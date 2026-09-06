## Task: Design & Implement IELTS Reading — Fill in the Blank Question Input

Saya sedang membangun website IELTS Mockup. Untuk admin, flow pembuatan soal adalah:

`Admin → Create Question → pilih Question Type → tampilkan form sesuai tipe soal`

Saat ini fokus implementasi hanya pada:

**IELTS Reading → Fill in the Blank**

Jangan mengubah atau merombak arsitektur question type lain yang sudah ada.

---

### 1. Tujuan

Buat admin form untuk membuat soal Reading Fill in the Blank.

Admin harus dapat:

1. Memasukkan instructions.
2. Memasukkan question/passage text.
3. Menentukan posisi blank di dalam text.
4. Menambahkan beberapa blank dalam satu question.
5. Menentukan correct answer untuk setiap blank.
6. Menyimpan question beserta seluruh blank dan answer-nya.

Satu question dapat memiliki banyak blank.

Contoh:

```text
The researchers discovered that [Blank 1]
in several regions. They also found that
[Blank 2] has increased rapidly.
```

Dengan:

```text
Blank 1 → erosion
Blank 2 → rainfall
```

---

### 2. UX yang diinginkan

Jangan membuat admin mengetik identifier seperti:

```text
{{blank_1}}
{{blank_2}}
```

Sebagai gantinya, sediakan editor text dengan tombol:

```text
+ Insert Blank
```

Flow:

```text
Question Text

The researchers discovered that climate change
has caused __________ in several regions.

                         [+ Insert Blank]
```

Admin menaruh cursor pada posisi yang diinginkan lalu menekan `Insert Blank`.

Sistem memasukkan placeholder yang terhubung dengan blank tertentu.

Contoh hasil:

```text
The researchers discovered that climate change
has caused [Blank 1] in several regions.
```

Jika admin menambahkan blank lagi:

```text
The researchers discovered that climate change
has caused [Blank 1] in several regions.
They also found that [Blank 2] has increased rapidly.
```

---

### 3. Answer Configuration

Setelah blank dibuat, tampilkan section `Answers`.

Contoh:

```text
ANSWERS

Blank 1
Correct Answer
[ erosion                         ]

Blank 2
Correct Answer
[ rainfall                        ]
```

Setiap blank harus memiliki answer sendiri.

Jangan membuat satu field `answer` untuk seluruh question.

Struktur konseptual:

```text
Question
 ├── content
 └── blanks
      ├── blank 1
      │    └── answer
      ├── blank 2
      │    └── answer
      └── ...
```

---

### 4. Answer Validation

Untuk MVP, answer checking harus:

- case-insensitive
- trim leading/trailing whitespace

Contoh:

Correct answer:

```text
Erosion
```

Maka:

```text
erosion
EROSION
Erosion
```

dianggap benar.

Jangan implementasikan fuzzy matching atau semantic matching dulu.

Jangan menambahkan accepted-answer system yang kompleks kecuali memang dibutuhkan oleh existing architecture.

---

### 5. Instructions

Admin harus dapat memasukkan IELTS instruction, misalnya:

```text
Complete the summary below.

Choose NO MORE THAN TWO WORDS from the passage for each answer.
```

Instructions adalah field terpisah dari question text.

Contoh:

```text
Instructions
┌──────────────────────────────────────────┐
│ Complete the summary below.              │
│ Choose NO MORE THAN TWO WORDS from       │
│ the passage for each answer.             │
└──────────────────────────────────────────┘
```

---

### 6. Admin Preview

Tambahkan preview sederhana agar admin dapat melihat bagaimana soal akan tampil kepada user.

Admin editor:

```text
The researchers discovered that climate
change has caused [Blank 1] in several regions.
```

Preview:

```text
The researchers discovered that climate
change has caused [__________] in several regions.
```

Blank harus diberi nomor yang konsisten:

```text
[1] __________
[2] __________
```

Nomor blank merupakan presentation/order, bukan hardcoded database ID.

---

### 7. Data Model

Jangan mengasumsikan bahwa satu question hanya memiliki satu answer.

Gunakan struktur yang memungkinkan:

```json
{
  "type": "fill_in_the_blank",
  "instructions": "Complete the summary below.",
  "content": "The researchers discovered that climate change has caused {{blank_1}} in several regions.",
  "blanks": [
    {
      "id": "blank_1",
      "position": 1,
      "answer": "erosion"
    }
  ]
}
```

Namun sebelum mengimplementasikan database schema, **inspect existing project schema/model terlebih dahulu**.

Jika project sudah memiliki struktur question/answer/option yang dapat digunakan kembali, gunakan existing architecture.

