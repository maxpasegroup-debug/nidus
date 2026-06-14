# NIDUS GURU Exam Creator Agent Design

## 1. Scope

This document designs the first production NIDUS GURU agent: Exam Creator Agent.

No UI or backend implementation should start until this design is approved.

Exam Creator Agent is responsible for:

- understanding teacher intent
- building academic context
- retrieving NIDUS knowledge
- generating an exam draft
- supporting teacher revision
- requiring teacher approval
- publishing only after approval
- delivering the exam to assigned students
- logging all AI decisions and teacher corrections

## 2. Product Objective

When a teacher clicks Create Exam, NIDUS GURU should behave like an Academic Head:

```text
Good Morning Sir.

I can see:

Program: NDA Foundation
Batch: Alpha

Completed Topics:
- Algebra
- Trigonometry

Pending:
- Calculus

Average Batch Score:
61%

What type of exam would you like to create today?

1. Weekly Test
2. Revision Test
3. Grand Test
4. Previous Year Style
```

The agent must never feel like a form generator. It must feel like an academic decision system.

## 3. Database Schema

### 3.1 Knowledge Base Tables

#### `ai_program_knowledge`

Stores official program-level knowledge.

Fields:

- `id`
- `programCode`
- `programName`
- `description`
- `eligibilitySummary`
- `examPatternSummary`
- `syllabusSummary`
- `physicalRequirementSummary`
- `medicalStandardSummary`
- `interviewStageSummary`
- `difficultyProfile`
- `active`
- `createdAt`
- `updatedAt`

#### `ai_exam_pattern`

Stores program exam patterns.

Fields:

- `id`
- `programKnowledgeId`
- `name`
- `sectionsJson`
- `totalMarks`
- `durationMinutes`
- `negativeMarkingJson`
- `questionTypeMixJson`
- `source`
- `active`
- `createdAt`
- `updatedAt`

#### `ai_syllabus_topic`

Stores normalized syllabus topics.

Fields:

- `id`
- `programKnowledgeId`
- `subject`
- `unit`
- `topic`
- `subtopicsJson`
- `difficultyLevel`
- `recommendedQuestionTypesJson`
- `active`
- `createdAt`
- `updatedAt`

#### `ai_question_bank`

Groups question-bank sources.

Fields:

- `id`
- `programKnowledgeId`
- `title`
- `sourceType`
- `sourceName`
- `subject`
- `topic`
- `active`
- `createdAt`
- `updatedAt`

#### `ai_question_bank_item`

Stores reusable question items.

Fields:

- `id`
- `questionBankId`
- `programCode`
- `subject`
- `topic`
- `questionType`
- `difficulty`
- `questionText`
- `optionsJson`
- `answerJson`
- `explanation`
- `marks`
- `negativeMarks`
- `sourceReference`
- `embeddingId`
- `active`
- `createdAt`
- `updatedAt`

#### `ai_knowledge_document`

Stores uploaded source documents.

Fields:

- `id`
- `uploadedByUserId`
- `programCode`
- `batchId`
- `subject`
- `topic`
- `title`
- `fileName`
- `fileType`
- `fileUrl`
- `parseStatus`
- `parseError`
- `createdAt`
- `updatedAt`

#### `ai_knowledge_chunk`

Stores searchable chunks from documents.

Fields:

- `id`
- `documentId`
- `chunkIndex`
- `content`
- `summary`
- `programCode`
- `subject`
- `topic`
- `embeddingId`
- `createdAt`
- `updatedAt`

### 3.2 Context Engine Tables

#### `ai_context_snapshot`

Stores one frozen context package for an agent run.

Fields:

- `id`
- `agentRunId`
- `teacherId`
- `programCode`
- `batchId`
- `contextJson`
- `completedTopicsJson`
- `pendingTopicsJson`
- `batchPerformanceJson`
- `teacherPreferencesJson`
- `retrievalSummary`
- `createdAt`

#### `ai_context_source`

Tracks where context came from.

Fields:

- `id`
- `contextSnapshotId`
- `sourceType`
- `sourceId`
- `sourceLabel`
- `sourceJson`
- `createdAt`

