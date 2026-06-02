import { Prisma, Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { uploadBufferToCloudinary } from "../../config/cloudinary.js";

type Requester = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type QuestStatus = "locked" | "unlocked" | "active" | "completed";

type QuestBundle = {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration: string;
  introduction: string;
  locked: boolean;
  unlockAfterQuestId: string | null;
  certificateTitle: string | null;
  lessons: Array<{
    id: string;
    questId: string;
    title: string;
    description: string;
    duration: string;
    mediaType: string;
    audioUrl: string | null;
    videoUrl: string | null;
    documentUrl: string | null;
    required: boolean;
    sortOrder: number;
  }>;
  reflections: Array<{
    id: string;
    questId: string;
    prompt: string;
    type: string;
    options: Prisma.JsonValue | null;
    required: boolean;
    sortOrder: number;
  }>;
  challenges: Array<{
    id: string;
    questId: string;
    title: string;
    description: string;
    required: boolean;
    evidenceRequired: boolean;
    sortOrder: number;
  }>;
};

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(xp / 300) + 1);
}

function normalizeOptions(options: Prisma.JsonValue | null) {
  return Array.isArray(options) ? options : [];
}

function answerToJson(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value as Prisma.InputJsonValue;
  if (typeof value === "object") return value as Prisma.InputJsonValue;
  return String(value);
}

async function awardXp(userId: string, sourceType: string, sourceId: string, xp: number) {
  if (xp <= 0) return;
  await prisma.guruXpLedger
    .create({ data: { userId, sourceType, sourceId, xp } })
    .catch(() => undefined);
}

async function unlockAchievement(userId: string, ruleKey: string) {
  const achievement = await prisma.guruAchievement.findUnique({ where: { ruleKey } });
  if (!achievement?.enabled) return;
  await prisma.guruUserAchievement
    .create({ data: { userId, achievementId: achievement.id } })
    .catch(() => undefined);
}

async function userCompletedQuest(userId: string, questId: string) {
  const progress = await prisma.guruProgress.findUnique({ where: { userId_questId: { userId, questId } } });
  return progress?.status === "completed" || progress?.completionPercent === 100;
}

async function isQuestLocked(userId: string, quest: { locked: boolean; unlockAfterQuestId: string | null }) {
  if (quest.locked) return true;
  if (!quest.unlockAfterQuestId) return false;
  return !(await userCompletedQuest(userId, quest.unlockAfterQuestId));
}

