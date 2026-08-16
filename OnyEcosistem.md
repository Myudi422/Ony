Product Requirements Document (PRD): Ony Smart Ecosystem
Version: 1.4

Focus: Self-Service Activation, Multi-Card Management, Dual Media Access (NFC Tap & QR Code Scan), User Dashboard (Analytics & Payment), & Admin Control Panel

Authentication: Google OAuth Only (User & Admin)

1. Product Goal
Membangun platform kartu pintar & QR digital (NFC Tap & Kode QR Scan) yang memungkinkan pengguna mengaktifkan satu atau banyak kartu/media secara mandiri (self-service & multi-card support) serta memiliki kendali penuh atas profil digital mereka (link, konten, redirect per kartu) melalui satu akun Google. Platform juga menyediakan Dashboard Pengguna yang komprehensif (Analitik Tap/Scan & Klik, Pembelian Media NFC/QR via Midtrans, Generator Kode QR HD, Manajemen Profil) serta Admin Control Panel untuk pengelolaan user, manajemen status & siklus kartu/QR, batch generation kode kartu, dan analitik ekosistem secara terpusat.

2. Core User Journey (The "Ony" Experience)

A. The Activation Journey (For NFC Cards / QR Codes / Sampling)
- The Discovery: User mendapatkan kartu/stiker/akrilik NFC & Kode QR baru (atau membeli kartu kosong).
- The Tap or Scan: User men-tap NFC kartu atau memindai (scan) Kode QR yang ada di fisik kartu/stiker dengan kamera HP mereka.
- The Hook: Sistem mendeteksi bahwa kode kartu belum memiliki pemilik (`unclaimed`). User diarahkan ke halaman Welcome/Claim.
- The Frictionless Login: User menekan tombol "Login with Google". (Jika sudah login, sistem langsung mengenali akun Google user yang aktif).
- The Ownership & Multi-Card Binding: Sistem otomatis mengikat `activation_code` kartu/QR tersebut ke akun Google User (`user_id`). Media baru ditambahkan ke daftar kartu milik user tanpa menghapus kartu lama.
- The Result: User langsung masuk ke Dashboard dan melihat kartu/QR barunya telah ditambahkan ke daftar media aktif.

B. The Management & Analytics Journey (For Regular User)
- Access: User login ke `ony.id/login` kapan saja menggunakan akun Google yang sama.
- Multi-Card & QR Switcher: User memilih kartu/QR mana yang ingin dikelola atau dianalisis (misal: "Kartu NFC Bisnis", "Stiker QR Mobil", "Standee QR Cafe").
- Individual Card/QR Control:
  - Label Kartu/QR: Mengubah nama/label identifier media (e.g. "Kartu Event Jakarta").
  - Edit Profil & Link: Mengelola foto, nama, bio, dan susunan link (WA, IG, LinkedIn, Portfolio).
  - Redirect Mode Per Kartu/QR: Pilihan independen untuk tiap media:
    - *Profile Mode*: Menampilkan halaman vCard profil digital.
    - *Direct Mode*: Langsung me-redirect ke 1 link spesifik (misal: Kartu A ke WhatsApp, Kartu B ke Web Toko Online).
  - High-Res QR Code Export: Mengunduh Kode QR resolusi tinggi (PNG/SVG/PDF) untuk dicetak ulang, dipakai sebagai wallpaper HP, atau stiker digital.
- Analytics Monitoring: User memantau grafik interaksi harian/mingguan (gabungan Tap NFC & Scan QR), link yang paling banyak diklik, serta tipe perangkat pengakses.
- Store & Payment: User membeli media NFC & Kode QR tambahan (Kartu PVC, Stiker NFC+QR, Standee Akrilik QR, Keychain) langsung dari dashboard dan membayar via Midtrans Snap.

C. The Admin Control Journey (For Superadmin / Admin)
- Access & Role Verification: Admin login via Google OAuth, middleware memverifikasi email/role terdaftar sebagai `admin` atau `superadmin` dan mengarahkan ke `/admin`.
- User Controlling & Multi-Card/QR Management:
  - Melihat daftar seluruh user beserta jumlah kartu/QR yang dimiliki oleh masing-masing akun Google (1 User -> N Kartu/QR).
  - Melihat detail setiap media NFC/QR milik user spesifik.
  - Melakukan suspend/ban user atau media spesifik jika terjadi indikasi penyalahgunaan konten.
  - Mengubah role user (Promote to Admin / Demote to User).
