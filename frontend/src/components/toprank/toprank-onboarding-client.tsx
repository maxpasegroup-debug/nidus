"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/services/api";
import { acceptTopRankAgreement, completeTopRankEnrollment, getTopRankBatches, getTopRankOnboardingStatus, saveTopRankProfile, selectTopRankBatch } from "@/services/toprank-enrollment-service";
import type { TopRankBatch, TopRankOnboardingStatus, TopRankStudentProfile } from "@/types/toprank";
import { AgreementCard, BatchCard, EnrollmentCard, ProfileForm, Stepper } from "./toprank-components";

const steps = ["Welcome", "Program", "Profile", "Batch", "Terms", "Confirm"];

export function TopRankOnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<TopRankOnboardingStatus | null>(null);
  const [profile, setProfile] = useState<TopRankStudentProfile>({});
  const [batches, setBatches] = useState<TopRankBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [agreement, setAgreement] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([getTopRankOnboardingStatus(), getTopRankBatches()])
      .then(([nextStatus, batchResult]) => {
        setStatus(nextStatus);
        setProfile(nextStatus.profile ?? {});
        setSelectedBatchId(nextStatus.selectedBatch?.id ?? "");
        setAgreement(Boolean(nextStatus.agreement?.accepted));
        setBatches(batchResult.batches);
      })
      .catch((err) => setError(getApiErrorMessage(err)));
  }, []);

  const selectedBatch = useMemo(() => batches.find((batch) => batch.id === selectedBatchId) ?? status?.selectedBatch ?? null, [batches, selectedBatchId, status]);

  async function next() {
    setBusy(true);
    setError("");
    try {
      if (step === 2) await saveTopRankProfile(profile);
      if (step === 3) {
        if (!selectedBatchId) throw new Error("Choose your TopRank batch to continue");
        await selectTopRankBatch(selectedBatchId);
      }
      if (step === 4) {
        if (!agreement) throw new Error("Accept the program agreement to continue");
        await acceptTopRankAgreement();
      }
      if (step === 5) {
        await completeTopRankEnrollment();
        router.push("/toprank/welcome");
        return;
      }
      setStep((value) => Math.min(value + 1, steps.length - 1));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Stepper steps={steps} currentStep={step} />
      {error ? <p className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-100">{error}</p> : null}
      <div className="mt-8">
        {step === 0 ? (
          <EnrollmentCard title="Welcome to TopRank onboarding" description="Your account verification is prepared as a placeholder for RC3. Complete the foundation steps to enter the Command Center.">
            <p className="text-sm leading-7 text-[#c9d0c2]">The onboarding flow records your profile, batch preference, agreement acceptance and enrollment status.</p>
          </EnrollmentCard>
        ) : null}
        {step === 1 ? (
          <EnrollmentCard title="Agniveer Program Overview" description="6 Month AI Powered TopRank Training Program for structured Agniveer preparation. AI features arrive in later releases.">
            <div className="grid gap-4 md:grid-cols-3">
              {["Academic foundation", "Physical preparation", "Mentor-led discipline"].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm font-bold text-white">{item}</div>)}
            </div>
          </EnrollmentCard>
        ) : null}
        {step === 2 ? (
          <EnrollmentCard title="Digital Profile" description="This profile helps TopRank understand your current preparation level before training begins.">
            <ProfileForm profile={profile} onChange={setProfile} />
          </EnrollmentCard>
        ) : null}
        {step === 3 ? (
          <EnrollmentCard title="Batch Selection" description="Choose one of the available Agniveer TopRank batches.">
            <div className="grid gap-4 md:grid-cols-2">
              {batches.map((batch) => <BatchCard key={batch.id} batch={batch} selected={selectedBatchId === batch.id} onSelect={setSelectedBatchId} />)}
            </div>
          </EnrollmentCard>
        ) : null}
        {step === 4 ? (
          <EnrollmentCard title="Program Agreement" description="Review and digitally accept the program rules before confirmation.">
            <AgreementCard checked={agreement} onCheckedChange={setAgreement} />
          </EnrollmentCard>
        ) : null}
        {step === 5 ? (
          <EnrollmentCard title="Confirmation" description="Your onboarding is ready to complete.">
            <div className="grid gap-3 text-sm font-bold text-[#dbe4d7]">
              <p>Selected batch: {selectedBatch?.name ?? "Batch selection pending"}</p>
              <p>Profile completion: {profile.completionPercentage ?? status?.profile?.completionPercentage ?? 0}%</p>
              <p>Agreement: {agreement ? "Accepted" : "Pending"}</p>
            </div>
          </EnrollmentCard>
        ) : null}
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={() => setStep((value) => Math.max(value - 1, 0))} className="min-h-12 rounded-full border border-white/12 px-6 text-sm font-bold text-white">Back</button>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/toprank/gateway/agniveer/orientation" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/12 px-6 text-sm font-bold text-white">Watch Orientation</Link>
          <button type="button" onClick={() => void next()} disabled={busy} className="min-h-12 rounded-full bg-[#d6a447] px-6 text-sm font-black text-[#06120e] disabled:opacity-60">{step === 5 ? "Complete Enrollment" : busy ? "Saving" : "Continue"}</button>
        </div>
      </div>
    </div>
  );
}

