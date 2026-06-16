"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Brain, ClipboardCheck, GraduationCap, ShieldCheck, Sparkles, Users } from "lucide-react";
import { apiGet } from "@/services/api";

type GuruResponse = {
  generatedAt: string;
  identity: string;
  permissions: { role: string; scope: string; accessibleBatchCount: number; canPublishWithoutApproval: boolean };
  knowledgeBrain: { status: string; totals: { courses: number; questionBankItems: number; feedbackSignals: number }; programs: Array<{ program: string; courses: number; questionBankItems: number; coverageStatus: string; missingKnowledgeAreas: string[] }> };
  examCreatorAgent: { status: string; workflow: string };
  assignmentCreatorAgent: { status: string; workflow: string };
  libraryIntelligence: { status: string; readableMaterials: number; limitation: string };
  studentBrain: { status: string; summary: { totalStudents: number; atRisk: number; attentionNeeded: number }; students: Array<{ studentId: string; studentName: string; healthScore: number | null; riskScore: number | null; status: string; signals: Record<string, unknown> }> };
  batchBrain: { status: string; batches: Array<{ batchId: string; batchName: string; program?: string | null; healthScore: number | null; status: string; signals: Record<string, unknown> }> };
  teacherBrain: { status: string; teachers: Array<{ teacherId: string; teacherName: string; performanceScore: number | null; status: string; signals: Record<string, unknown> }> };
  academicHeadBrain: { status: string; todayAttention: string[]; recommendations: Array<{ priority: string; action: string }>; safety: string };
  directorBrain?: { status: string; academyHealth: number | null; admissionsHealth: string; academicHealth: string; teacherHealth: string; studentHealth: string; batchHealth: string; financialSignals: { collectedFees: number; source: string } } | null;
  memoryEngine: { status: string; storedSignals: { workflowRequests: number; feedbackItems: number; examCreatorRequests: number; assignmentCreatorRequests: number }; rule: string };
  safetyRules: Record<string, string>;
};

