# Technical Debt — IELTS Reading Simulator

## Data duplication di grouped questions (dari review awal, item 4)
- `summary_completion`: field `template` di-duplicate di tiap row blank dalam 1 summary block.
- `matching_headings`: field `headings` (daftar heading + distractor) di-duplicate di tiap row
  paragraf yang dicocokkan.
- Risiko: edit di satu row (mis. admin nambah 1 heading baru) tidak otomatis sinkron ke row lain
  yang seharusnya share data yang sama → bisa out-of-sync tanpa admin sadar.
- Belum ada `group_id`/`block_id` yang menyatakan row-row tsb satu kesatuan.
- Untuk MVP dengan single admin, acceptable, tapi perlu diperbaiki kalau multi-admin (fase berikutnya)
  atau kalau jumlah soal makin banyak. Opsi perbaikan: pindahkan `template`/`headings` ke tabel
  terpisah (level "question group"), atau minimal tambah `group_id` + validasi konsistensi di app layer.

## Dependency band score conversion table (dari review awal, item 5)
- `lib/scoring.ts` sudah dibuat (dimajukan ke Minggu 1 untuk menutup loop `multiple_choice`
  end-to-end, bukan Minggu 3 seperti rencana awal) — tapi `rawScoreToBand()` di dalamnya pakai
  tabel approximate yang umum dipublikasikan (Cambridge/IDP prep materials), **bukan** tabel resmi
  per-administrasi-test yang sebenarnya bisa sedikit berbeda tiap test.
- Masih open question di PRD §10: perlu diganti dengan tabel resmi begitu dikonfirmasi/dilampirkan
  — cari `BAND_SCORE_TABLE` di `src/lib/scoring.ts`.

## Minor gaps (dicatat untuk perbaikan nanti)
- Tidak ada trigger untuk auto-update `reading_tests.updated_at` — kolom ada tapi tidak pernah
  ter-refresh saat row diupdate.
- Timer auto-submit di halaman ujian saat ini murni client-side; tidak ada validasi server-side
  yang membandingkan `submitted_at - started_at` terhadap `time_limit_minutes`. Cukup untuk
  practice tool, tapi perlu diperketat kalau ke depannya hasil dipakai untuk sesuatu yang lebih formal.
- Semantics `PATCH /api/attempts/:attemptId/answers` (create vs upsert) belum eksplisit ditulis
  di API spec — perilaku saat ini diasumsikan upsert karena ada `unique(attempt_id, question_id)`,
  perlu didokumentasikan eksplisit di spec.
- Flow verifikasi email Supabase Auth (aktif/nonaktif untuk signup) belum dibahas di PRD/spec —
  perlu diputuskan sebelum testing user flow end-to-end.
