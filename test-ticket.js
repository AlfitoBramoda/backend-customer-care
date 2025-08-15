const { Ticket } = require('./models');

async function testTicket() {
  try {
    console.log('🧪 Testing Ticket functionality...\n');
    
    // Test 1: Table accessibility
    const count = await Ticket.count();
    console.log('✅ Ticket table accessible');
    console.log('📊 Current ticket count:', count);
    
    // Test 2: Check table structure
    const attributes = Object.keys(Ticket.rawAttributes);
    console.log('🏗️  Ticket attributes:', attributes.join(', '));
    
    // Test 3: Describe table (optional)
    const tableInfo = await Ticket.sequelize.query('DESCRIBE ticket');
    console.log('\n📋 Table structure:');
    console.table(tableInfo[0]);
    
    console.log('\n✅ All basic tests passed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

testTicket();