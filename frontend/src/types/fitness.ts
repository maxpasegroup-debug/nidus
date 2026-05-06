export type FitnessProfile = {
  id: string;
  userId: string;
  height: number;
  weight: number;
  bmi: number;
  runningTime: number;
  pushups: number;
  pullups: number;
  situps: number;
  staminaScore: number;
  fitnessLevel: string;
  updatedAt: string;
};

export type PTSchedule = {
  id: string;
  title: string;
  description: string;
  scheduledDate: string;
  trainerName: string;
  activityType: string;
  duration: number;
  createdAt: string;
};

export type PTAttendance = {
  id: string;
  studentId: string;
  ptScheduleId: string;
  attendanceStatus: string;
  remarks?: string;
  markedAt: string;
  ptSchedule?: PTSchedule;
};

export type PhysicalEligibility = {
  id: string;
  userId: string;
  examType: string;
  eligibilityStatus: string;
  heightEligible: boolean;
  weightEligible: boolean;
  bmiEligible: boolean;
  staminaEligible: boolean;
  overallRemark: string;
  updatedAt: string;
};

export type DailyFitnessLog = {
  id: string;
  userId: string;
  runningDistance: number;
  caloriesBurned: number;
  waterIntake: number;
  workoutDuration: number;
  notes?: string;
  createdAt: string;
};
