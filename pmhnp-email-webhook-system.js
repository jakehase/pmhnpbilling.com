// PMHNP Email Webhook System
// No OAuth needed - receives email notifications via webhook

const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Add CORS headers for dashboard API access
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

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

        // API endpoint to dismiss/archive a lead
        app.post('/api/dismiss/:alertId', (req, res) => {
            this.dismissAlert(req, res);
        });

        // API endpoint to clear all alerts
        app.post('/api/clear-all', (req, res) => {
            this.clearAllAlerts(req, res);
        });

        // API endpoints for dynamic task management
        app.get('/api/tasks', (req, res) => {
            this.getTasks(req, res);
        });

        app.post('/api/tasks/:taskId/toggle', (req, res) => {
            this.toggleTask(req, res);
        });

        app.post('/api/tasks/add', (req, res) => {
            this.addTask(req, res);
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
        
        // Broadcast real-time update to dashboards
        this.broadcastUpdate('hot_lead_alert', {
            alert: alert,
            message: 'New hot lead detected!',
            action: 'refresh_alerts'
        });
        
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

    dismissAlert(req, res) {
        try {
            const alertId = req.params.alertId;
            const dashboardAlertsFile = '/root/clawd/pmnhp-billing/private-dashboard/live-alerts.json';
            
            // Remove from dashboard alerts
            let dashboardAlerts = [];
            if (fs.existsSync(dashboardAlertsFile)) {
                dashboardAlerts = JSON.parse(fs.readFileSync(dashboardAlertsFile, 'utf8'));
                dashboardAlerts = dashboardAlerts.filter(alert => alert.id !== alertId);
                fs.writeFileSync(dashboardAlertsFile, JSON.stringify(dashboardAlerts, null, 2));
            }

            // Mark as dismissed in main alerts file
            if (fs.existsSync(this.alertsFile)) {
                const alerts = JSON.parse(fs.readFileSync(this.alertsFile, 'utf8'));
                const alert = alerts.find(a => a.id === alertId);
                if (alert) {
                    alert.dismissed = true;
                    alert.dismissedAt = new Date().toISOString();
                    fs.writeFileSync(this.alertsFile, JSON.stringify(alerts, null, 2));
                }
            }

            console.log(`✅ Alert dismissed: ${alertId}`);
            
            // Broadcast alert dismissal to dashboards
            this.broadcastUpdate('alert_dismissed', {
                alertId: alertId,
                message: 'Alert dismissed'
            });
            
            res.json({
                success: true,
                message: 'Alert dismissed successfully',
                alertId: alertId
            });
            
        } catch (error) {
            console.error('❌ Error dismissing alert:', error);
            res.status(500).json({ success: false, error: 'Failed to dismiss alert' });
        }
    }

    clearAllAlerts(req, res) {
        try {
            const dashboardAlertsFile = '/root/clawd/pmnhp-billing/private-dashboard/live-alerts.json';
            
            // Clear dashboard alerts
            fs.writeFileSync(dashboardAlertsFile, JSON.stringify([], null, 2));
            
            // Mark all as dismissed in main alerts file
            if (fs.existsSync(this.alertsFile)) {
                const alerts = JSON.parse(fs.readFileSync(this.alertsFile, 'utf8'));
                alerts.forEach(alert => {
                    alert.dismissed = true;
                    alert.dismissedAt = new Date().toISOString();
                });
                fs.writeFileSync(this.alertsFile, JSON.stringify(alerts, null, 2));
            }

            console.log('✅ All alerts cleared');
            
            res.json({
                success: true,
                message: 'All alerts cleared successfully',
                clearedAt: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Error clearing alerts:', error);
            res.status(500).json({ success: false, error: 'Failed to clear alerts' });
        }
    }

    getTasks(req, res) {
        try {
            const DynamicTaskSystem = require('./dynamic-task-system.js');
            const taskSystem = new DynamicTaskSystem();
            const tasks = taskSystem.getTasks();
            
            res.json({
                success: true,
                tasks: tasks,
                lastUpdated: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Error getting tasks:', error);
            res.status(500).json({ success: false, error: 'Failed to get tasks' });
        }
    }

    toggleTask(req, res) {
        try {
            const taskId = req.params.taskId;
            const { completed } = req.body;
            
            const DynamicTaskSystem = require('./dynamic-task-system.js');
            const taskSystem = new DynamicTaskSystem();
            const result = taskSystem.updateTaskCompletion(taskId, completed);
            
            if (result.success) {
                // If task completed, clean up old completed tasks
                if (completed) {
                    taskSystem.removeCompletedTasks('urgent');
                    taskSystem.removeCompletedTasks('today');
                }
                
                // Broadcast task update to dashboards
                this.broadcastUpdate('task_update', {
                    taskId: taskId,
                    completed: completed,
                    message: result.message
                });
                
                res.json({
                    success: true,
                    taskId: taskId,
                    completed: completed,
                    message: result.message
                });
            } else {
                res.status(404).json(result);
            }
            
        } catch (error) {
            console.error('❌ Error toggling task:', error);
            res.status(500).json({ success: false, error: 'Failed to toggle task' });
        }
    }

    addTask(req, res) {
        try {
            const { category, text, priority, addedBy } = req.body;
            
            const DynamicTaskSystem = require('./dynamic-task-system.js');
            const taskSystem = new DynamicTaskSystem();
            const result = taskSystem.addTask(category, text, priority, addedBy);
            
            res.json(result);
            
        } catch (error) {
            console.error('❌ Error adding task:', error);
            res.status(500).json({ success: false, error: 'Failed to add task' });
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
        // Store WebSocket connections
        this.wsConnections = new Set();
        
        // Handle WebSocket connections
        wss.on('connection', (ws) => {
            console.log('📱 Dashboard connected for real-time updates');
            this.wsConnections.add(ws);
            
            // Send initial data
            ws.send(JSON.stringify({
                type: 'connected',
                message: 'Real-time updates active'
            }));
            
            ws.on('close', () => {
                this.wsConnections.delete(ws);
                console.log('📱 Dashboard disconnected');
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.wsConnections.delete(ws);
            });
        });
        
        server.listen(port, '0.0.0.0', () => {
            console.log('🚀 PMHNP Email Webhook System Started');
            console.log('=========================================');
            console.log(`📧 Monitoring: jacobhasenkamp@pmhnpbilling.com`);
            console.log(`🔗 Webhook URL: http://10.0.0.220:${port}/email-webhook`);
            console.log(`📡 WebSocket: ws://10.0.0.220:${port}/`);
            console.log(`🏥 Health Check: http://10.0.0.220:${port}/health`);
            console.log(`📱 Alternative: http://10.0.0.220:${port}/webhook/email`);
            console.log('=========================================');
            console.log('✅ Ready to receive email notifications!');
            console.log('🔍 Will automatically detect PMHNP leads');
            console.log('🚨 Will create instant alerts for hot leads');
            console.log('📊 Will update lead database automatically');
            console.log('⚡ Real-time dashboard updates enabled');
        });
    }

    // Broadcast updates to all connected dashboards
    broadcastUpdate(type, data) {
        const message = JSON.stringify({
            type: type,
            data: data,
            timestamp: new Date().toISOString()
        });
        
        this.wsConnections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            } else {
                this.wsConnections.delete(ws);
            }
        });
        
        console.log(`📡 Broadcasted ${type} update to ${this.wsConnections.size} dashboards`);
    }
}

// Run if called directly
if (require.main === module) {
    const webhookSystem = new PMHNPEmailWebhookSystem();
    webhookSystem.start(3001);
}

module.exports = PMHNPEmailWebhookSystem;