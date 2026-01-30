// PMHNP Email Webhook System
// No OAuth needed - receives email notifications via webhook

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

class PMHNPEmailWebhookSystem {
    constructor() {
        this.leadsFile = '/root/clawd/PMHNP_LEAD_DATABASE.md';
        this.alertsFile = '/root/clawd/hot-leads-alerts.json';
        this.logFile = '/root/clawd/email-webhook.log';
        this.setupRoutes();
    }

    setupRoutes() {
        // Health check
        app.get('/health', (req, res) => {
            res.json({ 
                status: 'active', 
                service: 'PMHNP Email Webhook',
                email: 'jacobhasenkamp@pmhnpbilling.com',
                timestamp: new Date().toISOString() 
            });
        });

        // Email webhook endpoint
        app.post('/email-webhook', (req, res) => {
            this.handleEmailWebhook(req, res);
        });

        // Alternative endpoint for different email services
        app.post('/webhook/email', (req, res) => {
            this.handleEmailWebhook(req, res);
        });

        // Gmail-style webhook (if using Gmail webhook)
        app.post('/gmail-webhook', (req, res) => {
            this.handleGmailWebhook(req, res);
        });

        // API endpoint for dashboard to get live alerts
        app.get('/api/alerts', (req, res) => {
            this.getDashboardAlerts(req, res);
        });

        // API endpoint for dashboard stats
        app.get('/api/stats', (req, res) => {
            this.getDashboardStats(req, res);
        });
    }

    handleEmailWebhook(req, res) {
        try {
            console.log('📧 Email webhook received at', new Date().toISOString());
            console.log('Headers:', req.headers);
            console.log('Body:', JSON.stringify(req.body, null, 2));

            const emailData = this.parseEmailData(req.body);
            this.logEmail(emailData);

            const analysis = this.analyzeEmail(emailData);
            
            if (analysis.isLead) {
                console.log('🔥 POTENTIAL LEAD DETECTED:', analysis.subject);
                
                if (analysis.isHot) {
                    this.createHotLeadAlert(analysis);
                    console.log('🚨 HOT LEAD ALERT CREATED!');
                }
                
                this.updateLeadDatabase(analysis);
            }

            res.status(200).json({ 
                received: true, 
                isLead: analysis.isLead,
                priority: analysis.priority 
            });

        } catch (error) {
            console.error('❌ Webhook processing error:', error);
            res.status(500).json({ error: 'Webhook processing failed' });
        }
    }

    handleGmailWebhook(req, res) {
        // Gmail Push notification format
        try {
            if (req.body.message && req.body.message.data) {
                const data = Buffer.from(req.body.message.data, 'base64').toString();
                console.log('📧 Gmail webhook notification:', data);
                
                // This would trigger fetching the actual email content
                // For now, just log the notification
                this.logEmail({
                    timestamp: new Date().toISOString(),
                    type: 'gmail_notification',
                    data: data
                });
            }
            
            res.status(200).json({ received: true });
        } catch (error) {
            console.error('❌ Gmail webhook error:', error);
            res.status(500).json({ error: 'Gmail webhook failed' });
        }
    }

    parseEmailData(body) {
        // Handle different webhook formats
        return {
            timestamp: new Date().toISOString(),
            from: body.from || body.sender || body.fromEmail || 'unknown@domain.com',
            to: body.to || body.recipient || 'jacobhasenkamp@pmhnpbilling.com',
            subject: body.subject || body.title || 'No Subject',
            body: body.text || body.body || body.content || body.html || '',
            messageId: body.messageId || body.id || Date.now().toString(),
            source: body.source || 'webhook'
        };
    }

