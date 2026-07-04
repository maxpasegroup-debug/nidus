"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, Clock3, Search, UserRound, Users, X } from "lucide-react";
import { TeacherModuleHeader, TeacherTileGrid } from "@/components/teacher/teacher-dashboard-primitives";

export type TeacherRosterStudent = {
  id: string;
  name: string;
  email?: string | null;
  mobile?: string | null;
};

export type TeacherRosterBatch = {
  id: string;
  name: string;
  program: string;
  subjects: string[];
  students: TeacherRosterStudent[];
};

type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";

const statuses: Array<{ value: AttendanceStatus; label: string }> = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "HALF_DAY", label: "Half Day" },
  { value: "LEAVE", label: "Leave" },
];

export function TeacherStudentsView({ batches, loading, onMarkAttendance }: {
  batches: TeacherRosterBatch[];
  loading: boolean;
  onMarkAttendance: (input: { batchId: string; subject: string; studentId: string; status: AttendanceStatus; remarks: string; date: string }) => Promise<void>;
}) {
  const [batchId, setBatchId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState<AttendanceStatus>("PRESENT");
  const [remarks, setRemarks] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [marked, setMarked] = useState<Record<string, AttendanceStatus>>({});

  const batch = batches.find((item) => item.id === batchId) ?? null;
  const student = batch?.students.find((item) => item.id === studentId) ?? null;
  const visibleStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!batch) return [];
    if (!query) return batch.students;
    return batch.students.filter((item) => [item.name, item.email, item.mobile].filter(Boolean).join(" ").toLowerCase().includes(query));
  }, [batch, search]);
  const markedCount = batch ? batch.students.filter((item) => marked[item.id]).length : 0;

  const openBatch = (nextBatch: TeacherRosterBatch) => {
    setBatchId(nextBatch.id);
    setStudentId(null);
    setSubject(nextBatch.subjects[0] || "General");
    setSearch("");
    setMessage("");
  };

  const close = () => {
    setBatchId(null);
    setStudentId(null);
    setRemarks("");
    setMessage("");
  };

  const chooseStudent = (id: string) => {
    setStudentId(id);
    setStatus(marked[id] || "PRESENT");
    setRemarks("");
    setMessage("");
  };

  const save = async () => {
    if (!batch || !student || !subject) return;
    setSaving(true);
    setMessage("");
    try {
      await onMarkAttendance({
        batchId: batch.id,
        subject,
        studentId: student.id,
        status,
        remarks,
        date: new Date().toISOString(),
      });
      setMarked((current) => ({ ...current, [student.id]: status }));
      setMessage(`${student.name} marked ${statuses.find((item) => item.value === status)?.label}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Attendance could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="grid gap-5">
      <TeacherModuleHeader eyebrow="My Students" title="Your assigned students" description="Choose a batch, open a student, mark today&apos;s attendance and add a short remark." />

      {loading ? <p className="rounded-xl border border-[var(--border)] bg-white p-5 text-sm font-bold text-[var(--muted-blue)]">Loading assigned batches...</p> : null}
      {!loading && batches.length ? (
        <TeacherTileGrid>
          {batches.map((item) => (
            <button key={item.id} type="button" onClick={() => openBatch(item)} className="flex aspect-square min-w-0 flex-col justify-between rounded-xl border border-[var(--border)] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--page-bg)]"><Users size={17} /></span>
              <span className="min-w-0">
                <span className="line-clamp-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--gold-dark)]">{item.program}</span>
                <span className="mt-1 line-clamp-3 block text-sm font-black leading-5 sm:text-base">{item.name}</span>
                <span className="mt-2 block text-xs font-bold text-[var(--muted-blue)]">{item.students.length} students</span>
              </span>
            </button>
          ))}
        </TeacherTileGrid>
      ) : null}
      {!loading && !batches.length ? <p className="rounded-xl border border-dashed border-[var(--border)] bg-white p-6 text-sm text-[var(--muted-blue)]">No student batches are assigned to this teacher.</p> : null}

      {batch ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={`${batch.name} students`}>
          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-white shadow-2xl sm:rounded-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-4 sm:p-5">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--gold-dark)]">{batch.program}</p>
                <h2 className="mt-1 truncate text-xl font-black sm:text-2xl">{batch.name}</h2>
                <p className="mt-1 text-sm text-[var(--muted-blue)]">{batch.students.length} assigned students</p>
              </div>
              <button type="button" onClick={close} aria-label="Close student roster" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--border)]"><X size={18} /></button>
            </header>

            <div className="grid min-h-0 flex-1 md:grid-cols-[0.9fr_1.1fr]">
              <section className={`${student ? "hidden md:flex" : "flex"} min-h-0 flex-col border-r border-[var(--border)]`}>
                <div className="p-4">
                  <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--page-bg)] px-3">
                    <Search size={16} />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                  </label>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                  <div className="grid gap-2">
                    {visibleStudents.map((item, index) => (
                      <button key={item.id} type="button" onClick={() => chooseStudent(item.id)} className="flex min-h-14 items-center gap-3 rounded-xl border border-[var(--border)] p-3 text-left hover:border-slate-950">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--page-bg)] text-xs font-black">{index + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-black">{item.name}</span>
                          <span className="block truncate text-xs text-[var(--muted-blue)]">{item.mobile || item.email || "Student"}</span>
                        </span>
                        {marked[item.id] ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">{marked[item.id].replace("_", " ")}</span> : null}
                      </button>
                    ))}
                    {!visibleStudents.length ? <p className="p-4 text-sm text-[var(--muted-blue)]">No matching students.</p> : null}
                  </div>
                </div>
              </section>

              <section className={`${student ? "flex" : "hidden md:flex"} min-h-0 flex-col`}>
                {student ? (
                  <>
                    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                      <button type="button" onClick={() => setStudentId(null)} className="mb-4 inline-flex items-center gap-2 text-sm font-black md:hidden"><ChevronLeft size={17} /> Back to students</button>
                      <div className="flex items-center gap-3">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-950 text-white"><UserRound size={21} /></span>
                        <div className="min-w-0"><h3 className="truncate text-xl font-black">{student.name}</h3><p className="truncate text-sm text-[var(--muted-blue)]">{student.mobile || student.email || "Student"}</p></div>
                      </div>

                      <div className="mt-5 grid gap-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--gold-dark)]">Batch</p>
                            <p className="mt-1 text-sm font-black">{batch.name}</p>
                          </div>
                          <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--gold-dark)]">Today</p>
                            <p className="mt-1 text-sm font-black">{marked[student.id]?.replace("_", " ") || "Not marked"}</p>
                          </div>
                          <div className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--gold-dark)]">Class Progress</p>
                            <p className="mt-1 text-sm font-black">{markedCount}/{batch.students.length} marked</p>
                          </div>
                        </div>
                        <label className="grid gap-2 text-sm font-black">Subject
                          <select value={subject} onChange={(event) => setSubject(event.target.value)} className="min-h-12 rounded-xl border border-[var(--border)] bg-white px-3">
                            {batch.subjects.map((item) => <option key={item} value={item}>{item}</option>)}
                          </select>
                        </label>
                        <div>
                          <p className="text-sm font-black">Attendance</p>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {statuses.map((item) => (
                              <button key={item.value} type="button" onClick={() => setStatus(item.value)} className={`min-h-12 rounded-xl border px-3 text-sm font-black ${status === item.value ? "border-slate-950 bg-slate-950 text-white" : "border-[var(--border)] bg-white"}`}>{item.label}</button>
                            ))}
                          </div>
                        </div>
                        <label className="grid gap-2 text-sm font-black">Remarks
                          <textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={3} placeholder="Optional note" className="resize-none rounded-xl border border-[var(--border)] px-3 py-3 text-sm font-normal outline-none focus:border-slate-950" />
                        </label>
                        <div className="flex items-center gap-2 rounded-xl bg-[var(--page-bg)] p-3 text-xs font-bold text-[var(--muted-blue)]"><Clock3 size={15} /> Date and time are recorded automatically: {new Date().toLocaleString()}</div>
                        {message ? <p className="rounded-xl border border-[var(--border)] bg-[var(--page-bg)] p-3 text-sm font-bold">{message}</p> : null}
                      </div>
                    </div>
                    <footer className="border-t border-[var(--border)] p-4 sm:p-5">
                      <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white disabled:opacity-60"><Check size={18} /> {saving ? "Saving..." : "Save Attendance"}</button>
                    </footer>
                  </>
                ) : (
                  <div className="grid flex-1 place-items-center p-6 text-center"><div><UserRound className="mx-auto h-8 w-8 text-[var(--gold-dark)]" /><h3 className="mt-3 text-xl font-black">Select a student</h3><p className="mt-2 text-sm text-[var(--muted-blue)]">Attendance controls will appear here.</p></div></div>
                )}
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
