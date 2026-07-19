"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, KeyRound } from "lucide-react";
import { RoleDashboardGuard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import { changePin, updateProfilePhoto } from "@/services/auth.v2";
import { useAuth } from "@/components/providers/auth-provider-v2";

export default function DashboardSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, refreshUser } = useAuth();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    setMustChangePassword(new URLSearchParams(window.location.search).get("mustChangePassword") === "1");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin)) {
      showToast("PIN must be exactly 4 digits", "error");
      return;
    }
    if (newPin !== confirmPin) {
      showToast("New PINs do not match", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await changePin({ currentPin, newPin });
      showToast(response.message ?? "PIN changed successfully", "success");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      router.replace("/login");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function uploadPhoto(file?: File) {
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const response = await updateProfilePhoto(file);
      await refreshUser();
      showToast(response.message ?? "Profile photo updated", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  return (
    <RoleDashboardGuard role={["ADMIN", "DIRECTOR", "ACADEMIC_HEAD", "TEACHER", "PHYSICAL_TRAINER", "STUDENT", "PARENT", "TELECALLER", "MARKETING_COORDINATOR", "BUSINESS_DEVELOPMENT_EXECUTIVE", "ADMINISTRATIVE_OFFICER", "GUEST"]}>
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl space-y-6">
          <div className="premium-surface rounded-lg p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 overflow-hidden rounded-full border border-gold/30 bg-gold/10 text-2xl font-semibold text-gold-soft">
                  {user?.imageUrl ? <span className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${user.imageUrl})` }} /> : <span className="m-auto">{user?.name?.slice(0, 1).toUpperCase() ?? "N"}</span>}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-gold-soft">Profile Photo</p>
                  <h1 className="mt-2 text-2xl font-semibold text-ink">{user?.name ?? "My Profile"}</h1>
                  <p className="mt-1 text-sm text-muted">{user?.mobile ?? "Mobile pending"} is your login number.</p>
                </div>
              </div>
              <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded bg-gold px-5 text-sm font-semibold text-navy-deep">
                <Camera className="h-4 w-4" />
                {isUploadingPhoto ? "Uploading..." : "Upload Photo"}
                <input className="sr-only" type="file" accept="image/*" disabled={isUploadingPhoto} onChange={(event) => void uploadPhoto(event.target.files?.[0])} />
              </label>
            </div>
          </div>
          <div className="premium-surface rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="rounded bg-gold/15 p-3 text-gold-soft">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-gold-soft">Account Security</p>
                <h1 className="mt-2 text-3xl font-semibold text-ink">Change PIN</h1>
              </div>
            </div>

            {mustChangePassword ? (
              <div className="mt-6 rounded border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold-soft">
                This account is using the default PIN. Change it now to continue using the platform securely.
              </div>
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={submit}>
              <PasswordInput label="Current PIN" value={currentPin} onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, "").slice(0, 4))} minLength={4} maxLength={4} inputMode="numeric" required />
              <PasswordInput label="New 4 Digit PIN" value={newPin} onChange={(event) => setNewPin(event.target.value.replace(/\D/g, "").slice(0, 4))} minLength={4} maxLength={4} inputMode="numeric" required />
              <PasswordInput label="Confirm New PIN" value={confirmPin} onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 4))} minLength={4} maxLength={4} inputMode="numeric" required />
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Updating..." : "Update PIN"}</Button>
            </form>
          </div>
        </section>
      </main>
    </RoleDashboardGuard>
  );
}
