# API Spec — IELTS Reading Simulator MVP

Base path: `/api`
Auth: Supabase session cookie (via `@supabase/ssr`), semua endpoint kecuali auth butuh user login. Endpoint admin butuh `profiles.role = 'admin'` (dicek di RLS + double-check di handler).

Format response standar:
```json
// success
{ "data": { ... } }
// error
{ "error": { "message": "...", "code": "..." } }
```

---

## Auth

Auth pakai Supabase client langsung dari frontend (`supabase.auth.signUp`, `signInWithPassword`, `signOut`) — **tidak perlu custom API route**, cukup panggil Supabase JS SDK. Middleware (`middleware.ts`) yang cek session & redirect berdasarkan role.

---

## Admin — Tests

### `GET /api/admin/tests`
List semua test (termasuk draft). Admin only.

**Response 200**
```json
{ "data": [
  { "id": "uuid", "title": "Cambridge 18 Test 1", "status": "draft",
    "time_limit_minutes": 60, "passage_count": 2, "question_count": 26,
    "created_at": "2026-09-01T10:00:00Z" }
]}
```

### `POST /api/admin/tests`
Buat test baru.

**Request**
```json
{ "title": "Cambridge 18 Test 1", "description": "...", "time_limit_minutes": 60 }
```
**Response 201** → `{ "data": { "id": "uuid", ... } }`

### `PATCH /api/admin/tests/:testId`
Update title/description/time_limit/status (`draft` ↔ `published`).

**Request** (partial)
```json
{ "status": "published" }
```
**Validasi khusus:** publish ditolak (400) kalau ada passage tanpa soal, atau test punya < 1 passage.

### `DELETE /api/admin/tests/:testId`
Cascade delete passages/questions terkait (ditangani via `on delete cascade` di DB).

---

## Admin — Passages

### `GET /api/admin/tests/:testId/passages`
List passage dalam 1 test, termasuk jumlah soal per passage.

### `POST /api/admin/tests/:testId/passages`
**Request**
```json
{ "passage_number": 1, "title": "The History of Tea", "content": "Full passage text..." }
```
`word_count` dihitung server-side dari `content.split(/\s+/).length`, gak perlu dikirim dari client.

**Response 201** → `{ "data": { "id": "uuid", "word_count": 812, ... } }`

### `PATCH /api/admin/passages/:passageId`
Update title/content (word_count dihitung ulang otomatis).

### `DELETE /api/admin/passages/:passageId`

---

## Admin — Questions

### `GET /api/admin/passages/:passageId/questions`
List soal dalam 1 passage, urut `question_number`.

### `POST /api/admin/passages/:passageId/questions`
Body **berbeda tergantung `type`** — ini yang menopang UI form dinamis di admin panel.

**`type: multiple_choice`**
```json
{
  "question_number": 1,
  "type": "multiple_choice",
  "question_data": {
    "question_text": "What is the main topic of paragraph A?",
    "options": ["Trade history", "Climate impact", "Cultural rituals", "Modern production"],
    "correct_index": 2
  },
  "explanation": "Paragraph A discusses tea ceremonies..."
}
```

**`type: true_false_notgiven`**
```json
{
  "question_number": 2,
  "type": "true_false_notgiven",
  "question_data": {
    "statement": "Tea was first cultivated in Japan.",
    "correct_answer": "FALSE"
  }
}
```

**`type: matching_headings`**
```json
{
  "question_number": 3,
  "type": "matching_headings",
  "question_data": {
    "headings": ["i. Origins of the trade", "ii. Economic impact", "iii. Cultural significance"],
    "paragraph_label": "A",
    "correct_heading_index": 0
  }
}
```

**`type: matching_information`**
```json
{
  "question_number": 4,
  "type": "matching_information",
  "question_data": {
    "statement": "A reference to an ancient trade route",
    "correct_paragraph_label": "B"
  }
}
```

**`type: summary_completion`**
```json
{
  "question_number": 5,
  "type": "summary_completion",
  "question_data": {
    "template": "Tea was first discovered in ___BLANK___ according to legend.",
    "blanks": [
      { "number": 5, "answer": "China", "word_limit": "NO MORE THAN ONE WORD" }
    ]
  }
}
```
Catatan: kalau 1 summary block punya beberapa blank sekaligus, tiap blank tetap disimpan sebagai **question row terpisah** (`question_number` masing-masing) supaya konsisten dengan `user_answers` yang 1 row = 1 question. `template` di-duplicate di tiap row atau disimpan sekali di level passage — **keputusan: duplicate di tiap row untuk MVP**, lebih simpel di query meski sedikit redundant.

