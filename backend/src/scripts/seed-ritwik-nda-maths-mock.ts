import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import "dotenv/config";
import pg from "pg";

const examTitle = "NIDUS Academy Mathematics Mock Test - 06 July 2026";
const subject = "Mathematics";
const topic =
  "Set Theory, Relations & Functions, Sequence & Series, Complex Numbers, Quadratic Equations & Inequalities, Permutation & Combinations";
const publishAt = new Date("2026-07-06T10:00:00+05:30");
const durationMinutes = 150;
const totalMarks = 300;
const marksPerQuestion = 2.5;
const targetBatchNames = ["NDA Crash Course Online 2026", "NDA Crash Course Offline 2026"];

const answerKey = [
  "A","B","C","C","A","B","C","C","B","B",
  "A","C","A","C","C","C","B","C","B","C",
  "C","A","C","B","A","C","D","B","C","A",
  "B","A","B","B","B","A","C","B","B","C",
  "B","C","B","C","A","C","A","A","B","B",
  "C","B","C","A","A","B","A","D","A","C",
  "B","B","C","C","B","B","D","A","A","A",
  "A","C","D","B","B","C","C","B","A","C",
  "C","C","B","A","B","A","B","B","B","C",
  "B","A","A","C","A","B","A","A","B","B",
  "C","B","B","B","C","B","B","A","C","B",
  "A","C","A","B","B","A","B","B","D","C"
];

const reviewRequired = new Map<number, string>([
  [85, "Provided options do not include the mathematically exact value. Please review before public attempt."],
  [91, "Question condition is inconsistent: roots 2 and m do not satisfy the stated coefficient relation. Please review."],
  [104, "For a committee of 4, the computed answer does not match the listed options. Please review."],
  [107, "The sum 1+4+9+...+100 is 385, which is not listed. Please review."],
  [120, "For a committee of 5 with at least 3 women, the computed answer does not match the listed options. Please review."]
]);