async function questBundle(questIdOrSlug: string, publishedOnly = true): Promise<QuestBundle | null> {
  const quest = await prisma.guruQuest.findFirst({
    where: {
      OR: [{ id: questIdOrSlug }, { slug: questIdOrSlug }],
      status: publishedOnly ? "published" : undefined
    }
  });
  if (!quest) return null;

  const [lessons, reflections, challenges] = await Promise.all([
    prisma.guruLesson.findMany({ where: { questId: quest.id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.guruReflectionQuestion.findMany({ where: { questId: quest.id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.guruChallenge.findMany({ where: { questId: quest.id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] })
  ]);

  return { ...quest, lessons, reflections, challenges };
}

async function calculateQuestProgress(userId: string, bundle: QuestBundle) {
  const [lessonCompletions, reflectionAnswers, challengeCompletions] = await Promise.all([
    prisma.guruLessonCompletion.findMany({ where: { userId, questId: bundle.id } }),
    prisma.guruReflectionAnswer.findMany({ where: { userId, questId: bundle.id } }),
    prisma.guruChallengeCompletion.findMany({ where: { userId, questId: bundle.id } })
  ]);

  const completedLessons = new Set(lessonCompletions.map((item) => item.lessonId));
  const answeredQuestions = new Set(reflectionAnswers.map((item) => item.questionId));
  const completedChallenges = new Map(challengeCompletions.map((item) => [item.challengeId, item]));

  const requiredLessons = bundle.lessons.filter((item) => item.required);
  const requiredReflections = bundle.reflections.filter((item) => item.required);
  const requiredChallenges = bundle.challenges.filter((item) => item.required);
  const requiredTotal = requiredLessons.length + requiredReflections.length + requiredChallenges.length;
  const completedTotal =
    requiredLessons.filter((item) => completedLessons.has(item.id)).length +
    requiredReflections.filter((item) => answeredQuestions.has(item.id)).length +
    requiredChallenges.filter((item) => completedChallenges.has(item.id)).length;
  const completionPercent = requiredTotal ? Math.round((completedTotal / requiredTotal) * 100) : 0;
  const locked = await isQuestLocked(userId, bundle);
  const status: QuestStatus = locked ? "locked" : completionPercent >= 100 ? "completed" : completionPercent > 0 ? "active" : "unlocked";

  return {
    completionPercent,
    status,
    locked,
    completedLessons,
    answeredQuestions,
    completedChallenges
  };
}

async function syncProgress(userId: string, bundle: QuestBundle) {
  const progress = await calculateQuestProgress(userId, bundle);
  const completedAt = progress.status === "completed" ? new Date() : null;
  await prisma.guruProgress.upsert({
    where: { userId_questId: { userId, questId: bundle.id } },
    update: {
      status: progress.status,
      completionPercent: progress.completionPercent,
      completedAt: progress.status === "completed" ? completedAt : null
    },
    create: {
      userId,
      questId: bundle.id,
      status: progress.status,
      completionPercent: progress.completionPercent,
      completedAt
    }
  });

  if (progress.status === "completed") {
    await awardXp(userId, "quest", bundle.id, 150);
    await unlockAchievement(userId, "quest_finisher");
    await issueCertificate(userId, bundle);
  }

  return progress;
}

async function issueCertificate(userId: string, bundle: QuestBundle) {
  const certificate = await prisma.guruCertificate.findFirst({ where: { questId: bundle.id, enabled: true } });
  if (!certificate) return;
  await prisma.guruUserCertificate
    .create({
      data: {
        userId,
        questId: bundle.id,
        certificateId: certificate.id,
        certificateUrl: certificate.templateUrl
      }
    })
    .catch(() => undefined);
}

async function formatQuest(userId: string, bundle: QuestBundle) {
  const progress = await syncProgress(userId, bundle);
  return {
    id: bundle.slug,
    questDbId: bundle.id,
    title: bundle.title,
    description: bundle.description,
    duration: bundle.duration,
    progress: progress.completionPercent,
    status: progress.status,
    locked: progress.locked,
    introduction: bundle.introduction,
    unlockAfterQuestId: bundle.unlockAfterQuestId ?? "",
    certificateTitle: bundle.certificateTitle ?? "",
    lessons: bundle.lessons.map((lesson) => ({
      id: lesson.id,
      questId: bundle.slug,
      title: lesson.title,
      description: lesson.description,
      duration: lesson.duration,
      mediaType: lesson.mediaType,
      audioUrl: lesson.audioUrl ?? "",
      videoUrl: lesson.videoUrl ?? "",
      documentUrl: lesson.documentUrl ?? "",
      completed: progress.completedLessons.has(lesson.id),
      required: lesson.required,
      sortOrder: lesson.sortOrder
    })),
    reflections: bundle.reflections.map((question) => ({
      id: question.id,
      questId: bundle.slug,
      prompt: question.prompt,
      type: question.type,
      options: normalizeOptions(question.options),
      required: question.required,
      sortOrder: question.sortOrder
    })),
    challenges: bundle.challenges.map((challenge) => {
      const completion = progress.completedChallenges.get(challenge.id);
      return {
        id: challenge.id,
        questId: bundle.slug,
        title: challenge.title,
        description: challenge.description,
        completed: Boolean(completion),
        evidenceUrl: completion?.evidenceUrl ?? "",
        notes: completion?.notes ?? "",
        required: challenge.required,
        evidenceRequired: challenge.evidenceRequired,
        sortOrder: challenge.sortOrder
      };
    })
  };
}

async function currentStreak(userId: string) {
  const completions = await prisma.guruDailyMissionCompletion.findMany({
    where: { userId },
    distinct: ["completedDate"],
    orderBy: { completedDate: "desc" },
    take: 30
  });
  const dates = new Set(completions.map((item) => item.completedDate));
  let streak = 0;
  const cursor = new Date();
  for (let index = 0; index < 30; index += 1) {
    const key = todayKey(cursor);
    if (!dates.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export const mobileGuruService = {
  async quests(user: Requester) {
    const quests = await prisma.guruQuest.findMany({
      where: { status: "published" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });
    const bundles = await Promise.all(quests.map((quest) => questBundle(quest.id)));
    const formatted = await Promise.all(bundles.filter((item): item is QuestBundle => Boolean(item)).map((bundle) => formatQuest(user.id, bundle)));
    return formatted;
  },

  async quest(user: Requester, questId: string) {
    const bundle = await questBundle(questId);
    if (!bundle) throw new Error("Quest not found");
    return formatQuest(user.id, bundle);
  },

  async completeLesson(user: Requester, lessonId: string) {
    const lesson = await prisma.guruLesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new Error("Lesson not found");
    const bundle = await questBundle(lesson.questId);
    if (!bundle) throw new Error("Quest not found");
    if (await isQuestLocked(user.id, bundle)) throw new Error("Quest is locked");

    await prisma.guruLessonCompletion
      .create({ data: { userId: user.id, questId: lesson.questId, lessonId } })
      .catch(() => undefined);
    await awardXp(user.id, "lesson", lessonId, 25);
    await unlockAchievement(user.id, "first_lesson_complete");
    const progress = await syncProgress(user.id, bundle);
    return { completed: true, progress: progress.completionPercent, status: progress.status };
  },

  async submitReflections(user: Requester, questId: string, answers: Record<string, unknown>) {
    const bundle = await questBundle(questId);
    if (!bundle) throw new Error("Quest not found");
    if (await isQuestLocked(user.id, bundle)) throw new Error("Quest is locked");
    const validQuestionIds = new Set(bundle.reflections.map((item) => item.id));

    for (const [questionId, answer] of Object.entries(answers ?? {})) {
      if (!validQuestionIds.has(questionId)) continue;
      await prisma.guruReflectionAnswer.upsert({
        where: { userId_questionId: { userId: user.id, questionId } },
        update: { answer: answerToJson(answer) },
        create: { userId: user.id, questId: bundle.id, questionId, answer: answerToJson(answer) }
      });
    }

    await awardXp(user.id, "reflection", `${bundle.id}:${Object.keys(answers ?? {}).sort().join(",")}`, 35);
    await unlockAchievement(user.id, "first_reflection");
    const progress = await syncProgress(user.id, bundle);
    return { submitted: true, progress: progress.completionPercent, status: progress.status };
  },

  async completeChallenge(user: Requester, challengeId: string, input: { notes?: string; evidenceUrl?: string }) {
    const challenge = await prisma.guruChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new Error("Challenge not found");
    const bundle = await questBundle(challenge.questId);
    if (!bundle) throw new Error("Quest not found");
    if (await isQuestLocked(user.id, bundle)) throw new Error("Quest is locked");
    if (challenge.evidenceRequired && !input.evidenceUrl) throw new Error("Evidence is required for this challenge");

    await prisma.guruChallengeCompletion.upsert({
      where: { userId_challengeId: { userId: user.id, challengeId } },
      update: { notes: input.notes, evidenceUrl: input.evidenceUrl },
      create: { userId: user.id, questId: challenge.questId, challengeId, notes: input.notes, evidenceUrl: input.evidenceUrl }
    });

    await awardXp(user.id, "challenge", challengeId, 50);
    await unlockAchievement(user.id, "action_mission_complete");
    const progress = await syncProgress(user.id, bundle);
    return { completed: true, progress: progress.completionPercent, status: progress.status };
  },

  async uploadEvidence(user: Requester, challengeId: string, file: Express.Multer.File) {
    const challenge = await prisma.guruChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new Error("Challenge not found");
    const bundle = await questBundle(challenge.questId);
    if (!bundle) throw new Error("Quest not found");
    if (await isQuestLocked(user.id, bundle)) throw new Error("Quest is locked");
    const result = await uploadBufferToCloudinary(file, "nidus/guru/evidence");
    return { url: result.secureUrl, evidenceUrl: result.secureUrl };
  },

  async progress(user: Requester) {
    const quests = await this.quests(user);
    const completedQuests = quests.filter((quest) => quest.status === "completed").length;
    const currentQuests = quests.filter((quest) => quest.status === "active").length;
    const completionPercent = quests.length ? Math.round(quests.reduce((sum, quest) => sum + quest.progress, 0) / quests.length) : 0;
    const [achievements, certificates, streak] = await Promise.all([
      prisma.guruUserAchievement.findMany({ where: { userId: user.id }, orderBy: { unlockedAt: "desc" } }),
      this.certificates(user),
      currentStreak(user.id)
    ]);
    const achievementRows = achievements.length
      ? await prisma.guruAchievement.findMany({ where: { id: { in: achievements.map((item) => item.achievementId) } } })
      : [];
    return {
      completedQuests,
      currentQuests,
      completionPercent,
      streak,
      achievements: achievementRows.map((item) => item.title),
      certificates: certificates.map((item) => item.title)
    };
  },

  async certificates(user: Requester) {
    const certificates = await prisma.guruUserCertificate.findMany({ where: { userId: user.id }, orderBy: { issuedAt: "desc" } });
    const certificateRows = certificates.length
      ? await prisma.guruCertificate.findMany({ where: { id: { in: certificates.map((item) => item.certificateId) } } })
      : [];
    const certificateMap = new Map(certificateRows.map((item) => [item.id, item]));
    return certificates.map((item) => {
      const certificate = certificateMap.get(item.certificateId);
      return {
        id: item.id,
        questId: item.questId,
        title: certificate?.title ?? "NIDUS Guru Certificate",
        description: certificate?.description ?? "Issued after completing all required actions.",
        certificateUrl: item.certificateUrl ?? certificate?.templateUrl ?? "",
        issuedAt: item.issuedAt.toISOString().slice(0, 10)
      };
    });
  },

  async growth(user: Requester) {
    const [xpAgg, missions, completions, notes, insights, leaderboardUsers, streak] = await Promise.all([
      prisma.guruXpLedger.aggregate({ where: { userId: user.id }, _sum: { xp: true } }),
      prisma.guruDailyMission.findMany({ where: { enabled: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
      prisma.guruDailyMissionCompletion.findMany({ where: { userId: user.id, completedDate: todayKey() } }),
      prisma.guruMentorNote.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.guruReflectionInsight.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.guruXpLedger.groupBy({ by: ["userId"], _sum: { xp: true }, orderBy: { _sum: { xp: "desc" } }, take: 5 }),
      currentStreak(user.id)
    ]);
    const completedMissionIds = new Set(completions.map((item) => item.missionId));
    const users = leaderboardUsers.length
      ? await prisma.user.findMany({ where: { id: { in: leaderboardUsers.map((item) => item.userId) } }, select: { id: true, name: true } })
      : [];
    const userMap = new Map(users.map((item) => [item.id, item.name]));
    const xp = xpAgg._sum.xp ?? 0;

    return {
      xp,
      level: levelFromXp(xp),
      dailyMissions: missions.map((mission) => ({
        id: mission.id,
        title: mission.title,
        description: mission.description,
        xp: mission.xp,
        completed: completedMissionIds.has(mission.id)
      })),
      leaderboard: leaderboardUsers.map((item, index) => ({
        rank: index + 1,
        userId: item.userId,
        name: userMap.get(item.userId) ?? "NIDUS Student",
        xp: item._sum.xp ?? 0,
        streak: item.userId === user.id ? streak : 0
      })),
      mentorNotes: notes.map((note) => ({
        id: note.id,
        title: note.title,
        message: note.message,
        createdAt: note.createdAt.toISOString().slice(0, 10)
      })),
      reflectionInsights: insights.map((insight) => ({
        id: insight.id,
        title: insight.title,
        summary: insight.summary,
        recommendation: insight.recommendation
      }))
    };
  },

  async completeDailyMission(user: Requester, missionId: string) {
    const mission = await prisma.guruDailyMission.findFirst({ where: { id: missionId, enabled: true } });
    if (!mission) throw new Error("Daily mission not found");
    const completedDate = todayKey();
    await prisma.guruDailyMissionCompletion
      .create({ data: { userId: user.id, missionId, completedDate } })
      .catch(() => undefined);
    await awardXp(user.id, "daily_mission", `${missionId}:${completedDate}`, mission.xp);
    const streak = await currentStreak(user.id);
    if (streak >= 7) await unlockAchievement(user.id, "seven_day_streak");
    return { completed: true, xp: mission.xp, streak };
  },

  async adminSummary() {
    const [quests, progress, certificates] = await Promise.all([
      prisma.guruQuest.count(),
      prisma.guruProgress.count(),
      prisma.guruUserCertificate.count()
    ]);
    return { quests, progress, certificates };
  },

  async adminQuests() {
    return prisma.guruQuest.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  },

  async adminUpsertQuest(input: Record<string, unknown>, id?: string) {
    const data = {
      slug: String(input.slug ?? "").trim(),
      title: String(input.title ?? "").trim(),
      description: String(input.description ?? "").trim(),
      duration: String(input.duration ?? "").trim(),
      introduction: String(input.introduction ?? "").trim(),
      status: String(input.status ?? "draft"),
      locked: Boolean(input.locked ?? false),
      unlockAfterQuestId: typeof input.unlockAfterQuestId === "string" && input.unlockAfterQuestId ? input.unlockAfterQuestId : null,
      certificateTitle: typeof input.certificateTitle === "string" && input.certificateTitle ? input.certificateTitle : null,
      sortOrder: Number(input.sortOrder ?? 0)
    };
    if (!data.slug || !data.title || !data.description || !data.duration || !data.introduction) throw new Error("Quest fields are required");
    return id ? prisma.guruQuest.update({ where: { id }, data }) : prisma.guruQuest.create({ data });
  },

  async adminAddLesson(questId: string, input: Record<string, unknown>) {
    return prisma.guruLesson.create({
      data: {
        questId,
        title: String(input.title ?? ""),
        description: String(input.description ?? ""),
        duration: String(input.duration ?? ""),
        mediaType: String(input.mediaType ?? "audio"),
        audioUrl: typeof input.audioUrl === "string" ? input.audioUrl : null,
        videoUrl: typeof input.videoUrl === "string" ? input.videoUrl : null,
        documentUrl: typeof input.documentUrl === "string" ? input.documentUrl : null,
        textContent: typeof input.textContent === "string" ? input.textContent : null,
        required: Boolean(input.required ?? true),
        sortOrder: Number(input.sortOrder ?? 0)
      }
    });
  },

  async adminAddReflection(questId: string, input: Record<string, unknown>) {
    return prisma.guruReflectionQuestion.create({
      data: {
        questId,
        prompt: String(input.prompt ?? ""),
        type: String(input.type ?? "text"),
        options: Array.isArray(input.options) ? input.options : [],
        required: Boolean(input.required ?? true),
        sortOrder: Number(input.sortOrder ?? 0)
      }
    });
  },

  async adminAddChallenge(questId: string, input: Record<string, unknown>) {
    return prisma.guruChallenge.create({
      data: {
        questId,
        title: String(input.title ?? ""),
        description: String(input.description ?? ""),
        required: Boolean(input.required ?? true),
        evidenceRequired: Boolean(input.evidenceRequired ?? false),
        sortOrder: Number(input.sortOrder ?? 0)
      }
    });
  },

  async adminProgress() {
    return prisma.guruProgress.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
  }
};