export default function NidusGuruAcademicHeadPage() {
  const guruQuery = useQuery({
    queryKey: ["nidus-guru", "academic-head"],
    queryFn: () => apiGet<GuruResponse>("/nidus-guru/academic-head"),
  });

  const data = guruQuery.data;

  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-5 py-6 text-[var(--navy)] md:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[var(--gold)]">NIDUS Guru</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black md:text-6xl">AI Academic Head</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-blue)]">
                Academic attention, student risk, batch health, teacher delivery, knowledge coverage and safety status. Built from academy data, not a generic chat prompt.
              </p>
            </div>
            {data ? (
              <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-soft)] px-5 py-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--gold)]">Scope</p>
                <p className="mt-1 font-black">{data.permissions.scope}</p>
                <p className="text-xs text-[var(--muted-blue)]">{data.permissions.accessibleBatchCount} batch(es)</p>
              </div>
            ) : null}
          </div>
        </div>

        {guruQuery.isLoading ? <Panel title="Loading NIDUS GURU intelligence..." /> : null}
        {guruQuery.isError ? <Panel title="NIDUS GURU unavailable" text="Could not load the academic intelligence endpoint." /> : null}

        {data ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric title="Students" value={data.studentBrain.summary.totalStudents} note={`${data.studentBrain.summary.atRisk} at risk`} icon={<Users size={20} />} />
              <Metric title="Batches" value={data.batchBrain.batches.length} note={`${data.batchBrain.batches.filter((item) => item.status !== "HEALTHY").length} need attention`} icon={<GraduationCap size={20} />} />
              <Metric title="Teachers" value={data.teacherBrain.teachers.length} note={`${data.teacherBrain.teachers.filter((item) => item.status !== "HEALTHY").length} flagged`} icon={<ClipboardCheck size={20} />} />
              <Metric title="Knowledge" value={data.knowledgeBrain.totals.questionBankItems} note={`${data.knowledgeBrain.totals.courses} courses`} icon={<Brain size={20} />} />
            </section>

            <Panel title="Today's Academic Attention" icon={<AlertTriangle size={20} />}>
              <div className="grid gap-3">
                {data.academicHeadBrain.todayAttention.map((item) => (
                  <div key={item} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4 text-sm font-bold">{item}</div>
                ))}
              </div>
            </Panel>

            <section className="grid gap-4 lg:grid-cols-2">
              <Panel title="Batch Brain" icon={<GraduationCap size={20} />}>
                <div className="grid gap-3">
                  {data.batchBrain.batches.slice(0, 8).map((batch) => (
                    <HealthRow key={batch.batchId} title={batch.batchName} meta={batch.program || "Program"} score={batch.healthScore} status={batch.status} />
                  ))}
                  {!data.batchBrain.batches.length ? <SoftNote text="No batch data available for this scope." /> : null}
                </div>
              </Panel>
              <Panel title="Teacher Brain" icon={<ClipboardCheck size={20} />}>
                <div className="grid gap-3">
                  {data.teacherBrain.teachers.slice(0, 8).map((teacher) => (
                    <HealthRow key={teacher.teacherId} title={teacher.teacherName} meta={`${teacher.signals.assignmentsPublished ?? 0} assignments / ${teacher.signals.examsPublished ?? 0} exams`} score={teacher.performanceScore} status={teacher.status} />
                  ))}
                  {!data.teacherBrain.teachers.length ? <SoftNote text="No teacher delivery records available yet." /> : null}
                </div>
              </Panel>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <Panel title="Student Success Monitor" icon={<Users size={20} />}>
                <div className="grid gap-3">
                  {data.studentBrain.students.slice(0, 10).map((student) => (
                    <HealthRow key={student.studentId} title={student.studentName} meta={`Risk ${student.riskScore ?? "No data"}`} score={student.healthScore} status={student.status} />
                  ))}
                  {!data.studentBrain.students.length ? <SoftNote text="No student activity records are available yet." /> : null}
                </div>
              </Panel>
              <Panel title="Knowledge Brain" icon={<Brain size={20} />}>
                <div className="grid gap-3">
                  {data.knowledgeBrain.programs.map((program) => (
                    <div key={program.program} className="rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-black">{program.program}</h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(program.coverageStatus)}`}>{program.coverageStatus}</span>
                      </div>
                      <p className="mt-2 text-sm text-[var(--muted-blue)]">{program.courses} course(s) / {program.questionBankItems} question(s)</p>
                      {program.missingKnowledgeAreas.length ? <p className="mt-2 text-xs text-[var(--muted-blue)]">Missing: {program.missingKnowledgeAreas.slice(0, 4).join(", ")}</p> : null}
                    </div>
                  ))}
                </div>
              </Panel>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <Panel title="Assessment Agents" icon={<Sparkles size={20} />}>
                <StatusLine label="Exam Creator" value={data.examCreatorAgent.status} note={data.examCreatorAgent.workflow} />
                <StatusLine label="Assignment Creator" value={data.assignmentCreatorAgent.status} note={data.assignmentCreatorAgent.workflow} />
              </Panel>
              <Panel title="Library Intelligence" icon={<Brain size={20} />}>
                <StatusLine label="Readable Materials" value={String(data.libraryIntelligence.readableMaterials)} note={data.libraryIntelligence.limitation} />
              </Panel>
              <Panel title="Safety Rules" icon={<ShieldCheck size={20} />}>
                {Object.entries(data.safetyRules).map(([key, value]) => (
                  <StatusLine key={key} label={key} value={value} />
                ))}
              </Panel>
            </section>

            {data.directorBrain ? (
              <Panel title="Director Brain" icon={<ShieldCheck size={20} />}>
                <div className="grid gap-3 md:grid-cols-3">
                  <Metric title="Academy Health" value={data.directorBrain.academyHealth ?? "No data"} note={data.directorBrain.academicHealth} />
                  <Metric title="Teacher Health" value={data.directorBrain.teacherHealth} note={data.directorBrain.batchHealth} />
                  <Metric title="Fees Collected" value={data.directorBrain.financialSignals.collectedFees} note={data.directorBrain.financialSignals.source} />
                </div>
              </Panel>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}

function Panel({ title, text, icon, children }: { title: string; text?: string; icon?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        {icon ? <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--page-bg)]">{icon}</span> : null}
        <div>
          <h2 className="text-2xl font-black">{title}</h2>
          {text ? <p className="mt-1 text-sm text-[var(--muted-blue)]">{text}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function Metric({ title, value, note, icon }: { title: string; value: React.ReactNode; note?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-[var(--muted-blue)]">{title}</p>
        {icon}
      </div>
      <p className="mt-2 text-3xl font-black">{value}</p>
      {note ? <p className="mt-1 text-xs font-bold text-[var(--muted-blue)]">{note}</p> : null}
    </div>
  );
}

function HealthRow({ title, meta, score, status }: { title: string; meta: string; score: number | null; status: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
      <div>
        <h3 className="font-black">{title}</h3>
        <p className="mt-1 text-xs text-[var(--muted-blue)]">{meta}</p>
      </div>
      <div className="text-right">
        <p className="text-xl font-black">{score ?? "-"}</p>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(status)}`}>{status}</span>
      </div>
    </div>
  );
}

function StatusLine({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="mb-3 rounded-2xl border border-[var(--border)] bg-[var(--page-bg)] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold)]">{label}</p>
      <p className="mt-1 font-black">{value}</p>
      {note ? <p className="mt-1 text-xs leading-5 text-[var(--muted-blue)]">{note}</p> : null}
    </div>
  );
}

function SoftNote({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--page-bg)] p-4 text-sm text-[var(--muted-blue)]">{text}</p>;
}

function statusClass(status: string) {
  const normalized = status.toUpperCase();
  if (["PASS", "HEALTHY", "PUBLISHED"].includes(normalized)) return "bg-emerald-50 text-emerald-800";
  if (["PARTIAL", "ATTENTION", "NO_DATA"].includes(normalized)) return "bg-amber-50 text-amber-800";
  return "bg-rose-50 text-rose-800";
}