const paper = String.raw`
Q1.
If (A={1,2,3,4,5}) and (B={2,4,6,8}), then (A\cap B) is
(A) {2,4}
(B) {1,3,5}
(C) {6,8}
(D) {2,4,6}
Q2.
If (f(x)=3x-5), then (f(4)) equals
(A) 5
(B) 7
(C) 12
(D) 17
Q3.
The fifth term of the AP 7, 11, 15,... is
(A) 19
(B) 21
(C) 23
(D) 25
Q4.
The modulus of (3+4i) is
(A) 3
(B) 4
(C) 5
(D) 7
Q5.
The roots of (x^2-9=0) are
(A) +/-3
(B) +/-9
(C) 3 only
(D) -3 only
Q6.
The value of (^{6}P_2) is
(A) 15
(B) 30
(C) 20
(D) 12
Q7.
If (A\subseteq B), then (A-B) is
(A) A
(B) B
(C) Empty set
(D) Universal Set
Q8.
Which of the following is one-one?
(A) (f(x)=x^2)
(B) (f(x)=|x|)
(C) (f(x)=2x+1)
(D) (f(x)=x^2+1)
Q9.
The common difference of the AP 15,12,9,6,...
(A) -2
(B) -3
(C) 3
(D) 6
Q10.
If (i^4=)
(A) -1
(B) 1
(C) i
(D) -i
Q11.
The discriminant of (x^2+4x+4=0) is
(A) 0
(B) 4
(C) 8
(D) 16
Q12.
The value of (5!) is
(A) 60
(B) 100
(C) 120
(D) 720
Q13.
If (n(A)=25), (n(B)=18) and (n(A\cap B)=7), then (n(A\cup B)) equals
(A) 36
(B) 43
(C) 50
(D) 32
Q14.
Which relation on integers is reflexive?
(A) x<y
(B) x>y
(C) x=x
(D) x!=y
Q15.
The sum of first 20 natural numbers is
(A) 190
(B) 200
(C) 210
(D) 220
Q16.
((2+i)(2-i)) equals
(A) 3
(B) 4
(C) 5
(D) 6
Q17.
The equation (x^2-5x+6=0) has roots
(A) 1,6
(B) 2,3
(C) 3,5
(D) 1,5
Q18.
The value of (^{7}C_1) is
(A) 1
(B) 6
(C) 7
(D) 8
Q19.
The complement of the universal set is
(A) Universal set
(B) Empty set
(C) Singleton
(D) Infinite set
Q20.
If (f(x)=x^2+2), then (f(-2)) is
(A) 2
(B) 4
(C) 6
(D) 8
Q21.
The sum of first 10 odd numbers equals
(A) 50
(B) 81
(C) 100
(D) 121
Q22.
The conjugate of (5-6i) is
(A) 5+6i
(B) -5+6i
(C) 6+5i
(D) -5-6i
Q23.
The equation (x^2+1=0) has
(A) Two real roots
(B) One real root
(C) No real roots
(D) Three roots
Q24.
The value of (^{8}P_3) equals
(A) 56
(B) 336
(C) 512
(D) 720
Q25.
If (A\subseteq B) and (B\subseteq A), then
(A) (A=B)
(B) (A\ne B)
(C) A is empty
(D) B is universal
Q26.
Which function is onto from R to R?
(A) (x^2)
(B) (|x|)
(C) (x^3)
(D) (e^x)
Q27.
The 15th term of the AP 4,7,10,...
(A) 43
(B) 44
(C) 45
(D) 46
Q28.
(i^{15}) equals
(A) i
(B) -i
(C) 1
(D) -1
Q29.
If the roots of a quadratic equation are equal, then
(A) D>0
(B) D<0
(C) D=0
(D) D>=0
Q30.
The value of (^{9}C_2) equals
(A) 36
(B) 45
(C) 72
(D) 81
Q31.
The number of subsets of a set having 5 elements is
(A) 25
(B) 32
(C) 64
(D) 16
Q32.
The inverse of (f(x)=x+7) is
(A) x-7
(B) x+7
(C) 7-x
(D) x/7
Q33.
The sum of the GP 2,4,8,16 is
(A) 28
(B) 30
(C) 32
(D) 34
Q34.
If (z=i), then (z^2) equals
(A) i
(B) -1
(C) 1
(D) -i
Q35.
The product of roots of (x^2-8x+15=0) is
(A) 8
(B) 15
(C) -15
(D) 23
Q36.
The number of ways of arranging the letters of the word BOOK is
(A) 12
(B) 24
(C) 6
(D) 8
Q37.
If (A\cap B=\varnothing), then A and B are
(A) Equal
(B) Overlapping
(C) Disjoint
(D) Universal
Q38.
The domain of (f(x)=1/(x-2)) is
(A) R
(B) R-{2}
(C) {2}
(D) Positive numbers
Q39.
The common ratio of 3,9,27,...
(A) 2
(B) 3
(C) 6
(D) 9
Q40.
The number of diagonals in a hexagon is
(A) 6
(B) 8
(C) 9
(D) 12
Q41.
If (A={1,2,3,4,5}), (B={2,4,6,8}) and (C={4,5,6}), then ((A\cup B)\cap C) is
(A) {4,5}
(B) {4,5,6}
(C) {5,6}
(D) {4}
Q42.
If (f(x)=2x+3) and (g(x)=x^2), then ((g\circ f)(2)) is
(A) 25
(B) 36
(C) 49
(D) 64
Q43.
The sum of first 15 terms of the AP 8, 13, 18,... is
(A) 615
(B) 645
(C) 675
(D) 705
Q44.
If (z=4-3i), then (|z|) is
(A) 4
(B) 3
(C) 5
(D) 7
Q45.
The roots of (2x^2-7x+3=0) are
(A) 3 and 1/2
(B) 2 and 3
(C) 1 and 3
(D) 1/2 and 2
Q46.
The value of (^{8}P_4) is
(A) 840
(B) 1260
(C) 1680
(D) 3360
Q47.
If (A\subseteq B), then (A\cap B) equals
(A) A
(B) B
(C) Empty set
(D) Universal Set
Q48.
Which of the following is a many-one function?
(A) (f(x)=x^2)
(B) (f(x)=2x+5)
(C) (f(x)=x+1)
(D) (f(x)=3x-2)
Q49.
The 12th term of GP 5,10,20,... is
(A) 5120
(B) 10240
(C) 20480
(D) 40960
Q50.
The argument of the complex number (1+i) is
(A) 30 deg
(B) 45 deg
(C) 60 deg
(D) 90 deg
Q51.
If one root of (x^2-6x+k=0) is 2, then (k) equals
(A) 4
(B) 6
(C) 8
(D) 10
Q52.
The number of permutations of the word "APPLE" is
(A) 120
(B) 60
(C) 30
(D) 20
Q53.
If (n(U)=60), (n(A)=35), (n(B)=28) and (n(A\cap B)=12), then the number outside both A and B is
(A) 7
(B) 8
(C) 9
(D) 10
Q54.
The inverse of (f(x)=5x-2) is
(A) ((x+2)/5)
(B) ((x-2)/5)
(C) (5x+2)
(D) (x/5-2)
Q55.
The sum of the GP (1+3+9+...+3^5) is
(A) 364
(B) 365
(C) 366
(D) 367
Q56.
If (z=2+i), then (z\bar z) equals
(A) 4
(B) 5
(C) 6
(D) 7
Q57.
The quadratic equation whose roots are 4 and -3 is
(A) (x^2-x-12=0)
(B) (x^2+x-12=0)
(C) (x^2-7x+12=0)
(D) (x^2+7x+12=0)
Q58.
The value of (^{10}C_3) equals
(A) 90
(B) 100
(C) 110
(D) 120
Q59.
If (A\cap B=A), then
(A) (A\subseteq B)
(B) (B\subseteq A)
(C) A=B
(D) None
Q60.
Which function is invertible over R?
(A) (x^2)
(B) (|x|)
(C) (2x+7)
(D) (x^4)
Q61.
The common ratio of the GP 243,81,27,... is
(A) 1/2
(B) 1/3
(C) 3
(D) 9
Q62.
The value of ((1+i)^2) is
(A) 2
(B) 2i
(C) 2+2i
(D) -2
Q63.
For real roots of a quadratic equation,
(A) (D<0)
(B) (D>0)
(C) (D>=0)
(D) (D=1)
Q64.
The number of ways of selecting 4 students from 9 students is
(A) 84
(B) 96
(C) 126
(D) 144
Q65.
If (A={1,2,3}), then the number of proper subsets is
(A) 6
(B) 7
(C) 8
(D) 9
Q66.
If (f(x)=sqrt(x)), then its domain is
(A) R
(B) (x>=0)
(C) (x>0)
(D) Integers
Q67.
The 20th term of AP 5,9,13,... is
(A) 77
(B) 78
(C) 79
(D) 81
Q68.
If (z=3+2i), then (z^2) equals
(A) 5+12i
(B) 6+12i
(C) 5+6i
(D) 9+12i
Q69.
The sum of roots of (3x^2+5x-2=0) is
(A) -5/3
(B) 5/3
(C) 2/3
(D) -2/3
Q70.
The value of (^{9}P_3) equals
(A) 504
(B) 672
(C) 720
(D) 756
Q71.
If (A-B=\varnothing), then
(A) (A\subseteq B)
(B) (B\subseteq A)
(C) A=B
(D) None
Q72.
The range of (f(x)=x^2) over R is
(A) R
(B) (x>0)
(C) (y>=0)
(D) Integers
Q73.
The sum of first 12 terms of GP (2,4,8,...) is
(A) 4094
(B) 4095
(C) 4096
(D) 8190
Q74.
The conjugate of (-7+9i) is
(A) (7-9i)
(B) (-7-9i)
(C) (9-7i)
(D) (7+9i)
Q75.
If one root of (x^2-8x+15=0) is 3, the other root is
(A) 4
(B) 5
(C) 6
(D) 7
Q76.
The number of diagonals of an octagon is
(A) 16
(B) 18
(C) 20
(D) 24
Q77.
The Cartesian product (A x B) has how many elements if (n(A)=5) and (n(B)=4)?
(A) 9
(B) 16
(C) 20
(D) 25
Q78.
If (f(x)=3x+1), then (f^{-1}(10)) equals
(A) 2
(B) 3
(C) 4
(D) 5
Q79.
If the arithmetic mean of two numbers is 18 and their difference is 6, then the numbers are
(A) 15,21
(B) 12,24
(C) 16,20
(D) 14,22
Q80.
The number of ways in which 5 different books can be arranged on a shelf is
(A) 24
(B) 60
(C) 120
(D) 720
Q81.
If (A={x:x^2-5x+6=0}) and (B={x:x^2-7x+12=0}), then (A\cup B) is
(A) {2,3}
(B) {3,4}
(C) {2,3,4}
(D) {2,4}
Q82.
If (f(x)=(2x+1)/(x-3)), then (f^{-1}(5)) equals
(A) 4
(B) 5
(C) (16/3)
(D) (8/3)
Q83.
If the sum of first (n) terms of an AP is (3n^2+5n), then the first term is
(A) 5
(B) 8
(C) 10
(D) 12
Q84.
If (z=(3+4i)/(1-i)), then (z) equals
(A) (-1/2+7/2i)
(B) (7/2+1/2i)
(C) (1/2+7/2i)
(D) (2+i)
Q85.
If one root of (2x^2+kx+8=0) is twice the other, then (k) is
(A) +/-8
(B) +/-6
(C) +/-4
(D) +/-10
Q86.
The number of arrangements of the letters of MISSISSIPPI is
(A) 34650
(B) 346500
(C) 69300
(D) 138600
Q87.
If (A\subset B\subset C), then which statement is always true?
(A) (A=C)
(B) (A\subset C)
(C) (C\subset A)
(D) (A=C=\varnothing)
Q88.
If (f(x)=x^2-6x+5), then the minimum value of (f(x)) is
(A) -5
(B) -4
(C) -3
(D) -2
Q89.
The sum of infinite GP (18,6,2,...) is
(A) 24
(B) 27
(C) 30
(D) 36
Q90.
If (z=1+i sqrt(3)), then (|z|^4) equals
(A) 4
(B) 8
(C) 16
(D) 32
Q91.
If the quadratic equation (x^2-(m+3)x+2m=0) has roots 2 and (m), then (m) equals
(A) 1
(B) 2
(C) 3
(D) 4
Q92.
The number of distinct permutations of the word ENGINEERING is
(A) 277200
(B) 831600
(C) 4989600
(D) 9979200
Q93.
If (n(A)=25), (n(B)=18), (n(C)=15), (n(A\cap B)=8), (n(B\cap C)=5), (n(A\cap C)=6), (n(A\cap B\cap C)=3), then (n(A\cup B\cup C)) is
(A) 42
(B) 45
(C) 47
(D) 50
Q94.
If (f(x)=x^3-3x), then the number of turning points is
(A) 0
(B) 1
(C) 2
(D) 3
Q95.
If the 5th term of an AP is 17 and the 12th term is 45, then the first term is
(A) 1
(B) 3
(C) 5
(D) 7
Q96.
If (z^2=-16), then (z) is
(A) +/-4
(B) +/-4i
(C) +/-8i
(D) +/-8
Q97.
The condition for unequal real roots of a quadratic equation is
(A) (D>0)
(B) (D>=0)
(C) (D<0)
(D) (D=0)
Q98.
The number of ways in which 5 boys and 5 girls can sit alternately in a row is
(A) 28800
(B) 14400
(C) 7200
(D) 86400
Q99.
The number of subsets containing exactly three elements of a six-element set is
(A) 15
(B) 20
(C) 25
(D) 30
Q100.
If (f(x)=(x+1)/(x-2)), then the value of (f^{-1}(4)) is
(A) 2
(B) 3
(C) 4
(D) 5
Q101.
If the sum of first (n) odd numbers is 1089, then (n) equals
(A) 31
(B) 32
(C) 33
(D) 34
Q102.
If (z=2(cos60+i sin60)), then (z^3) equals
(A) (8i)
(B) (-8)
(C) (8)
(D) (-8i)
Q103.
If the roots of (ax^2+bx+c=0) are reciprocals of each other, then
(A) (a+b=c)
(B) (a=c)
(C) (b=0)
(D) (a=-c)
Q104.
The number of ways of selecting a committee of 4 from 6 men and 5 women so that at least 2 women are included is
(A) 275
(B) 285
(C) 295
(D) 305
Q105.
If (A triangle B) denotes the symmetric difference, then (A triangle A) equals
(A) A
(B) Universal Set
(C) Empty set
(D) Cannot be determined
Q106.
The domain of (f(x)=sqrt(9-x^2)) is
(A) ((-3,3))
(B) ([-3,3])
(C) ((-infinity,3])
(D) ([0,3])
Q107.
The sum of the series (1+4+9+...+100) is
(A) 3385
(B) 3850
(C) 3550
(D) 3025
Q108.
If (z=3+4i), then (1/z) equals
(A) ((3-4i)/25)
(B) ((3+4i)/25)
(C) ((4-3i)/25)
(D) ((4+3i)/25)
Q109.
If the equation (x^2+px+20=0) has integral roots, then the number of possible values of (p) is
(A) 4
(B) 5
(C) 6
(D) 8
Q110.
The number of ways of arranging 8 persons around a circular table is
(A) (8!)
(B) (7!)
(C) (6!)
(D) (8!/2)
Q111.
The number of proper subsets of an eight-element set is
(A) 255
(B) 256
(C) 128
(D) 254
Q112.
If (f(x)=|x|), then the function is
(A) One-one only
(B) Onto only
(C) Neither one-one nor onto (over R->R)
(D) Both one-one and onto
Q113.
If the arithmetic mean of two positive numbers exceeds their geometric mean by 2 and their product is 64, then the numbers are
(A) 4 and 16
(B) 6 and 12
(C) 8 and 8
(D) 2 and 32
Q114.
If (z=i^{101}), then (z) equals
(A) 1
(B) i
(C) -1
(D) -i
Q115.
If the roots of (x^2-8x+k=0) differ by 2, then (k) equals
(A) 12
(B) 15
(C) 16
(D) 18
Q116.
The number of ways of distributing 5 distinct prizes among 8 students so that no student gets more than one prize is
(A) (^{8}P_5)
(B) (^{8}C_5)
(C) (8^5)
(D) (5!)
Q117.
If (A) has 4 elements and (B) has 5 elements, then the number of functions from (A) to (B) is
(A) 20
(B) 625
(C) 1024
(D) 3125
Q118.
If the common ratio of a GP is 2 and the sum of first 8 terms is 765, then the first term is
(A) 2
(B) 3
(C) 4
(D) 5
Q119.
If ((2+i)^n) is purely real, then the least positive value of (n) is
(A) 2
(B) 4
(C) 6
(D) No such positive integer
Q120.
A committee of 5 is to be formed from 7 men and 6 women. The number of committees containing at least 3 women is
(A) 791
(B) 756
(C) 651
(D) 861
`;

