"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, ClipboardCheck, Eye, EyeOff, FileQuestion, Settings2 } from "lucide-react";
import { DashboardError, DashboardSkeleton, RoleDashboardGuard, SectionHeader, StatCard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminPsychometricTests, useUpdateAdminPsychometricQuestion, useUpdateAdminPsychometricTest } from "@/hooks/use-psychometric";
import type { PsychometricQuestion, PsychometricTest } from "@/types/psychometric";

function value(form: HTMLFormElement, name: string) {
  return String(new FormData(form).get(name) ?? "");
}

function optionsFromText(valueText: string) {
  return valueText.split("\n").map((item) => item.trim()).filter(Boolean);
}

function TextArea({ label, name, defaultValue, rows = 4 }: { label: string; name: string; defaultValue?: string; rows?: number }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className="mt-2 w-full rounded border border-white/12 bg-white/6 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-muted/60 focus:border-gold focus:bg-white/10 focus:ring-2 focus:ring-gold/20"
      />
    </label>
  );
}

function SelectField({ label, name, defaultValue, children }: { label: string; name: string; defaultValue?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <select name={name} defaultValue={defaultValue} className="mt-2 h-12 w-full rounded border border-white/12 bg-navy px-3 text-sm text-white outline-none focus:border-gold">
        {children}
      </select>
    </label>
  );
}