### 3.3 Memory Tables

#### `teacher_ai_preference`

Stores long-term teacher preferences.

Fields:

- `id`
- `teacherId`
- `programCode`
- `subject`
- `preferenceType`
- `preferenceValueJson`
- `confidence`
- `lastObservedAt`
- `createdAt`
- `updatedAt`

Examples:

- prefers previous-year style
- prefers 50 MCQs
- prefers medium difficulty
- prefers simple English

#### `ai_generation_feedback`

Stores teacher feedback after draft/revision.

Fields:

- `id`
- `agentRunId`
- `draftId`
- `teacherId`
- `rating`
- `feedbackText`
- `correctionJson`
- `createdAt`

### 3.4 Agent Tables

#### `ai_agent_run`

Stores a full Exam Creator session.

Fields:

- `id`
- `agentType`
- `status`
- `teacherId`
- `programCode`
- `batchId`
- `startedAt`
- `completedAt`
- `errorCode`
- `errorMessage`
- `createdAt`
- `updatedAt`

Allowed `agentType`:

- `EXAM_CREATOR`

Allowed `status`:

- `STARTED`
- `COLLECTING_CONTEXT`
- `WAITING_FOR_TEACHER_INPUT`
- `GENERATING_DRAFT`
- `DRAFT_READY`
- `REVISING`
- `APPROVED`
- `PUBLISH_REQUESTED`
- `PUBLISHED`
- `FAILED`
- `CANCELLED`

#### `ai_agent_message`

Stores teacher and NIDUS GURU messages.

Fields:

- `id`
- `agentRunId`
- `role`
- `messageText`
- `messageJson`
- `createdAt`

Allowed roles:

- `TEACHER`
- `NIDUS_GURU`
- `SYSTEM`
- `TOOL`

#### `ai_generated_exam_draft`

Stores the structured exam draft.

Fields:

- `id`
- `agentRunId`
- `version`
- `status`
- `title`
- `programCode`
- `batchId`
- `examType`
- `durationMinutes`
- `totalMarks`
- `negativeMarking`
- `difficultyMixJson`
- `includedTopicsJson`
- `excludedTopicsJson`
- `instructionsJson`
- `sectionsJson`
- `sourceReferencesJson`
- `validationJson`
- `createdAt`
- `updatedAt`

Allowed `status`:

- `DRAFT`
- `REVISED`
- `APPROVED`
- `REJECTED`
- `PUBLISHED`

#### `ai_exam_draft_revision`

Stores teacher correction requests and resulting changes.

Fields:

- `id`
- `draftId`
- `agentRunId`
- `teacherId`
- `revisionRequest`
- `previousDraftJson`
- `revisedDraftJson`
- `changeSummary`
- `createdAt`

#### `ai_approval`

Stores mandatory human approval.

Fields:

- `id`
- `agentRunId`
- `draftId`
- `approvalType`
- `approvedByUserId`
- `approvalStatus`
- `approvalNotes`
- `approvedAt`
- `createdAt`

Allowed `approvalType`:

- `EXAM_DRAFT_APPROVAL`
- `EXAM_PUBLISH_APPROVAL`

Allowed `approvalStatus`:

- `PENDING`
- `APPROVED`
- `REJECTED`

#### `ai_publish_request`

Stores publish request after approval.

Fields:

- `id`
- `agentRunId`
- `draftId`
- `requestedByUserId`
- `approvedByUserId`
- `publishTargetType`
- `batchId`
- `scheduledDate`
- `scheduledTime`
- `durationMinutes`
- `instructions`
- `rulesJson`
- `status`
- `createdExamId`
- `createdAt`
- `updatedAt`

Allowed `status`:

- `PENDING_APPROVAL`
- `APPROVED`
- `PUBLISHED`
- `FAILED`
- `CANCELLED`

### 3.5 Exam Delivery Tables

The existing exam tables may be reused if they already exist. If not, create:

#### `teacher_exam`

Fields:

- `id`
- `createdByTeacherId`
- `sourceAgentRunId`
- `sourceDraftId`
- `programCode`
- `batchId`
- `title`
- `examType`
- `durationMinutes`
- `totalMarks`
- `negativeMarking`
- `instructionsJson`
- `rulesJson`
- `status`
- `scheduledAt`
- `publishedAt`
- `createdAt`
- `updatedAt`

