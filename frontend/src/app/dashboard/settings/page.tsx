"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { RoleDashboardGuard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import { changePassword } from "@/services/auth.v2";

export default function DashboardSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    setMustChangePassword(new URLSearchParams(window.location.search).get("mustChangePassword") === "1");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await changePassword({ currentPassword, newPassword });
      showToast(response.message ?? "Password changed successfully", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.replace("/login");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RoleDashboardGuard role={["ADMIN", "DIRECTOR", "TEACHER", "STUDENT", "PARENT", "TELECALLER", "MARKETING_COORDINATOR", "GUEST"]}>
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl space-y-6">
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

            {mustChangePassword ? (
              <div className="mt-6 rounded border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold-soft">
                This account is using a default password. Change it now to continue using the platform securely.
              </div>
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={submit}>
              <PasswordInput label="Current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
              <PasswordInput label="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} required />
              <PasswordInput label="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required />
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Updating..." : "Update Password"}</Button>
            </form>
          </div>
        </section>
      </main>
    </RoleDashboardGuard>
  );
}
