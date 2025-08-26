// routes/chat.js
'use strict';

const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chat_controller');

const chatRoutes = (db) => {
    const chatController = ChatController.createInstance(db);
    
    // Chat endpoints
    router.post('/sessions', chatController.createSession.bind(chatController));
    router.post('/:session_id/messages', chatController.sendMessage.bind(chatController));
    router.get('/:session_id/messages', chatController.getMessages.bind(chatController));
    
    return router;
};

module.exports = chatRoutes;