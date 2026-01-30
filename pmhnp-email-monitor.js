// PMHNP Lead Email Monitor
// Monitors jacobhasenkamp@pmhnpbilling.com for lead responses

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class PMHNPEmailMonitor {
    constructor() {
        this.email = 'jacobhasenkamp@pmhnpbilling.com';
        this.lastCheckFile = '/root/clawd/last-email-check.json';
        this.leadsFile = '/root/clawd/PMHNP_LEAD_DATABASE.md';
        this.alertsFile = '/root/clawd/hot-leads-alerts.json';
    }

    async checkEmails() {
        console.log(`🔍 Checking emails for ${this.email}...`);
        
        try {
            // Get unread emails from last 24 hours
            const searchQuery = 'is:unread newer_than:1d';
            const emails = await this.searchGmail(searchQuery);
            
            if (emails && emails.length > 0) {
                console.log(`📧 Found ${emails.length} new emails`);
                await this.processEmails(emails);
            } else {
                console.log('📭 No new emails found');
            }
        } catch (error) {
            console.error('❌ Email check failed:', error.message);
        }
    }

    async searchGmail(query) {
        return new Promise((resolve, reject) => {
            const cmd = `mcporter call --server google-workspace --tool "gmail.search" query="${query}" maxResults=20`;
            
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Gmail search failed: ${error.message}`));
                    return;
                }
                
                try {
                    const result = JSON.parse(stdout);
                    resolve(result.messages || []);
                } catch (e) {
                    reject(new Error(`Failed to parse Gmail response: ${e.message}`));
                }
            });
        });
    }

    async getEmailContent(messageId) {
        return new Promise((resolve, reject) => {
            const cmd = `mcporter call --server google-workspace --tool "gmail.get" messageId="${messageId}"`;
            
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                
                try {
                    const result = JSON.parse(stdout);
                    resolve(result);
                } catch (e) {
                    reject(new Error(`Failed to parse email content: ${e.message}`));
                }
            });
        });
    }

    async processEmails(emails) {
        const hotLeads = [];
        
        for (const email of emails) {
            try {
                const content = await this.getEmailContent(email.id);
                const analysis = this.analyzeEmail(content);
                
                if (analysis.isLead) {
                    console.log(`🔥 POTENTIAL LEAD DETECTED: ${analysis.subject}`);
                    
                    if (analysis.isHot) {
                        hotLeads.push(analysis);
                        await this.createHotLeadAlert(analysis);
                    }
                    
                    await this.updateLeadDatabase(analysis);
                }
            } catch (error) {
                console.error(`Failed to process email ${email.id}:`, error.message);
            }
        }
        
        if (hotLeads.length > 0) {
            await this.sendHotLeadNotification(hotLeads);
        }
    }

    analyzeEmail(email) {
        const subject = email.payload?.headers?.find(h => h.name === 'Subject')?.value || '';
        const from = email.payload?.headers?.find(h => h.name === 'From')?.value || '';
        const body = this.extractEmailBody(email);
        
        // Keywords that indicate PMHNP leads
        const leadKeywords = [
            'billing', 'pmhnp', 'psychiatric', 'mental health', 'prior auth',
            'claims', 'denial', 'reimbursement', 'coding', 'audit', 'revenue',
            'insurance', 'medicaid', 'medicare', 'consultation', 'help',
            'interested', 'pricing', 'service', 'support', 'question'
        ];
        
        // Hot lead indicators
        const hotKeywords = [
            'urgent', 'asap', 'immediately', 'call me', 'phone', 'meeting',
            'schedule', 'when can', 'available', 'start', 'begin', 'ready',
            'money', 'losing', 'denied claims', 'help me', 'need assistance'
        ];
        
        const bodyLower = body.toLowerCase();
        const subjectLower = subject.toLowerCase();
        const fullText = `${subjectLower} ${bodyLower}`;
        
        const leadScore = leadKeywords.reduce((score, keyword) => {
            return fullText.includes(keyword) ? score + 1 : score;
        }, 0);
        
        const hotScore = hotKeywords.reduce((score, keyword) => {
            return fullText.includes(keyword) ? score + 1 : score;
        }, 0);
        
        const isLead = leadScore >= 2;
        const isHot = isLead && (hotScore >= 2 || fullText.includes('call') || fullText.includes('urgent'));
        
        return {
            messageId: email.id,
            from,
            subject,
            body,
            isLead,
            isHot,
            leadScore,
            hotScore,
            receivedAt: new Date().toISOString(),
            priority: isHot ? 'HOT' : (leadScore >= 3 ? 'WARM' : 'COLD')
        };
    }

    extractEmailBody(email) {
        // Extract plain text body from Gmail API response
        if (email.payload?.body?.data) {
            return Buffer.from(email.payload.body.data, 'base64').toString();
        }
        
        if (email.payload?.parts) {
            for (const part of email.payload.parts) {
                if (part.mimeType === 'text/plain' && part.body?.data) {
                    return Buffer.from(part.body.data, 'base64').toString();
                }
            }
        }
        
        return '';
    }

    async createHotLeadAlert(analysis) {
        const alert = {
            id: `alert-${Date.now()}`,
            timestamp: analysis.receivedAt,
            priority: 'HOT',
            from: analysis.from,
            subject: analysis.subject,
            body: analysis.body.substring(0, 500),
            messageId: analysis.messageId,
            action: 'RESPOND_IMMEDIATELY',
            notified: false
        };
        
        // Save alert to file
        let alerts = [];
        try {
            if (fs.existsSync(this.alertsFile)) {
                alerts = JSON.parse(fs.readFileSync(this.alertsFile, 'utf8'));
            }
        } catch (e) {
            console.error('Failed to read alerts file:', e.message);
        }
        
        alerts.push(alert);
        fs.writeFileSync(this.alertsFile, JSON.stringify(alerts, null, 2));
        
        console.log(`🚨 HOT LEAD ALERT CREATED: ${analysis.subject}`);
    }

    async updateLeadDatabase(analysis) {
        // Update the lead database file with new prospect
        const leadEntry = `
## NEW LEAD - ${new Date().toLocaleDateString()}
**From**: ${analysis.from}
**Subject**: ${analysis.subject}
**Priority**: ${analysis.priority}
**Lead Score**: ${analysis.leadScore}/10
**Hot Score**: ${analysis.hotScore}/5
**Message ID**: ${analysis.messageId}

**Email Content** (first 300 chars):
${analysis.body.substring(0, 300)}...

**Next Action**: ${analysis.isHot ? 'CALL IMMEDIATELY' : 'Respond within 2 hours'}
**Status**: NEW - Needs Response

---
`;
        
        try {
            fs.appendFileSync(this.leadsFile, leadEntry);
            console.log(`📝 Lead added to database: ${analysis.priority} priority`);
        } catch (error) {
            console.error('Failed to update lead database:', error.message);
        }
    }

    async sendHotLeadNotification(hotLeads) {
        console.log(`🔥 SENDING HOT LEAD NOTIFICATION: ${hotLeads.length} leads`);
        
        // This would integrate with WhatsApp/SMS to notify Jake immediately
        // For now, create a priority alert file
        const notification = {
            timestamp: new Date().toISOString(),
            count: hotLeads.length,
            leads: hotLeads.map(lead => ({
                from: lead.from,
                subject: lead.subject,
                priority: lead.priority
            })),
            message: `🚨 HOT LEAD ALERT: ${hotLeads.length} urgent responses need immediate attention!`
        };
        
        fs.writeFileSync('/root/clawd/hot-lead-notification.json', JSON.stringify(notification, null, 2));
        
        // TODO: Integrate with Clawdbot's message system to send WhatsApp alert
        console.log('🔔 Notification saved - ready for WhatsApp integration');
    }

    async runMonitoring() {
        console.log('🚀 Starting PMHNP Email Monitor...');
        console.log(`📧 Monitoring: ${this.email}`);
        
        // Check emails immediately
        await this.checkEmails();
        
        // Set up periodic monitoring (every 10 minutes)
        setInterval(async () => {
            await this.checkEmails();
        }, 10 * 60 * 1000);
        
        console.log('✅ Email monitoring active - checking every 10 minutes');
    }
}

// Run if called directly
if (require.main === module) {
    const monitor = new PMHNPEmailMonitor();
    monitor.runMonitoring().catch(console.error);
}

module.exports = PMHNPEmailMonitor;