type ParsedQuestion = {
  number: number;
  questionText: string;
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

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseQuestions(): ParsedQuestion[] {
  const blocks = paper
    .replace(/\r/g, "")
    .split(/\n(?=Q\d+\.)/)
    .map((block) => block.trim())
    .filter(Boolean);

  const parsed = blocks.map((block) => {
    const match = block.match(
      /^Q(\d+)\.\s*([\s\S]*?)\n\(A\)\s*([\s\S]*?)\n\(B\)\s*([\s\S]*?)\n\(C\)\s*([\s\S]*?)\n\(D\)\s*([\s\S]*)$/m
    );
    if (!match) throw new Error(`Could not parse question block: ${block.slice(0, 80)}`);
    const number = Number(match[1]);
    return {
      number,
      questionText: normalize(match[2]),
      optionA: normalize(match[3]),
      optionB: normalize(match[4]),
      optionC: normalize(match[5]),
      optionD: normalize(match[6]),
      correctAnswer: answerKey[number - 1],
      explanation: reviewRequired.get(number)
        ? `Review required: ${reviewRequired.get(number)}`
        : "Answer key seeded from NIDUS Mathematics Mock Test solution review.",
      marks: marksPerQuestion,
      negativeMarks: 0,
      difficultyLevel: number <= 40 ? "EASY" : number <= 80 ? "MEDIUM" : "HARD",
      topic
    };
  });

  if (parsed.length !== 120) throw new Error(`Expected 120 questions, parsed ${parsed.length}`);
  if (answerKey.length !== parsed.length) throw new Error(`Answer key has ${answerKey.length} entries for ${parsed.length} questions`);
  return parsed;
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  query_timeout: 30000,
  statement_timeout: 30000
});