- Card/QR Lifecycle & Inventory Management:
  - Batch generation kode aktivasi baru untuk pencetakan fisik NFC & Kode QR.
  - Reset / Unbind kartu/QR spesifik jika user kehilangan kartu atau request transfer pemilikan ke akun Google lain.
  - Mengubah status media (Unclaimed, Active, Suspended, Lost).
- System Analytics & Order Processing: Pemantauan total tap/scan harian/bulanan, statistik aktivitas user, media teraktif, serta memproses pesanan fisik kartu/QR baru yang masuk.

3. Functional Requirements

1. Authentication & Role-Based Access Control (RBAC) Module
- Google OAuth: Satu-satunya metode akses untuk menekan hambatan pendaftaran (1 Akun Google untuk semua media NFC/QR).
- Session Management: Menggunakan NextAuth.js untuk mengelola sesi login user dan status role (`user`, `admin`, `superadmin`).
- Guard Middleware: Proteksi route `/admin/*` dan API `/api/admin/*` hanya dapat diakses oleh user ber-role Admin.

2. Activation & Ownership Module (Dual Access: NFC + QR Code)
- Single Unit Concept (NFC + QR Terkoneksi 1-ke-1): Setiap 1 fisik kartu/stiker memiliki 1 Chip NFC dan 1 Kode QR yang keduanya menggunakan `activation_code` dan URL yang SAMA (`ony.id/c/[activation_code]`).
- Universal Link Format: Format URL tunggal `ony.id/c/[activation_code]` yang ditulis ke dalam Chip NFC sekaligus dicetak dalam bentuk Kode QR pada fisik kartu yang sama.
- Claim System: Logika untuk memverifikasi apakah `activation_code` di URL sudah terikat `user_id` di database atau belum.
- Multi-Card/QR Binding: Jika belum terikat (`user_id == null`), sistem menambahkan media ke `user_id` dari akun Google user yang sedang login (Relasi 1:N).

3. User Dashboard Module (Multi-Card, QR Studio, Analytics & Payments)

A. Card & Profile Management Tab:
- Card/QR Switcher: UI Tabs/Dropdown untuk memilih media mana yang sedang dikelola.
- Label Editor: Input field untuk memberi nama/label pada masing-masing kartu/QR.
- Profile & Link Editor: Form untuk mengubah data profil (foto, nama, bio, vCard) dan susunan link (dynamic fields & drag-and-drop dengan `dnd-kit`).
- Mode Switcher: Toggle mode per kartu/QR (*Profile Mode* vs *Direct Mode*). Perubahan di dashboard langsung memperbarui hasil saat di-tap NFC maupun di-scan Kode QR secara real-time.
- QR Studio & Generator: Generator Kode QR interaktif (kustomisasi warna, logo Ony, dan unduh format PNG/SVG/PDF resolusi tinggi untuk cetak).
- Real-time Preview: Pratinjau tampilan profil seluler secara real-time.

B. User Analytics Tab (Analitik Tap & Scan):
- Metric Overview Cards: Total Interaksi (Tap NFC & Scan QR), Total Clicks (klik link), Active Media Count.
- Interactive Interaction Chart: Grafik tren tap & scan harian, mingguan, dan bulanan (menggunakan Recharts).
- Link Performance Breakdown: Analitik daftar link yang paling banyak diklik oleh pengunjung (Top Clicked Links).
- Traffic & Device Insights: Data statistik tipe perangkat (Mobile vs Desktop, iOS vs Android) dan browser pengakses.

C. Payment & Card/QR Store Tab (Pembayaran & Beli Produk):
- Catalog & Order Form: Pemesanan media fisik tambahan (Kartu PVC NFC+QR, Stiker NFC+QR, Standee Akrilik QR+NFC, Gantungan Kunci NFC+QR).
- Midtrans Payment Integration: Checkout seamless menggunakan Midtrans Snap SDK (QRIS, GoPay, ShopeePay, VA Bank, Credit Card).
- Transaction History & Invoices: Daftar riwayat transaksi (Status: Pending, Paid, Shipped, Cancelled), nomor resi pengiriman, dan tombol download Invoice.
- Payment Webhooks: Endpoint `/api/webhooks/midtrans` untuk memperbarui status pesanan secara otomatis secara real-time saat pembayaran selesai.

