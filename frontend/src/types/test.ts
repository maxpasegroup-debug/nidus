export type Question = {
  id: string;
  testId: string;
  questionText: string;
  questionImage?: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  marks: number;
  negativeMarks: number;
  difficultyLevel: string;
  topic: string;
};

export type Test = {
  id: string;
  title: string;
  description: string;
  examType: string;
  category: string;
  subject?: string | null;
  topic?: string | null;
  batchId?: string | null;
  teacherId?: string | null;
  publishAt?: string | null;
  status?: string | null;
  duration: number;
  totalMarks: number;
  isMockTest: boolean;
  isLive: boolean;
  createdAt: string;
  questions?: Question[];
  _count?: {
    questions?: number;
    attempts?: number;
  };
};

export type TestAttempt = {
  id: string;
  userId: string;
  testId: string;
  score: number;
  totalCorrect: number;
  totalWrong: number;
  timeTaken: number;
  startedAt: string;
  submittedAt?: string | null;
  test: Test;
  status?: string;
  currentQuestionId?: string | null;
  sectionState?: {
    currentIndex?: number;
    skippedMode?: boolean;
    [key: string]: unknown;
  } | null;
  answerStates?: AnswerState[];
  timing?: {
    serverTime: string;
    startedAt: string;
    expiresAt: string;
    durationSeconds: number;
    elapsedSeconds: number;
    remainingSeconds: number;
    isExpired: boolean;
  };
};

export type AnswerState = {
  id?: string;
  attemptId?: string;
  questionId: string;
  selectedAnswer?: string | null;
  status?: string | null;
  confidence?: string | null;
  timeSpent?: number | null;
  visitCount?: number | null;
  markedForReview?: boolean | null;
};

export type ResultAnswer = {
  id: string;
  selectedAnswer: string;
  isCorrect: boolean;
  question: Question;
};

export type TestResult = {
  attempt: TestAttempt & {
    answers: ResultAnswer[];
  };
  analytics: {
    accuracy: number;
    weakTopics: string[];
    timeAnalysis: {
      timeTaken: number;
      averagePerQuestion: number;
    };
    rankEstimation: number;
    topicAnalysis: Array<{ topic: string; correct: number; total: number; accuracy: number }>;
    aiInsights: string;
  };
};
