# PRD: IELTS Reading Simulator — MVP

**Versi:** 0.1 (Draft)
**Tanggal:** 3 September 2026
**Owner:** Frendy
**Status:** Untuk dieksekusi (target 2-3 minggu)

---

## 1. Latar Belakang & Tujuan

Aplikasi simulasi IELTS Reading yang memungkinkan user berlatih mengerjakan soal reading dengan format dan timing mendekati ujian asli, sekaligus memberi admin (Frendy) kemampuan mengelola bank soal secara mandiri tanpa perlu akses langsung ke database.

**Tujuan MVP:**
- Validasi apakah orang mau pakai simulasi reading berbasis web ini (product-market signal awal).
- Punya sistem input soal yang scalable untuk berbagai tipe soal IELTS Reading, tanpa perlu developer turun tangan tiap nambah soal baru.
- Jadi fondasi untuk modul Listening & Writing di fase berikutnya.

**Yang BUKAN tujuan MVP ini:**
- Monetisasi (belum ditentukan modelnya)
- Listening & Writing module
- AI-generated question / AI scoring
- Analytics performa mendalam (per skill breakdown, dsb)

---

## 2. Target Pengguna

| Role | Deskripsi | Kebutuhan utama |
|---|---|---|
| **Admin** | Frendy (single admin di MVP) | Bisa input passage & soal baru dengan cepat, berbagai tipe soal, tanpa nulis SQL manual |
| **Test-taker (User)** | Orang yang mau latihan IELTS Reading | Bisa daftar/login, pilih test, mengerjakan dengan timer, lihat hasil & pembahasan |

---

## 3. Scope MVP

### In scope
1. Autentikasi (signup/login/logout) — role `user` dan `admin`
2. Admin: CRUD Test → Passage → Question, dengan form dinamis sesuai tipe soal
3. User: lihat daftar test, kerjakan test dengan timer, submit, lihat hasil + pembahasan
4. Auto-grading untuk semua tipe soal objektif (bukan writing, jadi semua bisa auto-grade)
5. Riwayat attempt per user

### Out of scope (fase berikutnya)
- Listening & Writing module
- Multi-admin dengan permission granular
- Payment/subscription
- Import soal via bulk upload (CSV/Excel)
- Analitik performa per question-type/skill

---

## 4. Tipe Soal yang Didukung (MVP)

Berdasarkan format resmi IELTS Academic Reading:

| Tipe | Kode internal | Kompleksitas form |
|---|---|---|
| Multiple Choice | `multiple_choice` | Medium — jumlah opsi dinamis |
| True / False / Not Given | `true_false_notgiven` | Simple — fixed 3 opsi |
| Matching Headings | `matching_headings` | Complex — list heading + mapping ke paragraf |
| Matching Information | `matching_information` | Complex — mapping pernyataan ke paragraf |
| Sentence/Summary Completion | `summary_completion` | Medium — teks dengan blank + word limit |
| Short Answer | `short_answer` | Simple — jawaban singkat + word limit |

> Catatan: Matching Headings & Matching Information secara struktur data mirip (mapping N item ke paragraf), bisa share 1 component di frontend dengan label berbeda.

---

## 5. Feature Requirements

### 5.1 Autentikasi
- Signup/login via email+password (Supabase Auth)
- Setelah login, redirect sesuai role: admin → `/admin`, user → `/dashboard`
- Role disimpan di tabel `profiles` (extend dari `auth.users`), default `user`. Admin di-set manual via Supabase Studio (gak perlu UI promote-role di MVP).

### 5.2 Admin — Question Bank Management

**Flow utama (sesuai requirement):**

```
Admin Dashboard
  → Create/Select Test
    → Add Passage (judul, isi teks, nomor urut)
      → Add Question
        → Pilih tipe soal (dropdown)
          → Form dinamis muncul sesuai tipe
            → Isi detail → Save → Question masuk ke list soal passage tsb
```

**A. Create Test**
- Input: judul test, deskripsi singkat, time limit (default 60 menit), status (draft/published)
- Test dengan status `draft` tidak muncul di daftar test user

**B. Create Passage (dalam sebuah Test)**
- Input: nomor passage (1/2/3), judul passage, isi teks (textarea besar, plain text — rich text formatting bisa fase berikutnya)
- Word count otomatis dihitung & ditampilkan (validasi kasar: idealnya 700-900 kata)

