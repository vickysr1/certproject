import assert from 'node:assert/strict';
import test from 'node:test';
import bcryptjs from 'bcryptjs';
import { getDatabase, initializeDatabase } from '../lib/database.js';
import { registerStudent, approveStudent, archiveStudent } from '../services/userService.js';
import { createApp } from '../app.js';

const { compare } = bcryptjs;

test('student registration, login block, approval, and cross-login flow', async () => {
  await initializeDatabase();

  const payload = {
    name: 'Test Signup Student',
    email: 'testsignup@student.edu',
    rollNumber: 'TESTSIGNUP123',
    password: 'testpassword123',
    department: 'Chemistry',
    batch: '2023-2027',
  };

  // 1. Signup the student
  const student = await registerStudent(payload);
  assert.equal(student.rollNumber, 'TESTSIGNUP123');
  assert.equal(student.email, 'testsignup@student.edu');
  assert.equal(student.status, 'pending');

  // Verify database record has correct status
  const database = getDatabase();
  const dbUser = database.users.find(u => u.id === student.id);
  assert.ok(dbUser);
  assert.equal(dbUser.status, 'pending');

  // 2. Setup Express App to verify the login endpoint behavior
  const app = createApp();

  // Helper for requests
  const postRequest = async (url, data) => {
    const response = await fetch(`http://localhost:15689${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return {
      status: response.status,
      json: await response.json(),
    };
  };

  // Start temporary server for testing endpoint
  const server = app.listen(15689);

  try {
    // Attempt login as pending student via ID (roll number)
    const loginAttempt = await postRequest('/api/auth/login', {
      userId: 'TESTSIGNUP123',
      password: 'testpassword123',
    });
    assert.equal(loginAttempt.status, 403);
    assert.match(loginAttempt.json.message, /pending administrator approval/i);

    // Attempt login as pending student via email
    const loginAttemptEmail = await postRequest('/api/auth/login', {
      userId: 'testsignup@student.edu',
      password: 'testpassword123',
    });
    assert.equal(loginAttemptEmail.status, 403);

    // 3. Approve the student
    const approvedStudent = await approveStudent(student.id);
    assert.equal(approvedStudent.status, 'active');

    // 4. Login now that student is active (test ID)
    const loginSuccessId = await postRequest('/api/auth/login', {
      userId: 'TESTSIGNUP123',
      password: 'testpassword123',
    });
    assert.equal(loginSuccessId.status, 200);
    assert.ok(loginSuccessId.json.token);

    // Test Login via Email
    const loginSuccessEmail = await postRequest('/api/auth/login', {
      userId: 'testsignup@student.edu',
      password: 'testpassword123',
    });
    assert.equal(loginSuccessEmail.status, 200);
    assert.ok(loginSuccessEmail.json.token);
  } finally {
    // Ensure server stops and test database record is deleted
    server.close();
    await archiveStudent(student.id);
  }
});
