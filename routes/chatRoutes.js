'use strict';

const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');
const { authenticateToken } = require('../middlewares/auth');

// Chat session endpoints
router.post('/sessions', authenticateToken, ChatController.createSession);
router.get('/:session_id/summary', authenticateToken, ChatController.getSessionSummary);

// Chat message endpoints  
router.post('/:session_id/messages', authenticateToken, ChatController.sendMessage);
router.get('/:session_id/messages', authenticateToken, ChatController.getMessages);
router.delete('/:session_id/messages/:message_id', authenticateToken, ChatController.deleteMessage);

module.exports = router;