Jangan membuat tabel baru hanya karena lebih mudah jika existing schema sudah mendukung konsep tersebut.

---

### 8. Important: Reading Context

Ini adalah IELTS **Reading**, bukan Listening.

Jangan menambahkan:

- audio
- transcript
- audio controls
- speaker
- listening section logic

Focus hanya pada Reading.

---

### 9. Question Group / Passage Awareness

Perhatikan bahwa IELTS Reading biasanya memiliki passage/group yang digunakan oleh beberapa questions.

Jangan memasukkan seluruh Reading passage ke dalam Fill in the Blank question jika project saat ini sudah memiliki konsep:

```text
Passage
  ↓
Question Group
  ↓
Questions
```

Jika architecture tersebut sudah ada, Fill in the Blank hanya menyimpan content/question-specific data.

Contoh:

```text
Reading Test
 └── Passage 1
      └── Question Group
           ├── Q1
           ├── Q2
           ├── Q3
           └── Q4
```

Jangan duplicate passage ke setiap question.

---

### 10. Edge Cases

Implementasikan behavior berikut:

#### No blank

Tidak boleh save jika question text belum memiliki blank.

Tampilkan validation:

```text
Please insert at least one blank.
```

#### Blank tanpa answer

Tidak boleh save jika ada blank yang belum memiliki correct answer.

Contoh:

```text
Blank 2 requires a correct answer.
```

#### Delete blank

Admin dapat menghapus blank.

Jika:

```text
Blank 1
Blank 2
Blank 3
```

kemudian Blank 2 dihapus, sistem harus merapikan numbering menjadi:

```text
Blank 1
Blank 2
```

Jangan meninggalkan:

```text
Blank 1
Blank 3
```

#### Multiple blanks

Support minimal:

```text
Blank 1
Blank 2
Blank 3
...
```

tanpa hardcoded limit yang tidak diperlukan.

---

### 11. UI Principle

Gunakan UI yang sederhana dan familiar.

Struktur:

```text
Create Question
│
├── Question Type
│   └── Fill in the Blank
│
├── Instructions
│
├── Question Content
│   ├── text editor
│   └── Insert Blank
│
├── Answers
│   ├── Blank 1
│   ├── Blank 2
│   └── ...
│
├── Explanation (optional)
│
└── Preview
```

Jangan membuat UI terlalu kompleks untuk MVP.

---

### 12. Before Coding

Sebelum menulis kode:

1. Inspect existing project structure.
2. Temukan model/database untuk Question.
3. Temukan bagaimana Question Type saat ini direpresentasikan.
4. Temukan existing Create Question flow.
5. Temukan bagaimana existing question types menyimpan answer.
6. Temukan existing admin form/component.
7. Tentukan bagian mana yang dapat direuse.
8. Identifikasi apakah database membutuhkan perubahan.

Kemudian jelaskan secara singkat:

```text
Existing architecture
→ Required changes
→ Files/components affected
→ Database changes
→ Implementation plan
```

**Jangan langsung coding sebelum memahami existing architecture.**

---

### 13. Implementation Constraint

Prioritaskan:

- reuse existing components
- reuse existing validation
- reuse existing question model
- minimal database changes
- minimal changes ke existing question types
- maintainability

Jangan melakukan large-scale refactor.

Jangan mengubah behavior question types yang sudah bekerja.

---

### 14. Acceptance Criteria

Implementasi dianggap selesai jika:

- [ ] Admin dapat memilih `Fill in the Blank`.
- [ ] Form khusus Fill in the Blank muncul.
- [ ] Admin dapat memasukkan instructions.
- [ ] Admin dapat memasukkan question content.
- [ ] Admin dapat menggunakan `Insert Blank`.
- [ ] Blank dapat lebih dari satu.
- [ ] Setiap blank memiliki correct answer sendiri.
- [ ] Blank dapat dihapus.
- [ ] Blank numbering otomatis teratur.
- [ ] Question tidak dapat disimpan tanpa blank.
- [ ] Question tidak dapat disimpan jika ada blank tanpa answer.
- [ ] Case-insensitive answer checking tersedia.
- [ ] Preview menampilkan blank seperti yang akan dilihat user.
- [ ] Existing question types tidak rusak.
- [ ] Database mengikuti existing project architecture.
- [ ] Tidak ada unnecessary large-scale refactor.

---

### Final instruction to AI coding agent

**First inspect the existing codebase and explain the current question architecture. Do not immediately create new tables/components.**

After inspection, propose the smallest implementation that satisfies the requirements above.

Only then implement the feature.
