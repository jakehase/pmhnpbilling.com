// Dynamic Task Management System for Dashboard

const fs = require('fs');

class DynamicTaskSystem {
    constructor() {
        this.tasksFile = '/root/clawd/pmnhp-billing/private-dashboard/current-tasks.json';
        this.initializeDefaultTasks();
    }

    initializeDefaultTasks() {
        const defaultTasks = {
            urgent: [
                {
                    id: "linkedin-profile-update",
                    text: "Update LinkedIn Profile - Focus on psychiatric billing services",
                    completed: false,
                    addedBy: "system",
                    addedAt: new Date().toISOString(),
                    priority: "urgent"
                },
                {
                    id: "communication-preferences", 
                    text: "Communication Preferences Set ✅ - WhatsApp + Dashboard notifications active",
                    completed: true,
                    completedAt: new Date().toISOString(),
                    addedBy: "system",
                    priority: "urgent"
                },
                {
                    id: "prospect-search-test",
                    text: "Test Prospect Search - Search 'PMHNP Chicago' in LinkedIn",
                    completed: false,
                    addedBy: "system", 
                    addedAt: new Date().toISOString(),
                    priority: "urgent"
                },
                {
                    id: "email-forwarding-setup",
                    text: "Set Up Email Forwarding - Business email: jacobhasenkamp@pmhnpbilling.com",
                    completed: false,
                    addedBy: "system",
                    addedAt: new Date().toISOString(), 
                    priority: "urgent"
                }
            ],
            today: [
                {
                    id: "identify-prospects",
                    text: "Identify First 5 Prospects - Solo practitioners in Chicago suburbs",
                    completed: false,
                    addedBy: "system",
                    addedAt: new Date().toISOString(),
                    priority: "today"
                },
                {
                    id: "connection-requests",
                    text: "Send 3 Connection Requests - Use personalized templates", 
                    completed: false,
                    addedBy: "system",
                    addedAt: new Date().toISOString(),
                    priority: "today"
                },
                {
                    id: "activate-monitoring",
                    text: "Activate Monitoring ✅ - AI tracking all responses automatically",
                    completed: true,
                    completedAt: new Date().toISOString(),
                    addedBy: "system",
                    priority: "today"
                },
                {
                    id: "daily-routine",
                    text: "Establish Daily Routine - Morning/midday/evening checks",
                    completed: false,
                    addedBy: "system",
                    addedAt: new Date().toISOString(),
                    priority: "today"
                }
            ],
            suggested: []
        };

        if (!fs.existsSync(this.tasksFile)) {
            fs.writeFileSync(this.tasksFile, JSON.stringify(defaultTasks, null, 2));
        }
    }

    getTasks() {
        try {
            return JSON.parse(fs.readFileSync(this.tasksFile, 'utf8'));
        } catch (error) {
            console.error('Error reading tasks:', error);
            return { urgent: [], today: [], suggested: [] };
        }
    }

    updateTaskCompletion(taskId, completed) {
        try {
            const tasks = this.getTasks();
            let updated = false;

            // Search in all categories
            ['urgent', 'today', 'suggested'].forEach(category => {
                const task = tasks[category].find(t => t.id === taskId);
                if (task) {
                    task.completed = completed;
                    if (completed) {
                        task.completedAt = new Date().toISOString();
                    } else {
                        delete task.completedAt;
                    }
                    updated = true;
                }
            });

            if (updated) {
                fs.writeFileSync(this.tasksFile, JSON.stringify(tasks, null, 2));
                return { success: true, message: 'Task updated successfully' };
            } else {
                return { success: false, message: 'Task not found' };
            }

        } catch (error) {
            console.error('Error updating task:', error);
            return { success: false, message: 'Error updating task' };
        }
    }

    addTask(category, text, priority = 'today', addedBy = 'agent') {
        try {
            const tasks = this.getTasks();
            const newTask = {
                id: `task-${Date.now()}`,
                text: text,
                completed: false,
                addedBy: addedBy,
                addedAt: new Date().toISOString(),
                priority: priority
            };

            if (!tasks[category]) {
                tasks[category] = [];
            }

            tasks[category].unshift(newTask); // Add to beginning
            
            // Keep only last 10 tasks per category
            tasks[category] = tasks[category].slice(0, 10);

            fs.writeFileSync(this.tasksFile, JSON.stringify(tasks, null, 2));
            
            return { success: true, taskId: newTask.id, message: 'Task added successfully' };
            
        } catch (error) {
            console.error('Error adding task:', error);
            return { success: false, message: 'Error adding task' };
        }
    }

    removeCompletedTasks(category, olderThanDays = 1) {
        try {
            const tasks = this.getTasks();
            const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
            
            if (tasks[category]) {
                const originalCount = tasks[category].length;
                
                tasks[category] = tasks[category].filter(task => {
                    if (!task.completed) return true;
                    if (!task.completedAt) return true;
                    
                    const completedTime = new Date(task.completedAt).getTime();
                    return completedTime > cutoff;
                });

                const removedCount = originalCount - tasks[category].length;
                
                if (removedCount > 0) {
                    fs.writeFileSync(this.tasksFile, JSON.stringify(tasks, null, 2));
                    return { success: true, removed: removedCount };
                }
            }

            return { success: true, removed: 0 };
            
        } catch (error) {
            console.error('Error removing completed tasks:', error);
            return { success: false, message: 'Error removing tasks' };
        }
    }
}

module.exports = DynamicTaskSystem;