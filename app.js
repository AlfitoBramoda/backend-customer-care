// app.js - ADD ROUTES ONE BY ONE
const express = require('express');
const cors = require('cors');

// Import models
const db = require('./models');

// Import ONE route at a time to test
const customerRoutes = require('./routes/customers');  // Comment others
const agentRoutes = require('./routes/agents');
const teamRoutes = require('./routes/teams');
const accountRoutes = require('./routes/accounts');
const authRoutes = require('./routes/auth');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString()
  });
});

// Add ONE route at a time
const v1Router = express.Router();
v1Router.use('/customers', customerRoutes);  // Add one by one
v1Router.use('/agents', agentRoutes);
v1Router.use('/teams', teamRoutes);
v1Router.use('/accounts', accountRoutes);
v1Router.use('/auth', authRoutes);

app.use('/api/v1', v1Router);

// Start server
const PORT = process.env.PORT || 3001;

db.sequelize.sync({ force: false })
  .then(() => {
    console.log('✅ Database synced successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`💓 Health Check: http://localhost:${PORT}/health`);
    });
  })
  .catch(err => {
    console.error('❌ Unable to sync database:', err);
    process.exit(1);
  });

module.exports = app;