**C. Create Question (dalam sebuah Passage)** — ini bagian inti sesuai request:

1. Admin klik "Add Question"
2. Pilih **tipe soal** dari dropdown (6 tipe di atas)
3. Form berubah dinamis sesuai tipe yang dipilih:

**Form: Multiple Choice**
- Nomor soal (auto-increment, bisa diedit)
- Teks pertanyaan
- Jumlah pilihan jawaban (dropdown: 3/4/5, default 4) — menentukan berapa banyak field option yang muncul
- Field option A, B, C, ... (jumlah sesuai pilihan di atas), masing-masing berupa text input
- Pilih jawaban benar (radio button di samping tiap option, hanya bisa pilih 1 — atau checkbox jika mau support multi-answer MC di masa depan, tapi MVP single-answer dulu)
- Explanation (opsional, ditampilkan saat review jawaban)

**Form: True/False/Not Given**
- Nomor soal
- Teks pernyataan (statement)
- Jawaban benar: radio button [True / False / Not Given]
- Explanation (opsional)

**Form: Matching Headings**
- Daftar heading (dynamic list, admin bisa add/remove heading — biasanya lebih banyak dari jumlah paragraf sebagai distractor)
- Untuk tiap paragraf yang perlu dicocokkan: pilih heading yang benar dari daftar di atas (dropdown)
- Nomor soal per paragraf otomatis

**Form: Matching Information**
- Daftar pernyataan/statement yang perlu dicocokkan ke paragraf
- Untuk tiap statement: pilih paragraf yang benar (dropdown, isi = label paragraf A/B/C/dst dari passage)

**Form: Summary/Sentence Completion**
- Textarea isi ringkasan dengan penanda blank, format: `Text sebelum ___1___ text sesudah ___2___`
- Untuk tiap nomor blank: jawaban benar (text) + word limit (dropdown: "NO MORE THAN ONE WORD", "NO MORE THAN TWO WORDS", dst — mengikuti instruksi resmi IELTS)

**Form: Short Answer**
- Nomor soal, teks pertanyaan
- Jawaban benar (text, atau beberapa jawaban alternatif yang dianggap benar — array of accepted answers untuk fleksibilitas typo/sinonim)
- Word limit

4. Save → question tersimpan, muncul di list soal passage tsb dengan preview singkat (nomor, tipe, cuplikan pertanyaan)
5. Admin bisa edit/hapus/reorder soal dalam passage

**Validasi minimal yang perlu ada:**
- Tidak bisa publish test kalau ada passage tanpa soal
- Nomor soal harus unik & berurutan dalam 1 test (auto-handle, admin gak perlu mikirin nomor manual lintas passage)

### 5.3 User — Mengerjakan Soal

**A. Dashboard/Test List**
- List test yang berstatus `published`
- Info per test: judul, jumlah soal, estimasi waktu, status (belum dikerjakan / sudah dikerjakan — kalau sudah, tampilkan skor terakhir)

**B. Halaman Ujian (`/test/[testId]`)**
- Layout 2 kolom: kiri = passage (scroll independen), kanan = soal (scroll independen) — mereplikasi UX asli IELTS Reading
- Timer countdown di atas (mulai dari time_limit test), auto-submit saat waktu habis
- Navigasi antar soal (bisa jump ke nomor tertentu, indikator soal yang sudah/belum dijawab)
- Render form jawaban sesuai tipe soal (read-only version dari form admin — MC jadi radio button, matching jadi dropdown, dst)
- Tombol "Submit" manual + konfirmasi sebelum submit

**C. Hasil & Review (`/test/[testId]/result`)**
- Skor mentah (X/40) dan estimasi band score (pakai tabel konversi resmi Academic Reading)
- Breakdown per soal: jawaban user vs jawaban benar, status benar/salah, explanation (jika admin isi)
- Waktu pengerjaan

**D. Riwayat**
- List semua attempt user sebelumnya per test, dengan skor & tanggal

---

## 6. Data Model

