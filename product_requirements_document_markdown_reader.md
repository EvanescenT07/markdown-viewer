# Product Requirements Document (PRD): DocuMark (Markdown Reader & Converter)

**Versi Dokumen:** 1.1  
**Status:** Draft (Updated with Prisma ORM & Vercel Postgres Architecture)  
**Tech Stack Utama:** Fullstack Next.js (App Router), Vercel Postgres, Prisma ORM, JWT Authentication  

---

## 1. Ringkasan Eksekutif (Executive Summary)

**DocuMark** adalah aplikasi web berbasis *fullstack* Next.js yang dirancang untuk mengubah file mentah berformat Markdown (`.md`) menjadi dokumen yang rapi, interaktif, dan mudah dibaca (*human-readable*). Aplikasi ini mendukung *rendering* teks standar, *syntax highlighting* untuk potongan kode, visualisasi diagram alur (*user flow*), penyimpanan riwayat unggahan pengguna menggunakan Vercel Postgres yang dikelola melalui **Prisma ORM**, serta fitur ekspor langsung ke format PDF.

## 2. Tujuan Produk (Product Objectives)

* Memudahkan pengguna (terutama *developer*, *technical writer*, dan *product manager*) untuk membaca dan mempresentasikan file `.md` tanpa perlu menggunakan teks editor khusus.
* Menyediakan visualisasi otomatis untuk diagram berbasis teks (seperti Mermaid.js) yang terdapat di dalam file `.md`.
* Memberikan akses penyimpanan riwayat dokumen yang aman dan efisien bagi pengguna melalui autentikasi berbasis JWT dan penyimpanan langsung di PostgreSQL.
* Memudahkan pengelolaan skema database dan migrasi struktur tabel di lingkungan *serverless* Vercel menggunakan **Prisma ORM**.
* Memfasilitasi distribusi dokumen melalui fitur ekspor ke PDF yang mempertahankan tata letak dan visualisasi diagram.

## 3. Target Pengguna (Target Audience)

1. **Software Engineers / Developers:** Membaca dokumentasi teknis (`README.md`), menyalin potongan kode (*code snippets*), dan melihat arsitektur sistem.
2. **Product Managers / System Analysts:** Melihat *user flow*, PRD, atau diagram alur kerja yang ditulis dalam format Markdown dan membagikannya ke *stakeholder* dalam bentuk PDF.
3. **Technical Writers / Akademisi:** Mengubah catatan berformat Markdown menjadi dokumen siap cetak (PDF).

---

## 4. Spesifikasi Fungsional & Fitur Utama (Functional Requirements)

### 4.1. Sistem Autentikasi (JWT Authentication)

* **FR-AUTH-01 (Registrasi):** Pengguna dapat membuat akun baru menggunakan nama, email, dan kata sandi. Kata sandi wajib di-*hash* (menggunakan `bcryptjs`) sebelum disimpan ke PostgreSQL via Prisma.
* **FR-AUTH-02 (Login & JWT):** Pengguna yang berhasil masuk akan menerima *JSON Web Token* (JWT) yang ditandatangani menggunakan pustaka `jose` (kompatibel dengan Next.js Edge Runtime). Token disimpan di dalam *HTTP-Only Cookie* untuk mencegah serangan XSS.
* **FR-AUTH-03 (Proteksi Rute):** *Middleware* Next.js (`middleware.ts`) akan memverifikasi validitas JWT pada setiap rute privat (seperti halaman *Dashboard*, *History*, dan API *Upload*).
* **FR-AUTH-04 (Logout):** Pengguna dapat keluar dari sesi, yang akan menghapus *cookie* JWT dari peramban.

### 4.2. Unggah File Markdown (File Upload)

* **FR-UP-01 (Antarmuka Unggah):** Menyediakan area *drag-and-drop* atau tombol pemilihan file dari perangkat lokal.
* **FR-UP-02 (Validasi File):** Sistem hanya menerima file dengan ekstensi `.md` atau `.markdown` dengan batas ukuran maksimal 2 MB per file.
* **FR-UP-03 (Penyimpanan Langsung ke Database):** File yang diunggah akan dibaca isinya sebagai teks UTF-8 (*string parsing*) dan disimpan langsung ke kolom `TEXT` pada Vercel Postgres melalui `prisma.document.create()` tanpa menggunakan *Object Storage* eksternal (seperti Vercel Blob), lalu langsung ditampilkan di halaman pembaca (*reader view*).