#### `teacher_exam_question`

Fields:

- `id`
- `examId`
- `sectionTitle`
- `orderIndex`
- `questionType`
- `difficulty`
- `topic`
- `questionText`
- `optionsJson`
- `answerJson`
- `explanation`
- `marks`
- `negativeMarks`
- `sourceReference`
- `createdAt`

#### `student_exam_assignment`

Fields:

- `id`
- `examId`
- `studentId`
- `batchId`
- `status`
- `assignedAt`
- `startedAt`
- `submittedAt`
- `score`
- `createdAt`
- `updatedAt`

Allowed `status`:

- `ASSIGNED`
- `STARTED`
- `SUBMITTED`
- `MISSED`
- `EVALUATED`

## 4. Relationships

- `ai_program_knowledge` has many `ai_exam_pattern`.
- `ai_program_knowledge` has many `ai_syllabus_topic`.
- `ai_program_knowledge` has many `ai_question_bank`.
- `ai_question_bank` has many `ai_question_bank_item`.
- `ai_knowledge_document` has many `ai_knowledge_chunk`.
- `ai_agent_run` has one or many `ai_context_snapshot`.
- `ai_agent_run` has many `ai_agent_message`.
- `ai_agent_run` has many `ai_generated_exam_draft`.
- `ai_generated_exam_draft` has many `ai_exam_draft_revision`.
- `ai_generated_exam_draft` has many `ai_approval`.
- `ai_generated_exam_draft` has one `ai_publish_request`.
- `teacher_exam` references `ai_agent_run`.
- `teacher_exam` references `ai_generated_exam_draft`.
- `teacher_exam` has many `teacher_exam_question`.
- `teacher_exam` has many `student_exam_assignment`.

## 5. API Endpoints

### 5.1 Start Agent

`POST /api/ai/agents/exam/start`

Purpose:

Start an Exam Creator Agent run.

Request:

```json
{
  "programCode": "NDA",
  "batchId": "batch_123",
  "initialMessage": "Create NDA Maths exam"
}
```

Response:

```json
{
  "agentRunId": "run_123",
  "status": "WAITING_FOR_TEACHER_INPUT",
  "message": "Good Morning Sir. I can see..."
}
```

### 5.2 Send Message

`POST /api/ai/agents/exam/message`

Purpose:

Continue the conversation.

Request:

```json
{
  "agentRunId": "run_123",
  "message": "Weekly test, 50 questions, medium difficulty"
}
```

Response:

```json
{
  "agentRunId": "run_123",
  "status": "WAITING_FOR_TEACHER_INPUT",
  "message": "Should I include previous-year style questions?"
}
```

### 5.3 Upload Source

`POST /api/ai/agents/exam/source`

Purpose:

Attach PDF, Word, image, notes, or question-bank source.

Request:

```json
{
  "agentRunId": "run_123",
  "fileId": "file_123",
  "sourceType": "PDF"
}
```

Response:

```json
{
  "documentId": "doc_123",
  "parseStatus": "READY"
}
```

### 5.4 Generate Draft

`POST /api/ai/agents/exam/generate-draft`

Purpose:

Generate structured exam draft.

Request:

```json
{
  "agentRunId": "run_123",
  "examType": "WEEKLY_TEST",
  "questionCount": 50,
  "durationMinutes": 60
}
```

Response:

```json
{
  "draftId": "draft_123",
  "status": "DRAFT_READY",
  "draft": {}
}
```

### 5.5 Revise Draft

`POST /api/ai/agents/exam/revise`

Purpose:

Apply teacher correction.

Request:

```json
{
  "draftId": "draft_123",
  "revisionRequest": "Change question 5 to a harder trigonometry question"
}
```

Response:

```json
{
  "draftId": "draft_124",
  "version": 2,
  "changeSummary": "Question 5 changed..."
}
```

### 5.6 Approve Draft

`POST /api/ai/agents/exam/approve`

Purpose:

Teacher approves draft.

Request:

