"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, ClipboardCheck, DoorOpen, Hotel, Salad, Search, ShieldAlert } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { DisciplineRecordCard, EmptyState, HostelCard, LeaveRequestCard, LoadingSkeleton, OccupancyChart, ParadeScoreCard, RoomCard } from "@/components/hostel/hostel-components";
import { useAllocations, useDiscipline, useHostelLeave, useHostels, useInOut, useMessMenu, useParadePerformance, useRooms } from "@/hooks/use-hostel";

type ConsoleView = "dashboard" | "rooms" | "allocations" | "inout" | "leave" | "mess" | "discipline" | "parade";

const links = [
  ["/hostel", "Dashboard", Hotel],
  ["/hostel/rooms", "Rooms", DoorOpen],
  ["/hostel/allocations", "Allocations", ClipboardCheck],
  ["/hostel/inout", "In/Out", Activity],
  ["/hostel/leave", "Leave", Search],
  ["/mess-menu", "Mess", Salad],
  ["/discipline", "Discipline", ShieldAlert],
  ["/parade-performance", "Parade", ClipboardCheck]
] as const;

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

function SubmitButton({ label, busy }: { label: string; busy: boolean }) {
  return <Button type="submit" size="sm" disabled={busy}>{busy ? "Saving..." : label}</Button>;
}

