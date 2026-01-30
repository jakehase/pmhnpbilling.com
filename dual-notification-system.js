// PMHNP Dual Notification System
// WhatsApp alerts + Dashboard notifications for hot leads

const fs = require('fs');
const { exec } = require('child_process');

class DualNotificationSystem {
    constructor() {
        this.alertsFile = '/root/clawd/hot-leads-alerts.json';
        this.dashboardAlertsFile = '/root/clawd/pmnhp-billing/private-dashboard/live-alerts.json';
        this.notificationLog = '/root/clawd/notification-log.json';
    }

    async sendHotLeadNotification(leadData) {
        console.log('🚨 HOT LEAD DETECTED - Sending dual notifications');
        
        // 1. Send WhatsApp notification immediately
        await this.sendWhatsAppAlert(leadData);
        
        // 2. Update dashboard with live alert
        await this.updateDashboardAlert(leadData);
        
        // 3. Log notification for tracking
        await this.logNotification(leadData);
    }

    async sendWhatsAppAlert(leadData) {
        try {
            const message = `🔥 HOT LEAD ALERT!\n\n` +
                `📧 From: ${leadData.from}\n` +
                `📋 Subject: ${leadData.subject}\n` +
                `🎯 Priority: ${leadData.priority}\n` +
                `📊 Lead Score: ${leadData.leadScore}/10\n` +
                `🚨 Hot Score: ${leadData.hotScore}/5\n\n` +
                `💬 Message Preview:\n"${leadData.body.substring(0, 150)}..."\n\n` +
                `⏰ Received: ${new Date(leadData.timestamp).toLocaleString()}\n` +
                `🎯 Action: RESPOND IMMEDIATELY\n\n` +
                `📱 Check dashboard for full details: https://pmhnpbilling.com/private-dashboard/`;

            // Send via Clawdbot's message system to WhatsApp
            const messageCmd = `clawdbot message send --channel whatsapp --to "+17855410986" "${message.replace(/"/g, '\\"')}"`;
            
            exec(messageCmd, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ WhatsApp notification failed:', error);
                } else {
                    console.log('✅ WhatsApp alert sent successfully');
                }
            });
            
        } catch (error) {
            console.error('❌ WhatsApp notification error:', error);
        }
    }

    async updateDashboardAlert(leadData) {
        try {
            // Create dashboard alert object
            const dashboardAlert = {
                id: `alert-${Date.now()}`,
                timestamp: leadData.timestamp,
                type: 'HOT_LEAD',
                priority: leadData.priority,
                from: leadData.from,
                subject: leadData.subject,
                preview: leadData.body.substring(0, 200),
                leadScore: leadData.leadScore,
                hotScore: leadData.hotScore,
                keywords: leadData.analysis?.leadKeywords || [],
                hotKeywords: leadData.analysis?.hotKeywords || [],
                status: 'NEW',
                action: 'RESPOND_IMMEDIATELY',
                notified: true,
                displayUntil: Date.now() + (24 * 60 * 60 * 1000) // Show for 24 hours
            };

            // Load existing dashboard alerts
            let dashboardAlerts = [];
            try {
                if (fs.existsSync(this.dashboardAlertsFile)) {
                    dashboardAlerts = JSON.parse(fs.readFileSync(this.dashboardAlertsFile, 'utf8'));
                }
            } catch (e) {
                console.log('Creating new dashboard alerts file');
            }

            // Add new alert to beginning of array
            dashboardAlerts.unshift(dashboardAlert);
            
            // Keep only last 10 alerts
            dashboardAlerts = dashboardAlerts.slice(0, 10);

            // Save to dashboard alerts file
            fs.writeFileSync(this.dashboardAlertsFile, JSON.stringify(dashboardAlerts, null, 2));
            
            console.log('✅ Dashboard alert updated');
            
        } catch (error) {
            console.error('❌ Dashboard alert error:', error);
        }
    }

    async logNotification(leadData) {
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                leadId: leadData.messageId,
                from: leadData.from,
                subject: leadData.subject,
                priority: leadData.priority,
                notifications: {
                    whatsapp: true,
                    dashboard: true
                },
                processed: true
            };

            // Load existing log
            let log = [];
            try {
                if (fs.existsSync(this.notificationLog)) {
                    log = JSON.parse(fs.readFileSync(this.notificationLog, 'utf8'));
                }
            } catch (e) {
                console.log('Creating new notification log');
            }

            log.push(logEntry);
            
            // Keep only last 100 entries
            if (log.length > 100) {
                log = log.slice(-100);
            }

            fs.writeFileSync(this.notificationLog, JSON.stringify(log, null, 2));
            
        } catch (error) {
            console.error('❌ Notification logging error:', error);
        }
    }

    // Check for pending alerts and send notifications
    async processPendingAlerts() {
        try {
            if (!fs.existsSync(this.alertsFile)) {
                return;
            }

            const alerts = JSON.parse(fs.readFileSync(this.alertsFile, 'utf8'));
            const unnotified = alerts.filter(alert => !alert.notified && alert.priority === 'HOT');

            for (const alert of unnotified) {
                await this.sendHotLeadNotification(alert);
                
                // Mark as notified
                alert.notified = true;
            }

            // Save updated alerts
            if (unnotified.length > 0) {
                fs.writeFileSync(this.alertsFile, JSON.stringify(alerts, null, 2));
                console.log(`✅ Processed ${unnotified.length} pending hot lead alerts`);
            }

        } catch (error) {
            console.error('❌ Error processing pending alerts:', error);
        }
    }

    // Start monitoring for new alerts
    startMonitoring() {
        console.log('🚀 Dual Notification System Started');
        console.log('📱 WhatsApp alerts: +17855410986');
        console.log('📊 Dashboard alerts: https://pmhnpbilling.com/private-dashboard/');
        
        // Check for pending alerts immediately
        this.processPendingAlerts();
        
        // Monitor for new alerts every 30 seconds
        setInterval(() => {
            this.processPendingAlerts();
        }, 30000);
        
        console.log('✅ Monitoring active - checking every 30 seconds');
    }
}

// Export for use in webhook system
module.exports = DualNotificationSystem;

// Run if called directly
if (require.main === module) {
    const notifier = new DualNotificationSystem();
    notifier.startMonitoring();
}