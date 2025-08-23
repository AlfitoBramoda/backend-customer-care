require('dotenv').config({ path: '../.env' });
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const EmailEscalationService = require('./services/emailEscalationService');

// Initialize database
const adapter = new FileSync('./db.json');
const db = low(adapter);

// Initialize email service
const emailService = new EmailEscalationService(db);

async function testEscalationEmail() {
    console.log('🧪 Testing Email Escalation Service...\n');
    
    try {
        // Find a ticket that has been escalated (employee_status_id = 3)
        const escalatedTicket = db.get('ticket')
            .find({ employee_status_id: 3 })
            .value();

        if (!escalatedTicket) {
            console.log('❌ No escalated tickets found in database');
            return;
        }

        console.log(`📋 Found escalated ticket: ${escalatedTicket.ticket_number}`);
        console.log(`📧 Sending escalation email notification...\n`);

        // Get the CXC agent (employee_id: 1) as the escalating agent
        const escalatingAgent = db.get('employee')
            .find({ employee_id: 1 })
            .value();

        // Send escalation email
        const result = await emailService.sendEscalationEmail(
            escalatedTicket.ticket_id, 
            escalatingAgent.employee_id
        );

        if (result && result.success) {
            console.log(`✅ Email escalation test successful!`);
            console.log(`📨 Emails sent to ${result.sentTo} employees in ${result.division}`);
        } else {
            console.log('⚠️ Email escalation completed but no emails were sent');
        }

    } catch (error) {
        console.error('❌ Email escalation test failed:', error.message);
    }
}

// Run the test
testEscalationEmail();