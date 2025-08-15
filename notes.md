Step 1: Generate ALL Migrations

Master Data (No Dependencies)
bashnpx sequelize-cli model:generate --name Customer
npx sequelize-cli model:generate --name Agent  
npx sequelize-cli model:generate --name Channel
npx sequelize-cli model:generate --name Source
npx sequelize-cli model:generate --name Service
npx sequelize-cli model:generate --name Priority
npx sequelize-cli model:generate --name Uic
npx sequelize-cli model:generate --name ComplaintCategory
npx sequelize-cli model:generate --name Sla

Level 2 (Depend on Master)
bashnpx sequelize-cli model:generate --name Account
npx sequelize-cli model:generate --name Card
npx sequelize-cli model:generate --name Terminal
npx sequelize-cli model:generate --name ComplaintPolicy
npx sequelize-cli model:generate --name Faq
npx sequelize-cli model:generate --name ChatbotSession

Level 3 (Depend on Level 2)
bashnpx sequelize-cli model:generate --name FaqLog
npx sequelize-cli model:generate --name ChatbotMessage
npx sequelize-cli model:generate --name Ticket

Level 4 (Depend on Ticket)
bashnpx sequelize-cli model:generate --name TicketTransaction
npx sequelize-cli model:generate --name TicketActivity
npx sequelize-cli model:generate --name TicketUicEscalation
npx sequelize-cli model:generate --name Attachment
npx sequelize-cli model:generate --name Feedback
npx sequelize-cli model:generate --name Notification
npx sequelize-cli model:generate --name ChatMessage
npx sequelize-cli model:generate --name CallLog