**`type: short_answer`**
```json
{
  "question_number": 6,
  "type": "short_answer",
  "question_data": {
    "question_text": "In what year was the company founded?",
    "accepted_answers": ["1990", "1990s"],
    "word_limit": "NO MORE THAN TWO WORDS"
  }
}
```

**Response 201** → `{ "data": { "id": "uuid", ... } }`

### `PATCH /api/admin/questions/:questionId`
Update `question_data`/`explanation`. Body sama seperti POST sesuai tipe (tipe soal tidak bisa diganti setelah dibuat — kalau perlu ganti tipe, admin hapus & buat ulang, untuk menghindari edge case migrasi data).

### `DELETE /api/admin/questions/:questionId`

---

## User — Tests

### `GET /api/tests`
List test `status = 'published'`. Sertakan info attempt terakhir user (kalau ada).

**Response 200**
```json
{ "data": [
  { "id": "uuid", "title": "Cambridge 18 Test 1", "time_limit_minutes": 60,
    "question_count": 40, "last_attempt": { "raw_score": 32, "band_score_estimate": 7.5, "submitted_at": "..." } }
]}
```

### `GET /api/tests/:testId`
Detail test buat halaman ujian: semua passage + semua soal (tanpa `correct_answer`/`explanation` — di-strip di response biar gak bocor ke client saat mengerjakan).

**Response 200**
```json
{ "data": {
  "id": "uuid", "title": "...", "time_limit_minutes": 60,
  "passages": [
    { "id": "uuid", "passage_number": 1, "title": "...", "content": "...",
      "questions": [
        { "id": "uuid", "question_number": 1, "type": "multiple_choice",
          "question_data": { "question_text": "...", "options": [...] } }
      ]
    }
  ]
}}
```

---

## User — Attempts

### `POST /api/attempts`
Mulai attempt baru.

**Request** → `{ "test_id": "uuid" }`
**Response 201** → `{ "data": { "id": "uuid", "started_at": "...", "status": "in_progress" } }`

### `PATCH /api/attempts/:attemptId/answers`
Simpan/update jawaban satu soal (dipanggil tiap user jawab/ganti jawaban — autosave, bukan nunggu submit akhir).

**Request**
```json
{ "question_id": "uuid", "user_answer": { "selected_index": 2 } }
```
Bentuk `user_answer` mengikuti tipe soal, sama seperti `question_data` tapi versi jawaban user (mis. `{"selected_index": N}` buat MC, `{"answer": "TRUE"}` buat T/F/NG, `{"text": "..."}` buat short answer/summary).

**Response 200** → `{ "data": { "saved": true } }`

### `POST /api/attempts/:attemptId/submit`
Finalisasi attempt: hitung `raw_score`, `band_score_estimate`, set `is_correct` per `user_answers`, `status = 'submitted'`, `submitted_at = now()`.

**Response 200**
```json
{ "data": { "raw_score": 32, "band_score_estimate": 7.5, "total_questions": 40 } }
```
Grading logic (server-side, di `lib/scoring.ts`):
- `multiple_choice`: `user_answer.selected_index === question_data.correct_index`
- `true_false_notgiven`: `user_answer.answer === question_data.correct_answer`
- `matching_headings`: `user_answer.selected_index === question_data.correct_heading_index`
- `matching_information`: `user_answer.paragraph_label === question_data.correct_paragraph_label`
- `summary_completion` / `short_answer`: `normalize(user_answer.text)` (lowercase, trim) ada di `question_data.accepted_answers` (atau match exact `answer` untuk summary_completion)

### `GET /api/attempts/:attemptId`
Detail hasil + review (dipakai halaman result). Termasuk `explanation` per soal (boleh muncul karena sudah submitted).

### `GET /api/attempts?testId=uuid`
Riwayat attempt user untuk test tertentu (atau semua kalau `testId` tidak diisi).

---

## Error codes

| Code | Kapan dipakai |
|---|---|
| `UNAUTHENTICATED` | Belum login |
| `FORBIDDEN` | Bukan admin tapi akses endpoint admin |
| `NOT_FOUND` | Resource tidak ada / tidak published |
| `VALIDATION_ERROR` | Body tidak lolos Zod schema sesuai tipe soal |
| `PUBLISH_BLOCKED` | Publish test ditolak karena ada passage tanpa soal |
| `ATTEMPT_ALREADY_SUBMITTED` | Coba PATCH jawaban di attempt yang sudah `submitted` |