```
profiles
  id (FK → auth.users), role (enum: 'admin' | 'user'), created_at

reading_tests
  id, title, description, time_limit_minutes, status (enum: 'draft'|'published'), created_at

reading_passages
  id, test_id (FK), passage_number, title, content (text), word_count, created_at

reading_questions
  id, passage_id (FK), question_number, type (enum, 6 tipe di atas),
  question_data (JSONB — struktur berbeda per tipe, lihat di bawah),
  explanation (text, nullable), created_at

user_attempts
  id, user_id (FK), test_id (FK), started_at, submitted_at,
  raw_score, band_score_estimate, status (enum: 'in_progress'|'submitted')

user_answers
  id, attempt_id (FK), question_id (FK), user_answer (JSONB), is_correct (bool)
```

**Kenapa `question_data` JSONB, bukan kolom fixed:** tiap tipe soal punya struktur beda jauh (MC punya options array, matching punya mapping, summary punya blanks array). JSONB fleksibel untuk ini, tapi perlu strict TypeScript type + validasi (Zod) di layer aplikasi biar tetap konsisten. Contoh isi per tipe:

```json
// multiple_choice
{ "question_text": "...", "options": ["A text", "B text", "C text", "D text"], "correct_index": 2 }

// true_false_notgiven
{ "statement": "...", "correct_answer": "TRUE" }

// matching_headings
{ "headings": ["i. ...", "ii. ...", "iii. ..."], "paragraph_label": "A", "correct_heading_index": 1 }

// summary_completion
{ "template": "Text ___1___ more text ___2___", "blanks": [{"number":1,"answer":"climate","word_limit":"ONE WORD"}, ...] }

// short_answer
{ "question_text": "...", "accepted_answers": ["1990", "1990s"], "word_limit": "NO MORE THAN TWO WORDS" }
```

---

## 7. Non-Functional Requirements
- **Security:** Row Level Security (RLS) di Supabase — user hanya bisa akses `user_attempts`/`user_answers` miliknya; hanya role `admin` yang bisa write ke `reading_tests`/`reading_passages`/`reading_questions`.
- **Performance:** halaman ujian harus load < 2 detik (passage + soal di-fetch sekali di awal, bukan per interaksi).
- **Browser support:** modern browser (Chrome, Edge, Safari terbaru) — tidak perlu support IE/browser lama.
- **Responsive:** minimal usable di tablet; mobile-first tidak wajib untuk MVP karena reading test practice biasanya dilakukan di desktop/laptop.

---

## 8. Tech Stack

- **Framework:** Next.js 14+ (App Router), TypeScript
- **DB & Auth:** Supabase (Postgres + Auth), akses via `@supabase/ssr`
- **Validasi schema:** Zod (terutama untuk `question_data` JSONB per tipe)
- **Styling/UI:** Tailwind CSS + shadcn/ui
- **Deploy:** Vercel (frontend+API routes), Supabase (DB, free tier)

---

## 9. Timeline (3 Minggu)

| Minggu | Fokus |
|---|---|
| 1 | Setup project, schema DB + RLS, auth, CRUD Test/Passage dasar, 1 tipe soal (Multiple Choice) end-to-end (admin form → tersimpan → tampil ke user → auto-grade) |
| 2 | Tambah 5 tipe soal lainnya (form admin + render user + grading logic masing-masing), halaman ujian lengkap (timer, navigasi, layout 2 kolom) |
| 3 | Hasil & review page, riwayat attempt, band score conversion, isi 2-3 test lengkap sebagai konten awal, testing & deploy |

---

## 10. Open Questions
- Band score conversion table: pakai tabel resmi Cambridge Academic Reading — perlu dikonfirmasi/dilampirkan sebelum implementasi `lib/scoring.ts`.
- Short Answer & Summary Completion pakai exact match atau fuzzy match (toleransi typo/case)? Rekomendasi MVP: exact match case-insensitive + array `accepted_answers` untuk variasi yang admin definisikan manual (lebih simpel & predictable daripada fuzzy matching).
- Reorder soal dalam passage: perlu drag-and-drop UI atau cukup input nomor manual? Rekomendasi MVP: input manual dulu, drag-and-drop bisa nyusul.

---

## 11. Next Phase (setelah MVP)
- Modul Listening (perlu audio player + transcript sync)
- Modul Writing (perlu AI scoring — bisa manfaatkan pengalaman RAG/LLM yang sudah dikuasai)
- Model bisnis (freemium/subscription/B2B ke lembaga kursus)
- Bulk import soal, multi-admin
