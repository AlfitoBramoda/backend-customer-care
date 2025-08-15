'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('faq', [
      {
        faq_id: 1,
        complaint_id: 4,
        question: 'Apa yang harus dilakukan jika transaksi BI-FAST gagal atau dana tidak masuk?',
        answer: 'Simpan bukti transaksi dan hubungi BNI Call untuk pengecekan dan proses refund.',
        keywords: 'dana tidak masuk, bifast',
        created_at: new_Date(),
        updated_at: new Date()
      },
      {
        faq_id: 2,
        complaint_id: 31,
        question: 'Bagaimana jika Top Up Dana atau pembayaran tagihan gagal?',
        answer: 'Pastikan saldo terpotong, simpan bukti transaksi, lalu laporkan ke BNI Call atau cabang.',
        keywords: 'gagal topup, dana',
        created_at: new_Date(),
        updated_at: new Date()
      },
      {
        faq_id: 3,
        complaint_id: 25,
        question: 'Apa yang harus dilakukan jika tarik tunai di ATM Link gagal tetapi saldo terpotong?',
        answer: 'Catat lokasi dan waktu, simpan struk, lalu ajukan laporan ke BNI Call untuk proses pengembalian dana.',
        keywords: 'transfer gagal, mbank',
        created_at: new_Date(),
        updated_at: new Date()
      }
    ],{});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('faq', null, {});
  }
};