D. Account & Security Settings Tab:
- Profile Overview: Informasi akun Google terhubung.
- Media Inventory: Daftar seluruh kartu/QR milik user (dengan status: Active, Lost, Unclaimed).
- Lost/Stolen Media Action: Fitur untuk menonaktifkan atau menandai media yang hilang (*Report Lost*) agar tidak disalahgunakan orang lain.

4. Admin Control & User Management Module
- User Controlling Panel:
  - Datatable user (Search, Filter by status/role, Pagination, Filter by Card/QR Count).
  - Detail profil user, analitik interaksi user, & daftar semua kartu/QR yang dimiliki.
  - Akses kontrol: Action button untuk Suspend/Activate User, Change Role, dan Force Logout.
- Card/QR & Batch Management:
  - Batch generation kode aktivasi baru (Export CSV/JSON berisi URL & Kode QR siap cetak).
  - Manual Assign / Unbind media individual dari user.
  - Status switcher (Unclaimed, Active, Suspended, Lost).
- Order Management Panel:
  - Kelola pesanan fisik masuk (Update nomor resi pengiriman, status pesanan).
- Analytics & Audit Log:
  - Metric Cards: Total Users, Total Active Media (NFC & QR), Total Revenue, Total Tap/Scan Interactions.
  - Audit Log aktivitas admin (mencatat aksi suspend user, unbind kartu/QR, ubah role).

5. Public View (The "Tap & Scan" Result)
- Responsiveness: Halaman yang muncul saat kartu di-tap atau QR di-scan mobile-first (seperti aplikasi native).
- Universal Tap/Scan Counter: Pencatatan counter interaksi otomatis setiap kali kartu di-tap atau Kode QR di-scan.
- Click Analytics: Tracking otomatis ketika pengunjung menekan salah satu link di profil.
- vCard Download: Fitur untuk menyimpan kontak user ke buku telepon HP secara instan.

4. Database Schema (PostgreSQL)

users:
- `id`: UUID (PK)
- `email`: String (Unique Index)
- `name`: String
- `avatar_url`: String
- `role`: Enum ('user', 'admin', 'superadmin') - Default: 'user'
- `status`: Enum ('active', 'suspended', 'banned') - Default: 'active'
- `last_login_at`: Timestamp
- `created_at`: Timestamp
- `updated_at`: Timestamp

cards (Media NFC & Kode QR - Relasi 1:N dengan users):
- `id`: UUID (PK)
- `activation_code`: String (Unique Index)
- `user_id`: UUID (FK to users.id, nullable - null berarti belum diklaim / unclaimed)
- `card_name`: String - Default: 'Ony Card / QR Saya' (Label pengenal media)
- `media_type`: Enum ('nfc_card', 'nfc_sticker', 'qr_standee', 'qr_keychain', 'digital_qr') - Default: 'nfc_card'
- `status`: Enum ('unclaimed', 'active', 'suspended', 'lost') - Default: 'unclaimed'
- `mode`: Enum ('profile', 'direct') - Default: 'profile'
- `redirect_url`: String (nullable)
- `total_taps`: Integer - Default: 0 (Hit counter tap NFC & scan QR)
- `created_at`: Timestamp
- `updated_at`: Timestamp

links (Berelasi dengan user / card):
- `id`: UUID (PK)
- `user_id`: UUID (FK to users.id)
- `card_id`: UUID (FK to cards.id, nullable - jika null berlaku global untuk semua kartu user, jika ada ID berlaku spesifik)
- `title`: String
- `url`: String
- `icon_type`: String
- `order_index`: Integer
- `total_clicks`: Integer - Default: 0
- `is_active`: Boolean - Default: true
- `created_at`: Timestamp

orders (Pemesanan Media Fisik NFC & QR):
- `id`: UUID (PK)
- `order_number`: String (Unique Index, e.g., 'ONY-ORD-20260815-001')
- `user_id`: UUID (FK to users.id)
- `total_amount`: Decimal / Integer
- `shipping_address`: Text
- `shipping_courier`: String (nullable)
- `tracking_number`: String (nullable - Nomor Resi Pengiriman)
- `status`: Enum ('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled') - Default: 'pending'
- `created_at`: Timestamp
- `updated_at`: Timestamp

transactions (Pembayaran via Midtrans):
- `id`: UUID (PK)
- `order_id`: UUID (FK to orders.id)
- `midtrans_transaction_id`: String (nullable)
- `payment_type`: String (e.g., 'qris', 'gopay', 'bank_transfer')
- `gross_amount`: Decimal / Integer
- `transaction_status`: Enum ('pending', 'settlement', 'expire', 'cancel', 'deny') - Default: 'pending'
- `snap_token`: String (nullable)
- `created_at`: Timestamp
- `updated_at`: Timestamp

