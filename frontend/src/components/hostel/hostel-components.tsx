"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { ShieldCheck, Star, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DisciplineRecord, Hostel, HostelLeave, ParadePerformance, Room } from "@/types/hostel";

export function EmptyState({ title, note }: { title: string; note: string }) {
  return <Card className="p-6 text-center text-sm text-muted"><p className="text-base font-semibold text-ink">{title}</p><p className="mt-2">{note}</p></Card>;
}

export function LoadingSkeleton() {
  return <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-lg border border-white/10 bg-white/8" />)}</div>;
}

export function HostelCard({ hostel }: { hostel: Hostel }) {
  const rooms = hostel.rooms ?? [];
  const beds = rooms.reduce((sum, room) => sum + room.capacity, 0);
  const occupied = rooms.reduce((sum, room) => sum + room.occupiedCount, 0);
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs uppercase tracking-[0.2em] text-gold">{hostel.type}</p><h3 className="mt-2 text-xl font-bold text-white">{hostel.name}</h3></div>
          <ShieldCheck className="h-8 w-8 text-gold" />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <span><b className="block text-lg text-white">{hostel.totalRooms}</b><span className="text-muted">Rooms</span></span>
          <span><b className="block text-lg text-white">{occupied}</b><span className="text-muted">Cadets</span></span>
          <span><b className="block text-lg text-white">{beds}</b><span className="text-muted">Beds</span></span>
        </div>
        <p className="mt-4 border-t border-white/10 pt-4 text-sm text-muted">Warden: <span className="text-ink">{hostel.wardenName}</span></p>
      </Card>
    </motion.div>
  );
}

export function RoomCard({ room }: { room: Room }) {
  const percent = Math.round((room.occupiedCount / room.capacity) * 100);
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between"><h3 className="text-lg font-bold text-white">Room {room.roomNumber}</h3><span className="rounded border border-gold/30 px-2 py-1 text-xs text-gold">{room.status}</span></div>
      <p className="mt-1 text-sm text-muted">Floor {room.floor} - {room.hostel?.name ?? "Hostel block"}</p>
      <div className="mt-5 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gold" style={{ width: `${Math.min(percent, 100)}%` }} /></div>
      <p className="mt-3 text-sm text-ink">{room.occupiedCount}/{room.capacity} occupied</p>
    </Card>
  );
}

export function LeaveRequestCard({ leave, onApprove, onReject }: { leave: HostelLeave; onApprove?: () => void; onReject?: () => void }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="font-bold text-white">{leave.student?.name ?? leave.studentId}</h3><p className="text-sm text-muted">{new Date(leave.fromDate).toLocaleDateString()} to {new Date(leave.toDate).toLocaleDateString()}</p></div>
        <DisciplineBadge severity={leave.status} />
      </div>
      <p className="mt-4 text-sm text-ink">{leave.reason}</p>
      {onApprove && onReject ? <div className="mt-4 flex gap-2"><button className="rounded border border-emerald-400/40 px-3 py-2 text-sm text-emerald-100" onClick={onApprove}>Approve</button><button className="rounded border border-red-400/40 px-3 py-2 text-sm text-red-100" onClick={onReject}>Reject</button></div> : null}
    </Card>
  );
}

export function DisciplineBadge({ severity }: { severity: string }) {
  const tone = severity === "CRITICAL" || severity === "REJECTED" ? "border-red-400/40 bg-red-400/15 text-red-100" : severity === "HIGH" || severity === "PENDING" ? "border-amber-300/40 bg-amber-300/15 text-amber-100" : "border-emerald-300/40 bg-emerald-300/15 text-emerald-100";
  return <span className={`rounded border px-2 py-1 text-xs font-semibold ${tone}`}>{severity}</span>;
}

export function ParadeScoreCard({ item }: { item: ParadePerformance }) {
  const average = Math.round((item.attendance + item.discipline + item.leadership + item.fitness) / 4);
  const scores = [
    { label: "attendance", value: item.attendance },
    { label: "discipline", value: item.discipline },
    { label: "leadership", value: item.leadership },
    { label: "fitness", value: item.fitness }
  ];
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between"><h3 className="font-bold text-white">{item.student?.name ?? item.studentId}</h3><Star className="h-5 w-5 text-gold" /></div>
      <p className="mt-1 text-sm text-muted">{new Date(item.createdAt).toLocaleDateString()}</p>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs text-muted">{scores.map((score) => <span key={score.label}><b className="block text-base text-white">{score.value}</b>{score.label}</span>)}</div>
      <p className="mt-4 text-sm text-gold">Overall {average}%</p>
    </Card>
  );
}

export function OccupancyChart({ rooms }: { rooms: Room[] }) {
  const [mounted, setMounted] = useState(false);
  const occupied = rooms.reduce((sum, room) => sum + room.occupiedCount, 0);
  const available = rooms.reduce((sum, room) => sum + Math.max(room.capacity - room.occupiedCount, 0), 0);
  const data = [{ name: "Occupied", value: occupied }, { name: "Available", value: available }];
  useEffect(() => setMounted(true), []);
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2"><Users className="h-5 w-5 text-gold" /><h3 className="font-bold text-white">Occupancy Analytics</h3></div>
      <div className="mt-4 h-56">
        {mounted ? <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={224}>
          <PieChart><Pie data={data} dataKey="value" innerRadius={55} outerRadius={82} paddingAngle={4}>{data.map((entry, index) => <Cell key={entry.name} fill={index === 0 ? "#c9a646" : "#2dd4bf"} />)}</Pie></PieChart>
        </ResponsiveContainer> : <div className="h-full animate-pulse rounded-lg bg-white/8" />}
      </div>
      <p className="text-center text-sm text-muted">{occupied} occupied - {available} available</p>
    </Card>
  );
}

export function DisciplineRecordCard({ item }: { item: DisciplineRecord }) {
  return <Card className="p-5"><div className="flex justify-between gap-3"><h3 className="font-bold text-white">{item.category}</h3><DisciplineBadge severity={item.severity} /></div><p className="mt-3 text-sm text-ink">{item.description}</p><p className="mt-3 text-xs text-muted">Action: {item.actionTaken}</p></Card>;
}
