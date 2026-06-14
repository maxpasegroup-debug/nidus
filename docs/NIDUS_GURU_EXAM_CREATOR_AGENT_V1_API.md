# NIDUS GURU Exam Creator Agent V1 API

## Scope

Backend-only implementation of the first NIDUS GURU agent.

No React UI, dashboard changes, or exam-specific draft tables are introduced in V1.

The agent uses the approved universal AI workflow engine:

```text
AiWorkflowRequest
  -> AiWorkflowContext
  -> AiWorkflowDraft
  -> AiWorkflowReview
  -> AiWorkflowApproval
  -> AiWorkflowPublication
  -> Test / TeacherExamRecord
```

## Database Changes

No new database tables were required for V1.

The implementation reuses:

- `AiWorkflowRequest`
- `AiWorkflowContext`
- `AiWorkflowContextSource`
- `AiWorkflowDraft`
- `AiWorkflowDraftVersion`
- `AiWorkflowReview`
- `AiWorkflowApproval`
- `AiWorkflowPublication`
- `TeacherExamRecord`
- `Test`
- `Question`
- `Batch`
- `BatchStudent`
- `TeacherBatchAssignment`
- `TeacherSyllabusProgressRecord`
- `TeacherCalendarLogRecord`
- `TeacherStudyMaterialRecord`
- `QuestionBankItem`

## Routes

Base path:

```text
/api/ai/exam
```

All routes require an authenticated academic user:

- Teacher
- Academic Head acting as teacher
- Director
- Admin, except restricted admin dashboard templates

Plain teachers can use only assigned batches.

## 1. Create Draft

```http
POST /api/ai/exam/create
```

Sample request:

```json
{
  "program": "NDA",
  "batchId": "batch_123",
  "subject": "Mathematics",
  "topic": "Trigonometry",
  "examType": "Weekly Test",
  "questionCount": 20,
  "durationMinutes": 40,
  "difficulty": "MEDIUM",
  "prompt": "Create an NDA Maths weekly test on Trigonometry.",
  "sourceMaterial": [
    {
      "title": "Teacher notes",
      "type": "NOTES",
      "content": "Focus on identities, heights and distances, and application questions."
    }
  ]
}
```

Sample response:

```json
{
  "requestId": "ai_req_123",
  "contextId": "ctx_123",
  "draftId": "draft_123",
  "status": "DRAFT",
  "model": "gpt-4.1-mini",
  "draft": {
    "title": "NDA Mathematics - Trigonometry Weekly Test",
    "program": "NDA",
    "batch": "Alpha",
    "examType": "Weekly Test",
    "subject": "Mathematics",
    "topic": "Trigonometry",
    "durationMinutes": 40,
    "totalMarks": 20,
    "negativeMarking": false,
    "difficultyMix": {
      "easy": 60,
      "medium": 30,
      "hard": 10
    },
    "includedTopics": ["Trigonometry"],
    "excludedTopics": ["Calculus"],
    "instructions": ["Teacher review is mandatory before publishing."],
    "sections": [],
    "teacherReviewRequired": true
  }
}
```

Audit behavior:

- Stores full teacher prompt.
- Stores full NIDUS GURU instructions.
- Stores model name.
- Stores frozen context snapshot.
- Stores context sources, including syllabus, batch, calendar logs, exam history, assignment history, library materials, question bank items, and teacher-provided source material.

## 2. Review Draft

```http
POST /api/ai/exam/review
```

Sample request:

```json
{
  "draftId": "draft_123",
  "status": "IN_REVIEW",
  "notes": "Question 5 should be more application-oriented.",
  "correctionJson": {
    "questionNumber": 5,
    "request": "Make this harder and based on heights and distances."
  }
}
```

Optional corrected-draft request:

```json
{
  "draftId": "draft_123",
  "revisionRequest": "I manually corrected question 5.",
  "correctedDraft": {
    "title": "Corrected draft JSON here"
  }
}
```

Sample response:

```json
{
  "draftId": "draft_123",
  "review": {
    "id": "review_123",
    "status": "IN_REVIEW"
  },
  "version": null
}
```

## 3. Approve Draft

```http
POST /api/ai/exam/approve
```

Sample request:

```json
{
  "draftId": "draft_123",
  "notes": "Approved for NDA Alpha weekly test."
}
```

Sample response:

```json
{
  "draftId": "draft_123",
  "approvalId": "approval_123",
  "status": "APPROVED"
}
```

## 4. Publish Exam

```http
POST /api/ai/exam/publish
```

Sample request:

```json
{
  "requestId": "ai_req_123",
  "draftId": "draft_123",
  "batchId": "batch_123",
  "scheduledDate": "2026-06-20",
  "scheduledTime": "10:00",
  "durationMinutes": 40,
  "instructions": "Attempt all questions. No retake allowed.",
  "rules": {
    "allowRetake": false,
    "showResultImmediately": false
  },
  "approvalNotes": "Publish details confirmed by teacher."
}
```

Sample response:

```json
{
  "requestId": "ai_req_123",
  "draftId": "draft_123",
  "publicationId": "pub_123",
  "testId": "test_123",
  "assignedStudents": 42,
  "status": "PUBLISHED"
}
```

Publish rules:

- Draft must be approved.
- Publication receives its own approval record.
- Batch must have active students.
- Teacher must have access to the batch.
- Student delivery uses the existing `Test` availability path.

## Postman Collection Shape

Create four requests:

```text
POST {{baseUrl}}/api/ai/exam/create
POST {{baseUrl}}/api/ai/exam/review
POST {{baseUrl}}/api/ai/exam/approve
POST {{baseUrl}}/api/ai/exam/publish
```

Headers:

```text
Content-Type: application/json
Cookie: session={{sessionCookie}}
```

Suggested environment variables:

```text
baseUrl=http://localhost:4000
sessionCookie=<login-session-cookie>
batchId=<assigned-batch-id>
requestId=<from-create-response>
draftId=<from-create-response>
```

## Acceptance Status

Implemented:

- Real academy context injection
- Full context snapshot storage
- OpenAI integration through existing provider wrapper
- Fallback draft when OpenAI key is unavailable in development
- Universal AI workflow draft storage
- Teacher review record
- Teacher draft approval
- Publication approval
- Publish into existing student-facing test system
- Teacher batch permission guard
- Academic Head and Director access support

Not implemented in V1:

- File parsing for uploaded PDF/Word/Image binaries
- Vector embeddings
- Chat-style multi-message UI
- AI revision regeneration from a correction message
- Dedicated student assignment rows separate from the existing `Test` availability model
