import { prisma } from "../../config/prisma.js";
import type { Role } from "../../generated/prisma/client.js";

type DashboardUser = {
  id: string;
  role: Role;
};

const performanceSeries = [
  { month: "Jan", score: 62, attendance: 84 },
  { month: "Feb", score: 68, attendance: 88 },
  { month: "Mar", score: 73, attendance: 91 },
  { month: "Apr", score: 78, attendance: 93 },
  { month: "May", score: 84, attendance: 96 }
];

export const dashboardService = {
  async getStudentDashboard(user: DashboardUser) {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, mobile: true, role: true }
    });

    return {
      profile,
      enrolledCourses: [
        { id: "nda-foundation", title: "NDA Foundation", progress: 76, nextLesson: "Trigonometry drills" },
        { id: "ssb-screening", title: "SSB Screening", progress: 58, nextLesson: "OIR practice set" },
        { id: "current-affairs", title: "Current Affairs", progress: 82, nextLesson: "Defence briefing" }
      ],
      upcomingTests: [
        { id: "test-nda-math-01", title: "NDA Mathematics Mock", date: "2026-05-10", durationMinutes: 120 },
        { id: "test-gk-brief-02", title: "Current Affairs Weekly", date: "2026-05-12", durationMinutes: 45 }
      ],
      attendance: {
        percentage: 92,
        present: 46,
        total: 50,
        trend: performanceSeries.map(({ month, attendance }) => ({ month, attendance }))
      },
      leaderboardRank: {
        rank: 12,
        percentile: 92,
        batch: "NDA Alpha"
      },
      aiRecommendations: [
        "Revise trigonometry identities before the next mock test.",
        "Attempt two OIR practice sets for SSB screening.",
        "Read today's maritime security current affairs brief."
      ],
      fitnessProgress: {
        score: 64,
        streakDays: 9,
        focus: "Endurance and agility"
      },
      recentActivities: [
        "Completed NDA mathematics mock test",
        "Joined current affairs live briefing",
        "AI study plan updated",
        "Fitness tracker streak continued"
      ]
    };
  },

  async getParentDashboard(user: DashboardUser) {
    const link = await prisma.parentStudentLink.findFirst({
      where: { parentId: user.id, status: "ACTIVE" },
      include: { student: { select: { id: true, name: true, email: true, mobile: true } } },
      orderBy: { linkedAt: "desc" }
    });
    const linkedStudent = link?.student ?? null;
    if (link) {
      await prisma.parentStudentLink.update({ where: { id: link.id }, data: { lastViewedAt: new Date() } }).catch(() => undefined);
    }

    return {
      parentId: user.id,
      linkedStudent,
      monitoringPermissions: link?.monitoringPermissions ?? null,
      studentPerformance: {
        averageScore: 84,
        improvement: 7,
        trend: performanceSeries
      },
      attendance: {
        percentage: 92,
        present: 44,
        total: 48
      },
      feeStatus: {
        status: "PAID",
        dueAmount: 0,
        nextDueDate: "2026-06-05"
      },
      notifications: [
        "Weekly performance report is ready.",
        "Counselling slot recommended for SSB preparation.",
        "Attendance improved by 4% this week."
      ],
      disciplineScore: {
        grade: "A",
        score: 94,
        notes: "No active discipline concerns."
      }
    };
  },

  async getAdminDashboard() {
    const [totalStudents, recentAdmissions] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          role: true,
          createdAt: true
        }
      })
    ]);

    return {
      totalStudents,
      totalRevenue: {
        amount: 6800000,
        currency: "INR",
        quarter: "Q2"
      },
      attendanceAnalytics: {
        average: 89,
        presentToday: 1128,
        totalMarked: 1248,
        trend: performanceSeries.map(({ month, attendance }) => ({ month, attendance }))
      },
      recentAdmissions,
      staffSummary: {
        totalStaff: 86,
        faculty: 42,
        mentors: 18,
        operations: 26
      },
      hostelStats: {
        occupancyPercentage: 78,
        occupiedBeds: 312,
        totalBeds: 400
      }
    };
  },

  async getGuestDashboard() {
    return {
      featuredCourses: [
        { id: "nda", title: "NDA Foundation", duration: "24 weeks", level: "Beginner" },
        { id: "cds", title: "CDS Officer Track", duration: "18 weeks", level: "Intermediate" },
        { id: "afcat", title: "AFCAT Accelerator", duration: "12 weeks", level: "Intermediate" },
        { id: "ssb", title: "SSB Interview Lab", duration: "8 weeks", level: "Advanced" }
      ],
      freeTests: [
        { id: "nda-sample", title: "NDA Sample Mock", questions: 30 },
        { id: "afcat-reasoning", title: "AFCAT Reasoning Drill", questions: 25 },
        { id: "ssb-oir", title: "SSB OIR Practice", questions: 40 }
      ],
      latestNews: [
        "NDA preparation batch opens this month.",
        "Free AFCAT reasoning mock test is available.",
        "SSB psychology demo class added to guest access."
      ]
    };
  },

  async getTeacherDashboard(user: DashboardUser) {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, mobile: true, role: true, instituteId: true, branchId: true }
    });

    return {
      profile,
      subjects: ["Maths", "English", "GK", "Reasoning", "Current Affairs", "Physics", "Chemistry", "Biology", "SSB", "Fitness/PT"],
      classPerformance: { averageScore: 78, attendance: 91, weakStudentCount: 14, assignmentsDue: 6 },
      contentOps: {
        lectureUploads: 18,
        notesUploads: 34,
        pendingReviews: 5,
        cbtDrafts: 4
      },
      modules: [
        { title: "Subject assignment", status: "Active", metric: "10 subjects mapped" },
        { title: "Lecture uploads", status: "Ready", metric: "Cloud media enabled" },
        { title: "Notes uploads", status: "Ready", metric: "PDF/document library" },
        { title: "Assignment management", status: "Active", metric: "6 due this week" },
        { title: "Attendance marking", status: "Active", metric: "91% class average" },
        { title: "CBT/test management", status: "Active", metric: "4 drafts" },
        { title: "Weak student alerts", status: "Review", metric: "14 alerts" },
        { title: "Parent communication", status: "Ready", metric: "Messages linked" },
        { title: "AI recommendations", status: "Shell", metric: "Learning engine connected" }
      ],
      weakStudentAlerts: ["Algebra accuracy below 55% for NDA Alpha", "Current affairs quiz drop in Bravo batch", "Fitness/PT attendance requires follow-up"],
      aiRecommendations: ["Assign remedial trigonometry set to NDA Alpha.", "Schedule a short GK recap before Friday CBT.", "Send parent update for students with two missed sessions."]
    };
  },

  async getDirectorDashboard(user: DashboardUser) {
    const director = await prisma.user.findUnique({
      where: { id: user.id },
      select: { instituteId: true, branchId: true }
    });
    const scopedWhere = user.role === "DIRECTOR" ? { instituteId: director?.instituteId ?? undefined, branchId: director?.branchId ?? undefined } : {};
    const [students, leads, admissions, teachers] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT", ...scopedWhere } }),
      prisma.lead.count(),
      prisma.admission.count(),
      prisma.user.count({ where: { role: "TEACHER", ...scopedWhere } })
    ]);

    return {
      scope: { instituteId: director?.instituteId ?? null, branchId: director?.branchId ?? null },
      instituteAnalytics: { students, teachers, attendance: 89, cbtCompletion: 74 },
      admissionsAnalytics: { leads, admissions, conversionRate: leads ? Math.round((admissions / leads) * 100) : 0 },
      revenueAnalytics: { collected: 6800000, pending: 940000, forecast: 8200000 },
      facultyAnalytics: { active: teachers, utilization: 82, reviewDue: 7 },
      riskAlerts: ["Admission conversion below target in one branch", "CBT completion dip for Current Affairs", "Faculty review backlog requires action"],
      executiveInsights: ["Revenue trend remains positive for Q2.", "CBT completion needs director review.", "Parent engagement improved after weekly reporting."],
      growthForecast: performanceSeries.map(({ month, score }) => ({ month, forecast: score + 12 }))
    };
  },

  async getTelecallerDashboard(user: DashboardUser) {
    const [assignedLeads, followUps, counselling] = await Promise.all([
      prisma.lead.count({ where: { assignedTo: user.role === "TELECALLER" ? user.id : undefined } }),
      prisma.followUp.count({ where: { createdBy: user.role === "TELECALLER" ? user.id : undefined } }),
      prisma.counsellingBooking.count()
    ]);

    return {
      leadPipeline: { new: 42, contacted: 31, counselling: 18, enrolled: 9, lost: 6, assignedLeads },
      scheduling: { callbacksToday: 12, counselling, overdueFollowUps: 4 },
      performance: { callsToday: 64, conversionRate: 18, averageResponseTime: "11m", notesAdded: followUps },
      modules: ["Lead pipeline", "Enquiry tracking", "Callback scheduling", "Counselling scheduling", "Follow-up tracking", "Lead notes", "Conversion analytics", "AI call-script suggestions", "WhatsApp integration"],
      aiCallScripts: ["Open with NDA batch deadline and free diagnostic test.", "Use parent outcome framing for AISSEE enquiries.", "Offer SSB demo class for officer-track leads."],
      whatsappShell: { status: "Configured shell", templates: 5, pendingOptIns: 17 }
    };
  },

  async getMarketingDashboard(_user: DashboardUser) {
    return {
      campaignTracking: { activeCampaigns: 7, leadsGenerated: 286, costPerLead: 138, roi: 3.4 },
      attribution: [
        { channel: "Google Ads", leads: 94, conversion: 14 },
        { channel: "Instagram", leads: 76, conversion: 9 },
        { channel: "Webinars", leads: 58, conversion: 21 },
        { channel: "Daily Intelligence", leads: 38, conversion: 11 }
      ],
      webinarRegistrations: { upcoming: 3, registered: 420, attendedLast: 166 },
      landingPageAnalytics: { visitors: 12840, conversionRate: 4.8, topPage: "NDA Foundation" },
      roiAnalytics: performanceSeries.map(({ month, score }) => ({ month, roi: Number((score / 25).toFixed(1)) })),
      publishingShell: { contentQueue: 9, dailyIntelligenceShares: 22, socialPosts: 14 },
      socialCampaignAnalytics: { reach: 186000, engagement: 7.2, enquiries: 118 }
    };
  }
};
