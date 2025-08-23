require('dotenv').config({ path: '../.env' });
const nodemailer = require('nodemailer');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const EmailEscalationService = require('./services/emailEscalationService');

const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
        user: process.env.SMTP_USER, // ganti dengan username dari Mailtrap
        pass: process.env.SMTP_PASS  // ganti dengan password dari Mailtrap
    }
});

const testEmail = async () => {
    console.log('🔧 Testing email with Mailtrap...');
    console.log('📋 Environment Variables:');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***hidden***' : 'undefined');
    
    try {
        await transporter.sendMail({
        from: 'noreply@bcare.my.id',
        to: 'uic.test@example.com',
        subject: 'Test Email - Ticket Escalation',
        html: `
            <h2>🚨 Ticket Escalation Test</h2>
            <p><strong>Ticket ID:</strong> #123</p>
            <p><strong>Customer:</strong> Andi Saputra</p>
            <p><strong>Priority:</strong> High</p>
            <p>This is a test email for escalation notification.</p>
        `
        });
        console.log('✅ Email sent successfully!');
    } catch (error) {
        console.error('❌ Email failed:', error);
    }
};

async function testEscalationEmail() {
    console.log('\n🚨 Testing Escalation Email System...');
    
    try {
        // Initialize database
        const adapter = new FileSync('./db.json');
        const db = low(adapter);
        
        // Initialize email service
        const emailService = new EmailEscalationService(db);
        
        // Find an escalated ticket or use a sample ticket ID
        const escalatedTicket = db.get('ticket')
            .find({ employee_status_id: 3 }) // ESCALATED status
            .value();
            
        if (escalatedTicket) {
            console.log(`📋 Testing with ticket: ${escalatedTicket.ticket_number}`);
            
            const result = await emailService.sendEscalationEmail(
                escalatedTicket.ticket_id, 
                1 // CXC agent ID
            );
            
            if (result && result.success) {
                console.log(`✅ Escalation email test successful!`);
                console.log(`📨 Sent to ${result.sentTo} employees in ${result.division}`);
            } else {
                console.log('⚠️ No emails sent - check division employees');
            }
        } else {
            console.log('ℹ️ No escalated tickets found for testing');
        }
        
    } catch (error) {
        console.error('❌ Escalation email test failed:', error.message);
    }
}

// Run both tests
testEmail().then(() => {
    return testEscalationEmail();
}).catch(console.error);