```json
{
  "draftId": "draft_124",
  "approvalNotes": "Approved after revision"
}
```

Response:

```json
{
  "approvalId": "approval_123",
  "status": "APPROVED"
}
```

### 5.7 Request Publish

`POST /api/ai/agents/exam/publish-request`

Purpose:

Create publish request after draft approval.

Request:

```json
{
  "draftId": "draft_124",
  "batchId": "batch_123",
  "scheduledDate": "2026-06-20",
  "scheduledTime": "10:00",
  "durationMinutes": 60,
  "rules": {
    "allowRetake": false,
    "showResultImmediately": false
  }
}
```

Response:

```json
{
  "publishRequestId": "pub_123",
  "status": "PENDING_APPROVAL"
}
```

### 5.8 Publish

`POST /api/ai/agents/exam/publish`

Purpose:

Publish only after approval.

Request:

```json
{
  "publishRequestId": "pub_123"
}
```

Response:

```json
{
  "examId": "exam_123",
  "assignedStudents": 42,
  "status": "PUBLISHED"
}
```

## 6. OpenAI Integration Flow

1. Build system prompt from NIDUS GURU identity.
2. Build agent prompt for Exam Creator.
3. Fetch context snapshot.
4. Retrieve relevant program knowledge and question bank chunks.
5. Inject teacher memory.
6. Send conversation and context to OpenAI.
7. Request structured JSON response.
8. Validate JSON schema.
9. Run academic guardrails.
10. Store output as draft.
11. Return draft to teacher for review.

OpenAI must never receive unfiltered database dumps. The Context Engine must summarize only necessary data.

## 7. Context Injection Flow

For every AI response:

1. Identify authenticated user.
2. Confirm teacher has access to selected batch.
3. Resolve program and batch.
4. Fetch syllabus progress.
5. Fetch calendar logs.
6. Fetch recent exam history.
7. Fetch batch performance.
8. Fetch assignment history.
9. Fetch teacher preferences.
10. Fetch relevant knowledge chunks.
11. Produce compact context summary.
12. Attach context summary to AI request.

Example context summary:

```text
Teacher: Ritwik
Role: Academic Head acting as teacher
Program: NDA Foundation
Batch: Alpha
Completed topics: Algebra, Trigonometry, Geometry
Pending topics: Calculus
Batch average score: 61%
Weak topic: Trigonometry
Teacher preference: medium difficulty, previous-year style
Instruction: Do not include pending topics unless teacher confirms.
```

## 8. Teacher Review Flow

Draft states:

1. `DRAFT_READY`
2. Teacher opens draft.
3. Teacher can:
   - edit title
   - edit instructions
   - edit marks
   - edit question
   - delete question
   - add question
   - ask NIDUS GURU to revise
4. Every revision creates a new draft version.
5. Teacher approves final version.
6. Only approved draft can move to publish request.

Approval must be explicit. Scrolling past the draft or closing the modal is not approval.

## 9. Publish Flow

1. Teacher clicks Publish Exam.
2. System checks draft approval.
3. System asks:
   - program
   - batch
   - date
   - time
   - duration
   - instructions
   - rules
4. System creates `ai_publish_request`.
5. System checks permission.
6. System creates `teacher_exam`.
7. System creates `teacher_exam_question`.
8. System creates `student_exam_assignment` for students in batch.
9. System logs publish action.
10. Students see exam in their dashboard.

NIDUS GURU cannot call publish without a human-approved publish request.

## 10. Student Delivery Flow

After publish:

1. Fetch active students in batch.
2. Create exam assignment for each student.
3. Notify student dashboard.
4. Show:
   - title
   - date/time
   - duration
   - instructions
   - attempt button when open
5. Store attempt.
6. Store result.
7. Return performance to batch intelligence later.

If no students exist, publish should fail with clear warning unless Director/HOD override is added later.

## 11. Failure Cases

### Missing Context

- no batch selected
- teacher has no assigned batches
- selected batch not assigned to teacher
- no syllabus progress
- no completed topics

Expected behavior:

Ask clarification or block generation.

### Source Issues

- invalid PDF
- unsupported file
- file parse fails
- empty document
- duplicate document

