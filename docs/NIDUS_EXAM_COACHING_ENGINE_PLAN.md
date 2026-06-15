# NIDUS Exam Coaching Engine Plan

## Decision

NIDUS will not depend on Career7 or TOPRANK for exam coaching.

The owned engine will live inside the NIDUS platform and reuse the existing academy, test, AI workflow, and NIDUS GURU foundations.

## Product Objective

Build a simple defence exam coaching engine for a small Kerala academy:

- Student sees assigned practice, tests, and progress.
- Teacher creates exams and assignments with NIDUS GURU.
- Academic Head/Director assigns programs, batches, subjects, and teachers.
- NIDUS stores all questions, attempts, marks, corrections, and progress.
- No external bridge is required for daily exam practice.

## Core Engine Modules

### 1. Exam Catalog

Owned NIDUS exam areas:

- NDA
- CDS
- AFCAT
- SSB
- Agniveer Army
- Agniveer Navy
- Agniveer Air Force
- AISSEE
- RIMC
- MNS
- TES
- TGC / SSC Technical
- AFMC

Each exam area should store:

- Eligibility notes
- Subjects
- Syllabus topics
- Exam pattern
- Difficulty levels
- Question banks
- Practice sets
- Mock tests

### 2. Question Bank

NIDUS-owned question records should support:

- Program
- Subject
- Topic
- Difficulty
- Question type
- Options
- Correct answer
- Explanation
- Marks
- Negative marks
- Source note
- Teacher approval status

### 3. Practice Engine

Students should get:

- Daily practice sets
- Topic-wise practice
- Weak-topic practice
- Timed practice
- Previous-year-style practice
- AI correction where safe
- Teacher-approved tests

### 4. Test Attempt Engine

Every attempt should store:

- Student
- Test
- Program
- Batch
- Start time
- End time
- Answers
- Score
- Accuracy
- Time per question
- Weak topics
- Result status

### 5. NIDUS GURU Integration

NIDUS GURU should support:

- Exam creation
- Assignment creation
- Question bank generation
- Question explanation
- Weak-topic recommendations
- Batch-level test recommendations

All generated academic content must follow:

Knowledge Retrieval -> Context Injection -> AI Draft -> Human Review -> Approval -> Publish

### 6. Teacher Workflow

Teacher flow:

Classes -> Program -> Batch -> Students -> Progress

Exam flow:

Create Exam -> NIDUS GURU Draft -> Teacher Review -> Approve -> Publish -> Student Attempts -> Results

Assignment flow:

Create Assignment -> NIDUS GURU Draft -> Teacher Review -> Publish -> Submitted/Pending Tracking

### 7. Student Workflow

Student flow:

Dashboard -> Assigned Batch -> Practice / Exams / Assignments / Library -> Results -> Progress

Students must only see content assigned to their program, batch, or individual profile.

## Migration From TOPRANK

### Removed Now

- Career7 environment requirements
- TOPRANK backend bridge
- TOPRANK public routes
- TOPRANK dashboard route
- TOPRANK payment shortcut
- TOPRANK navigation links
- TOPRANK marketing labels

### Replaced With

- NIDUS Exam Coaching public entry through `/tests`
- NIDUS-owned tests and examination center
- NIDUS GURU exam creation backend foundation
- Director/Academic Head owned assignment of programs, batches, and teachers

## Build Order

### Phase 1: Stabilize Existing Owned Tests

- Audit current `Test`, `Question`, `TestAttempt`, and question bank models.
- Confirm student test-taking works without external services.
- Connect student dashboard exam area to owned tests only.
- Remove any dead references to external exam launch systems.

### Phase 2: Owned Question Bank Console

- Director/HOD can add/import questions.
- Teacher can suggest questions.
- Academic Head approves questions.
- NIDUS GURU can draft questions into the universal AI workflow engine.

### Phase 3: Student Practice Engine

- Topic-wise practice
- Timed practice
- Daily missions
- Weak-topic retry
- Result review

### Phase 4: Batch Intelligence

- Batch score
- Attendance + exam + assignment summary
- Weak topics
- Suggested next test

### Phase 5: NIDUS GURU Coaching Intelligence

- Suggest practice based on syllabus progress.
- Avoid topics not completed in academic calendar.
- Adjust difficulty based on batch performance.
- Save teacher preferences and corrections.

## Non-Negotiable Rules

- No exam content is published directly by AI.
- Human approval is mandatory before publishing exams, assignments, notices, or learning materials.
- Teachers never create academy structure.
- Teachers only see assigned programs and batches.
- Students only see assigned academic content.
- Director and Academic Head own program, batch, and teacher allocation.

## Success Definition

NIDUS Exam Coaching Engine V1 is successful when:

1. Student can take a NIDUS-owned practice test.
2. Teacher can publish a NIDUS-owned exam through NIDUS GURU approval workflow.
3. Academic Head can monitor results by program and batch.
4. Director can see real exam activity without external platform dependency.
5. No Career7 or TOPRANK route, variable, or payment logic is required to run exam coaching.