### 4.3. Konversi & Tampilan Pembaca (Markdown Renderer)

* **FR-READ-01 (GitHub Flavored Markdown):** Mendukung elemen standar Markdown serta tabel, *task list*, *strikethrough*, dan *autolink*.
* **FR-READ-02 (Syntax Highlighting):** Setiap blok kode (*code block*) harus diwarnai sesuai dengan bahasa pemrogramannya.
* **FR-READ-03 (Diagram & User Flow Rendering):** Sistem harus mampu mendeteksi blok kode khusus diagram (`mermaid`) dan mengubahnya menjadi grafik visual (SVG) untuk menampilkan *user flow*, *sequence diagram*, *flowchart*, atau *ERD*.

### 4.4. Fitur Salin Konten (Copy to Clipboard)

* **FR-COPY-01 (Copy Code Snippet):** Setiap blok kode yang di-render wajib memiliki tombol "Copy" di sudut kanan atas. Saat diklik, kode disalin ke *clipboard* dan menampilkan indikator visual (ikon berubah menjadi tanda centang dengan teks "Copied!").
* **FR-COPY-02 (Copy Konten Dokumen):** Terdapat opsi di bilah alat (*toolbar*) atas untuk menyalin seluruh isi dokumen, baik sebagai teks bersih (*plain text*) maupun sebagai teks mentah Markdown.

### 4.5. Riwayat Unggahan (Upload History)

* **FR-HIST-01 (Pencatatan Otomatis):** Setiap file `.md` yang berhasil diunggah oleh pengguna yang terautentikasi akan otomatis tercatat di tabel `documents`.
* **FR-HIST-02 (Daftar Riwayat Efisien):** Pengguna dapat melihat daftar file yang pernah diunggah (nama file, tanggal unggah, dan ukuran file). Query daftar riwayat menggunakan fitur `select` pada Prisma untuk mengecualikan kolom `raw_content` agar hemat *bandwidth* dan memori.
* **FR-HIST-03 (Manajemen Riwayat):** Pengguna dapat membuka kembali dokumen dari daftar riwayat tanpa perlu mengunggah ulang, serta dapat menghapus riwayat dokumen tertentu.

### 4.6. Ekspor ke PDF (Export to PDF)

* **FR-PDF-01 (Konversi Presisi):** Pengguna dapat mengunduh tampilan Markdown yang sudah di-render menjadi file `.pdf`.
* **FR-PDF-02 (Dukungan Visual & Diagram):** Hasil ekspor PDF harus menyertakan gaya tipografi (*styling*), tabel, *syntax highlighting* pada blok kode, serta grafik diagram (*user flow*) yang telah ter-render secara utuh (tidak terpotong di pergantian halaman).

---

## 5. Arsitektur Teknis & Tech Stack (Technical Architecture)

* **Hosting & Infrastruktur:** Vercel (Serverless Functions & Edge Network).
* **Framework Utama:** Next.js (App Router, TypeScript) untuk *Frontend* (React Server & Client Components) sekaligus *Backend* (Route Handlers / Server Actions).
* **Database:** Vercel Postgres (berbasis Neon Serverless PostgreSQL).
* **ORM & Migrasi Database:** **Prisma ORM** (`prisma` & `@prisma/client`) untuk pengelolaan skema deklaratif, *type-safe query*, dan migrasi struktur tabel otomatis (`prisma migrate`).
* **Keputusan Arsitektur Penyimpanan File:** Isi file `.md` disimpan langsung pada kolom bertipe `TEXT` di PostgreSQL (memanfaatkan fitur kompresi internal *PostgreSQL TOAST*) tanpa memerlukan *Vercel Blob*, karena file `.md` murni berupa teks berukuran kecil dan membutuhkan transaksi yang atomik (ACID) bersama metadatanya.
* **Autentikasi:** `jose` untuk manajemen JWT, dipadukan dengan `bcryptjs` untuk *hashing* kata sandi.
* **Styling & UI:** Tailwind CSS (dengan plugin `@tailwindcss/typography`) dan komponen UI dari `shadcn/ui`.
* **Pustaka Pemrosesan Markdown:**
  * `react-markdown`, `remark-gfm`, dan `rehype-sanitize` (proteksi XSS).
  * `rehype-pretty-code` (dengan `shiki`) atau `react-syntax-highlighter` untuk *code snippet*.
  * `mermaid` (Mermaid.js) untuk merender diagram dan *user flow*.
