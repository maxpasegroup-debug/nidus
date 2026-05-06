export type PYQCategory = {
  id: string;
  name: string;
  examType: string;
  createdAt: string;
  _count?: { questions: number };
};

export type PYQQuestion = {
  id: string;
  categoryId: string;
  year: number;
  subject: string;
  topic: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  difficultyLevel: string;
  createdAt: string;
  category?: PYQCategory;
};

export type CurrentAffairQuiz = {
  id: string;
  currentAffairId: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
};

export type CurrentAffair = {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  publishedDate: string;
  createdAt: string;
  quizzes?: CurrentAffairQuiz[];
};

export type QuizBattleParticipant = {
  id: string;
  battleId: string;
  userId: string;
  score: number;
  rank?: number;
  timeTaken: number;
  user?: { id: string; name: string; email: string };
};

export type QuizBattle = {
  id: string;
  title: string;
  category: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  participants?: QuizBattleParticipant[];
};

export type LeaderboardEntry = {
  id: string;
  userId: string;
  points: number;
  streak: number;
  rank?: number;
  updatedAt: string;
  user?: { id: string; name: string; email: string };
};
