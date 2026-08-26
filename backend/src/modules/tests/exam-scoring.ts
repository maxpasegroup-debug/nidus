export type ObjectiveQuestion = {
  id: string;
  correctAnswer: string;
  marks: number;
  negativeMarks: number;
};

export type ObjectiveAnswer = {
  questionId: string;
  selectedAnswer: string;
};

export function calculateObjectiveScore(questions: ObjectiveQuestion[], answers: ObjectiveAnswer[]) {
  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer.selectedAnswer]));
  let score = 0;
  let totalCorrect = 0;
  let totalWrong = 0;

  for (const question of questions) {
    const selected = answerByQuestion.get(question.id);
    if (!selected) continue;
    if (question.correctAnswer === selected) {
      score += question.marks;
      totalCorrect += 1;
    } else {
      score -= question.negativeMarks;
      totalWrong += 1;
    }
  }

  return {
    score,
    totalCorrect,
    totalWrong,
    totalUnanswered: Math.max(0, questions.length - totalCorrect - totalWrong),
  };
}
