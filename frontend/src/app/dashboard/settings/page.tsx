"use client";

import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { RoleDashboardGuard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import { changePassword } from "@/services/auth";

export default function DashboardSettingsPage() {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await changePassword({ currentPassword, newPassword });
      showToast(response.message, "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RoleDashboardGuard role={["ADMIN", "DIRECTOR", "TEACHER", "STUDENT", "PARENT", "TELECALLER", "MARKETING_COORDINATOR", "GUEST"]}>
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl">
          <div className="premium-surface rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="rounded bg-gold/15 p-3 text-gold-soft">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-gold-soft">Account Security</p>
                <h1 className="mt-2 text-3xl font-semibold text-ink">Change Password</h1>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={submit}>
              <Input label="Current password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
              <Input label="New password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} required />
              <Input label="Confirm new password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required />
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Updating..." : "Update Password"}</Button>
            </form>
          </div>
        </section>
      </main>
    </RoleDashboardGuard>
  );
}