* **Pustaka Ekspor PDF:** `react-to-print` yang dioptimalkan dengan aturan CSS `@media print` (menghindari *timeout* dan batas ukuran *bundle* Puppeteer di fungsi *serverless* Vercel).

---

## 6. Desain Skema Database & Konfigurasi Prisma ORM

### 6.1. Struktur Tabel PostgreSQL

#### Tabel `users`
| Nama Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `UUID` (Primary Key) | ID unik pengguna (default: `uuid()`) |
| `name` | `VARCHAR(100)` | Nama lengkap pengguna |
| `email` | `VARCHAR(255)` (Unique) | Email pengguna untuk login |
| `password_hash` | `TEXT` | Kata sandi yang sudah di-*hash* |
| `created_at` | `TIMESTAMP` | Waktu pembuatan akun |
| `updated_at` | `TIMESTAMP` | Waktu pembaruan data akun |

#### Tabel `documents` (Upload Histories)
| Nama Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `UUID` (Primary Key) | ID unik dokumen |
| `user_id` | `UUID` (Foreign Key) | Merujuk ke `users.id` (`ON DELETE CASCADE`) |
| `file_name` | `VARCHAR(255)` | Nama asli file `.md` (contoh: `architecture.md`) |
| `file_size` | `INTEGER` | Ukuran file dalam satuan *bytes* |
| `raw_content` | `TEXT` | Isi teks mentah dari file Markdown (disimpan via PostgreSQL TOAST) |
| `created_at` | `TIMESTAMP` | Waktu file diunggah |
| `updated_at` | `TIMESTAMP` | Waktu pembaruan dokumen |

### 6.2. Skema Prisma (`prisma/schema.prisma`)

Untuk berjalan optimal di **Vercel Postgres**, Prisma membutuhkan dua konfigurasi URL database:
1. `POSTGRES_PRISMA_URL` (`url`): Menggunakan *connection pooling* (PgBouncer) untuk mencegah kehabisan koneksi saat fungsi *serverless* Next.js melakukan *scaling*.
2. `POSTGRES_URL_NON_POOLING` (`directUrl`): Koneksi langsung ke PostgreSQL yang wajib digunakan oleh CLI Prisma saat menjalankan migrasi tabel (`prisma migrate`).

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}

model User {
  id           String     @id @default(uuid()) @db.Uuid
  name         String     @db.VarChar(100)
  email        String     @unique @db.VarChar(255)
  passwordHash String     @map("password_hash") @db.Text
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")
  documents    Document[]

  @@map("users")
}

