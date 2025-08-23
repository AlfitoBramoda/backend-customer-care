const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your.email@gmail.com',     // ganti dengan email Anda
        pass: 'your_app_password'         // bukan password biasa, tapi App Password
    }
});

const testEmail = async () => {
    console.log('🔧 Testing email with Gmail...');
    
    try {
        const info = await transporter.sendMail({
            from: 'your.email@gmail.com',
            to: 'your.email@gmail.com',  // kirim ke diri sendiri untuk testing
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
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Email failed:', error);
    }
};

testEmail();