export function HostelConsole({ view }: { view: ConsoleView }) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const studentId = user?.id ?? "";
  const [lookupId, setLookupId] = useState(studentId);
  const hostels = useHostels();
  const rooms = useRooms();
  const allocations = useAllocations();
  const inout = useInOut(lookupId || undefined);
  const leave = useHostelLeave();
  const mess = useMessMenu();
  const discipline = useDiscipline(lookupId || undefined);
  const parade = useParadePerformance(lookupId || undefined);
  const roomData = rooms.data ?? [];
  const hostelData = hostels.data ?? [];
  const leaveData = leave.data ?? [];
  const messData = mess.data ?? [];
  const inoutData = inout.data ?? [];
  const disciplineData = discipline.data ?? [];
  const paradeData = parade.data ?? [];
  const occupied = roomData.reduce((sum, room) => sum + room.occupiedCount, 0);
  const capacity = roomData.reduce((sum, room) => sum + room.capacity, 0);
  const occupancy = capacity ? Math.round((occupied / capacity) * 100) : 0;

  useEffect(() => setMounted(true), []);

  function formValue(form: HTMLFormElement, name: string) {
    return String(new FormData(form).get(name) ?? "");
  }

  return (
    <motion.div className="space-y-7" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">NIDUS Residence Command</p>
          <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">Hostel & Discipline Management</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Structured academy operations for rooms, movement, leave, mess, conduct and parade readiness.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {links.map(([href, label, Icon]) => <Link key={href} href={href} className="inline-flex h-10 items-center gap-2 rounded border border-white/10 px-3 text-sm text-ink transition hover:border-gold/50 hover:text-gold"><Icon className="h-4 w-4" />{label}</Link>)}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="p-5"><p className="text-sm text-muted">Occupancy</p><b className="mt-2 block text-3xl text-white">{occupancy}%</b></Card>
        <Card className="p-5"><p className="text-sm text-muted">Available Beds</p><b className="mt-2 block text-3xl text-white">{Math.max(capacity - occupied, 0)}</b></Card>
        <Card className="p-5"><p className="text-sm text-muted">Leave Pending</p><b className="mt-2 block text-3xl text-white">{leaveData.filter((item) => item.status === "PENDING").length}</b></Card>
        <Card className="p-5"><p className="text-sm text-muted">Discipline Alerts</p><b className="mt-2 block text-3xl text-white">{disciplineData.filter((item) => ["HIGH", "CRITICAL"].includes(item.severity)).length}</b></Card>
      </section>

      {view === "dashboard" ? (
        <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <div className="grid gap-4 md:grid-cols-2">{hostels.isLoading ? <LoadingSkeleton /> : hostelData.map((hostel) => <HostelCard key={hostel.id} hostel={hostel} />)}</div>
          <OccupancyChart rooms={roomData} />
        </section>
      ) : null}

      {view === "rooms" ? (
        <section className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-4 text-xl font-bold text-white">Add Room</h2>
            <form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; rooms.create.mutate({ hostelId: formValue(form, "hostelId"), roomNumber: formValue(form, "roomNumber"), floor: Number(formValue(form, "floor")), capacity: Number(formValue(form, "capacity")) }); form.reset(); }}>
              <FieldGrid><Input name="hostelId" label="Hostel ID" required /><Input name="roomNumber" label="Room Number" required /><Input name="floor" label="Floor" type="number" required /><Input name="capacity" label="Capacity" type="number" required /></FieldGrid>
              <div className="mt-4"><SubmitButton label="Create Room" busy={rooms.create.isPending} /></div>
            </form>
          </Card>
          <div className="grid gap-4 md:grid-cols-3">{roomData.length ? roomData.map((room) => <RoomCard key={room.id} room={room} />) : <EmptyState title="No rooms yet" note="Create hostel rooms to begin occupancy tracking." />}</div>
        </section>
      ) : null}

      {view === "allocations" ? (
        <Card className="p-5">
          <h2 className="mb-4 text-xl font-bold text-white">Allocation Management</h2>
          <form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; allocations.allocate.mutate({ studentId: formValue(form, "studentId"), hostelId: formValue(form, "hostelId"), roomId: formValue(form, "roomId") }); }}>
            <FieldGrid><Input name="studentId" label="Student ID" required /><Input name="hostelId" label="Hostel ID" required /><Input name="roomId" label="Room ID" required /></FieldGrid>
            <div className="mt-4"><SubmitButton label="Allocate Cadet" busy={allocations.allocate.isPending} /></div>
          </form>
        </Card>
      ) : null}

      {view === "inout" ? (
        <section className="space-y-4">
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Student Movement Tracking</h2><Input label="Search Student ID" value={lookupId} onChange={(event) => setLookupId(event.target.value)} /></Card>
          <Card className="p-5">
            <form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; inout.create.mutate({ studentId: formValue(form, "studentId"), type: formValue(form, "type") as "IN" | "OUT", remarks: formValue(form, "remarks") }); }}>
              <FieldGrid><Input name="studentId" label="Student ID" defaultValue={studentId} required /><Input name="type" label="Type IN/OUT" required /><Input name="remarks" label="Remarks" /></FieldGrid>
              <div className="mt-4"><SubmitButton label="Log Movement" busy={inout.create.isPending} /></div>
            </form>
          </Card>
          <div className="grid gap-3">{inoutData.map((entry) => <Card key={entry.id} className="p-4 text-sm text-ink">{entry.type} · {entry.student?.name ?? entry.studentId} · {new Date(entry.entryTime).toLocaleString()} · {entry.remarks ?? "No remarks"}</Card>)}</div>
        </section>
      ) : null}

      {view === "leave" ? (
        <section className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-4 text-xl font-bold text-white">Leave Requests</h2>
            <form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; leave.create.mutate({ studentId: formValue(form, "studentId"), reason: formValue(form, "reason"), fromDate: formValue(form, "fromDate"), toDate: formValue(form, "toDate") }); }}>
              <FieldGrid><Input name="studentId" label="Student ID" defaultValue={studentId} required /><Input name="reason" label="Reason" required /><Input name="fromDate" label="From Date" type="date" required /><Input name="toDate" label="To Date" type="date" required /></FieldGrid>
              <div className="mt-4"><SubmitButton label="Submit Leave" busy={leave.create.isPending} /></div>
            </form>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">{leaveData.map((item) => <LeaveRequestCard key={item.id} leave={item} onApprove={() => leave.update.mutate({ id: item.id, status: "APPROVED" })} onReject={() => leave.update.mutate({ id: item.id, status: "REJECTED" })} />)}</div>
        </section>
      ) : null}

      {view === "mess" ? (
        <section className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-4 text-xl font-bold text-white">Weekly Mess Menu</h2>
            <form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; mess.create.mutate({ date: formValue(form, "date"), breakfast: formValue(form, "breakfast"), lunch: formValue(form, "lunch"), snacks: formValue(form, "snacks"), dinner: formValue(form, "dinner") }); }}>
              <FieldGrid><Input name="date" label="Date" type="date" required /><Input name="breakfast" label="Breakfast" required /><Input name="lunch" label="Lunch" required /><Input name="snacks" label="Snacks" required /><Input name="dinner" label="Dinner" required /></FieldGrid>
              <div className="mt-4"><SubmitButton label="Save Menu" busy={mess.create.isPending} /></div>
            </form>
          </Card>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{messData.map((item) => <Card key={item.id} className="p-5"><h3 className="font-bold text-gold">{new Date(item.date).toLocaleDateString()}</h3><p className="mt-3 text-sm text-ink">Breakfast: {item.breakfast}</p><p className="text-sm text-ink">Lunch: {item.lunch}</p><p className="text-sm text-ink">Snacks: {item.snacks}</p><p className="text-sm text-ink">Dinner: {item.dinner}</p></Card>)}</div>
        </section>
      ) : null}

      {view === "discipline" ? (
        <section className="space-y-4">
          <Card className="p-5"><Input label="Student ID" value={lookupId} onChange={(event) => setLookupId(event.target.value)} /></Card>
          <Card className="p-5">
            <h2 className="mb-4 text-xl font-bold text-white">Record Discipline</h2>
            <form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; discipline.create.mutate({ studentId: formValue(form, "studentId"), category: formValue(form, "category"), description: formValue(form, "description"), severity: formValue(form, "severity"), actionTaken: formValue(form, "actionTaken") }); }}>
              <FieldGrid><Input name="studentId" label="Student ID" defaultValue={lookupId} required /><Input name="category" label="Category" required /><Input name="severity" label="Severity" placeholder="LOW/MEDIUM/HIGH/CRITICAL" required /><Input name="actionTaken" label="Action Taken" required /><Input name="description" label="Description" required /></FieldGrid>
              <div className="mt-4"><SubmitButton label="Add Record" busy={discipline.create.isPending} /></div>
            </form>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">{disciplineData.map((item) => <DisciplineRecordCard key={item.id} item={item} />)}</div>
        </section>
      ) : null}

      {view === "parade" ? (
        <section className="space-y-4">
          <Card className="p-5"><Input label="Student ID" value={lookupId} onChange={(event) => setLookupId(event.target.value)} /></Card>
          <Card className="p-5">
            <h2 className="mb-4 text-xl font-bold text-white">Parade Performance</h2>
            <form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; parade.create.mutate({ studentId: formValue(form, "studentId"), attendance: Number(formValue(form, "attendance")), discipline: Number(formValue(form, "discipline")), leadership: Number(formValue(form, "leadership")), fitness: Number(formValue(form, "fitness")), remarks: formValue(form, "remarks") }); }}>
              <FieldGrid><Input name="studentId" label="Student ID" defaultValue={lookupId} required /><Input name="attendance" label="Attendance" type="number" required /><Input name="discipline" label="Discipline" type="number" required /><Input name="leadership" label="Leadership" type="number" required /><Input name="fitness" label="Fitness" type="number" required /><Input name="remarks" label="Remarks" /></FieldGrid>
              <div className="mt-4"><SubmitButton label="Record Scores" busy={parade.create.isPending} /></div>
            </form>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">{paradeData.map((item) => <ParadeScoreCard key={item.id} item={item} />)}</div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5"><h3 className="mb-4 font-bold text-white">Leave Trends</h3><div className="h-56">{mounted ? <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={224}><BarChart data={leaveData.map((item) => ({ label: item.status, value: 1 }))}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="label" stroke="#9fb0c7" /><YAxis stroke="#9fb0c7" allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#c9a646" /></BarChart></ResponsiveContainer> : <div className="h-full animate-pulse rounded-lg bg-white/8" />}</div></Card>
        <Card className="p-5"><h3 className="mb-4 font-bold text-white">Discipline Score Trends</h3><div className="h-56">{mounted ? <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={224}><LineChart data={paradeData.map((item, index) => ({ label: index + 1, score: item.discipline }))}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="label" stroke="#9fb0c7" /><YAxis stroke="#9fb0c7" /><Tooltip /><Line type="monotone" dataKey="score" stroke="#f2d675" strokeWidth={3} /></LineChart></ResponsiveContainer> : <div className="h-full animate-pulse rounded-lg bg-white/8" />}</div></Card>
      </section>
    </motion.div>
  );
}
