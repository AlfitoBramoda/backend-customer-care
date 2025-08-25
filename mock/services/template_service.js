class TemplateService {
    getTicketCreatedTemplate(ticket, userType) {
        if (userType === 'customer') {
            return {
                title: 'Ticket Berhasil Dibuat',
                body: `Ticket #${ticket.ticket_number} telah dibuat. Kami akan segera menindaklanjuti keluhan Anda.`,
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
    }

    getTicketUpdatedTemplate(ticket, userType, action = 'updated') {
        const actionMap = {
            'updated': 'diperbarui',
            'escalated': 'dieskalasi',
            'closed': 'ditutup',
            'reopened': 'dibuka kembali'
        };

        if (userType === 'customer') {
            return {
                title: 'Update Status Ticket',
                body: `Ticket #${ticket.ticket_number} telah ${actionMap[action] || 'diperbarui'}.`,
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
    }

    getTicketEscalatedTemplate(ticket, userType) {
        if (userType === 'customer') {
            return {
                title: 'Ticket Dieskalasi',
                body: `Ticket #${ticket.ticket_number} telah dieskalasi ke tim yang lebih spesialis untuk penanganan lebih lanjut.`,
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
    }

    getTicketClosedTemplate(ticket, userType) {
        return {
            title: 'Ticket Ditutup',
            body: `Ticket #${ticket.ticket_number} telah ditutup. Terima kasih atas kepercayaan Anda.`,
            data: {
                ticket_id: String(ticket.ticket_id),
                ticket_number: ticket.ticket_number,
                action: 'rate_ticket',
                type: 'ticket_closed'
            }
        };
    }

    getSLAWarningTemplate(ticket, userType, hoursLeft) {
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
    }
}

module.exports = new TemplateService();