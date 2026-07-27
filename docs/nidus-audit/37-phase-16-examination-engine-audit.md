# 37 - Phase 16 Examination Engine Audit

## Status

Complete.

## Operating Name

`NIDUS Examination Engine - Teacher Publish to Student Result Release`

## Purpose

This audit locks the professional examination workflow from teacher paper upload to student solved-paper release.

The implementation reuses the existing teacher dashboard, tests module, student dashboard and result pages. It does not create a duplicate exam engine.

## Workflow Covered

1. Teacher selects batch, subject, schedule, duration and marks.
2. Teacher uploads or pastes question paper.
3. Teacher uploads answer key, with or without explanations.
4. Engine extracts text from TXT, DOCX and PDF sources.
5. Original source files are preserved for audit.
6. Engine detects subject, paper type, marking scheme, sections, answer-key mode and visual risk.
7. Teacher reviews the extracted student preview beside the original paper.
8. Teacher approves and publishes.
9. Student sees the exam in the student dashboard.
10. Student attempts inside Secure CBT Exam Mode.
11. Student submits.
12. Result remains locked until faculty release.
13. Teacher reviews ranked submissions and releases official results.
14. Student sees score, rank, answer key, explanations and solved-paper review after release.

## Teacher Dashboard Audit

### Upload and Extraction

Implemented controls:

- Question paper upload.
- Answer key upload.
- TXT extraction.
- DOCX extraction.
- PDF text extraction.
- Original file preservation through `ExamUpload`.
- Signed source URL support.
- Local preview URL support during teacher review.

Covered source types:

- Text-only papers.
- PDF papers.
- Word papers.
- Image question papers.
- Answer-key-only uploads.
- Physics or mathematics papers with formulas.
- Papers that reference diagrams, images, graphs, charts or tables.

Known limitation:

- PDF visual extraction renders page snapshots for teacher-controlled attachment. It does not automatically crop each diagram region perfectly. The system preserves the original source, allows page/image attachment to questions, and forces teacher visual review instead of silently publishing a damaged paper.

### Paper Understanding

The teacher review now displays:

- Inferred exam type.
- Inferred subject.
- Inferred topic.
- Answer-key mode.
- Marks per question.
- Negative marking.
- Section detection.
- Missing answer keys.
- Extra answer keys.
- Diagram/image risks.
- Table risks.
- Graph/chart risks.
- Formula/symbol risks.

### Visual Fidelity

The visual fidelity layer now:

- Counts visual, formula, table and graph risk questions.
- Lists question numbers needing review.
- Blocks publish if diagram/table/graph questions exist without preserved source.
- Shows original PDF/image source beside extracted question preview.
- Renders PDF pages into attachable question visual assets.
- Allows uploaded image question papers to become attachable assets.
- Allows teacher to attach or remove a visual asset per question.
- Allows teacher to attach full, top, middle or bottom regions from a rendered visual asset.
- Publishes attached assets through `Question.questionImage`.
- Records question image assignment count in `visualFidelity`.
- Persists `visualFidelity` in exam draft audit JSON.
- Writes per-question `visualReviewRequired` and `visualReviewNotes` into published `Question` rows.

## Backend Audit

### New Models and Fields

Added:

- `ExamUpload`
- `Question.visualReviewRequired`
- `Question.visualReviewNotes`

### APIs

Teacher upload and result APIs include:

- `POST /api/academy/exams/uploads`
- `GET /api/academy/exams/:id/uploads`
- `GET /api/academy/exams/:id/results`
- `POST /api/academy/exams/:id/release-results`

Student test APIs include:

- Available tests.
- Start test.
- Resume attempt.
- Autosave.
- Integrity event.
- Submit.
- Attempt history.
- Result.

### Result Privacy

Before result release:

- Student cannot see score.
- Student cannot see correct answer.
- Student cannot see explanations.
- Student sees submitted state and pending faculty release.

After result release:

- Student sees score.
- Student sees rank.
- Student sees correct answer.
- Student sees explanation.
- Student sees solved paper.
- Student sees question images, PDF page snapshots and teacher visual review notes.

### Release Protection

Teacher result release now requires:

- At least one submitted attempt.
- Explicit teacher confirmation in UI.
- Result release audit event.

On release:

- `TeacherExamRecord.status` becomes `RESULTS_RELEASED`.
- Linked `Test.status` becomes `RESULTS_RELEASED`.
- Linked `Test.isLive` becomes `false`.

## Student Dashboard Audit

### Before Attempt

Student dashboard shows:

- Upcoming/live exams.
- Attended history.
- Missed/unattended exams.
- Countdown and exam window state.

### During Attempt

Secure CBT Exam Mode includes:

- Server-resumed attempt state.
- Timer.
- Autosave status.
- Focus alert count.
- Fullscreen control.
- Question palette.
- Answered/skipped/review state.
- Confidence flag.
- Per-question time tracking.
- Visual notes from teacher-reviewed question metadata.

### After Submit

Student result page shows:

- Pending faculty release lock when unreleased.
- Submission timestamp.
- Question count.
- Time taken.
- No answer key or score leakage.

### After Release

Student result page shows:

- Total score.
- Accuracy.
- Batch rank.
- Average time.
- Correct/wrong/skipped counts.
- Topic chart.
- Feedback and improvement areas.
- Solved paper with options, correct answer and explanation.
- Question images and visual review notes.

## Security and Integrity

Implemented:

- Correct answers stripped from active attempts.
- Explanations stripped from active attempts.
- Pending result payload sanitized.
- Tab switch integrity event.
- Copy blocked integrity event.
- Autosave answer state.
- Timer expiry auto-submit path.

## Validation

Commands run during the examination phases:

- `npm run build --workspace backend`
- `npm run build --workspace frontend`
- `npx prisma validate --config backend/prisma.config.ts`
- `npx prisma generate --config backend/prisma.config.ts`

Phase 8 also extends:

- `npm run test:cbt --workspace backend`

The CBT verification now asserts the teacher upload, visual-fidelity, result-locking and release-audit contracts.

## Deployment Checklist

Before production rollout:

1. Run Prisma migrations.
2. Regenerate Prisma client.
3. Build backend and frontend.
4. Run CBT verification.
5. Upload one PDF question paper with diagrams/tables.
6. Upload one answer-key-only file.
7. Attach a rendered PDF page snapshot or crop its top/middle/bottom region to the diagram question.
8. Confirm teacher visual preview blocks unsafe publish until manual review/source preservation is complete.
9. Publish the exam.
10. Attempt as student.
11. Confirm the attached visual appears in Secure CBT Exam Mode.
12. Confirm result page is locked before release.
13. Release as teacher.
14. Confirm solved paper, score, rank, answer key, explanation and visual notes appear for student.

## Opinion

The examination module is now suitable for a controlled pilot.

The strongest part of the implementation is that it does not pretend PDF extraction can perfectly understand diagrams, tables and formulas. It preserves the source, flags risk, forces teacher review, and carries that review into the student attempt and released solved paper.

Phase 9 adds teacher-controlled PDF page snapshot attachment for question-level assets.

Phase 10 adds teacher-controlled region capture for full, top, middle and bottom sections of each rendered page/image asset. The next improvement should be automated region suggestion with AI vision validation and stricter storage-size rules.