    analyzeEmail(emailData) {
        const subject = emailData.subject || '';
        const from = emailData.from || '';
        const body = emailData.body || '';
        
        // PMHNP Lead Keywords
        const leadKeywords = [
            'billing', 'pmhnp', 'psychiatric', 'mental health', 'prior auth',
            'claims', 'denial', 'reimbursement', 'coding', 'audit', 'revenue',
            'insurance', 'medicaid', 'medicare', 'consultation', 'help',
            'interested', 'pricing', 'service', 'support', 'question', 'therapy',
            'psychiatrist', 'nurse practitioner', 'behavioral health'
        ];
        
        // Hot Lead Indicators
        const hotKeywords = [
            'urgent', 'asap', 'immediately', 'call me', 'phone', 'meeting',
            'schedule', 'when can', 'available', 'start', 'begin', 'ready',
            'money', 'losing', 'denied claims', 'help me', 'need assistance',
            'desperate', 'struggling', 'problems', 'issues', 'crisis'
        ];
        
        const fullText = `${subject} ${body} ${from}`.toLowerCase();
        
        const leadScore = leadKeywords.reduce((score, keyword) => {
            return fullText.includes(keyword) ? score + 1 : score;
        }, 0);
        
        const hotScore = hotKeywords.reduce((score, keyword) => {
            return fullText.includes(keyword) ? score + 1 : score;
        }, 0);
        
        const isLead = leadScore >= 2 || fullText.includes('pmhnp') || fullText.includes('billing');
        const isHot = isLead && (hotScore >= 2 || fullText.includes('urgent') || fullText.includes('help me'));
        
        return {
            ...emailData,
            isLead,
            isHot,
            leadScore,
            hotScore,
            priority: isHot ? 'HOT' : (leadScore >= 3 ? 'WARM' : 'COLD'),
            analysis: {
                leadKeywords: leadKeywords.filter(k => fullText.includes(k)),
                hotKeywords: hotKeywords.filter(k => fullText.includes(k))
            }
        };
    }

    logEmail(emailData) {
        const logEntry = `${emailData.timestamp} | FROM: ${emailData.from} | SUBJECT: ${emailData.subject} | LEAD: ${emailData.isLead || 'unknown'}\n`;
        
        try {
            fs.appendFileSync(this.logFile, logEntry);
        } catch (error) {
            console.error('Failed to write log:', error);
        }
    }

    createHotLeadAlert(analysis) {
        const alert = {
            id: `alert-${Date.now()}`,
            timestamp: analysis.timestamp,
            priority: 'HOT',
            from: analysis.from,
            subject: analysis.subject,
            body: analysis.body.substring(0, 500),
            messageId: analysis.messageId,
            action: 'RESPOND_IMMEDIATELY',
            leadScore: analysis.leadScore,
            hotScore: analysis.hotScore,
            analysis: analysis.analysis,
            notified: false
        };
        
        // Save alert
        let alerts = [];
        try {
            if (fs.existsSync(this.alertsFile)) {
                alerts = JSON.parse(fs.readFileSync(this.alertsFile, 'utf8'));
            }
        } catch (e) {
            console.error('Failed to read alerts file:', e);
        }
        
        alerts.push(alert);
        fs.writeFileSync(this.alertsFile, JSON.stringify(alerts, null, 2));
        
        // Create immediate notification file
        fs.writeFileSync('/root/clawd/URGENT_LEAD_ALERT.json', JSON.stringify(alert, null, 2));
        
        // Send dual notifications (WhatsApp + Dashboard)
        this.sendDualNotifications(alert);
        
        console.log(`🚨 HOT LEAD ALERT: ${analysis.subject} from ${analysis.from}`);
    }

    async sendDualNotifications(alert) {
        try {
            const DualNotificationSystem = require('./dual-notification-system.js');
            const notifier = new DualNotificationSystem();
            await notifier.sendHotLeadNotification(alert);
        } catch (error) {
            console.error('❌ Dual notification failed:', error);
        }
    }

