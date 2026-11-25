import {
  AvailabilityRuleSchema,
  BookingSchema,
  CourseSchema,
  EnrollmentSchema,
  MaterialSchema,
  QuestionSchema,
  QuizAttemptSchema,
  QuizSchema,
  TutorProfileSchema,
  UserSchema,
  type AvailabilityRule,
  type Booking,
  type Course,
  type Enrollment,
  type Material,
  type Question,
  type Quiz,
  type QuizAttempt,
  type TutorProfile,
  type User,
} from '@tutorbase/shared';

import { addMinutes, weekdayInstant } from './time';

export const DEMO_PASSWORD = 'password1234';

const ada = '11111111-1111-4111-8111-111111111111';
const noah = '22222222-2222-4222-8222-222222222222';
const sam = '33333333-3333-4333-8333-333333333333';
const lea = '44444444-4444-4444-8444-444444444444';
const jonas = '55555555-5555-4555-8555-555555555555';
const maya = '66666666-6666-4666-8666-666666666666';

const german = 'c1111111-1111-4111-8111-111111111111';
const physics = 'c2222222-2222-4222-8222-222222222222';
const music = 'c3333333-3333-4333-8333-333333333333';
const algebra = 'c4444444-4444-4444-8444-444444444444';
const python = 'c5555555-5555-4555-8555-555555555555';
const goethe = 'c6666666-6666-4666-8666-666666666666';

const greetings = 'a2222222-2222-4222-8222-222222222222';
const germanQuiz = 'd1111111-1111-4111-8111-111111111111';
const samGerman = 'e1111111-1111-4111-8111-111111111111';

const publishedAt = '2026-09-01T08:00:00.000Z';

export const seedUsers: User[] = [
  {
    id: ada,
    email: 'tutor@demo.test',
    name: 'Ada Meier',
    role: 'tutor',
    locale: 'en',
    timezone: 'Europe/Berlin',
  },
  {
    id: noah,
    email: 'noah@demo.test',
    name: 'Noah Klein',
    role: 'tutor',
    locale: 'en',
    timezone: 'Europe/Berlin',
  },
  {
    id: sam,
    email: 'student@demo.test',
    name: 'Sam Okonkwo',
    role: 'student',
    locale: 'en',
    timezone: 'Europe/Berlin',
  },
  {
    id: lea,
    email: 'lea@demo.test',
    name: 'Lea Bernard',
    role: 'student',
    locale: 'en',
    timezone: 'Europe/Berlin',
  },
  {
    id: jonas,
    email: 'jonas@demo.test',
    name: 'Jonas Berg',
    role: 'student',
    locale: 'en',
    timezone: 'Europe/Berlin',
  },
  {
    id: maya,
    email: 'maya@demo.test',
    name: 'Maya Costa',
    role: 'student',
    locale: 'en',
    timezone: 'Europe/Berlin',
  },
].map((user) => UserSchema.parse(user));

export const seedProfiles: TutorProfile[] = [
  {
    user_id: ada,
    bio: 'German teacher. Conversation first, grammar when it helps.',
    meeting_link: 'https://example.com/meet/ada',
    session_minutes: 45,
  },
  {
    user_id: noah,
    bio: 'I teach maths, programming, and exam technique.',
    meeting_link: 'https://example.com/meet/noah',
    session_minutes: 60,
  },
].map((profile) => TutorProfileSchema.parse(profile));

