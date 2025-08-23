require('dotenv').config({ path: '../.env' });
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const EmailEscalationService = require('./services/emailEscalationService');

// Initialize database
const adapter = new FileSync('./db.json');
const db = low(adapter);

async function demonstrateEscalation() {
    console.log('🚀 Email Escalation System Demo\n');
    console.log('================================\n');

    // Initialize email service
    const emailService = new EmailEscalationService(db);

    // Show current escalated tickets
    const escalatedTickets = db.get('ticket')
        .filter({ employee_status_id: 3 }) // ESCALATED status
        .value();

    console.log(`📊 Found ${escalatedTickets.length} escalated tickets in system:\n`);

    escalatedTickets.forEach((ticket, index) => {
        const customer = db.get('customer').find({ customer_id: ticket.customer_id }).value();
        const policy = db.get('complaint_policy').find({ policy_id: ticket.policy_id }).value();
        const division = db.get('division').find({ division_id: policy?.uic_id }).value();
        const complaint = db.get('complaint_category').find({ complaint_id: ticket.complaint_id }).value();

        console.log(`${index + 1}. Ticket: ${ticket.ticket_number}`);
        console.log(`   Customer: ${customer?.full_name}`);
        console.log(`   Complaint: ${complaint?.complaint_name}`);
        console.log(`   Target Division: ${division?.division_name}`);
        console.log(`   Created: ${new Date(ticket.created_time).toLocaleString('id-ID')}\n`);
    });

    if (escalatedTickets.length > 0) {
        console.log('📧 Email Notification Details:\n');
        
        // Show which employees would receive emails for each division
        const divisions = [...new Set(escalatedTickets.map(ticket => {
            const policy = db.get('complaint_policy').find({ policy_id: ticket.policy_id }).value();
            return policy?.uic_id;
        }).filter(Boolean))];

        divisions.forEach(divisionId => {
            const division = db.get('division').find({ division_id: divisionId }).value();
            const employees = db.get('employee').filter({ division_id: divisionId, is_active: true }).value();
            
            console.log(`🏢 ${division?.division_name}:`);
            employees.forEach(emp => {
                console.log(`   📧 ${emp.full_name} (${emp.email})`);
            });
            console.log('');
        });

        // Test sending email for the first escalated ticket
        console.log('🧪 Testing email send for first escalated ticket...\n');
        
        try {
            const testTicket = escalatedTickets[0];
            const result = await emailService.sendEscalationEmail(testTicket.ticket_id, 1); // CXC agent ID
            
            if (result && result.success) {
                console.log(`✅ Test email sent successfully!`);
                console.log(`📨 Sent to ${result.sentTo} employees in ${result.division}`);
            }
        } catch (error) {
            console.error('❌ Test email failed:', error.message);
        }
    } else {
        console.log('ℹ️ No escalated tickets found to demonstrate email functionality.');
        console.log('💡 Create a ticket with action="ESCALATED" to see email notifications.');
    }

    console.log('\n================================');
    console.log('✨ Demo completed!');
}

// Run the demonstration
demonstrateEscalation();