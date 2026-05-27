import { Router } from "express";
import { authRouter } from "./auth/auth.v2.routes.js";
import { coursesRouter } from "./courses/courses.routes.js";
import { dashboardRouter } from "./dashboard/dashboard.routes.js";
import { testsRouter } from "./tests/tests.routes.js";
import { psychometricRouter } from "./psychometric/psychometric.routes.js";
import { aiPlannerRouter, analyticsRouter, revisionScheduleRouter } from "./ai-planner/ai-planner.routes.js";
import { lectureProgressRouter, liveClassesRouter, recordedLecturesRouter } from "./live-classes/live-classes.routes.js";
import { attendanceRouter, facultyRouter, payrollRouter, timetableRouter } from "./erp/erp.routes.js";
import { usersRouter } from "./users/users.routes.js";
import { disciplineRouter, hostelOpsRouter, hostelsRouter, messRouter, paradeRouter, roomsRouter } from "./hostel/hostel.routes.js";
import { crmRouter } from "./crm/crm.routes.js";
import { feesRouter, invoicesRouter, paymentsRouter, subscriptionsRouter } from "./payments/payments.routes.js";
import { communicationAnnouncementsRouter, emailsRouter, messagesRouter, notificationsRouter, pushRouter } from "./communication/communication.routes.js";
import { aiEngineRouter } from "./ai-engine/ai-engine.routes.js";
import { fitnessRouter } from "./fitness/fitness.routes.js";
import { currentAffairsRouter, leaderboardRouter, pyqRouter, quizBattlesRouter } from "./learning-hub/learning-hub.routes.js";
import { documentsRouter, mediaRouter } from "./media/media.routes.js";
import { adminCenterRouter } from "./admin-center/admin-center.routes.js";
import { systemRouter } from "./system/system.routes.js";
import { learningStabilityRouter } from "./learning-stability/learning-stability.routes.js";
import { toprankRouter } from "./toprank/toprank.routes.js";
import { salesBoosterRouter } from "./sales-booster/sales-booster.routes.js";
import { academyRouter } from "./academy/academy.routes.js";
import { protect, allowRoles } from "../middlewares/session.middleware.js";
import { Role } from "../generated/prisma/client.js";
import { coursesController } from "./courses/courses.controller.js";
import { getRuntimeState } from "../runtime/lifecycle.js";
import { env } from "../config/env.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  const runtime = getRuntimeState();
  const healthy = !env.HEALTHCHECK_STRICT || runtime.ready;
  res.json({
    status: healthy ? "ok" : "starting",
    service: "nidus-backend",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    database: runtime.ready ? "connected" : "starting",
    redis: env.REDIS_URL ? "configured" : "optional",
    runtime
  });
});
apiRouter.use("/system", systemRouter);

apiRouter.use("/auth", authRouter);
apiRouter.use("/courses", coursesRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/tests", testsRouter);
apiRouter.use("/psychometric", psychometricRouter);
apiRouter.use("/ai-planner", aiPlannerRouter);
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/revision-schedule", revisionScheduleRouter);
apiRouter.use("/live-classes", liveClassesRouter);
apiRouter.use("/recorded-lectures", recordedLecturesRouter);
apiRouter.use("/lecture-progress", lectureProgressRouter);
apiRouter.use("/attendance", attendanceRouter);
apiRouter.use("/timetable", timetableRouter);
apiRouter.use("/faculty", facultyRouter);
apiRouter.use("/payroll", payrollRouter);
apiRouter.use("/announcements", communicationAnnouncementsRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/hostels", hostelsRouter);
apiRouter.use("/rooms", roomsRouter);
apiRouter.use("/hostel", hostelOpsRouter);
apiRouter.use("/mess", messRouter);
apiRouter.use("/discipline", disciplineRouter);
apiRouter.use("/parade", paradeRouter);
apiRouter.use("/crm", crmRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/subscriptions", subscriptionsRouter);
apiRouter.use("/fees", feesRouter);
apiRouter.use("/invoices", invoicesRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/messages", messagesRouter);
apiRouter.use("/emails", emailsRouter);
apiRouter.use("/push", pushRouter);
apiRouter.use("/ai", aiEngineRouter);
apiRouter.use("/fitness", fitnessRouter);
apiRouter.use("/pyq", pyqRouter);
apiRouter.use("/current-affairs", currentAffairsRouter);
apiRouter.use("/quiz-battles", quizBattlesRouter);
apiRouter.use("/leaderboard", leaderboardRouter);
apiRouter.use("/media", mediaRouter);
apiRouter.use("/documents", documentsRouter);
apiRouter.use("/admin", adminCenterRouter);
apiRouter.use("/academy", academyRouter);
apiRouter.use("/learning-stability", learningStabilityRouter);
apiRouter.use("/toprank", toprankRouter);
apiRouter.use("/sales-booster", salesBoosterRouter);
apiRouter.get("/my-courses", protect, allowRoles(Role.STUDENT, Role.ADMIN), coursesController.myCourses);
