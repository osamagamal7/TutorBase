import { EnrollmentSchema, MaterialSchema } from '@tutorbase/shared';

import type { ApiClient } from './client';
import {
  db,
  findEnrollment,
  requireCourse,
  requireOwner,
  requireUser,
} from './db';
import { apiError } from './errors';
import { readInput } from './parse';
import { courseProgress } from './progress';
import { run } from './delay';

const MAX_MATERIAL_BYTES = 10 * 1024 * 1024;
const MAX_MATERIALS = 30;

function canReadMaterials(courseId: string, userId: string) {
  const course = requireCourse(courseId);
  return (
    course.tutor_id === userId || Boolean(findEnrollment(courseId, userId))
  );
}

export const learningApi: Pick<
  ApiClient,
  | 'enroll'
  | 'unenroll'
  | 'createMaterialUploadUrl'
  | 'createMaterial'
  | 'materials'
  | 'updateMaterial'
  | 'deleteMaterial'
  | 'materialDownloadUrl'
  | 'completeMaterial'
  | 'uncompleteMaterial'
  | 'progress'
> = {
  enroll(courseId) {
    return run(() => {
      const user = requireUser();
      const course = requireCourse(courseId);
      if (course.status !== 'published') {
        throw apiError('NOT_FOUND', 'Course not found');
      }
      const existing = findEnrollment(course.id, user.id);
      if (existing) return { ...existing };
      const enrollment = EnrollmentSchema.parse({
        id: crypto.randomUUID(),
        course_id: course.id,
        student_id: user.id,
      });
      db.enrollments.push(enrollment);
      return { ...enrollment };
    });
  },

  unenroll(courseId) {
    return run(() => {
      const user = requireUser();
      const enrollment = findEnrollment(courseId, user.id);
      if (!enrollment) throw apiError('NOT_ENROLLED', 'You are not enrolled');
      const now = Date.now();
      for (const booking of db.bookings) {
        if (
          booking.course_id === courseId &&
          booking.student_id === user.id &&
          booking.status === 'booked' &&
          new Date(booking.starts_at).getTime() > now
        ) {
          booking.status = 'cancelled';
          booking.cancelled_by = user.id;
        }
      }
      db.completions = db.completions.filter(
        (completion) => completion.enrollment_id !== enrollment.id,
      );
      db.enrollments = db.enrollments.filter(
        (item) => item.id !== enrollment.id,
      );
    });
  },

  createMaterialUploadUrl(courseId, input) {
    return run(() => {
      const user = requireUser();
      const course = requireCourse(courseId);
      requireOwner(course, user);
      if (input.type !== 'pdf' && input.type !== 'markdown') {
        throw apiError('VALIDATION_ERROR', 'Invalid input');
      }
      if (input.size_bytes > MAX_MATERIAL_BYTES) {
        throw apiError('FILE_TOO_LARGE', 'Materials must be 10 MB or smaller');
      }
      const count = db.materials.filter(
        (material) => material.course_id === course.id,
      ).length;
      if (count >= MAX_MATERIALS) {
        throw apiError(
          'MATERIAL_LIMIT',
          'A course can have at most 30 materials',
        );
      }
      const safeName = input.filename.replace(/[^\w.-]+/g, '-').slice(0, 80);
      const storageKey = `materials/${course.id}/${crypto.randomUUID()}-${safeName}`;
      return {
        upload_url: `https://example.com/upload/${storageKey}`,
        storage_key: storageKey,
      };
    });
  },

  createMaterial(courseId, input) {
    return run(() => {
      const user = requireUser();
      const course = requireCourse(courseId);
      requireOwner(course, user);
      const count = db.materials.filter(
        (material) => material.course_id === course.id,
      ).length;
      if (count >= MAX_MATERIALS) {
        throw apiError(
          'MATERIAL_LIMIT',
          'A course can have at most 30 materials',
        );
      }
      const position =
        db.materials
          .filter((material) => material.course_id === course.id)
          .reduce((max, material) => Math.max(max, material.position), -1) + 1;
      const material = readInput(MaterialSchema, {
        id: crypto.randomUUID(),
        course_id: course.id,
        title: input.title,
        type: input.type,
        storage_key: input.storage_key,
        size_bytes: input.size_bytes,
        position,
        ingest_status: 'pending',
      });
      db.materials.push(material);
      return { ...material };
    });
  },

  materials(courseId) {
    return run(() => {
      const user = requireUser();
      if (!canReadMaterials(courseId, user.id)) {
        throw apiError('FORBIDDEN', 'Enroll to read these materials');
      }
      return db.materials
        .filter((material) => material.course_id === courseId)
        .sort((a, b) => a.position - b.position)
        .map((material) => ({ ...material }));
    });
  },

  updateMaterial(id, input) {
    return run(() => {
      const user = requireUser();
      const material = db.materials.find((item) => item.id === id);
      if (!material) throw apiError('NOT_FOUND', 'Material not found');
      requireOwner(requireCourse(material.course_id), user);
      if (input.title !== undefined) material.title = input.title;
      if (input.position !== undefined) material.position = input.position;
      const parsed = readInput(MaterialSchema, material);
      Object.assign(material, parsed);
      return { ...material };
    });
  },

  deleteMaterial(id) {
    return run(() => {
      const user = requireUser();
      const material = db.materials.find((item) => item.id === id);
      if (!material) throw apiError('NOT_FOUND', 'Material not found');
      requireOwner(requireCourse(material.course_id), user);
      db.materials = db.materials.filter((item) => item.id !== material.id);
      db.completions = db.completions.filter(
        (completion) => completion.material_id !== material.id,
      );
    });
  },

  materialDownloadUrl(id) {
    return run(() => {
      const user = requireUser();
      const material = db.materials.find((item) => item.id === id);
      if (!material) throw apiError('NOT_FOUND', 'Material not found');
      if (!canReadMaterials(material.course_id, user.id)) {
        throw apiError('FORBIDDEN', 'Enroll to download this material');
      }
      return {
        download_url: `https://example.com/download/${material.storage_key}`,
      };
    });
  },

  completeMaterial(materialId) {
    return run(() => {
      const user = requireUser();
      const material = db.materials.find((item) => item.id === materialId);
      if (!material) throw apiError('NOT_FOUND', 'Material not found');
      const enrollment = findEnrollment(material.course_id, user.id);
      if (!enrollment) throw apiError('NOT_ENROLLED', 'You are not enrolled');
      const existing = db.completions.find(
        (completion) =>
          completion.enrollment_id === enrollment.id &&
          completion.material_id === material.id,
      );
      if (!existing) {
        db.completions.push({
          enrollment_id: enrollment.id,
          material_id: material.id,
          completed_at: new Date().toISOString(),
        });
      }
    });
  },

  uncompleteMaterial(materialId) {
    return run(() => {
      const user = requireUser();
      const material = db.materials.find((item) => item.id === materialId);
      if (!material) throw apiError('NOT_FOUND', 'Material not found');
      const enrollment = findEnrollment(material.course_id, user.id);
      if (!enrollment) throw apiError('NOT_ENROLLED', 'You are not enrolled');
      db.completions = db.completions.filter(
        (completion) =>
          !(
            completion.enrollment_id === enrollment.id &&
            completion.material_id === material.id
          ),
      );
    });
  },

  progress(courseId) {
    return run(() => {
      const user = requireUser();
      requireCourse(courseId);
      return courseProgress(courseId, user.id);
    });
  },
};