export const seedCourses: Course[] = [
  {
    id: german,
    tutor_id: ada,
    title: 'German for beginners',
    slug: 'german-for-beginners',
    description:
      'Start speaking German: greetings, the alphabet, and simple sentences.',
    subject: 'Languages',
    level: 'Beginner',
    language: 'de',
    status: 'published',
    published_at: publishedAt,
  },
  {
    id: physics,
    tutor_id: ada,
    title: 'Physics basics',
    slug: 'physics-basics',
    description: 'Motion, force, and energy, with worked examples.',
    subject: 'Science',
    level: 'Intermediate',
    language: 'en',
    status: 'published',
    published_at: publishedAt,
  },
  {
    id: music,
    tutor_id: ada,
    title: 'Music theory',
    slug: 'music-theory',
    description: 'Notes, rhythm, and keys. Not published yet.',
    subject: 'Music',
    level: 'Beginner',
    language: 'en',
    status: 'draft',
    published_at: null,
  },
  {
    id: algebra,
    tutor_id: noah,
    title: 'Algebra I',
    slug: 'algebra-i',
    description:
      'Equations, factoring, and graphs for students past arithmetic.',
    subject: 'Mathematics',
    level: 'Advanced',
    language: 'en',
    status: 'published',
    published_at: publishedAt,
  },
  {
    id: python,
    tutor_id: noah,
    title: 'Intro to Python',
    slug: 'intro-to-python',
    description: 'Write small programs: variables, functions, and lists.',
    subject: 'Programming',
    level: 'Beginner',
    language: 'en',
    status: 'published',
    published_at: publishedAt,
  },
  {
    id: goethe,
    tutor_id: noah,
    title: 'Goethe exam prep',
    slug: 'goethe-exam-prep',
    description:
      'Practice for the Goethe certificate: reading, listening cues, and writing.',
    subject: 'Exam preparation',
    level: 'Intermediate',
    language: 'de',
    status: 'published',
    published_at: publishedAt,
  },
].map((course) => CourseSchema.parse(course));

export const seedMaterials: Material[] = [
  {
    id: 'a1111111-1111-4111-8111-111111111111',
    course_id: german,
    title: 'The alphabet',
    type: 'pdf',
    storage_key: 'materials/german/alphabet.pdf',
    size_bytes: 120_000,
    position: 0,
    ingest_status: 'ready',
  },
  {
    id: greetings,
    course_id: german,
    title: 'Greetings',
    type: 'markdown',
    storage_key: 'materials/german/greetings.md',
    size_bytes: 4_000,
    position: 1,
    ingest_status: 'ready',
  },
  {
    id: 'a3333333-3333-4333-8333-333333333333',
    course_id: physics,
    title: 'Motion',
    type: 'markdown',
    storage_key: 'materials/physics/motion.md',
    size_bytes: 8_000,
    position: 0,
    ingest_status: 'ready',
  },
  {
    id: 'a4444444-4444-4444-8444-444444444444',
    course_id: algebra,
    title: 'Linear equations',
    type: 'pdf',
    storage_key: 'materials/algebra/linear.pdf',
    size_bytes: 240_000,
    position: 0,
    ingest_status: 'ready',
  },
  {
    id: 'a5555555-5555-4555-8555-555555555555',
    course_id: python,
    title: 'Setup',
    type: 'markdown',
    storage_key: 'materials/python/setup.md',
    size_bytes: 3_000,
    position: 0,
    ingest_status: 'ready',
  },
  {
    id: 'a6666666-6666-4666-8666-666666666666',
    course_id: goethe,
    title: 'Vocabulary list',
    type: 'markdown',
    storage_key: 'materials/goethe/vocab.md',
    size_bytes: 6_000,
    position: 0,
    ingest_status: 'ready',
  },
].map((material) => MaterialSchema.parse(material));

export const seedEnrollments: Enrollment[] = [
  { id: samGerman, course_id: german, student_id: sam },
  {
    id: 'e2222222-2222-4222-8222-222222222222',
    course_id: german,
    student_id: lea,
  },
  {
    id: 'e3333333-3333-4333-8333-333333333333',
    course_id: physics,
    student_id: maya,
  },
  {
    id: 'e4444444-4444-4444-8444-444444444444',
    course_id: algebra,
    student_id: jonas,
  },
  {
    id: 'e5555555-5555-4555-8555-555555555555',
    course_id: python,
    student_id: lea,
  },
  {
    id: 'e6666666-6666-4666-8666-666666666666',
    course_id: goethe,
    student_id: sam,
  },
].map((enrollment) => EnrollmentSchema.parse(enrollment));

export type Completion = {
  enrollment_id: string;
  material_id: string;
  completed_at: string;
};

export const seedCompletions: Completion[] = [
  {
    enrollment_id: samGerman,
    material_id: greetings,
    completed_at: '2026-11-01T10:00:00.000Z',
  },
];