export default function PsychometricAdminManagePage() {
  const tests = useAdminPsychometricTests();
  const updateTest = useUpdateAdminPsychometricTest();
  const updateQuestion = useUpdateAdminPsychometricQuestion();
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");

  const allTests = useMemo(() => tests.data ?? [], [tests.data]);
  const selectedTest = useMemo(() => allTests.find((test) => test.id === (selectedTestId || allTests[0]?.id)), [allTests, selectedTestId]);
  const selectedQuestion = selectedTest?.questions?.find((question) => question.id === selectedQuestionId) ?? selectedTest?.questions?.[0];
  const activeCount = allTests.filter((test) => test.isActive).length;
  const premiumCount = allTests.filter((test) => test.access === "PREMIUM").length;
  const totalQuestions = allTests.reduce((sum, test) => sum + (test._count?.questions ?? test.questions?.length ?? 0), 0);

  function submitTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTest) return;
    const form = event.currentTarget;
    updateTest.mutate({
      id: selectedTest.id,
      data: {
        title: value(form, "title"),
        description: value(form, "description"),
        duration: Number(value(form, "duration")),
        instructions: value(form, "instructions"),
        access: value(form, "access") as PsychometricTest["access"],
        category: value(form, "category"),
        isActive: value(form, "isActive") === "true"
      }
    });
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedQuestion) return;
    const form = event.currentTarget;
    updateQuestion.mutate({
      id: selectedQuestion.id,
      data: {
        questionText: value(form, "questionText"),
        questionType: value(form, "questionType"),
        order: Number(value(form, "order")),
        options: optionsFromText(value(form, "options"))
      }
    });
  }

  if (tests.isLoading) return <RoleDashboardGuard role={["ADMIN", "DIRECTOR"]}><DashboardSkeleton /></RoleDashboardGuard>;
  if (tests.error) return <RoleDashboardGuard role={["ADMIN", "DIRECTOR"]}><DashboardError error={tests.error} onRefresh={() => tests.refetch()} /></RoleDashboardGuard>;

  return (
    <RoleDashboardGuard role={["ADMIN", "DIRECTOR"]}>
      <div className="space-y-8">
        <section className="premium-surface rounded-lg p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Assessment Management</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-ink sm:text-4xl">Control psychometric tests, access, and question content.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                Manage active status, category, free/core/premium access, instructions, timing, and individual question choices without touching code.
              </p>
            </div>
            <Button href="/psychometric/admin" variant="secondary">Command View <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Assessments" value={String(allTests.length)} note={`${activeCount} active`} />
          <StatCard label="Questions" value={String(totalQuestions)} note="Managed question bank" />
          <StatCard label="Premium" value={String(premiumCount)} note="Subscription-gated tests" />
          <StatCard label="Categories" value={String(new Set(allTests.map((test) => test.category)).size)} note="Assessment groups" />
        </section>

        <section className="grid gap-5 lg:grid-cols-[20rem_1fr]">
          <aside className="space-y-3">
            <SectionHeader eyebrow="Catalog" title="Assessments" />
            {allTests.map((test) => (
              <button
                key={test.id}
                type="button"
                onClick={() => { setSelectedTestId(test.id); setSelectedQuestionId(""); }}
                className={`w-full rounded-lg border p-4 text-left transition hover:-translate-y-0.5 ${selectedTest?.id === test.id ? "border-gold/50 bg-gold/10" : "border-white/10 bg-white/[0.045]"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold leading-5 text-white">{test.title}</p>
                  {test.isActive ? <Eye className="h-4 w-4 text-gold" /> : <EyeOff className="h-4 w-4 text-muted" />}
                </div>
                <p className="mt-2 text-xs text-muted">{test.access} • {test.category ?? "GENERAL"}</p>
              </button>
            ))}
          </aside>

          {selectedTest ? (
            <main className="space-y-6">
              <SectionHeader eyebrow="Settings" title={selectedTest.title} action={`${selectedTest._count?.attempts ?? 0} attempts`} />
              <form onSubmit={submitTest} className="rounded-lg border border-white/10 bg-white/[0.055] p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input name="title" label="Title" defaultValue={selectedTest.title} required />
                  <Input name="duration" label="Duration minutes" type="number" min={5} max={180} defaultValue={selectedTest.duration} required />
                  <SelectField name="access" label="Access Tier" defaultValue={selectedTest.access ?? "CORE"}>
                    <option value="FREE">FREE</option>
                    <option value="CORE">CORE</option>
                    <option value="PREMIUM">PREMIUM</option>
                  </SelectField>
                  <SelectField name="isActive" label="Active Status" defaultValue={String(selectedTest.isActive ?? true)}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </SelectField>
                  <Input name="category" label="Category" defaultValue={selectedTest.category ?? "GENERAL"} required />
                  <Input label="Question Count" value={String(selectedTest._count?.questions ?? selectedTest.questions?.length ?? 0)} readOnly />
                  <div className="md:col-span-2">
                    <TextArea name="description" label="Description" defaultValue={selectedTest.description} />
                  </div>
                  <div className="md:col-span-2">
                    <TextArea name="instructions" label="Instructions" defaultValue={selectedTest.instructions} />
                  </div>
                </div>
                <div className="mt-5">
                  <Button type="submit" disabled={updateTest.isPending}>{updateTest.isPending ? "Saving..." : "Save Assessment Settings"}</Button>
                </div>
              </form>

              <section className="grid gap-5 lg:grid-cols-[18rem_1fr]">
                <div className="space-y-3">
                  <SectionHeader eyebrow="Questions" title="Question bank" />
                  {(selectedTest.questions ?? []).map((question) => (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setSelectedQuestionId(question.id)}
                      className={`w-full rounded border p-3 text-left text-sm transition hover:border-gold/40 ${selectedQuestion?.id === question.id ? "border-gold/50 bg-gold/10 text-gold-soft" : "border-white/10 bg-white/[0.035] text-white"}`}
                    >
                      <span className="flex items-center gap-2"><FileQuestion className="h-4 w-4" /> Q{question.order}</span>
                      <span className="mt-2 line-clamp-2 block text-xs leading-5 text-muted">{question.questionText}</span>
                    </button>
                  ))}
                </div>

                {selectedQuestion ? (
                  <form key={selectedQuestion.id} onSubmit={submitQuestion} className="rounded-lg border border-white/10 bg-white/[0.055] p-5">
                    <div className="flex items-center gap-3">
                      <Settings2 className="h-5 w-5 text-gold" />
                      <h2 className="text-lg font-semibold text-white">Edit Question {selectedQuestion.order}</h2>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <Input name="order" label="Order" type="number" min={1} defaultValue={selectedQuestion.order} required />
                      <Input name="questionType" label="Question Type" defaultValue={selectedQuestion.questionType} required />
                      <div className="md:col-span-2">
                        <TextArea name="questionText" label="Question Text" defaultValue={selectedQuestion.questionText} rows={5} />
                      </div>
                      <div className="md:col-span-2">
                        <TextArea
                          name="options"
                          label="Answer Options (one per line)"
                          defaultValue={(Array.isArray(selectedQuestion.options) ? selectedQuestion.options : []).join("\n")}
                          rows={8}
                        />
                      </div>
                    </div>
                    <div className="mt-5">
                      <Button type="submit" disabled={updateQuestion.isPending}>{updateQuestion.isPending ? "Saving..." : "Save Question"}</Button>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 text-sm text-muted">Select a question to edit it.</div>
                )}
              </section>

              <div className="rounded-lg border border-gold/20 bg-gold/10 p-4 text-sm leading-7 text-gold-soft">
                Changes to questions and scoring affect future reports. Completed reports with snapshots remain stable.
              </div>
            </main>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.055] p-5 text-sm text-muted">No assessments found.</div>
          )}
        </section>
      </div>
    </RoleDashboardGuard>
  );
}
