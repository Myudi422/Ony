API Key Diperlukan
Semua request harus menyertakan API Key di header:

x-api-key: YOUR_API_KEY

Dapatkan API Key di Dashboard → Settings → API Keys

cURL / Postman
Ganti YOUR_API_KEY dengan API Key Anda
curl -X POST https://cashi.id/api/create-order \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "amount": 50000,
  "order_id": "TRX123"
}'

Contoh Request
Endpoint
Body
Contoh Request
POST
https://cashi.id/api/create-order

Parameter	Contoh	Tipe	Wajib	Keterangan
amount	50000	Number	Ya	Nominal pembayaran (min 2.000, max 10.000.000)
order_id	TRX123	String	Tidak	ID unik dari sistem Anda (wajib unik!)
kode_channel	BCA	String	Tidak	Pilih metode pembayaran (lihat tab di bawah)
QRIS Utama
QRIS Custom
Virtual Account
Retail
{
  "amount": 50000,
  "order_id": "TRX123"
}


{
  "amount": 50000,
  "order_id": "TRX123",
  "kode_channel": "QRIS_CUSTOM"
}

{
  "amount": 50000,
  "order_id": "TRX123",
  "kode_channel": "BCA"
}

{
  "amount": 50000,
  "order_id": "TRX123",
  "kode_channel": "ALFAMART"
}

Kode channel dapat ditemukan di Metode Pembayaran pada dashboard merchant.

Response
Berikut response API sesuai dengan kategori pembayarannya

QRIS
Virtual Akun
Retail
{
    "success": true,
    "orderId": "TRX12345",
    "amount": 50000,
    "checkout_url": "https://cashi.id/pay/TRX12345",
    "qrUrl": "data:image/png; ......",
    "expires_at": "0",
    "provider": "CASHI",
    "fee": 0.7
}

{
    "success": true,
    "orderId": "TRX123",
    "amount": 50000,
    "total_amount": 54200,
    "admin_fee": 4200,
    "expected_net": 47500,
    "va_number": "1551418080000130",
    "bank": "BCA",
    "bank_name": "BCA VA",
    "expires_at": "0",
    "provider": "VA",
    "kode_channel": "BCA"
}


{
  "success": true,
  "orderId": "TRX123",
  "amount": 50000,
  "total_amount": 51500,
  "admin_fee": 1500,
  "expected_net": 47500,
  "payment_code": "211752000000025",
  "retail_code": "ALFAMART",
  "retail_name": "Alfamart",
  "expires_at": "0",
  "provider": "RETAIL",
  "kode_channel": "ALFAMART"
}

Webhooks
WAJIB: Verifikasi Signature
JANGAN memproses webhook tanpa verifikasi signature.
Risiko keamanan jika tidak diverifikasi:
Attacker dapat mengirim request webhook palsu
Penambahan saldo tanpa pembayaran yang sah
Webhook dapat di-replay (diproses berulang)
Potensi kerugian finansial bagi bisnis Anda

PHP
NODEJS
NODEJS HANDLER
const crypto = require('crypto');

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-gateway-signature'];
  
  if (!signature) {
    return res.status(401).send('Missing signature');
  }

  const payload = JSON.stringify(req.body);
  const expected = crypto
    .createHmac('sha256', 'YOUR_SECRET_KEY')
    .update(payload)
    .digest('hex');

  if (signature !== expected) {
    return res.status(401).send('Invalid signature');
  }

  const { event, data } = req.body;

  if (event === 'PAYMENT_SETTLED') {
    if (data.order_id?.startsWith('TEST-')) {
      return res.status(200).send('Test OK');
    }

    if (data.status === 'SETTLED') {
      // Update database: ubah status order jadi lunas
      // await db.query('UPDATE orders SET status = "paid" WHERE order_id = ?', [data.order_id]);
    }
    
    res.status(200).send('OK');
  } else {
    res.status(200).send('Event ignored');
  }
});

Check Status
GET
https://cashi.id/api/check-status/:orderId
{
  "success": true,
  "status": "SETTLED",
  "amount": 50078,
  "order_id": "INV-123"
}




API KEY : 7576626ad46a47041a3dc4b6e133d6abb33a8dbb58ae8b706731c5fffa806dfa
WEBHOOK SECRET KEY : sk_b3e73f271e3c0a68fc65168d14920e7b