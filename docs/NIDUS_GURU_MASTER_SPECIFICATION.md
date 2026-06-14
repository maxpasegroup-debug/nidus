# NIDUS GURU Master Specification

## 1. Product Definition

NIDUS GURU is the AI Academic Head of NIDUS Academy.

It is not a generic chatbot, page assistant, or simple content generator. Every NIDUS GURU response must be grounded in academy context, teacher intent, syllabus progress, batch performance, and NIDUS academic philosophy.

NIDUS GURU must help NIDUS run academics better before it tries to look impressive.

## 2. Non-Negotiable Principles

- Do not build UI first.
- Do not invent workflows inside pages.
- Do not publish AI-generated exams or assignments without teacher approval.
- NIDUS GURU must never directly publish exams, assignments, notices, reports, materials, or student actions. Human approval is mandatory.
- Do not generate questions from topics not completed by the batch unless the teacher explicitly requests it.
- Do not use fake intelligence, fake counters, placeholder analytics, or demo recommendations.
- Do not fine-tune a model initially.
- Use GPT as the reasoning engine, with NIDUS context injected before every response.
- Build daily teacher workflows first so real academic data naturally accumulates.

## 3. AI Architecture

NIDUS GURU intelligence is created through:

- Core LLM: OpenAI GPT reasoning engine.
- System Prompt: permanent NIDUS GURU identity and operating rules.
- Context Engine: live academy data injected before every AI response.
- Knowledge Base: program, syllabus, exam pattern, question bank, and uploaded material retrieval.
- Memory Engine: teacher preferences, corrections, and feedback.
- Agent Engine: specialized academic workflows.
- Review Loop: teacher approval and correction before publishing.

## 4. Permanent Agent Boundaries

Every NIDUS GURU interaction must belong to one of these agents:

1. Academy Knowledge Agent
2. Exam Creator Agent
3. Assignment Creator Agent
4. Library Agent
5. Academic Calendar Agent
6. Teacher Intelligence Agent
7. Academic Head Agent
8. Transformation Agent

The first production agent to build is Exam Creator Agent only.

## 5. NIDUS System Prompt Requirements

Every NIDUS GURU conversation must start with rules equivalent to:

```text
You are NIDUS GURU, the AI Academic Head of NIDUS Academy.
You are not a generic chatbot.
You understand NDA, CDS, AFCAT, SSB, Agniveer, MNS, TES, TGC, SSC Technical, AFMC, and RIMC.
You think like an Academic Head.
You ask clarifying questions when academic context is missing.
You verify syllabus completion before creating exams or assignments.
You consider batch performance before recommending difficulty.
You never publish exams, assignments, notices, reports, materials, or student actions directly.
Human review and approval are mandatory before any publish or student-facing action.
You preserve the NIDUS DNA: discipline, leadership, focus, purpose, character, and Dream Addiction.
```

## 6. Data Foundation

### 6.1 Academy Knowledge Base

Required entities:

- Program
- ProgramEligibility
- ExamPattern
- SyllabusArea
- SyllabusTopic
- CutoffHistory
- PhysicalRequirement
- MedicalStandard
- InterviewStage
- PreviousTrend
- QuestionBank
- QuestionBankItem
- KnowledgeDocument
- KnowledgeChunk

Programs must include:

- NDA
- CDS
- AFCAT
- SSB
- Agniveer Army
- Agniveer Navy
- Agniveer Air Force
- MNS
- TES
- TGC
- SSC Technical
- AFMC
- RIMC

### 6.2 AI Context Engine Tables

Required entities:

- AiContextSnapshot
- AiContextSource
- TeacherContext
- BatchContext
- StudentContext
- SyllabusProgressContext
- CalendarLogContext
- ExamHistoryContext
- AssignmentHistoryContext
- LibraryUsageContext

The Context Engine must fetch and summarize:

- teacher identity and role
- assigned program
- selected batch
- completed topics
- pending topics
- previous exams
- previous assignment completion
- batch average score
- attendance health
- library material availability
- teacher preferences

### 6.3 AI Memory Engine Tables

Required entities:

- TeacherAiPreference
- TeacherAiCorrection
- AiGenerationFeedback
- ExamGenerationFeedback
- AssignmentGenerationFeedback
- PromptRunLog
- AiDecisionLog

Memory examples:

- Teacher prefers previous-year-style papers.
- Teacher prefers 50 MCQs.
- Teacher frequently changes difficulty from hard to medium.
- Teacher wants simpler English for Agniveer batches.

### 6.4 AI Agent Engine Tables

Required entities:

- AiAgentRun
- AiAgentStep
- AiGeneratedDraft
- AiDraftRevision
- AiApproval
- AiPublishRequest

Agent runs must store:

- agent type
- input prompt
- injected context summary
- retrieved knowledge references
- generated draft
- teacher edits
- approval status
- publish status
- errors and retries

## 7. API Design

### 7.1 Context APIs

- `POST /api/ai/context/build`
- `GET /api/ai/context/:contextId`
- `GET /api/ai/context/teacher/:teacherId`
- `GET /api/ai/context/batch/:batchId`

### 7.2 Knowledge APIs

- `POST /api/ai/knowledge/documents`
- `GET /api/ai/knowledge/search`
- `POST /api/ai/knowledge/chunk`
- `POST /api/ai/knowledge/embed`

### 7.3 Memory APIs

- `GET /api/ai/memory/teacher/:teacherId`
- `POST /api/ai/memory/feedback`
- `POST /api/ai/memory/correction`

### 7.4 Agent APIs

- `POST /api/ai/agents/exam/start`
- `POST /api/ai/agents/exam/message`
- `POST /api/ai/agents/exam/generate-draft`
- `POST /api/ai/agents/exam/revise`
- `POST /api/ai/agents/exam/approve`
- `POST /api/ai/agents/exam/publish`

