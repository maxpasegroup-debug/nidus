import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";
import { prisma } from "../config/prisma.js";
import { DEFAULT_ACCOUNT_PASSWORD } from "../modules/auth/auth.v2.service.js";
import { Prisma, Role } from "../generated/prisma/client.js";

type TeamMemberSeed = {
  name: string;
  email: string;
  legacyEmail?: string;
  mobile: string;
  role: Role;
  designation: string;
  department: string;
  dashboardTemplate: string;
  subject?: string;
  resetDefaultPassword?: boolean;
  permissions: string[];
  focusAreas: string[];
};

export const nidusTeamMembers: TeamMemberSeed[] = [
  {
    name: "Sayuj",
    email: "sayujdamodharan@gmail.com",
    mobile: "+919000001001",
    role: Role.DIRECTOR,
    designation: "Director",
    department: "Leadership",
    dashboardTemplate: "EXECUTIVE_COMMAND",
    permissions: ["view_all", "manage_strategy", "review_finance", "review_staff", "review_academics"],
    focusAreas: ["Admissions conversion", "Revenue health", "Staff productivity", "Academic outcomes"]
  },
  {
    name: "Aswanth",
    email: "ltcdraswanth@gmail.com",
    mobile: "+919000001002",
    role: Role.DIRECTOR,
    designation: "Director",
    department: "Leadership",
    dashboardTemplate: "EXECUTIVE_COMMAND",
    permissions: ["view_all", "manage_strategy", "review_finance", "review_staff", "review_academics"],
    focusAreas: ["Operations discipline", "Training quality", "Admissions pipeline", "Institution reports"]
  },
  {
    name: "Priyanka",
    email: "priyankaraveendran87@gmail.com",
    mobile: "+919000001003",
    role: Role.TEACHER,
    designation: "Academic Head",
    department: "Academics",
    dashboardTemplate: "ACADEMIC_HEAD",
    permissions: ["manage_batches", "review_faculty", "review_tests", "review_attendance", "manage_academic_reports"],
    focusAreas: ["Faculty coverage", "Batch progress", "Weak student tracking", "Test completion"]
  },
  {
    name: "Ritwik",
    email: "ritwikvyshnav@gmail.com",
    mobile: "+919000001004",
    role: Role.TEACHER,
    designation: "Academic Head",
    department: "Academics",
    dashboardTemplate: "ACADEMIC_HEAD",
    permissions: ["manage_batches", "review_faculty", "review_tests", "review_attendance", "manage_academic_reports"],
    focusAreas: ["Syllabus completion", "Class observations", "Student risk review", "Faculty task closure"]
  },
  {
    name: "Santhosh",
    email: "vaniyamkulam68@gmail.com",
    mobile: "+919000001005",
    role: Role.TEACHER,
    designation: "Physical Instructor",
    department: "Physical Training",
    dashboardTemplate: "PHYSICAL_INSTRUCTOR",
    subject: "Physical Training",
    permissions: ["manage_pt_sessions", "mark_pt_attendance", "review_fitness", "record_training_remarks"],
    focusAreas: ["PT attendance", "Fitness eligibility", "Daily training remarks", "Physical readiness"]
  },
  {
    name: "Vinod",
    email: "vinuchirakkal01@gmail.com",
    mobile: "+919000001006",
    role: Role.TEACHER,
    designation: "Physical Instructor",
    department: "Physical Training",
    dashboardTemplate: "PHYSICAL_INSTRUCTOR",
    subject: "Physical Training",
    permissions: ["manage_pt_sessions", "mark_pt_attendance", "review_fitness", "record_training_remarks"],
    focusAreas: ["Drill schedule", "Fitness logs", "Physical test readiness", "Student discipline"]
  },
  {
    name: "Suma",
    email: "sumasooryakantham@gmail.com",
    mobile: "+919000001007",
    role: Role.TEACHER,
    designation: "GK Faculty",
    department: "Academics",
    dashboardTemplate: "SUBJECT_FACULTY",
    subject: "GK",
    permissions: ["manage_own_classes", "mark_attendance", "upload_materials", "create_subject_tests"],
    focusAreas: ["Current affairs", "GK practice tests", "Class notes", "Weak topic review"]
  },
  {
    name: "Anjali",
    email: "anjaliack2@gmail.com",
    mobile: "+919000001008",
    role: Role.TEACHER,
    designation: "English Faculty",
    department: "Academics",
    dashboardTemplate: "SUBJECT_FACULTY",
    subject: "English",
    permissions: ["manage_own_classes", "mark_attendance", "upload_materials", "create_subject_tests"],
    focusAreas: ["Vocabulary", "Grammar practice", "Reading comprehension", "Written communication"]
  },
  {
    name: "Anjusha",
    email: "anjushae1997@gmail.com",
    mobile: "+919000001009",
    role: Role.TEACHER,
    designation: "Maths Faculty",
    department: "Academics",
    dashboardTemplate: "SUBJECT_FACULTY",
    subject: "Maths",
    permissions: ["manage_own_classes", "mark_attendance", "upload_materials", "create_subject_tests"],
    focusAreas: ["Maths drills", "Formula revision", "Speed practice", "Weak topic review"]
  },
  {
    name: "Surya",
    email: "suryasmathew22@gmail.com",
    mobile: "+919000001010",
    role: Role.TEACHER,
    designation: "Biology Faculty",
    department: "Academics",
    dashboardTemplate: "SUBJECT_FACULTY",
    subject: "Biology",
    permissions: ["manage_own_classes", "mark_attendance", "upload_materials", "create_subject_tests"],
    focusAreas: ["Biology concepts", "Diagram practice", "Topic tests", "Revision planning"]
  },
  {
    name: "Sumitha",
    email: "sumithavinod40378@gmail.com",
    mobile: "+919000001011",
    role: Role.TEACHER,
    designation: "Maths Faculty",
    department: "Academics",
    dashboardTemplate: "SUBJECT_FACULTY",
    subject: "Maths",
    permissions: ["manage_own_classes", "mark_attendance", "upload_materials", "create_subject_tests"],
    focusAreas: ["Maths remediation", "Practice worksheets", "Monthly tests", "Student doubts"]
  },
  {
    name: "Nimisha",
    email: "nimishamanoharan555@gmail.com",
    mobile: "+919000001012",
    role: Role.TEACHER,
    designation: "Chemistry Faculty",
    department: "Academics",
    dashboardTemplate: "SUBJECT_FACULTY",
    subject: "Chemistry",
    permissions: ["manage_own_classes", "mark_attendance", "upload_materials", "create_subject_tests"],
    focusAreas: ["Chemistry concepts", "Equation practice", "Topic tests", "Lab-linked notes"]
  },
  {
    name: "Admission Cell",
    email: "admisioncell@nidusacademy.in",
    legacyEmail: "vineeshdeepthi8@gmail.com",
    mobile: "+919000001013",
    role: Role.ADMIN,
    designation: "Admission Cell",
    department: "Admissions",
    dashboardTemplate: "ADMIN_OPERATIONS",
    permissions: ["manage_enquiries", "manage_applications", "manage_admissions", "manage_documents", "manage_fees", "send_notices"],
    focusAreas: ["New enquiries", "Applications", "Admission approval", "Fees and documents"]
  },
  {
    name: "Chitra",
    email: "nairchitrac1992@gmail.com",
    mobile: "+919000001014",
    role: Role.TELECALLER,
    designation: "Student Support & Lead Management",
    department: "Admissions and Support",
    dashboardTemplate: "LEAD_SUPPORT",
    permissions: ["manage_leads", "schedule_followups", "record_support_tickets", "handover_admissions"],
    focusAreas: ["New enquiries", "Follow-ups", "Parent communication", "Student support"]
  },
  {
    name: "Sales Booster",
    email: "salesbooster@nidusacademy.in",
    legacyEmail: "fortuneconnect@nidusacademy.in",
    mobile: "+919000001015",
    role: Role.MARKETING_COORDINATOR,
    designation: "AI Sales & Marketing Automation",
    department: "Admissions Growth",
    dashboardTemplate: "SALES_BOOSTER",
    resetDefaultPassword: true,
    permissions: ["plan_campaigns", "review_creatives", "manage_campaign_leads", "prepare_whatsapp_followups", "review_campaign_reports"],
    focusAreas: ["Academy promotions", "TOPRANK subscriptions", "NIDUS Guru campaigns", "Assessment lead magnets", "WhatsApp follow-up"]
  }
];