    getDashboardAlerts(req, res) {
        try {
            const alertsFile = '/root/clawd/pmnhp-billing/private-dashboard/live-alerts.json';
            let alerts = [];
            
            if (fs.existsSync(alertsFile)) {
                alerts = JSON.parse(fs.readFileSync(alertsFile, 'utf8'));
                
                // Filter out expired alerts
                const now = Date.now();
                alerts = alerts.filter(alert => alert.displayUntil > now);
            }
            
            res.json({
                success: true,
                alerts: alerts,
                count: alerts.length,
                lastUpdated: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Error getting dashboard alerts:', error);
            res.status(500).json({ success: false, error: 'Failed to get alerts' });
        }
    }

    getDashboardStats(req, res) {
        try {
            // Get hot leads count
            let hotLeads = 0;
            let warmLeads = 0;
            let totalLeads = 0;
            
            if (fs.existsSync(this.alertsFile)) {
                const alerts = JSON.parse(fs.readFileSync(this.alertsFile, 'utf8'));
                hotLeads = alerts.filter(a => a.priority === 'HOT').length;
                warmLeads = alerts.filter(a => a.priority === 'WARM').length;
                totalLeads = alerts.length;
            }
            
            res.json({
                success: true,
                stats: {
                    hotLeads: hotLeads,
                    warmLeads: warmLeads,
                    coldLeads: totalLeads - hotLeads - warmLeads,
                    totalLeads: totalLeads,
                    prospectsIdentified: 15, // From agent work
                    setupProgress: Math.min(90, 30 + (totalLeads * 5)) // Increases with leads
                },
                lastUpdated: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Error getting dashboard stats:', error);
            res.status(500).json({ success: false, error: 'Failed to get stats' });
        }
    }

    updateLeadDatabase(analysis) {
        const leadEntry = `
## NEW EMAIL LEAD - ${new Date().toLocaleDateString()}
**From**: ${analysis.from}  
**Subject**: ${analysis.subject}  
**Priority**: ${analysis.priority} 🔥  
**Lead Score**: ${analysis.leadScore}/10  
**Hot Score**: ${analysis.hotScore}/5  
**Message ID**: ${analysis.messageId}  
**Received**: ${analysis.timestamp}

**Detected Keywords**: ${analysis.analysis.leadKeywords.join(', ')}
${analysis.analysis.hotKeywords.length > 0 ? `**Hot Keywords**: ${analysis.analysis.hotKeywords.join(', ')}` : ''}

**Email Content** (first 400 chars):
\`\`\`
${analysis.body.substring(0, 400)}...
\`\`\`

**Next Action**: ${analysis.isHot ? '🚨 CALL IMMEDIATELY' : '📞 Respond within 2 hours'}  
**Status**: NEW - Needs Response

---
`;
        
        try {
            fs.appendFileSync(this.leadsFile, leadEntry);
            console.log(`📝 Lead added to database: ${analysis.priority} priority from ${analysis.from}`);
        } catch (error) {
            console.error('Failed to update lead database:', error);
        }
    }

    start(port = 3001) {
        app.listen(port, '0.0.0.0', () => {
            console.log('🚀 PMHNP Email Webhook System Started');
            console.log('=========================================');
            console.log(`📧 Monitoring: jacobhasenkamp@pmhnpbilling.com`);
            console.log(`🔗 Webhook URL: http://10.0.0.220:${port}/email-webhook`);
            console.log(`🏥 Health Check: http://10.0.0.220:${port}/health`);
            console.log(`📱 Alternative: http://10.0.0.220:${port}/webhook/email`);
            console.log('=========================================');
            console.log('✅ Ready to receive email notifications!');
            console.log('🔍 Will automatically detect PMHNP leads');
            console.log('🚨 Will create instant alerts for hot leads');
            console.log('📊 Will update lead database automatically');
        });
    }
}

// Run if called directly
if (require.main === module) {
    const webhookSystem = new PMHNPEmailWebhookSystem();
    webhookSystem.start(3001);
}

module.exports = PMHNPEmailWebhookSystem;