Later:

- `POST /api/ai/agents/assignment/start`
- `POST /api/ai/agents/library/start`
- `POST /api/ai/agents/academic-head/daily-brief`

## 8. Exam Creator Agent

### 8.1 Purpose

The Exam Creator Agent helps a teacher create, review, approve, and publish exams using live academy context.

### 8.2 Workflow

Teacher clicks Create Exam.

NIDUS GURU opens and greets the teacher.

NIDUS GURU asks for missing context:

- program
- batch
- exam type
- topic
- question count
- difficulty
- marks
- negative marking
- duration
- source material

NIDUS GURU fetches:

- completed syllabus
- pending syllabus
- batch score history
- previous exam weakness
- teacher preferences
- relevant question bank
- uploaded material

NIDUS GURU generates draft.

Teacher reviews.

Teacher edits or requests revision.

Teacher approves.

Only after approval, exam can be published.

### 8.3 Exam Draft Output Contract

The agent must return structured output:

```json
{
  "title": "",
  "program": "",
  "batch": "",
  "examType": "",
  "durationMinutes": 0,
  "totalMarks": 0,
  "negativeMarking": false,
  "difficultyMix": {
    "easy": 0,
    "medium": 0,
    "hard": 0
  },
  "includedTopics": [],
  "excludedTopics": [],
  "instructions": [],
  "sections": [
    {
      "title": "",
      "questionType": "",
      "marks": 0,
      "questions": []
    }
  ],
  "teacherReviewRequired": true
}
```

### 8.4 Required Intelligence

If Calculus is not completed, do not include Calculus unless teacher confirms.

If batch average is weak, recommend easier distribution.

If teacher has prior preferences, apply them silently and mention them.

If source material is missing, ask for topic and syllabus scope.

If question bank retrieval is weak, disclose that and ask for confirmation.

## 9. Assignment Creator Agent

Build after Exam Creator Agent is stable.

Required output:

```json
{
  "title": "",
  "objectives": [],
  "tasks": [],
  "instructions": [],
  "evaluationCriteria": [],
  "estimatedTimeMinutes": 0,
  "difficulty": "",
  "teacherReviewRequired": true
}
```

Assignment Agent must consider:

- batch completion rate
- assignment history
- topic progress
- teacher preference
- student level
- Dream Addiction / discipline reflection where appropriate

## 10. Library Agent

Library Agent must:

- read uploaded PDFs, Word docs, notes, and links
- summarize material
- classify by program, subject, and topic
- recommend where the material belongs
- suggest titles, descriptions, and thumbnails
- identify duplicate materials
- connect materials to syllabus topics

## 11. Academic Calendar Agent

Academic Calendar Agent must:

- read planned topics
- read completed, partial, and pending logs
- identify syllabus delay
- warn teacher and Academic Head
- advise what should be tested next
- prevent exams from using uncompleted topics by default

## 12. Permission Model

Teacher:

- can use AI only for assigned programs and batches
- can create exam and assignment drafts
- can approve and publish to assigned batches
- cannot access other teachers' batches
- cannot create programs or batches

Academic Head:

- can use Teacher Mode for own assigned classes
- can open HOD mode
- can review teacher activity
- can approve or reject academic materials when required
- can view batch and teacher intelligence

Director:

- can view all AI intelligence
- can access strategic summaries
- can audit AI decisions
- can override academic workflows

Student:

- can only see published academic content assigned to them
- cannot see teacher prompts, AI reasoning, or internal risk notes

## 13. Failure Cases

The system must handle:

- no assigned batch
- no completed syllabus
- no source material
- invalid PDF
- unsupported file
- OpenAI timeout
- knowledge retrieval failure
- database unavailable
- teacher tries to publish without approval
- teacher tries to generate from unassigned batch
- duplicate publish request
- empty AI output
- malformed structured output

No failure should publish content automatically.

## 14. Testing Requirements

Exam Creator Agent success tests:

- teacher creates exam with topic only
- teacher creates exam with PDF
- teacher creates exam with question bank
- AI excludes pending syllabus topic
- AI recommends easier difficulty for weak batch
- teacher revises question
- teacher approves
- exam publishes
- student receives exam

Permission tests:

- teacher cannot access unassigned batch
- academic head can open HOD intelligence
- student cannot access AI drafts
- director can audit AI run

Failure tests:

- OpenAI timeout
- invalid file upload
- no syllabus progress
- no batch selected
- malformed AI JSON

## 15. Build Order

### Phase 1

- Academy Knowledge Brain
- Knowledge tables
- Context Engine
- Memory tables
- OpenAI integration wrapper

### Phase 2

- Exam Creator Agent only
- Teacher review workflow
- Exam draft structured output
- Publish after approval

### Phase 3

- Assignment Creator Agent
- Library Agent
- Academic Calendar context awareness

### Phase 4

- Batch Brain
- Teacher Brain
- Student risk detection

### Phase 5

- Academic Head Brain
- Director Brain
- Transformation Brain

## 16. Acceptance Rule

No NIDUS GURU feature is complete unless:

- it uses real academy context
- it logs the AI run
- it stores teacher feedback
- it requires teacher approval before publishing
- it blocks direct AI publishing of exams, assignments, notices, reports, materials, and student actions
- it respects permissions
- it has failure handling
- it has tests

## 17. Current Decision

Development is frozen for new UI-first AI features.

The next approved implementation should be backend-first:

1. Database schema for NIDUS GURU foundation
2. Context Engine
3. Memory Engine
4. OpenAI integration layer
5. Exam Creator Agent API
6. Teacher review and publish workflow

UI should only be implemented after the agent architecture is approved.