function roleMetadata(member: TeamMemberSeed, includeDefaultPassword: boolean) {
  const metadata: Record<string, Prisma.InputJsonValue | null> = {
    designation: member.designation,
    department: member.department,
    dashboardTemplate: member.dashboardTemplate,
    subject: member.subject ?? null,
    permissions: member.permissions,
    focusAreas: member.focusAreas,
    seededBy: "nidus-team"
  };

  if (includeDefaultPassword) metadata.defaultPassword = true;
  return metadata as Prisma.InputJsonObject;
}

export async function ensureNidusTeam() {
  const password = await bcrypt.hash(DEFAULT_ACCOUNT_PASSWORD, 12);
  const now = new Date();
  const results = [];

  for (const member of nidusTeamMembers) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: member.email },
          ...(member.legacyEmail ? [{ email: member.legacyEmail }] : [])
        ]
      }
    });
    const existingMetadata = existing?.roleMetadata && typeof existing.roleMetadata === "object" && !Array.isArray(existing.roleMetadata) ? existing.roleMetadata as Prisma.InputJsonObject : {};
    const metadata: Prisma.InputJsonObject = {
      ...existingMetadata,
      ...roleMetadata(member, !existing)
    };
    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: member.name,
            email: member.email,
            mobile: member.mobile,
            ...(member.resetDefaultPassword ? { password } : {}),
            role: member.role,
            emailVerified: true,
            mobileVerified: true,
            isDisabled: false,
            disabledAt: null,
            roleOnboardingStatus: "ACTIVE",
            roleActivatedAt: existing.roleActivatedAt ?? now,
            lastRoleActivityAt: now,
            roleMetadata: metadata
          }
        })
      : await prisma.user.create({
          data: {
            name: member.name,
            email: member.email,
            mobile: member.mobile,
            password,
            role: member.role,
            emailVerified: true,
            mobileVerified: true,
            isDisabled: false,
            roleOnboardingStatus: "ACTIVE",
            roleActivatedAt: now,
            lastRoleActivityAt: now,
            roleMetadata: metadata
          }
        });

    if (member.role === Role.TEACHER) {
      await prisma.faculty.upsert({
        where: { userId: user.id },
        update: {
          department: member.department,
          designation: member.designation,
          status: "ACTIVE"
        },
        create: {
          userId: user.id,
          department: member.department,
          designation: member.designation,
          joiningDate: now,
          salary: 0,
          status: "ACTIVE"
        }
      });
    }

    results.push({ email: member.email, role: member.role, dashboardTemplate: member.dashboardTemplate, action: existing ? "updated" : "created" });
  }

  return results;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const results = await ensureNidusTeam();
  console.log(JSON.stringify({ seeded: true, users: results.length, results }, null, 2));
  await prisma.$disconnect();
}