Expected behavior:

Continue with topic-only generation only after teacher confirmation.

### AI Issues

- OpenAI timeout
- malformed JSON
- empty output
- hallucinated topic
- included pending topic
- wrong exam pattern

Expected behavior:

Retry, validate, or block draft with explanation.

### Publish Issues

- teacher tries publish without approval
- publish request not approved
- no students in batch
- duplicate publish request
- database failure

Expected behavior:

Block publish and log failure.

## 12. Permission Model

Teacher can:

- start exam agent for assigned batches
- upload source material for assigned batches
- generate drafts for assigned batches
- revise drafts
- approve own drafts
- publish to assigned batches only

Academic Head can:

- use teacher mode for assigned batches
- review teacher exam activity
- approve academic workflows when HOD approval is required

Director can:

- audit all AI runs
- override publish blocks where policy allows
- review strategic exam quality

Student can:

- see only published exams assigned to them
- never see AI prompts, draft reasoning, teacher corrections, or internal context

## 13. Sequence Diagram

```text
Teacher
  |
  | clicks Create Exam
  v
Frontend
  |
  | POST /api/ai/agents/exam/start
  v
Exam Creator Agent
  |
  | validate teacher + batch access
  v
Context Engine
  |
  | fetch syllabus, calendar, scores, teacher memory
  v
Knowledge Retrieval
  |
  | retrieve program pattern + question bank + source material
  v
OpenAI GPT
  |
  | structured draft JSON
  v
Validation + Guardrails
  |
  | reject invalid or unsafe draft
  v
Draft Store
  |
  | draft shown to teacher
  v
Teacher Review
  |
  | revise / edit / approve
  v
Approval Store
  |
  | publish request
  v
Publish Service
  |
  | create exam + questions + student assignments
  v
Student Dashboard
```

## 14. UI Wireframe

### 14.1 Start Screen

```text
Exams
Create, review, publish and manage student assessments.

[+ Create New Exam]

Draft Exams
[Draft Card] [Draft Card]

Scheduled Exams
[Scheduled Card] [Scheduled Card]

Completed Exams
[Completed Card] [Completed Card]
```

### 14.2 NIDUS GURU Exam Creator

```text
------------------------------------------------------------
NIDUS GURU - Exam Creator
------------------------------------------------------------

Left: Chat

NIDUS GURU:
Good Morning Sir.

I can see:
Program: NDA Foundation
Batch: Alpha
Completed: Algebra, Trigonometry
Pending: Calculus
Average Score: 61%

What type of exam would you like to create?

[Teacher message box]

Right: Academic Context

Program: NDA Foundation
Batch: Alpha
Completed Topics
Pending Topics
Batch Score
Teacher Preference

Source Upload
[PDF] [Word] [Image] [Question Bank]

[Generate Draft]
```

### 14.3 Draft Review

```text
Exam Draft

Title
Duration
Marks
Difficulty Mix
Included Topics
Excluded Topics

Section A
Question cards

Section B
Question cards

[Edit Question]
[Delete Question]
[Add Question]
[Ask NIDUS GURU to Revise]

[Approve Draft]
```

### 14.4 Publish

```text
Publish Exam

Program
Batch
Date
Time
Duration
Instructions
Rules

Approval status: Approved by Teacher

[Publish to Students]
```

## 15. Acceptance Criteria

Exam Creator Agent is complete only when:

- teacher can start agent from assigned batch
- agent greets with real context
- agent asks missing academic questions
- agent retrieves academy knowledge
- agent excludes pending syllabus topics by default
- agent generates structured exam draft
- teacher can revise draft
- teacher can approve draft
- unapproved draft cannot publish
- approved draft can publish
- students receive exam
- AI run is logged
- teacher corrections are stored
- permission tests pass
- failure cases are handled

## 16. Implementation Gate

Before code begins, the following must be approved:

1. Database schema
2. API endpoint list
3. Context injection contract
4. OpenAI structured output schema
5. Review and approval workflow
6. Publish workflow
7. Student delivery workflow
8. Failure handling list
9. Permission model
10. UI wireframe

This document is the design checkpoint for approval.
