export const fitnessAIService = {
  generateFitnessSuggestions(input: { bmi: number; runningTime: number; pushups: number; pullups: number; staminaScore: number }) {
    const suggestions = [
      input.bmi > 25 ? "Prioritize endurance runs and controlled nutrition to move BMI toward defence readiness." : "Maintain BMI with balanced meals and steady conditioning.",
      input.runningTime > 8 ? "Add interval sprints twice a week to improve 1.6 km timing." : "Running pace is promising; preserve consistency.",
      input.pullups < 6 ? "Use assisted pull-up ladders and dead hangs to build upper-body strength." : "Upper-body endurance is on track."
    ];
    return suggestions.join(" ");
  },
  predictEligibilityImprovement(input: { eligibilityStatus: string; staminaEligible: boolean; bmiEligible: boolean }) {
    if (input.eligibilityStatus === "ELIGIBLE") return "Current physical metrics meet readiness expectations. Focus on sustaining performance.";
    if (!input.staminaEligible) return "With 4-6 weeks of interval running and recovery discipline, stamina eligibility can improve materially.";
    if (!input.bmiEligible) return "BMI eligibility can improve through nutrition discipline and daily aerobic work.";
    return "Address the failed eligibility indicators with a trainer-guided plan.";
  }
};
