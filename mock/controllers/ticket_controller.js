const jwt = require('jsonwebtoken');

class TicketController {
    constructor(db) {
        this.db = db;
    }

    static createInstance(db) {
        return new TicketController(db);
    }

    // Method untuk data customer (ringkas)
    getCustomerTicketData(ticketId) {
        const ticket = this.db.get('ticket').find({ ticket_id: parseInt(ticketId) }).value();
        if (!ticket) return null;

        const customerStatus = this.db.get('customer_status')
            .find({ customer_status_id: ticket.customer_status_id })
            .value();
        
        const issueChannel = this.db.get('channel')
            .find({ channel_id: ticket.issue_channel_id })
            .value();
        
        const complaint = this.db.get('complaint_category')
            .find({ complaint_id: ticket.complaint_id })
            .value();

        return {
            ticket_id: ticket.ticket_id,
            ticket_number: ticket.ticket_number,
            description: ticket.description,
            customer_status: customerStatus?.customer_status_name || null,
            issue_channel: issueChannel?.channel_name || null,
            complaint: complaint?.complaint_name || null,
            created_time: ticket.created_time
        };
    }

    // Endpoint untuk customer version (ringkas)
    async getCustomerTicket(req, res, next) {
        try {
            const { ticketId } = req.params;
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw {
                    status: 401,
                    message: "Authorization token required"
                };
            }

            const token = authHeader.split(' ')[1];
            const secret = process.env.JWT_SECRET || 'your-secret-key';
            const decoded = jwt.verify(token, secret);

            if (decoded.role !== 'customer') {
                throw {
                    status: 403,
                    message: "Access denied. Customer access only"
                };
            }

            const ticket = this.db.get('ticket').find({ ticket_id: parseInt(ticketId) }).value();

            if (!ticket) {
                throw {
                    status: 404,
                    message: "Ticket not found"
                };
            }

            if (ticket.customer_id !== decoded.id) {
                throw {
                    status: 403,
                    message: "Access denied. You can only view your own tickets"
                };
            }

            const ticketDetails = this.getCustomerTicketData(ticketId);

            res.status(200).json({
                message: "Success get ticket details",
                data: ticketDetails
            });

        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                error.status = 401;
                error.message = 'Invalid token';
            }
            next(error);
        }
    }
}

module.exports = TicketController;
