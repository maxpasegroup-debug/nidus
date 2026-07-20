"use client";

import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/services/api";
import { changeTopRankPassword, getTopRankMe, updateTopRankContact } from "@/services/toprank-auth-service";
import { getTopRankOnboardingStatus, saveTopRankProfile } from "@/services/toprank-enrollment-service";
import type { TopRankStudentProfile, TopRankUser } from "@/types/toprank";
import { EnrollmentCard, ProfileForm, ProfileSummary } from "./toprank-components";

const inputClass = "min-h-12 rounded-xl border border-white/12 bg-[#06120e] px-4 text-white outline-none focus:border-[#d6a447]";

export function TopRankProfileClient() {
  const [user, setUser] = useState<TopRankUser | null>(null);
  const [profile, setProfile] = useState<TopRankStudentProfile>({});
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getTopRankMe(), getTopRankOnboardingStatus()])
      .then(([me, status]) => {
        setUser(me.user);
        setProfile(status.profile ?? {});
      })
      .catch((err) => setError(getApiErrorMessage(err)));
  }, []);

  async function saveProfile() {
    setError("");
    setNotice("");
    try {
      const result = await saveTopRankProfile(profile);
      setProfile(result.profile);
      setNotice("Profile updated successfully.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function saveContact() {
    setError("");
    setNotice("");
    try {
      if (!user) return;
      const result = await updateTopRankContact({ name: user.name, phone: user.phone, state: String(user.metadata?.state ?? ""), district: String(user.metadata?.district ?? ""), language: String(user.metadata?.language ?? "") });
      setUser(result.user);
      setNotice("Contact information updated.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function savePassword() {
    setError("");
    setNotice("");
    try {
      const result = await changeTopRankPassword(passwords);
      setNotice(result.message);
      setPasswords({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      {error ? <p className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm font-bold text-red-100">{error}</p> : null}
      {notice ? <p className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-100">{notice}</p> : null}
      <ProfileSummary user={user} profile={profile} />
      <EnrollmentCard title="Edit Digital Profile" description="Keep your TopRank preparation profile accurate for onboarding and future training systems.">
        <ProfileForm profile={profile} onChange={setProfile} />
        <button type="button" onClick={() => void saveProfile()} className="mt-5 min-h-12 rounded-full bg-[#d6a447] px-6 text-sm font-black text-[#06120e]">Save Profile</button>
      </EnrollmentCard>
      <EnrollmentCard title="Contact Information" description="Update your TopRank account contact details.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Name<input value={user?.name ?? ""} onChange={(event) => setUser((state) => state ? { ...state, name: event.target.value } : state)} className={inputClass} /></label>
          <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Mobile<input value={user?.phone ?? ""} onChange={(event) => setUser((state) => state ? { ...state, phone: event.target.value } : state)} className={inputClass} /></label>
        </div>
        <button type="button" onClick={() => void saveContact()} className="mt-5 min-h-12 rounded-full bg-[#d6a447] px-6 text-sm font-black text-[#06120e]">Update Contact</button>
      </EnrollmentCard>
      <EnrollmentCard title="Change Password" description="Use a strong password with letters and numbers.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">Current Password<input type="password" value={passwords.currentPassword} onChange={(event) => setPasswords((state) => ({ ...state, currentPassword: event.target.value }))} className={inputClass} /></label>
          <label className="grid gap-2 text-sm font-bold text-[#d9dccf]">New Password<input type="password" value={passwords.newPassword} onChange={(event) => setPasswords((state) => ({ ...state, newPassword: event.target.value }))} className={inputClass} /></label>
        </div>
        <button type="button" onClick={() => void savePassword()} className="mt-5 min-h-12 rounded-full bg-[#d6a447] px-6 text-sm font-black text-[#06120e]">Change Password</button>
      </EnrollmentCard>
    </div>
  );
}

