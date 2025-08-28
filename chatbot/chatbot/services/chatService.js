const ChatMessage = require('../models/ChatMessage');
const sequelize = require('../config/database');

class ChatService {
  // Simpan pesan user ke database dengan proper field mapping
  static async saveUserMessage(ticketId, userIdentifier, message, senderTypeId = 1, userType = 'customer') {
    try {
      console.log('💾 Attempting to save message:', { 
        ticketId, 
        userIdentifier, 
        message, 
        senderTypeId,
        userType
      });
      
      // Get actual user ID from identifier
      let senderId;
      if (userType === 'customer') {
        const [customer] = await sequelize.query('SELECT customer_id FROM customer WHERE email = ?', {
          replacements: [userIdentifier]
        });
        senderId = customer[0]?.customer_id;
      } else if (userType === 'employee') {
        const [employee] = await sequelize.query('SELECT employee_id FROM employee WHERE npp = ?', {
          replacements: [userIdentifier]
        });
        senderId = employee[0]?.employee_id;
      }
      
      if (!senderId) {
        throw new Error(`Could not find ${userType} ID for ${userIdentifier}`);
      }
      
      // Check if ticket exists
      const [ticketCheck] = await sequelize.query('SELECT ticket_id FROM ticket WHERE ticket_id = ?', {
        replacements: [ticketId]
      });
      
      if (ticketCheck.length === 0) {
        throw new Error(`Ticket ID ${ticketId} not found`);
      }
      
      // Validate sender_type_id exists
      const [senderTypeCheck] = await sequelize.query('SELECT sender_type_id FROM sender_type WHERE sender_type_id = ?', {
        replacements: [senderTypeId]
      });
      
      if (senderTypeCheck.length === 0) {
        console.log(`⚠️ Sender type ID ${senderTypeId} not found, using default (1)`);
        senderTypeId = 1;
      }
      
      const result = await ChatMessage.create({
        ticket_id: ticketId,
        sender_id: senderId,
        sender_type_id: senderTypeId,
        message: message,
        sent_at: new Date()
      });
      
      console.log('✅ Message saved successfully with ID:', result.chat_id);
      return result;
    } catch (error) {
      console.error('❌ Error saving user message:', error.message);
      console.error('Error details:', error);
      throw error;
    }
  }

  // Get chat history untuk ticket tertentu
  static async getChatHistory(ticketId) {
    try {
      const messages = await ChatMessage.findAll({
        where: { ticket_id: ticketId },
        order: [['sent_at', 'ASC']]
      });
      console.log(`📜 Found ${messages.length} messages for ticket ${ticketId}`);
      return messages;
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }
  
  // Test insert dummy data
  static async testInsert() {
    try {
      // Get first existing ticket_id
      const [result] = await sequelize.query('SELECT ticket_id FROM ticket LIMIT 1');
      if (result.length === 0) {
        console.log('⚠️ No tickets found in database, skipping insert test');
        return true;
      }
      
      const ticketId = result[0].ticket_id;
      
      const testMessage = await ChatMessage.create({
        ticket_id: ticketId,
        sender_id: 1,
        sender_type_id: 1,
        message: 'Test connection message',
        sent_at: new Date()
      });
      console.log('✅ Test insert successful:', testMessage.chat_id);
      
      // Delete test message
      await testMessage.destroy();
      console.log('✅ Test message deleted');
      
      return true;
    } catch (error) {
      console.error('❌ Test insert failed:', error.message);
      return false;
    }
  }

  // Get sender types from database
  static async getSenderTypes() {
    try {
      const [senderTypes] = await sequelize.query('SELECT sender_type_id, sender_type_name FROM sender_type');
      console.log('📊 Available sender types:', senderTypes);
      return senderTypes;
    } catch (error) {
      console.error('Error getting sender types:', error.message);
      return [];
    }
  }
  
  // Validate user exists in appropriate table
  static async validateUser(userIdentifier, userType) {
    try {
      console.log(`🔍 Validating ${userType}: ${userIdentifier}`);
      
      let query = '';
      let tableName = '';
      let fieldName = '';
      
      if (userType === 'customer') {
        query = 'SELECT customer_id, full_name, email FROM customer WHERE email = ?';
        tableName = 'customer';
        fieldName = 'email';
      } else if (userType === 'employee') {
        query = 'SELECT employee_id, full_name, npp FROM employee WHERE npp = ?';
        tableName = 'employee';
        fieldName = 'NPP';
      } else {
        throw new Error(`Invalid user type: ${userType}`);
      }
      
      const [results] = await sequelize.query(query, {
        replacements: [userIdentifier]
      });
      
      if (results.length === 0) {
        console.log(`❌ ${userType} ${fieldName} ${userIdentifier} not found in ${tableName} table`);
        return { valid: false, message: `${userType} ${fieldName} ${userIdentifier} not found` };
      }
      
      console.log(`✅ ${userType} ${fieldName} ${userIdentifier} validated:`, results[0]);
      return { 
        valid: true, 
        user: results[0],
        message: `${userType} validated successfully`
      };
      
    } catch (error) {
      console.error('Error validating user:', error.message);
      return { valid: false, message: error.message };
    }
  }
  
  // Ensure ticket exists or create new one (using customer_id from validation)
  static async ensureTicket(customerEmail) {
    try {
      // Get customer_id from email first
      const [customer] = await sequelize.query(
        'SELECT customer_id FROM customer WHERE email = ?',
        { replacements: [customerEmail] }
      );
      
      if (customer.length === 0) {
        throw new Error(`Customer with email ${customerEmail} not found`);
      }
      
      const customerId = customer[0].customer_id;
      
      // Check for active ticket
      const [activeTickets] = await sequelize.query(
        'SELECT ticket_id FROM ticket WHERE customer_id = ? AND status != \'closed\' ORDER BY created_at DESC LIMIT 1',
        { replacements: [customerId] }
      );
      
      if (activeTickets.length > 0) {
        console.log(`🎫 Found existing ticket: ${activeTickets[0].ticket_id}`);
        return activeTickets[0].ticket_id;
      }
      
      // Create new ticket
      const [newTicket] = await sequelize.query(
        'INSERT INTO ticket (customer_id, subject, status, priority_id, channel_id, source_id, complaint_category_id) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING ticket_id',
        { replacements: [customerId, 'Chat Support', 'open', 2, 3, 1, 1] }
      );
      
      console.log(`🎫 Created new ticket: ${newTicket[0].ticket_id}`);
      return newTicket[0].ticket_id;
    } catch (error) {
      console.error('Error ensuring ticket:', error.message);
      throw error;
    }
  }
  
  // Test database connection
  static async testConnection() {
    try {
      console.log('🔍 Testing database connection...');
      console.log('Database config:', {
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'bni_customer_support_dev',
        username: process.env.DB_USER || 'postgres'
      });
      
      await sequelize.authenticate();
      console.log('✅ Database connection successful');
      
      // Test table exists
      const [results] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'chat_message'");
      if (results.length > 0) {
        console.log('✅ Table chat_message exists');
        
        // Test count records
        const count = await ChatMessage.count();
        console.log(`📊 Total chat messages in database: ${count}`);
        
        // Show sender types
        await this.getSenderTypes();
      } else {
        console.log('❌ Table chat_message not found');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }
}

module.exports = ChatService;