model Document {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  fileName   String   @map("file_name") @db.VarChar(255)
  fileSize   Int      @map("file_size")
  rawContent String   @map("raw_content") @db.Text
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)], name: "idx_user_documents_history")
  @@map("documents")
}
```

### 6.3. Alur Kerja Migrasi Prisma (Migration Workflow)

* **Lingkungan Pengembangan Lokal (Local Development):**
  * Menarik variabel lingkungan dari Vercel menggunakan perintah `vercel env pull .env.local`.
  * Setiap ada perubahan struktur tabel di `schema.prisma`, pengembang menjalankan `npx prisma migrate dev --name <nama_migrasi>` untuk membuat file SQL migrasi di folder `prisma/migrations` dan memperbarui *Prisma Client*.
* **Lingkungan Produksi (Vercel CI/CD Deployment):**
  * Skrip `build` pada `package.json` dikonfigurasi menjadi:
    `"build": "prisma generate && prisma migrate deploy && next build"`
  * Saat kode di-*push* ke repositori Git, Vercel otomatis menjalankan `prisma migrate deploy` menggunakan `directUrl` untuk menerapkan perubahan tabel secara aman tanpa menghapus data yang ada sebelum membangun aplikasi Next.js.
* **Pola Singleton Prisma Client:**
  * Menggunakan *global singleton pattern* pada file `lib/prisma.ts` untuk mencegah pembuatan *instance* `PrismaClient` berlebih saat fitur *Hot Reloading* (HMR) Next.js berjalan di mode pengembangan.

---

## 7. Alur Pengguna (User Flow)

1. **Autentikasi:**
   * Pengguna membuka aplikasi $\rightarrow$ Mengakses halaman Login/Register $\rightarrow$ Memasukkan kredensial $\rightarrow$ Sistem memvalidasi via Prisma dan mengeluarkan JWT Cookie $\rightarrow$ Pengguna diarahkan ke *Dashboard*.
2. **Unggah & Konversi File:**
   * Di *Dashboard*, pengguna memilih atau menyeret file `project-flow.md` ke komponen unggah.
   * Sistem memvalidasi ekstensi dan ukuran file $\rightarrow$ Menyimpan teks dan metadata ke tabel `documents` melalui `prisma.document.create()` $\rightarrow$ Mengarahkan pengguna ke halaman `/read/[id]`.
3. **Membaca & Berinteraksi:**
   * Halaman `/read/[id]` mengambil data menggunakan `prisma.document.findUnique()` dan menampilkan isi Markdown yang sudah diformat dengan rapi.
   * Blok kode `mermaid` di dalam file otomatis berubah menjadi diagram alur (*flowchart*) visual.
   * Pengguna menekan tombol "Copy" pada salah satu blok kode konfigurasi $\rightarrow$ Teks kode tersalin ke *clipboard*.
4. **Ekspor ke PDF:**
   * Pengguna menekan tombol "Export to PDF" di bagian atas dokumen $\rightarrow$ Sistem memformat tata letak khusus cetak $\rightarrow$ File `project-flow.pdf` terunduh ke perangkat pengguna.
5. **Mengakses Riwayat:**
   * Pengguna membuka menu "History" di bilah samping (*sidebar*) $\rightarrow$ Sistem memanggil `prisma.document.findMany()` (tanpa mengikutsertakan kolom `rawContent`) $\rightarrow$ Pengguna mengklik salah satu item untuk membukanya kembali atau menghapusnya.

---

## 8. Kebutuhan Non-Fungsional (Non-Functional Requirements)

* **Keamanan (Security):**
  * Konten Markdown yang di-render ke HTML wajib melalui proses sanitasi (`rehype-sanitize`) untuk mencegah serangan *Cross-Site Scripting* (XSS) dari file `.md` berbahaya.
  * Query database sepenuhnya menggunakan *parameterized queries* bawaan Prisma ORM untuk mencegah serangan *SQL Injection*.
  * JWT memiliki masa kedaluwarsa (*expiration time*, misalnya 7 hari) dan disimpan di *HttpOnly*, *Secure*, *SameSite=Lax* cookie.
* **Performa & Efisiensi Database (Performance):**
  * Query daftar riwayat wajib mengecualikan kolom `raw_content` (`select: { id: true, fileName: true, fileSize: true, createdAt: true }`) agar PostgreSQL tidak perlu melakukan *de-TOAST* (dekompresi teks besar) saat hanya menampilkan daftar riwayat.
  * *Rendering* diagram Mermaid dilakukan di sisi klien (*client-side*) secara asinkron dengan indikator *loading skeleton* agar tidak memblokir tampilan teks utama.
* **Kenyamanan Antarmuka (UI/UX):**
  * Mendukung mode gelap (*Dark Mode*) dan mode terang (*Light Mode*), namun saat diekspor ke PDF otomatis dipaksa menggunakan tema terang (*high-contrast print view*) agar hemat tinta dan mudah dibaca.