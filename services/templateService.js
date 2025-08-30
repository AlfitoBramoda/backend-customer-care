const { Ticket, User, TicketStatus, CustomerStatus } = require('../models'); // Adjust path accordingly

class TemplateService {
    
    async getTicketCreatedTemplate(ticketId, userType) {
        try {
            const ticket = await Ticket.findByPk(ticketId, {
                include: [
                    {
                        model: TicketStatus,
                        as: 'ticketStatus'
                    },
                    {
                        model: CustomerStatus, 
                        as: 'customerStatus'
                    }
                ]
            });

            if (!ticket) {
                throw new Error(`Ticket with ID ${ticketId} not found`);
            }

            if (userType === 'customer') {
                return {
                    title: 'Ticket Berhasil Dibuat',
                    body: `Ticket #${ticket.ticket_number} telah diterima. Kami akan segera menindaklanjuti keluhan Anda.`,
                    data: {
                        ticket_id: String(ticket.ticket_id),
                        ticket_number: ticket.ticket_number,
                        action: 'view_ticket',
                        type: 'ticket_created'
                    }
                };
            }

            return {
                title: 'Ticket Baru Ditugaskan',
                body: `Ticket #${ticket.ticket_number} telah ditugaskan kepada Anda.`,
                data: {
                    ticket_id: String(ticket.ticket_id),
                    ticket_number: ticket.ticket_number,
                    action: 'view_ticket',
                    type: 'ticket_assigned'
                }
            };
        } catch (error) {
            console.error('Error in getTicketCreatedTemplate:', error);
            throw error;
        }
    }

    async getTicketUpdatedTemplate(ticketId, userType, action = 'updated') {
        try {
            const ticket = await Ticket.findByPk(ticketId, {
                include: [
                    {
                        model: TicketStatus,
                        as: 'ticketStatus'
                    },
                    {
                        model: CustomerStatus,
                        as: 'customerStatus'
                    }
                ]
            });

            if (!ticket) {
                throw new Error(`Ticket with ID ${ticketId} not found`);
            }

            const actionMap = {
                'updated': 'diperbarui',
                'escalated': 'dieskalasi',
                'closed': 'ditutup',
                'reopened': 'dibuka kembali'
            };

            if (userType === 'customer') {
                // Customer notification berdasarkan status mereka
                const customerStatusMap = {
                    1: 'Ticket Anda telah diterima', // ACC
                    2: 'Ticket Anda sedang diverifikasi', // VERIF  
                    3: 'Ticket Anda sedang diproses', // PROCESS
                    4: 'Ticket Anda telah selesai', // CLOSED
                    5: 'Ticket Anda tidak dapat diproses' // DECLINED
                };
                
                const statusMessage = customerStatusMap[ticket.customer_status_id] || 'Ticket Anda telah diperbarui';
                
                return {
                    title: 'Update Status Ticket',
                    body: `${statusMessage}. Ticket #${ticket.ticket_number}`,
                    data: {
                        ticket_id: String(ticket.ticket_id),
                        ticket_number: ticket.ticket_number,
                        action: 'view_ticket',
                        type: 'ticket_updated'
                    }
                };
            }

            return {
                title: 'Ticket Diperbarui',
                body: `Ticket #${ticket.ticket_number} telah ${actionMap[action] || 'diperbarui'}.`,
                data: {
                    ticket_id: String(ticket.ticket_id),
                    ticket_number: ticket.ticket_number,
                    action: 'view_ticket',
                    type: 'ticket_updated'
                }
            };
        } catch (error) {
            console.error('Error in getTicketUpdatedTemplate:', error);
            throw error;
        }
    }

    async getTicketEscalatedTemplate(ticketId, userType) {
        try {
            const ticket = await Ticket.findByPk(ticketId, {
                include: [
                    {
                        model: TicketStatus,
                        as: 'ticketStatus'
                    },
                    {
                        model: CustomerStatus,
                        as: 'customerStatus'
                    }
                ]
            });

            if (!ticket) {
                throw new Error(`Ticket with ID ${ticketId} not found`);
            }

            if (userType === 'customer') {
                return {
                    title: 'Update Status Ticket',
                    body: `Ticket #${ticket.ticket_number} sedang diproses oleh tim spesialis.`,
                    data: {
                        ticket_id: String(ticket.ticket_id),
                        ticket_number: ticket.ticket_number,
                        action: 'view_ticket',
                        type: 'ticket_escalated'
                    }
                };
            }

            return {
                title: 'Ticket Dieskalasi',
                body: `Ticket #${ticket.ticket_number} telah dieskalasi kepada Anda.`,
                data: {
                    ticket_id: String(ticket.ticket_id),
                    ticket_number: ticket.ticket_number,
                    action: 'view_ticket',
                    type: 'ticket_escalated'
                }
            };
        } catch (error) {
            console.error('Error in getTicketEscalatedTemplate:', error);
            throw error;
        }
    }

    async getTicketClosedTemplate(ticketId, userType) {
        try {
            const ticket = await Ticket.findByPk(ticketId, {
                include: [
                    {
                        model: TicketStatus,
                        as: 'ticketStatus'
                    },
                    {
                        model: CustomerStatus,
                        as: 'customerStatus'
                    }
                ]
            });

            if (!ticket) {
                throw new Error(`Ticket with ID ${ticketId} not found`);
            }

            if (userType === 'customer') {
                return {
                    title: 'Ticket Selesai',
                    body: `Ticket #${ticket.ticket_number} telah selesai diproses. Terima kasih atas kepercayaan Anda.`,
                    data: {
                        ticket_id: String(ticket.ticket_id),
                        ticket_number: ticket.ticket_number,
                        action: 'rate_ticket',
                        type: 'ticket_closed'
                    }
                };
            }
            
            return {
                title: 'Ticket Ditutup',
                body: `Ticket #${ticket.ticket_number} telah ditutup.`,
                data: {
                    ticket_id: String(ticket.ticket_id),
                    ticket_number: ticket.ticket_number,
                    action: 'view_ticket',
                    type: 'ticket_closed'
                }
            };
        } catch (error) {
            console.error('Error in getTicketClosedTemplate:', error);
            throw error;
        }
    }

    async getSLAWarningTemplate(ticketId, userType, hoursLeft) {
        try {
            const ticket = await Ticket.findByPk(ticketId, {
                include: [
                    {
                        model: TicketStatus,
                        as: 'ticketStatus'
                    },
                    {
                        model: CustomerStatus,
                        as: 'customerStatus'
                    }
                ]
            });

            if (!ticket) {
                throw new Error(`Ticket with ID ${ticketId} not found`);
            }

            if (userType === 'customer') {
                return {
                    title: 'Update Progress Ticket',
                    body: `Ticket #${ticket.ticket_number} sedang dalam proses penyelesaian.`,
                    data: {
                        ticket_id: String(ticket.ticket_id),
                        ticket_number: ticket.ticket_number,
                        action: 'view_ticket',
                        type: 'sla_warning'
                    }
                };
            }

            return {
                title: 'SLA Warning',
                body: `Ticket #${ticket.ticket_number} akan melewati SLA dalam ${hoursLeft} jam.`,
                data: {
                    ticket_id: String(ticket.ticket_id),
                    ticket_number: ticket.ticket_number,
                    action: 'view_ticket',
                    type: 'sla_warning',
                    priority: 'high'
                }
            };
        } catch (error) {
            console.error('Error in getSLAWarningTemplate:', error);
            throw error;
        }
    }
}

module.exports = new TemplateService();
