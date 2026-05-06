import { prisma } from "../../config/prisma.js";

type DashboardUser = {
  id: string;
  role: "STUDENT" | "PARENT" | "ADMIN" | "GUEST";
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
    const linkedStudent = await prisma.user.findFirst({
      where: { role: "STUDENT" },
      select: { id: true, name: true, email: true, mobile: true }
    });

    return {
      parentId: user.id,
      linkedStudent,
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
  }
};
