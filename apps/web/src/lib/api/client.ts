import type {
  AvailabilityInput,
  AvailabilityRule,
  Booking,
  BookingInput,
  Course,
  CourseInput,
  CourseListItem,
  Enrollment,
  LoginInput,
  Material,
  Paginated,
  Progress,
  Question,
  Quiz,
  QuizAttempt,
  QuizForStudent,
  QuizInput,
  RegisterInput,
  SettingsInput,
  Slot,
  TutorProfile,
  User,
} from '@tutorbase/shared';

export type CourseQuery = {
  q?: string;
  subject?: string;
  level?: string;
  language?: string;
  page?: number;
  pageSize?: number;
};

export type CourseDetail = Course & {
  tutor_name: string;
  tutor_bio: string;
  material_count: number;
  quiz_count: number;
};

export type CourseStudent = {
  student_id: string;
  name: string;
  progress: Progress;
  last_activity_at: string | null;
};

export type TutorProfileInput = Pick<
  TutorProfile,
  'bio' | 'meeting_link' | 'session_minutes'
>;

export type MaterialUploadInput = {
  filename: string;
  type: 'pdf' | 'markdown';
  size_bytes: number;
};

export type MaterialUpload = {
  upload_url: string;
  storage_key: string;
};

export type MaterialCreate = {
  title: string;
  type: 'pdf' | 'markdown';
  size_bytes: number;
  storage_key: string;
};

export type MaterialPatch = {
  title?: string;
  position?: number;
};

export type BookingView = Booking & {
  student_name: string;
  tutor_name: string;
  course_title: string;
  meeting_link: string;
};

export type QuizSummary = Quiz & { question_count: number };

export type QuizDetail = Quiz & { questions: Question[] };

export type AccountExport = {
  user: User;
  tutor_profile: TutorProfile | null;
  enrollments: Enrollment[];
  bookings: Booking[];
  quiz_attempts: QuizAttempt[];
};

/** One method per v1 endpoint in spec section 8. Phase 4 AI routes are omitted. */
export interface ApiClient {
  health(): Promise<{ status: 'ok' }>;

  register(input: RegisterInput): Promise<User>;
  login(input: LoginInput): Promise<User>;
  logout(): Promise<void>;
  me(): Promise<User>;

  updateMe(input: SettingsInput): Promise<User>;
  exportMe(): Promise<AccountExport>;
  deleteMe(input: { password: string }): Promise<void>;
  myCourses(): Promise<Course[]>;

  tutorProfile(): Promise<TutorProfile>;
  updateTutorProfile(input: TutorProfileInput): Promise<TutorProfile>;

  courses(query?: CourseQuery): Promise<Paginated<CourseListItem>>;
  course(slug: string): Promise<CourseDetail>;
  createCourse(input: Pick<CourseInput, 'title'>): Promise<Course>;
  updateCourse(id: string, input: CourseInput): Promise<Course>;
  publishCourse(id: string): Promise<Course>;
  unpublishCourse(id: string): Promise<Course>;
  deleteCourse(id: string): Promise<void>;
  courseStudents(courseId: string): Promise<CourseStudent[]>;

  enroll(courseId: string): Promise<Enrollment>;
  unenroll(courseId: string): Promise<void>;

  createMaterialUploadUrl(
    courseId: string,
    input: MaterialUploadInput,
  ): Promise<MaterialUpload>;
  createMaterial(courseId: string, input: MaterialCreate): Promise<Material>;
  materials(courseId: string): Promise<Material[]>;
  updateMaterial(id: string, input: MaterialPatch): Promise<Material>;
  deleteMaterial(id: string): Promise<void>;
  materialDownloadUrl(id: string): Promise<{ download_url: string }>;

  completeMaterial(materialId: string): Promise<void>;
  uncompleteMaterial(materialId: string): Promise<void>;

  availability(): Promise<AvailabilityRule[]>;
  updateAvailability(input: AvailabilityInput): Promise<AvailabilityRule[]>;
  slots(courseId: string, query: { from: string; to: string }): Promise<Slot[]>;

  createBooking(input: BookingInput): Promise<BookingView>;
  myBookings(scope: 'upcoming' | 'past'): Promise<BookingView[]>;
  cancelBooking(id: string): Promise<BookingView>;

  quizzes(courseId: string): Promise<QuizSummary[]>;
  createQuiz(courseId: string, input: QuizInput): Promise<QuizDetail>;
  quiz(id: string): Promise<QuizDetail | QuizForStudent>;
  updateQuiz(id: string, input: QuizInput): Promise<QuizDetail>;
  publishQuiz(id: string): Promise<Quiz>;
  deleteQuiz(id: string): Promise<void>;

  submitAttempt(
    quizId: string,
    input: { answers: number[] },
  ): Promise<QuizAttempt>;
  myAttempts(quizId: string): Promise<QuizAttempt[]>;
  progress(courseId: string): Promise<Progress>;
}