export const seedAvailability: AvailabilityRule[] = [
  {
    id: '71111111-1111-4111-8111-111111111111',
    tutor_id: ada,
    weekday: 1,
    start_time: '09:00',
    end_time: '12:00',
  },
  {
    id: '72222222-2222-4222-8222-222222222222',
    tutor_id: ada,
    weekday: 3,
    start_time: '14:00',
    end_time: '17:00',
  },
  {
    id: '73333333-3333-4333-8333-333333333333',
    tutor_id: noah,
    weekday: 2,
    start_time: '10:00',
    end_time: '13:00',
  },
  {
    id: '74444444-4444-4444-8444-444444444444',
    tutor_id: noah,
    weekday: 4,
    start_time: '16:00',
    end_time: '19:00',
  },
].map((rule) => AvailabilityRuleSchema.parse(rule));

const adaUpcoming = weekdayInstant(1, '09:00', 'Europe/Berlin', 'future');
const noahPast = weekdayInstant(2, '10:00', 'Europe/Berlin', 'past');
const noahFuture = weekdayInstant(4, '16:00', 'Europe/Berlin', 'future');

export const seedBookings: Booking[] = [
  {
    id: '81111111-1111-4111-8111-111111111111',
    tutor_id: ada,
    student_id: sam,
    course_id: german,
    starts_at: adaUpcoming,
    ends_at: addMinutes(adaUpcoming, 45),
    status: 'booked',
    cancelled_by: null,
    reminder_sent_at: null,
  },
  {
    id: '82222222-2222-4222-8222-222222222222',
    tutor_id: noah,
    student_id: lea,
    course_id: python,
    starts_at: noahPast,
    ends_at: addMinutes(noahPast, 60),
    status: 'booked',
    cancelled_by: null,
    reminder_sent_at: null,
  },
  {
    id: '83333333-3333-4333-8333-333333333333',
    tutor_id: noah,
    student_id: jonas,
    course_id: algebra,
    starts_at: noahFuture,
    ends_at: addMinutes(noahFuture, 60),
    status: 'cancelled',
    cancelled_by: noah,
    reminder_sent_at: null,
  },
].map((booking) => BookingSchema.parse(booking));

export const seedQuizzes: Quiz[] = [
  {
    id: germanQuiz,
    course_id: german,
    title: 'Week 1 check',
    status: 'published',
    pass_score: 70,
  },
  {
    id: 'd2222222-2222-4222-8222-222222222222',
    course_id: python,
    title: 'Setup quiz',
    status: 'draft',
    pass_score: 70,
  },
].map((quiz) => QuizSchema.parse(quiz));

export const seedQuestions: Question[] = [
  {
    id: 'b1111111-1111-4111-8111-111111111111',
    quiz_id: germanQuiz,
    position: 0,
    prompt: 'What does "Guten Tag" mean?',
    options: ['Good night', 'Good day', 'Thank you'],
    correct_index: 1,
    explanation: 'It is the usual daytime greeting.',
  },
  {
    id: 'b2222222-2222-4222-8222-222222222222',
    quiz_id: germanQuiz,
    position: 1,
    prompt: 'Which letter comes after A in the German alphabet song we use?',
    options: ['B', 'C'],
    correct_index: 0,
    explanation: null,
  },
  {
    id: 'b3333333-3333-4333-8333-333333333333',
    quiz_id: 'd2222222-2222-4222-8222-222222222222',
    position: 0,
    prompt: 'What runs a Python file?',
    options: ['A browser', 'The Python interpreter'],
    correct_index: 1,
    explanation: null,
  },
].map((question) => QuestionSchema.parse(question));

export const seedAttempts: QuizAttempt[] = [
  {
    id: 'f1111111-1111-4111-8111-111111111111',
    quiz_id: germanQuiz,
    student_id: sam,
    answers: [1, 0],
    score: 100,
  },
].map((attempt) => QuizAttemptSchema.parse(attempt));

if (seedUsers.filter((user) => user.role === 'tutor').length !== 2) {
  throw new Error('Seed needs 2 tutors');
}
if (seedUsers.filter((user) => user.role === 'student').length !== 4) {
  throw new Error('Seed needs 4 students');
}
if (
  seedCourses.length !== 6 ||
  seedCourses.filter((course) => course.status === 'draft').length !== 1
) {
  throw new Error('Seed needs 6 courses, one of them a draft');
}