async function upsertBatchExam(batchId: string, batchName: string, teacherId: string, teacherName: string, questions: ParsedQuestion[]) {
  const existingTest = await client.query(
    'SELECT "id" FROM "Test" WHERE "title" = $1 AND "batchId" = $2 LIMIT 1',
    [examTitle, batchId]
  );

  let testId = existingTest.rows[0]?.id as string | undefined;
  if (testId) {
    const attempts = await client.query('SELECT COUNT(*)::int AS count FROM "TestAttempt" WHERE "testId" = $1', [testId]);
    const attemptCount = attempts.rows[0]?.count ?? 0;
    if (attemptCount > 0) {
      throw new Error(`Cannot update ${batchName}; ${attemptCount} attempt(s) already exist for this exam.`);
    }
    await client.query('DELETE FROM "Question" WHERE "testId" = $1', [testId]);
    await client.query(
      `UPDATE "Test"
       SET "description" = $1, "examType" = $2, "category" = $3, "subject" = $4, "topic" = $5,
           "teacherId" = $6, "publishAt" = $7, "status" = $8, "reviewedAt" = $9, "approvedAt" = $10,
           "approvedById" = $11, "duration" = $12, "totalMarks" = $13, "isMockTest" = $14, "isLive" = $15
       WHERE "id" = $16`,
      [
        `Official NIDUS Academy Mathematics Mock Test. ${totalMarks} marks, ${durationMinutes} minutes.`,
        "NDA",
        "Defence",
        subject,
        topic,
        teacherId,
        publishAt,
        "DRAFT",
        null,
        null,
        null,
        durationMinutes,
        totalMarks,
        false,
        true,
        testId
      ]
    );
  } else {
    testId = randomUUID();
    await client.query(
      `INSERT INTO "Test"
       ("id", "title", "description", "examType", "category", "subject", "topic", "batchId", "teacherId",
        "publishAt", "status", "reviewedAt", "approvedAt", "approvedById", "duration", "totalMarks",
        "isMockTest", "isLive", "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
      [
        testId,
        examTitle,
        `Official NIDUS Academy Mathematics Mock Test. ${totalMarks} marks, ${durationMinutes} minutes.`,
        "NDA",
        "Defence",
        subject,
        topic,
        batchId,
        teacherId,
        publishAt,
        "DRAFT",
        null,
        null,
        null,
        durationMinutes,
        totalMarks,
        false,
        true,
        new Date()
      ]
    );
  }

  for (const question of questions) {
    await client.query(
      `INSERT INTO "Question"
       ("id", "testId", "questionText", "optionA", "optionB", "optionC", "optionD", "correctAnswer",
        "explanation", "marks", "negativeMarks", "difficultyLevel", "topic", "reviewStatus")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        randomUUID(),
        testId,
        question.questionText,
        question.optionA,
        question.optionB,
        question.optionC,
        question.optionD,
        question.correctAnswer,
        question.explanation,
        question.marks,
        question.negativeMarks,
        question.difficultyLevel,
        question.topic,
        "DRAFT"
      ]
    );
  }

  const draft = {
    examType: "NDA",
    category: "Defence",
    source: "Seeded from Maths QP supplied on 2026-07-04",
    scheduledAt: publishAt.toISOString(),
    totalMarks,
    durationMinutes,
    reviewRequiredQuestions: Array.from(reviewRequired.keys()),
    questions
  };

  const existingRecord = await client.query(
    'SELECT "id" FROM "TeacherExamRecord" WHERE "title" = $1 AND "batchId" = $2 LIMIT 1',
    [examTitle, batchId]
  );

  const recordData = {
    batchId,
    batchName,
    testId,
    subject,
    course: "NDA Crash Course",
    teacherId,
    teacherName,
    title: examTitle,
    topic,
    questionCount: questions.length,
    durationMinutes,
    difficulty: "MIXED",
    instructions: "Official Mathematics mock test. Duration: 10:00 AM to 12:30 PM. Total marks: 300.",
    draft,
    status: "DRAFT",
    approvedBy: null,
    approvedAt: null,
    analytics: {
      commonExamGroup: "NDA_MATHS_MOCK_2026_07_06",
      reviewRequiredQuestions: Array.from(reviewRequired.keys())
    }
  };

  let examRecordId = existingRecord.rows[0]?.id as string | undefined;
  if (examRecordId) {
    await client.query(
      `UPDATE "TeacherExamRecord"
       SET "testId" = $1, "subject" = $2, "course" = $3, "teacherId" = $4, "teacherName" = $5,
           "title" = $6, "topic" = $7, "questionCount" = $8, "durationMinutes" = $9, "difficulty" = $10,
           "instructions" = $11, "draft" = $12::jsonb, "status" = $13, "approvedBy" = $14,
           "approvedAt" = $15, "analytics" = $16::jsonb, "updatedAt" = $17
       WHERE "id" = $18`,
      [
        recordData.testId,
        recordData.subject,
        recordData.course,
        recordData.teacherId,
        recordData.teacherName,
        recordData.title,
        recordData.topic,
        recordData.questionCount,
        recordData.durationMinutes,
        recordData.difficulty,
        recordData.instructions,
        JSON.stringify(recordData.draft),
        recordData.status,
        recordData.approvedBy,
        recordData.approvedAt,
        JSON.stringify(recordData.analytics),
        new Date(),
        examRecordId
      ]
    );
  } else {
    examRecordId = randomUUID();
    await client.query(
      `INSERT INTO "TeacherExamRecord"
       ("id", "batchId", "batchName", "testId", "subject", "course", "teacherId", "teacherName", "title",
        "topic", "questionCount", "durationMinutes", "difficulty", "instructions", "draft", "status",
        "approvedBy", "approvedAt", "analytics", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16,$17,$18,$19::jsonb,$20,$21)`,
      [
        examRecordId,
        recordData.batchId,
        recordData.batchName,
        recordData.testId,
        recordData.subject,
        recordData.course,
        recordData.teacherId,
        recordData.teacherName,
        recordData.title,
        recordData.topic,
        recordData.questionCount,
        recordData.durationMinutes,
        recordData.difficulty,
        recordData.instructions,
        JSON.stringify(recordData.draft),
        recordData.status,
        recordData.approvedBy,
        recordData.approvedAt,
        JSON.stringify(recordData.analytics),
        new Date(),
        new Date()
      ]
    );
  }

  return { batchName, testId, examRecordId, questionCount: questions.length };
}

