'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('complaint_category', [
      { complaint_id: 1, complaint_code: '2ND_CHARGEBACK', complaint_name: '2nd Chargeback', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 2, complaint_code: '2ND_CHARGEBACK_QRIS_DEBIT', complaint_name: '2nd Chargeback QRIS Debit', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 3, complaint_code: 'BI_FAST_BILATERAL', complaint_name: 'BI-FAST Bilateral (Refund,salah/batal Care/ 7 transfer,rek terdebet > 1x)', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 4, complaint_code: 'BI_FAST_DANA_TIDAK_MASUK', complaint_name: 'BI-FAST Dana Tidak Masuk ke Rek Tujuan', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 5, complaint_code: 'BI_FAST_GAGAL_HAPUS_AKUN', complaint_name: 'BI-FAST Gagal Hapus Akun', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 6, complaint_code: 'BI_FAST_GAGAL_MIGRASI_AKUN', complaint_name: 'BI-FAST Gagal Migrasi Akun', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 7, complaint_code: 'BI_FAST_GAGAL_SUSPEND_AKUN', complaint_name: 'BI-FAST Gagal Suspend Akun', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 8, complaint_code: 'BI_FAST_GAGAL_UPDATE_AKUN', complaint_name: 'BI-FAST Gagal Update Akun', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 9, complaint_code: 'DISPUTE', complaint_name: 'Dispute', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 10, complaint_code: 'DISPUTE_QRIS_KARTU_DEBIT', complaint_name: 'Dispute QRIS Kartu Debit', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 11, complaint_code: 'MOBILE_TUNAI', complaint_name: 'Mobile Tunai', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 12, complaint_code: 'MOBILE_TUNAI_ALFAMART', complaint_name: 'Mobile Tunai Alfamart', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 13, complaint_code: 'MOBILE_TUNAI_ALFAMIDI', complaint_name: 'Mobile Tunai Alfamidi', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 14, complaint_code: 'MOBILE_TUNAI_INDOMARET', complaint_name: 'Mobile Tunai Indomaret', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 15, complaint_code: 'PEMBAYARAN_KARTU_KREDIT_BANK_LAIN', complaint_name: 'Pembayaran Kartu Kredit Bank Lain', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 16, complaint_code: 'PEMBAYARAN_KARTU_KREDIT_BNI', complaint_name: 'Pembayaran Kartu Kredit BNI', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 17, complaint_code: 'PEMBAYARAN_MPNG2', complaint_name: 'Pembayaran MPNG2', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 18, complaint_code: 'PEMBAYARAN_MPNG3', complaint_name: 'Pembayaran MPNG3', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 19, complaint_code: 'PEMBAYARAN_MPNG4', complaint_name: 'Pembayaran MPNG4', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 20, complaint_code: 'PEMBAYARAN_PLN_VIA_ATM_BANK_LAIN', complaint_name: 'Pembayaran PLN via ATM Bank Lain', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 21, complaint_code: 'PEMBAYARAN_SAMSAT', complaint_name: 'Pembayaran Samsat', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 22, complaint_code: 'PEMBAYARAN_TELKOM_TELKOMSEL_INDOSAT_PROVIDER_LAINNYA', complaint_name: 'Pembayaran Telkom/Telkomsel/Indosat/Provider Lainnya', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 23, complaint_code: 'PERMINTAAN_CCTV_ATM_BNI', complaint_name: 'Permintaan CCTV ATM BNI', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 24, complaint_code: 'SETOR_TUNAI_DI_MESIN_ATM_CRM', complaint_name: 'Setor Tunai Di Mesin ATM CRM', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 25, complaint_code: 'TARIK_TUNAI_DI_ATM_LINK', complaint_name: 'Tarik Tunai Di ATM Link', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 26, complaint_code: 'TARIK_TUNAI_DI_ATM_PRIMA', complaint_name: 'Tarik Tunai Di ATM Prima', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 27, complaint_code: 'TARIK_TUNAI_DI_ATM_CIRRUS', complaint_name: 'Tarik Tunai Di ATM Cirrus', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 28, complaint_code: 'TARIK_TUNAI_DI_JARINGAN_ALTO', complaint_name: 'Tarik Tunai Di Jaringan Alto', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 29, complaint_code: 'TARIK_TUNAI_DI_JARINGAN_BERSAMA', complaint_name: 'Tarik Tunai Di Jaringan Bersama', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 30, complaint_code: 'TARIK_TUNAI_DI_MESIN_ATM_BNI', complaint_name: 'Tarik Tunai Di Mesin ATM BNI', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 31, complaint_code: 'TOP_UP_DANA', complaint_name: 'Top Up Dana', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 32, complaint_code: 'TOP_UP_E_MONEY', complaint_name: 'Top Up e-money', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 33, complaint_code: 'TOP_UP_GOPAY', complaint_name: 'Top Up Gopay', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 34, complaint_code: 'TOP_UP_LINKAJA', complaint_name: 'Top Up LinkAja', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 35, complaint_code: 'TOP_UP_OVO', complaint_name: 'Top Up OVO', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 36, complaint_code: 'TOP_UP_PRA_MIGRASI_DANA_GAGAL_TERKOREKSI', complaint_name: 'Top Up Pra Migrasi, Dana Gagal Terkoreksi', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 37, complaint_code: 'TOP_UP_PULSA', complaint_name: 'Top Up Pulsa', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 38, complaint_code: 'TOP_UP_PULSA_VIA_ATM_BANK_LAIN', complaint_name: 'Top Up Pulsa via ATM Bank Lain', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 39, complaint_code: 'TOP_UP_SHOPEE_PAY', complaint_name: 'Top Up Shopee Pay', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 40, complaint_code: 'TRANSFER_ANTAR_REKENING_BNI', complaint_name: 'Transfer Antar Rekening BNI', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 41, complaint_code: 'TRANSFER_ATM_ALTO_DANA_TDK_MASUK', complaint_name: 'Transfer ATM Alto (Dana Tdk Masuk ke Rek Tujuan)', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 42, complaint_code: 'TRANSFER_ATM_ALTO_BILATERAL', complaint_name: 'Transfer ATM Alto Bilateral (Refund,salah/batal transfer,rek terdebet > 1x)', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 43, complaint_code: 'TRANSFER_ATM_ALTO_LINK_BILATERAL', complaint_name: 'Transfer ATM Alto Link Bilateral (Refund,salah/batal transfer,rek terdebet > 1x)', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 44, complaint_code: 'TRANSFER_ATM_BERSAMA_DANA_TDK_MASUK', complaint_name: 'Transfer ATM Bersama (Dana Tdk Masuk ke Rek Tujuan)', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 45, complaint_code: 'TRANSFER_ATM_BERSAMA_BILATERAL', complaint_name: 'Transfer ATM Bersama Bilateral (Refund,salah/batal transfer,rek terdebet > 1x)', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 46, complaint_code: 'TRANSFER_ATM_LINK_DANA_TDK_MASUK', complaint_name: 'Transfer ATM Link (Dana Tdk Masuk ke Rek Tujuan)', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 47, complaint_code: 'TRANSFER_ATM_PRIMA_DANA_TDK_MASUK', complaint_name: 'Transfer ATM Prima (Dana Tdk Masuk ke Rek Tujuan)', created_at: new Date(), updated_at: new Date() },
      { complaint_id: 48, complaint_code: 'TRANSFER_ATM_PRIMA_BILATERAL', complaint_name: 'Transfer ATM Prima Bilateral (Refund,salah/batal transfer,rek terdebet > 1x)', created_at: new Date(), updated_at: new Date() }
    ], {});

    // Fix sequence
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('complaint_category', 'complaint_id'), COALESCE(MAX(complaint_id), 1)) FROM complaint_category;"
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('complaint_category', null, {});
  }
};
