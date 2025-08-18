// Test Status History untuk Ticket ID 1
// Jalankan: node test-status-history.js

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/v1';

async function testStatusHistory() {
    try {
        console.log('🔍 Testing Status History for Ticket ID 1...\n');

        // Login sebagai employee untuk akses penuh
        const loginResponse = await axios.post(`${BASE_URL}/auth/login/employee`, {
            npp: 'EMP00001',
            password: 'password123'
        });

        const token = loginResponse.data.data.access_token;
        console.log('✅ Login berhasil sebagai employee\n');

        // Get ticket detail dengan status history
        const ticketResponse = await axios.get(`${BASE_URL}/tickets/1`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const ticket = ticketResponse.data.data;
        
        console.log('📋 TICKET INFORMATION:');
        console.log(`Ticket Number: ${ticket.ticket_number}`);
        console.log(`Description: ${ticket.description}`);
        console.log(`Created: ${ticket.created_time}`);
        console.log(`Current Customer Status: ${ticket.customer_status.customer_status_name} (${ticket.customer_status.customer_status_code})`);
        console.log(`Current Employee Status: ${ticket.employee_status.employee_status_name} (${ticket.employee_status.employee_status_code})`);
        
        console.log('\n📊 CUSTOMER STATUS HISTORY:');
        console.log('═'.repeat(80));
        ticket.status_history.customer_status_history.forEach((status, index) => {
            const isInitial = status.is_initial ? ' (Initial)' : '';
            console.log(`${index + 1}. ${status.status_name} (${status.status_code})${isInitial}`);
            console.log(`   Changed by: ${status.changed_by}`);
            console.log(`   Changed at: ${status.changed_at}`);
            console.log(`   Activity ID: ${status.activity_id}`);
            console.log('');
        });

        console.log('👨‍💼 EMPLOYEE STATUS HISTORY:');
        console.log('═'.repeat(80));
        ticket.status_history.employee_status_history.forEach((status, index) => {
            const isInitial = status.is_initial ? ' (Initial)' : '';
            console.log(`${index + 1}. ${status.status_name} (${status.status_code})${isInitial}`);
            console.log(`   Changed by: ${status.changed_by}`);
            console.log(`   Changed at: ${status.changed_at}`);
            console.log(`   Activity ID: ${status.activity_id}`);
            console.log('');
        });

        // Test activities endpoint juga
        console.log('🔄 TESTING ACTIVITIES ENDPOINT:');
        console.log('═'.repeat(80));
        
        const activitiesResponse = await axios.get(`${BASE_URL}/tickets/1/activities?activity_type=STATUS_CHANGE`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const activities = activitiesResponse.data.data.activities;
        console.log(`Found ${activities.length} status change activities:\n`);
        
        activities.forEach((activity, index) => {
            console.log(`${index + 1}. ${activity.activity_type.ticket_activity_name}`);
            console.log(`   Content: ${activity.content}`);
            console.log(`   By: ${activity.sender.full_name} (${activity.sender.type})`);
            console.log(`   Time: ${activity.ticket_activity_time}`);
            console.log('');
        });

        console.log('✅ Status History Test Completed Successfully!');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// Jalankan test
testStatusHistory();