tap_logs (NFC Tap & QR Scan Tracking):
- `id`: UUID (PK)
- `card_id`: UUID (FK to cards.id)
- `access_method`: Enum ('nfc_tap', 'qr_scan', 'direct_url') - Default: 'nfc_tap'
- `ip_address`: String (nullable)
- `user_agent`: String (nullable)
- `tapped_at`: Timestamp

link_click_logs (Click Analytics):
- `id`: UUID (PK)
- `link_id`: UUID (FK to links.id)
- `card_id`: UUID (FK to cards.id)
- `clicked_at`: Timestamp

admin_audit_logs (Security & Auditing):
- `id`: UUID (PK)
- `admin_id`: UUID (FK to users.id)
- `action`: String (e.g., 'SUSPEND_USER', 'UNBIND_CARD', 'UPDATE_ORDER')
- `target_type`: String (e.g., 'USER', 'CARD', 'ORDER')
- `target_id`: String
- `details`: JSONB (nullable)
- `created_at`: Timestamp

5. Technical Requirements (Tech Stack Implementation)

- Next.js (App Router): Fondasi utama untuk App Server, API Routes, dan Edge Middleware.
- NextAuth.js: Mengelola Google OAuth dan Role Injection di JWT Token & Session.
- Edge Middleware: Redirect kartu/QR secara super cepat saat di-tap/di-scan, sekaligus proteksi route `/admin`.
- Fast API / Python FastAPI: Backend service / microservice pendukung (jika diperlukan untuk pengolahan data/analitik).
- PostgreSQL (Supabase / Neon): Database relasional utama untuk user, cards, links, orders, transactions, dan logs.
- Midtrans Client & Server SDK: Payment Gateway untuk transaksi pembelian media fisik & webhook listener.
- `qrcode.react` / `node-qrcode`: Library frontend & backend untuk generate Kode QR HD (PNG, SVG).
- shadcn/ui & Tailwind CSS & Recharts: Komponen UI & Charting library untuk User Dashboard & Admin Control Panel.
- dnd-kit: Library drag-and-drop untuk pengurutan link di dashboard user.
- Vercel: Deployment platform dengan Edge Network.

6. Security & Policy

- Dual Access Link Security: URL `ony.id/c/[activation_code]` di-encode di chip NFC dan dicetak sebagai Kode QR. Keamanan claim dan akses terjamin sama.
- Single OAuth - Multi Card/QR: 1 Akun Google dapat memiliki dan mengelola N media NFC & QR tanpa batas.
- Role-Based Access Control (RBAC):
  - User biasa tidak dapat mengakses `/admin` atau endpoint `/api/admin/*`.
  - Hanya role `admin` dan `superadmin` yang diberikan izin kelola user & kartu/QR.
- Secure Payment Processing: Verifikasi signature key webhook Midtrans pada `/api/webhooks/midtrans` untuk mencegah klaim status palsu.
- Card/QR Claim & Lost Security: Setiap media yang dilaporkan hilang (*Lost*) langsung diblokir redirect-nya oleh sistem (baik via Tap NFC maupun Scan QR).
- Content Policy Enforcement: Admin berhak menangguhkan (`suspended`) akun atau media spesifik jika melanggar ketentuan layanan.

7. Strategi "Promotion Sampling" & Dual Access Flow

Untuk media promosi/sampling (Kartu NFC & Kode QR):
1. Admin melakukan batch generation kode aktivasi di Admin Panel (menghasilkan URL `ony.id/c/[activation_code]` dan file Kode QR siap cetak).
2. Fisik kartu/stiker dicetak dengan Chip NFC yang di-program URL tersebut + Kode QR fisik yang dicetak di permukaan kartu/stiker.
3. Pengguna yang men-tap NFC maupun memindai (scan) Kode QR akan langsung diarahkan ke halaman aktivasi yang sama.
4. Di **Dashboard User**, pengguna memiliki **QR Studio** untuk mengunduh Kode QR digital milik kartunya (dapat digunakan sebagai wallpaper HP, stiker digital, atau dicetak sendiri).
5. Semua interaksi (baik Tap NFC maupun Scan Kode QR) tercatat dalam Analitik Pengguna secara real-time.