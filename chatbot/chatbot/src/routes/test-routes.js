const express = require('express');
const router = express.Router();

// Test endpoint untuk simulate Socket.IO chat message dan test persistence
router.post('/test-chat-persistence', async (req, res) => {
  try {
    const { 
      room, 
      message, 
      senderId, 
      senderTypeId, 
      ticketId,
      authToken 
    } = req.body;

    console.log('\n=== TEST CHAT PERSISTENCE ===');
    console.log('Request body:', req.body);

    if (!room || !message) {
      return res.status(400).json({
        success: false,
        error: 'room dan message wajib diisi'
      });
    }

    // Import config
    const { BACKEND_API_URL, API_TOKEN } = require('../config/config');
    const base = process.env.PERSIST_BASE_URL || BACKEND_API_URL;

    // Extract ticket ID (sama seperti di Socket.IO)
    const extractedTicketId = ticketId || 
      (typeof room === "string" ? (room.match(/ticket[-:]?(\d+)/)?.[1] ?? null) : null);

    console.log('[test] debug - room:', room);
    console.log('[test] debug - extracted ticketId:', extractedTicketId);

    if (!extractedTicketId) {
      // Check if this is a DM room
      if (typeof room === "string" && room.startsWith("dm:")) {
        return res.json({
          success: true,
          skipped: true,
          reason: 'DM room - tidak perlu persist ke database',
          room: room
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'Tidak bisa resolve ticketId dari room. Format yang didukung: call:ticket-123, ticket:123, atau kirim ticketId manual',
        room: room
      });
    }

    // Normalize fields
    const sender_id = senderId || 'TEST-USER';
    const sender_type_id = senderTypeId || (sender_id?.startsWith("EMP-") ? 2 : 1);
    const messageText = message.toString();

    console.log('[test] payload:', { sender_id, sender_type_id, message: messageText, ticketId: extractedTicketId });

    // Headers untuk API call
    const headers = { 
      "Content-Type": "application/json"
    };
    
    const token = authToken || API_TOKEN;
    if (token) {
      // Check if token already has Bearer prefix
      if (token.startsWith('Bearer ')) {
        headers["Authorization"] = token;
      } else {
        headers["Authorization"] = `Bearer ${token}`;
      }
      console.log('[test] Using auth token:', token ? '***' + token.slice(-10) : 'none');
    } else {
      console.warn('[test] No auth token available - API calls may fail');
    }

    const results = {
      success: true,
      ticketId: extractedTicketId,
      room: room,
      steps: []
    };

    // Step 1: Create/ensure chat session
    console.log('[test] Step 1: Ensuring chat session exists...');
    try {
      const sessionResp = await fetch(`${base}/v1/chats/sessions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ticket_id: Number(extractedTicketId) })
      });

      const sessionResult = {
        step: 1,
        action: 'create_session',
        url: `${base}/v1/chats/sessions`,
        status: sessionResp.status,
        success: sessionResp.ok
      };

      if (!sessionResp.ok) {
        const sessionError = await sessionResp.text();
        sessionResult.error = sessionError;
        console.warn('[test] Session creation failed:', sessionResp.status, sessionError);
      } else {
        const sessionData = await sessionResp.json();
        sessionResult.data = sessionData;
        console.log('[test] Session ensured:', sessionData);
      }

      results.steps.push(sessionResult);
    } catch (err) {
      results.steps.push({
        step: 1,
        action: 'create_session',
        success: false,
        error: err.message
      });
    }

    // Step 2: Save message
    console.log('[test] Step 2: Sending message...');
    try {
      const messageResp = await fetch(`${base}/v1/chats/${extractedTicketId}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sender_id, sender_type_id, message: messageText })
      });

      const messageResult = {
        step: 2,
        action: 'save_message',
        url: `${base}/v1/chats/${extractedTicketId}/messages`,
        status: messageResp.status,
        success: messageResp.ok
      };

      if (!messageResp.ok) {
        const errorText = await messageResp.text();
        messageResult.error = errorText;
        console.error('[test] Message save failed:', messageResp.status, errorText);
        results.success = false;
      } else {
        const saved = await messageResp.json();
        messageResult.data = saved;
        console.log('[test] ✅ Message saved successfully:', saved);
      }

      results.steps.push(messageResult);
    } catch (err) {
      results.steps.push({
        step: 2,
        action: 'save_message',
        success: false,
        error: err.message
      });
      results.success = false;
    }

    console.log('=== TEST RESULT ===');
    console.log('Success:', results.success);
    console.log('Steps completed:', results.steps.length);

    return res.json(results);

  } catch (error) {
    console.error('[test] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint untuk check config
router.get('/test-config', (req, res) => {
  const { BACKEND_API_URL, API_TOKEN } = require('../config/config');
  
  res.json({
    backend_api_url: BACKEND_API_URL,
    api_token_configured: !!API_TOKEN,
    api_token_preview: API_TOKEN ? '***' + API_TOKEN.slice(-4) : null,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint untuk simulate different room formats
router.post('/test-room-formats', async (req, res) => {
  const testRooms = [
    'ticket:123',
    'call:ticket-456', 
    'dm:CUS-1:EMP-2',
    'support:ticket-789',
    'invalid-room-format'
  ];

  const results = [];

  for (const room of testRooms) {
    const ticketId = room.match(/ticket[-:]?(\d+)/)?.[1] ?? null;
    const isDM = room.startsWith("dm:");
    
    results.push({
      room,
      extracted_ticket_id: ticketId,
      is_dm_room: isDM,
      will_persist: !!ticketId && !isDM,
      reason: isDM ? 'DM room - skip persistence' : 
              ticketId ? 'Valid ticket room' : 
              'Cannot extract ticket ID'
    });
  }

  res.json({
    test_type: 'room_format_validation',
    results
  });
});

module.exports = router;
