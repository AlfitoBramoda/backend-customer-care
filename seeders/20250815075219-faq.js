'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('faq', [
      {
        faq_id: 1,
        channel_id: 6,
        question: 'Apa yang harus dilakukan jika transaksi BI-FAST gagal atau dana tidak masuk?',
        answer: 'Simpan bukti transaksi dan hubungi BNI Call untuk pengecekan dan proses refund.',
        keywords: 'dana tidak masuk,bifast,transfer gagal',
        created_at: new Date('2025-08-14T08:10:00Z'),
        updated_at: new Date('2025-08-14T08:11:00Z')
      },
      {
        faq_id: 2,
        channel_id: 6,
        question: 'Bagaimana jika Top Up Dana atau pembayaran tagihan gagal?',
        answer: 'Pastikan saldo terpotong, simpan bukti transaksi, lalu laporkan ke BNI Call atau cabang.',
        keywords: 'gagal topup,dana,pembayaran tagihan',
        created_at: new Date('2025-08-14T08:12:00Z'),
        updated_at: new Date('2025-08-14T08:13:00Z')
      },
      {
        faq_id: 3,
        channel_id: 1,
        question: 'Apa yang harus dilakukan jika tarik tunai di ATM Link gagal tetapi saldo terpotong?',
        answer: 'Catat lokasi dan waktu, simpan struk, lalu ajukan laporan ke BNI Call untuk proses pengembalian dana.',
        keywords: 'tarik tunai gagal,atm link,saldo terpotong',
        created_at: new Date('2025-08-14T08:14:00Z'),
        updated_at: new Date('2025-08-14T08:15:00Z')
      },
      {
        faq_id: 4,
        channel_id: 1,
        question: 'Bagaimana cara melaporkan kartu ATM yang tertelan mesin?',
        answer: 'Segera hubungi BNI Call 1500046, catat nomor ATM dan lokasi, serta waktu kejadian. Kartu akan diblokir sementara untuk keamanan.',
        keywords: 'kartu tertelan,atm,blokir kartu',
        created_at: new Date('2025-08-14T08:16:00Z'),
        updated_at: new Date('2025-08-14T08:16:00Z')
      },
      {
        faq_id: 5,
        channel_id: 6,
        question: 'Mengapa transfer antar rekening BNI di Mobile Banking gagal?',
        answer: 'Pastikan saldo mencukupi, nomor rekening tujuan benar, dan jaringan internet stabil. Jika masih gagal, coba beberapa saat lagi atau hubungi BNI Call.',
        keywords: 'transfer gagal,mobile banking,antar rekening bni',
        created_at: new Date('2025-08-14T08:18:00Z'),
        updated_at: new Date('2025-08-14T08:18:00Z')
      },
      {
        faq_id: 6,
        channel_id: 5,
        question: 'Bagaimana cara mengatasi Internet Banking yang tidak bisa login?',
        answer: 'Pastikan User ID dan password benar, clear cache browser, atau coba browser lain. Jika tetap tidak bisa, hubungi BNI Call untuk reset password.',
        keywords: 'internet banking,login gagal,reset password',
        created_at: new Date('2025-08-14T08:20:00Z'),
        updated_at: new Date('2025-08-14T08:20:00Z')
      },
      {
        faq_id: 7,
        channel_id: 1,
        question: 'Apa yang harus dilakukan jika pembayaran kartu kredit BNI di ATM gagal?',
        answer: 'Simpan struk transaksi, catat waktu dan lokasi ATM. Hubungi BNI Call untuk verifikasi pembayaran dan proses refund jika diperlukan.',
        keywords: 'pembayaran kartu kredit,atm,gagal bayar',
        created_at: new Date('2025-08-14T08:22:00Z'),
        updated_at: new Date('2025-08-14T08:22:00Z')
      },
      {
        faq_id: 8,
        channel_id: 6,
        question: 'Bagaimana cara mengatasi Top Up GoPay yang gagal di Mobile Banking?',
        answer: 'Pastikan nomor GoPay benar dan saldo mencukupi. Jika transaksi gagal tapi saldo terpotong, simpan bukti dan laporkan ke BNI Call.',
        keywords: 'top up gopay,mobile banking,gagal topup',
        created_at: new Date('2025-08-14T08:24:00Z'),
        updated_at: new Date('2025-08-14T08:24:00Z')
      },
      {
        faq_id: 9,
        channel_id: 1,
        question: 'Mengapa tarik tunai di ATM Prima/Bersama sering gagal?',
        answer: 'Pastikan saldo mencukupi dan kartu tidak bermasalah. Jika gagal tapi saldo terpotong, catat detail transaksi dan hubungi BNI Call.',
        keywords: 'tarik tunai,atm prima,atm bersama,gagal tarik',
        created_at: new Date('2025-08-14T08:26:00Z'),
        updated_at: new Date('2025-08-14T08:26:00Z')
      },
      {
        faq_id: 10,
        channel_id: 6,
        question: 'Bagaimana cara mengatasi Top Up OVO yang tidak masuk saldo?',
        answer: 'Cek riwayat transaksi di Mobile Banking. Jika sudah terpotong tapi OVO belum bertambah, hubungi BNI Call dengan bukti transaksi.',
        keywords: 'top up ovo,saldo tidak masuk,mobile banking',
        created_at: new Date('2025-08-14T08:28:00Z'),
        updated_at: new Date('2025-08-14T08:28:00Z')
      },
      {
        faq_id: 11,
        channel_id: 1,
        question: 'Apa yang harus dilakukan jika top up pulsa di ATM gagal?',
        answer: 'Pastikan nomor HP benar dan nominal sesuai. Jika gagal tapi saldo terpotong, simpan struk dan laporkan ke BNI Call.',
        keywords: 'top up pulsa,atm,gagal topup',
        created_at: new Date('2025-08-14T08:30:00Z'),
        updated_at: new Date('2025-08-14T08:30:00Z')
      },
      {
        faq_id: 12,
        channel_id: 7,
        question: 'Bagaimana cara menggunakan Mobile Tunai di ATM BNI?',
        answer: 'Buka aplikasi BNI Mobile Banking, pilih Mobile Tunai, masukkan nominal, dapatkan kode OTP, lalu masukkan kode di ATM BNI terdekat.',
        keywords: 'mobile tunai,atm bni,tarik tunai tanpa kartu',
        created_at: new Date('2025-08-14T08:32:00Z'),
        updated_at: new Date('2025-08-14T08:32:00Z')
      },
      {
        faq_id: 13,
        channel_id: 8,
        question: 'Bagaimana cara menggunakan Mobile Tunai di Alfamart?',
        answer: 'Buka BNI Mobile Banking, pilih Mobile Tunai Alfamart, masukkan nominal, dapatkan kode, tunjukkan kode ke kasir Alfamart.',
        keywords: 'mobile tunai alfamart,tarik tunai,tanpa kartu',
        created_at: new Date('2025-08-14T08:34:00Z'),
        updated_at: new Date('2025-08-14T08:34:00Z')
      },
      {
        faq_id: 14,
        channel_id: 9,
        question: 'Mengapa pembayaran QRIS dengan kartu debit BNI gagal?',
        answer: 'Pastikan saldo mencukupi, kartu aktif, dan merchant QRIS valid. Jika gagal tapi saldo terpotong, simpan bukti dan hubungi BNI Call.',
        keywords: 'qris,kartu debit,pembayaran gagal',
        created_at: new Date('2025-08-14T08:36:00Z'),
        updated_at: new Date('2025-08-14T08:36:00Z')
      },
      {
        faq_id: 15,
        channel_id: 3,
        question: 'Bagaimana cara setor tunai di mesin CRM BNI?',
        answer: 'Masukkan kartu ATM, pilih Setor Tunai, masukkan uang sesuai petunjuk mesin, konfirmasi jumlah, dan ambil struk sebagai bukti.',
        keywords: 'setor tunai,crm,cash recycling machine',
        created_at: new Date('2025-08-14T08:38:00Z'),
        updated_at: new Date('2025-08-14T08:38:00Z')
      },
      {
        faq_id: 16,
        channel_id: 6,
        question: 'Bagaimana cara mengatur limit transaksi di Mobile Banking?',
        answer: 'Login Mobile Banking, pilih Pengaturan > Limit Transaksi, masukkan PIN, atur limit sesuai kebutuhan, konfirmasi dengan SMS OTP.',
        keywords: 'limit transaksi,mobile banking,pengaturan',
        created_at: new Date('2025-08-14T08:40:00Z'),
        updated_at: new Date('2025-08-14T08:40:00Z')
      },
      {
        faq_id: 17,
        channel_id: 5,
        question: 'Bagaimana cara mendaftar Internet Banking BNI?',
        answer: 'Kunjungi cabang BNI terdekat dengan membawa KTP, buku tabungan, dan kartu ATM. Isi formulir pendaftaran dan dapatkan User ID.',
        keywords: 'daftar internet banking,registrasi,cabang bni',
        created_at: new Date('2025-08-14T08:42:00Z'),
        updated_at: new Date('2025-08-14T08:42:00Z')
      },
      {
        faq_id: 18,
        channel_id: 1,
        question: 'Apa yang harus dilakukan jika lupa PIN ATM?',
        answer: 'Kunjungi cabang BNI terdekat dengan membawa KTP dan kartu ATM untuk reset PIN. Tidak bisa dilakukan melalui telepon atau online.',
        keywords: 'lupa pin atm,reset pin,cabang bni',
        created_at: new Date('2025-08-14T08:44:00Z'),
        updated_at: new Date('2025-08-14T08:44:00Z')
      },
      {
        faq_id: 19,
        channel_id: 6,
        question: 'Bagaimana cara blokir kartu ATM yang hilang melalui Mobile Banking?',
        answer: 'Login Mobile Banking, pilih Kartu > Blokir Kartu, pilih kartu yang hilang, konfirmasi dengan PIN, kartu akan diblokir otomatis.',
        keywords: 'blokir kartu,kartu hilang,mobile banking',
        created_at: new Date('2025-08-14T08:46:00Z'),
        updated_at: new Date('2025-08-14T08:46:00Z')
      },
      {
        faq_id: 20,
        channel_id: 6,
        question: 'Mengapa transfer ke bank lain di Mobile Banking lama prosesnya?',
        answer: 'Transfer ke bank lain melalui kliring membutuhkan waktu 1-2 hari kerja. Untuk transfer instan, gunakan fitur BI-FAST dengan biaya tambahan.',
        keywords: 'transfer bank lain,kliring,bi-fast,mobile banking',
        created_at: new Date('2025-08-14T08:48:00Z'),
        updated_at: new Date('2025-08-14T08:48:00Z')
      },
      {
        faq_id: 21,
        channel_id: 1,
        question: 'Bagaimana cara cek saldo di ATM bank lain?',
        answer: 'Masukkan kartu BNI, pilih Cek Saldo, masukkan PIN. Akan dikenakan biaya administrasi sesuai ketentuan jaringan ATM yang digunakan.',
        keywords: 'cek saldo,atm bank lain,biaya admin',
        created_at: new Date('2025-08-14T08:50:00Z'),
        updated_at: new Date('2025-08-14T08:50:00Z')
      },
      {
        faq_id: 22,
        channel_id: 6,
        question: 'Bagaimana cara mengaktifkan notifikasi SMS untuk transaksi?',
        answer: 'Login Mobile Banking, pilih Pengaturan > Notifikasi SMS, aktifkan untuk jenis transaksi yang diinginkan, konfirmasi dengan PIN.',
        keywords: 'notifikasi sms,pengaturan,mobile banking',
        created_at: new Date('2025-08-14T08:52:00Z'),
        updated_at: new Date('2025-08-14T08:52:00Z')
      },
      {
        faq_id: 23,
        channel_id: 2,
        question: 'Bagaimana cara top up saldo Tapcash BNI?',
        answer: 'Top up bisa dilakukan di ATM BNI, teller cabang, atau merchant yang bekerja sama. Pilih menu Top Up Tapcash dan ikuti petunjuk.',
        keywords: 'top up tapcash,atm bni,merchant',
        created_at: new Date('2025-08-14T08:54:00Z'),
        updated_at: new Date('2025-08-14T08:54:00Z')
      },
      {
        faq_id: 24,
        channel_id: 6,
        question: 'Bagaimana cara mengubah nomor HP yang terdaftar di Mobile Banking?',
        answer: 'Kunjungi cabang BNI terdekat dengan membawa KTP dan buku tabungan untuk mengubah nomor HP yang terdaftar di sistem.',
        keywords: 'ubah nomor hp,mobile banking,cabang bni',
        created_at: new Date('2025-08-14T08:56:00Z'),
        updated_at: new Date('2025-08-14T08:56:00Z')
      },
      {
        faq_id: 25,
        channel_id: 1,
        question: 'Mengapa kartu ATM BNI tidak bisa digunakan di luar negeri?',
        answer: 'Pastikan kartu sudah diaktivasi untuk transaksi internasional. Hubungi BNI Call atau kunjungi cabang untuk aktivasi fitur overseas.',
        keywords: 'kartu atm,luar negeri,aktivasi overseas',
        created_at: new Date('2025-08-14T08:58:00Z'),
        updated_at: new Date('2025-08-14T08:58:00Z')
      }
    ],{});

    // Fix sequence
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('faq', 'faq_id'), COALESCE(MAX(faq_id), 1)) FROM faq;"
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('faq', null, {});
  }
};
