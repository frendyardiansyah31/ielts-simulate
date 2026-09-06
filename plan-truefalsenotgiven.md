You are working on an IELTS Reading mock test application.

## Context

The application allows an admin to:

1. Create an IELTS Reading test.
2. Create 3 passages inside the test.
3. Add questions to each passage.
4. Click `Add Question`.
5. Select a question type.
6. Display a question form specific to that question type.

The application uses **Supabase/PostgreSQL**.

We are now implementing the **True / False / Not Given (TFNG)** question type for IELTS Reading.

---

# 1. Question Type

Add/support this question type:

```text
true_false_not_given
```

The question consists of:

- A statement
- One correct answer
- Optional explanation

The available answers are fixed:

```text
TRUE
FALSE
NOT_GIVEN
```

Do NOT allow the admin to create custom answer options for this question type.

---

# 2. Admin Form

When the admin selects:

```text
Add Question
→ True / False / Not Given
```

show a form similar to:

```text
┌──────────────────────────────────────────────┐
│ Question 1                                   │
│ Type: True / False / Not Given               │
├──────────────────────────────────────────────┤
│                                              │
│ Statement                                    │
│ ┌──────────────────────────────────────────┐ │
│ │ The researchers began their study in     │ │
│ │ 1995.                                    │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Correct Answer                               │
│                                              │
│ ○ TRUE                                       │
│ ○ FALSE                                      │
│ ○ NOT GIVEN                                  │
│                                              │
│ Explanation (optional)                       │
│ ┌──────────────────────────────────────────┐ │
│ │ The passage states that...               │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ [ Cancel ]                    [ Save ]       │
└──────────────────────────────────────────────┘
```

Use a radio group for the three answers.

Do NOT use a free-text input for the correct answer.

The admin must select exactly one:

```text
TRUE
FALSE
NOT_GIVEN
```

---

# 3. Internal Answer Values

Use stable internal values:

```text
TRUE
FALSE
NOT_GIVEN
```

Do not store:

```text
true
false
"Not Given"
```

as inconsistent values.

The UI label should be:

```text
TRUE
FALSE
NOT GIVEN
```

but the internal/database value should be:

```text
TRUE
FALSE
NOT_GIVEN
```

Do NOT use a boolean column because TFNG has three possible states.

---

# 4. Database Design

First inspect the existing database schema and question architecture.

If the existing application already has a generic `questions` table, extend it rather than creating a separate TFNG table unless there is a strong architectural reason not to.

The preferred conceptual structure is:

```text
questions
--------------------------------
id
passage_id
question_number
question_type
question_text
question_data JSONB
explanation
created_at
updated_at
```

If the existing schema already stores some of these fields differently, adapt to the existing architecture instead of blindly creating duplicate columns.

---

# 5. JSONB Structure

For a TFNG question, `question_data` should contain only question-type-specific data.

Preferred structure:

```json
{
  "correct_answer": "TRUE"
}
```

or:

```json
{
  "correct_answer": "FALSE"
}
```

or:

```json
{
  "correct_answer": "NOT_GIVEN"
}
```

Do not put unnecessary fields into the JSONB object.

For example, do not duplicate:

```json
{
  "question_text": "...",
  "correct_answer": "TRUE",
  "explanation": "..."
}
```

if `question_text` and `explanation` already exist as normal columns.

---

# 6. Example Database Record

Example:

```text
question_type:
true_false_not_given

question_text:
"The researchers began their study in 1995."

question_data:
{
  "correct_answer": "TRUE"
}

explanation:
"The passage states that the research began in 1995."
```

---

# 7. Student UI

The student should see something like:

```text
1. The researchers began their study in 1995.

○ TRUE
○ FALSE
○ NOT GIVEN
```

The student selects exactly one answer.

When submitting, compare the student's selected value against:

```text
question_data.correct_answer
```

For example:

```text
student_answer = "NOT_GIVEN"

correct_answer = "NOT_GIVEN"

→ correct
```

Do not compare translated/display labels if avoidable. Use the stable internal values.

---

# 8. Question Numbering

Do not make the TFNG component responsible for generating question numbers.

Question numbering should remain controlled by the existing test/question architecture.

For example:

```text
Question 1 → Multiple Choice
Question 2 → TFNG
Question 3 → TFNG
Question 4 → Fill in the Blank
```

TFNG questions should behave exactly like other question types regarding ordering and numbering.

---

# 9. Passage Relationship

TFNG questions belong to a specific passage:

```text
Test
 └── Passage 1
      ├── Question 1 → Multiple Choice
      ├── Question 2 → TFNG
      ├── Question 3 → TFNG
      └── Question 4 → Fill in the Blank
```

Do not duplicate the passage content inside the TFNG question.

The question only stores the statement.

---

# 10. Optional Evidence / Reference

Do NOT make paragraph identification mandatory for TFNG.

A TFNG question should work even if the passage has no manually defined paragraph structure.

Optionally, if the existing architecture supports it, allow the admin to associate the question with a passage paragraph as an evidence/reference location.

Example:

```text
Evidence / Reference (optional)

[ Paragraph B ▼ ]
```

This is only metadata for explanation/review.

It must NOT be required to answer the question.

It must NOT be used as the primary answer mechanism.

If paragraph structure is not implemented yet, do not block TFNG implementation because of this optional feature.

---

# 11. Validation

Admin form validation:

- Statement is required.
- Correct answer is required.
- Exactly one answer must be selected.
- Explanation is optional.

Reject invalid data such as:

```json
{
  "correct_answer": "MAYBE"
}
```

Only allow:

```text
TRUE
FALSE
NOT_GIVEN
```

---

# 12. Scoring

Do not create a special scoring algorithm for TFNG.

The scoring logic should simply be:

```text
if student_answer === correct_answer:
    correct
else:
    incorrect
```

Each question contributes one mark, following the existing scoring system.

Do not implement IELTS band conversion inside the question component if band conversion is already handled elsewhere.

---

# 13. Important Architectural Requirement

Before coding:

1. Inspect the existing `questions` table.
2. Inspect existing question creation components/forms.
3. Inspect how `question_type` is currently represented.
4. Inspect how JSONB question data is currently structured.
5. Inspect how Multiple Choice is implemented.
6. Inspect how answers are stored and evaluated.
7. Inspect how the student-side question renderer works.
8. Inspect existing Supabase migrations.
9. Reuse existing patterns wherever possible.

Do not introduce a second question architecture just for TFNG.

Do not redesign the entire question system.

---

# 14. Compatibility With Existing Question Types

The implementation must not break existing question types such as:

```text
Multiple Choice
Fill in the Blank
List of Headings
```

The question system should remain extensible:

```text
question_type
      │
      ├── multiple_choice
      ├── fill_in_blank
      ├── list_of_headings
      └── true_false_not_given
```

Each type should own only the data and UI specific to that type.

---

# 15. Deliverables

Before modifying code, provide a short implementation plan based on the actual existing architecture.

Then implement:

1. TFNG question type.
2. Admin form.
3. Database/migration changes if required.
4. Validation.
5. Student rendering.
6. Answer submission/evaluation.
7. Any required TypeScript/types/schema updates.
8. Tests for:
   - TRUE answer
   - FALSE answer
   - NOT_GIVEN answer
   - invalid answer
   - missing statement
   - missing correct answer

Keep the implementation focused on TFNG.

Do not redesign unrelated parts of the IELTS application.
