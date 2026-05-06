import { prisma } from "../../config/prisma.js";
import type { CounsellingMode, LeadStatus } from "../../generated/prisma/client.js";
import { crmNotificationService } from "./crm-notification.service.js";

const userSelect = { id: true, name: true, email: true, mobile: true, role: true } as const;
const leadInclude = { assignee: { select: userSelect }, followUps: { orderBy: { followUpDate: "asc" as const }, take: 3 } } as const;

export const crmService = {
  leads(filters: { status?: LeadStatus; search?: string }) {
    return prisma.lead.findMany({
      where: {
        status: filters.status,
        OR: filters.search ? [
          { fullName: { contains: filters.search, mode: "insensitive" } },
          { mobile: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
          { targetExam: { contains: filters.search, mode: "insensitive" } }
        ] : undefined
      },
      orderBy: { createdAt: "desc" },
      include: leadInclude
    });
  },
  createLead(input: { fullName: string; mobile: string; email: string; targetExam: string; source: string; status?: LeadStatus; assignedTo?: string; notes?: string }) {
    return prisma.lead.create({ data: { ...input, status: input.status ?? "NEW" }, include: leadInclude });
  },
  updateLead(id: string, input: Partial<{ fullName: string; mobile: string; email: string; targetExam: string; source: string; status: LeadStatus; assignedTo: string | null; notes: string }>) {
    return prisma.lead.update({ where: { id }, data: input, include: leadInclude });
  },
  async deleteLead(id: string) {
    await prisma.lead.delete({ where: { id } });
    return { message: "Lead deleted successfully" };
  },
  async createFollowUp(input: { leadId: string; followUpDate: string; remarks: string; status: string }, createdBy: string) {
    const followUp = await prisma.followUp.create({
      data: { ...input, followUpDate: new Date(input.followUpDate), createdBy },
      include: { lead: true, creator: { select: userSelect } }
    });
    await crmNotificationService.scheduleAutomatedNotification({
      recipient: followUp.lead.mobile,
      message: `Follow-up scheduled for ${followUp.lead.fullName}`,
      context: { followUpId: followUp.id, leadId: followUp.leadId }
    });
    return followUp;
  },
  followUps() {
    return prisma.followUp.findMany({ orderBy: { followUpDate: "asc" }, include: { lead: true, creator: { select: userSelect } } });
  },
  admissions() {
    return prisma.admission.findMany({ orderBy: { admissionDate: "desc" }, include: { student: { select: userSelect }, course: true } });
  },
  createAdmission(input: { studentId: string; courseId: string; admissionDate: string; paymentStatus: string; batch: string }) {
    return prisma.admission.create({
      data: { ...input, admissionDate: new Date(input.admissionDate) },
      include: { student: { select: userSelect }, course: true }
    });
  },
  counselling() {
    return prisma.counsellingBooking.findMany({ orderBy: { bookingDate: "asc" }, include: { lead: true } });
  },
  async createCounselling(input: { leadId: string; counsellorName: string; bookingDate: string; mode: CounsellingMode; status: string }) {
    const booking = await prisma.counsellingBooking.create({
      data: { ...input, bookingDate: new Date(input.bookingDate) },
      include: { lead: true }
    });
    await crmNotificationService.sendWhatsAppReminder({
      recipient: booking.lead.mobile,
      message: `Counselling booked with ${booking.counsellorName}`,
      context: { bookingId: booking.id, mode: booking.mode }
    });
    return booking;
  },
  referrals() {
    return prisma.referral.findMany({
      orderBy: { createdAt: "desc" },
      include: { referrer: { select: userSelect }, referred: { select: userSelect } }
    });
  },
  async createReferral(input: { referrerUserId: string; referredUserId: string; rewardStatus: string }) {
    const referral = await prisma.referral.create({
      data: input,
      include: { referrer: { select: userSelect }, referred: { select: userSelect } }
    });
    await crmNotificationService.sendSmsFollowup({
      recipient: referral.referrer.mobile,
      message: `Referral reward status: ${referral.rewardStatus}`,
      context: { referralId: referral.id }
    });
    return referral;
  }
};
