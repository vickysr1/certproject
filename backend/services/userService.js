import bcryptjs from 'bcryptjs';
import { getDatabaseSnapshot, updateDatabase } from '../lib/database.js';
import { createHttpError, sanitizeUser } from '../lib/http.js';
import { nextStudentId } from '../lib/ids.js';

const { hashSync } = bcryptjs;

const SEED_STUDENT_PASSWORDS = {
  student01: 'student123',
  student02: 'student123',
};

function normalizeText(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function getLoginPassword(user) {
  return user.loginPassword || SEED_STUDENT_PASSWORDS[user.id] || null;
}

export function listStudents() {
  return getDatabaseSnapshot()
    .users
    .filter((user) => user.role === 'student')
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map((user) => ({
      ...sanitizeUser(user),
      loginPassword: getLoginPassword(user),
    }));
}

export async function createStudent(payload) {
  return updateDatabase(async (database) => {
    const userId = payload.userId?.trim() || null;
    const rollNumber = payload.rollNumber?.trim() || null;

    if (userId && database.users.some((user) => user.id === userId)) {
      throw createHttpError(409, 'A student account already exists with this User ID');
    }

    if (rollNumber && database.users.some((user) => user.rollNumber === rollNumber)) {
      throw createHttpError(409, 'This roll number is already assigned to another student');
    }

    const student = {
      id: userId || nextStudentId(database),
      passwordHash: hashSync(payload.password, 10),
      loginPassword: payload.password,
      role: 'student',
      status: 'active',
      name: normalizeText(payload.name),
      department: normalizeText(payload.department || 'General'),
      batch: normalizeText(payload.batch || 'Current Batch'),
      rollNumber: rollNumber || `AUTO-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };

    database.users.push(student);
    database.counters.studentSequence += 1;
    return sanitizeUser(student);
  });
}

export async function archiveStudent(studentId) {
  return updateDatabase(async (database) => {
    const index = database.users.findIndex((user) => user.id === studentId && user.role === 'student');

    if (index === -1) {
      throw createHttpError(404, 'Student account not found');
    }

    const [removed] = database.users.splice(index, 1);
    return sanitizeUser(removed);
  });
}