export async function seedRitwikNdaMathsMock() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");
  await client.connect();
  const questions = parseQuestions();
  const ritwikResult = await client.query(
    `SELECT "id", "name", "email", "role"
     FROM "User"
     WHERE LOWER("name") = LOWER($1) OR LOWER("email") LIKE LOWER($2)
     ORDER BY "updatedAt" DESC
     LIMIT 1`,
    ["Ritwik", "%ritwik%"]
  );
  const ritwik = ritwikResult.rows[0];
  if (!ritwik) throw new Error("Ritwik user account not found.");

  const batchResult = await client.query(
    'SELECT "id", "name", "status" FROM "Batch" WHERE "name" = ANY($1::text[])',
    [targetBatchNames]
  );
  const batches = batchResult.rows;
  const found = new Set(batches.map((batch) => batch.name));
  const missing = targetBatchNames.filter((name) => !found.has(name));
  if (missing.length) throw new Error(`Missing target batch(es): ${missing.join(", ")}`);

  const results = [];
  for (const batchName of targetBatchNames) {
    const batch = batches.find((item) => item.name === batchName);
    if (!batch) continue;
    await client.query("BEGIN");
    try {
      results.push(await upsertBatchExam(batch.id, batch.name, ritwik.id, ritwik.name, questions));
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }

  return {
    seeded: true,
    teacher: { id: ritwik.id, name: ritwik.name, email: ritwik.email, role: ritwik.role },
    title: examTitle,
    schedule: "2026-07-06 10:00 AM - 12:30 PM",
    durationMinutes,
    totalMarks,
    questions: questions.length,
    reviewRequiredQuestions: Array.from(reviewRequired.keys()),
    results
  };
}

const isDirectRun = process.argv[1] ? fileURLToPath(import.meta.url) === process.argv[1] : false;

if (isDirectRun) {
  seedRitwikNdaMathsMock()
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error("Failed to seed Ritwik NDA Mathematics mock exam", error);
      process.exitCode = 1;
    })
    .finally(async () => {
    await client.end();
    });
}
