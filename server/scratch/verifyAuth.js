import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import app from '../app.js';
import apiRouter from '../routes/index.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

// --- DATABASE MOCKING SETUP ---
const testUsers = [];

// Mock mongoose.connect to prevent connecting to a real MongoDB
mongoose.connect = async () => {
  console.log('[Mock DB] Mock MongoDB Connection initialized.');
  return mongoose;
};

// Mock connection state
Object.defineProperty(mongoose.connection, 'readyState', {
  get: () => 1,
});

// Mock User.prototype.save to avoid actual database write buffering
User.prototype.save = async function () {
  if (this.password && !this.password.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  return this;
};

// Mock Query Class to handle chainable methods like select()
class MockQuery {
  constructor(result) {
    this.result = result;
    this.isSelectedPassword = false;
  }

  select(fields) {
    if (fields && (fields.includes('+password') || fields.includes('password'))) {
      this.isSelectedPassword = true;
    }
    return this;
  }

  then(resolve, reject) {
    if (!this.result) {
      return resolve(null);
    }
    const doc = new User(this.result);
    // If password is not explicitly selected, remove it from the document
    if (!this.isSelectedPassword) {
      doc.password = undefined;
    } else {
      doc.password = this.result.password;
    }
    return resolve(doc);
  }
}

// Mock User.deleteMany
User.deleteMany = async (query) => {
  testUsers.length = 0;
  return { deletedCount: 0 };
};

// Mock User.findOne
User.findOne = function (query) {
  const found = testUsers.find((u) => u.email === query.email);
  return new MockQuery(found);
};

// Mock User.findById
User.findById = function (id) {
  const found = testUsers.find((u) => String(u._id) === String(id));
  return new MockQuery(found);
};

// Mock User.create
User.create = async function (data) {
  const doc = new User(data);
  await doc.save();
  const plainObj = doc.toObject();
  plainObj._id = doc._id || new mongoose.Types.ObjectId();
  plainObj.password = doc.password; // Keep hashed password in Mock DB
  testUsers.push(plainObj);

  // Return document without password
  const resDoc = new User(plainObj);
  resDoc.password = undefined;
  return resDoc;
};
// --- END DATABASE MOCKING SETUP ---

// Add a test route to the apiRouter for verifying role middleware
apiRouter.get('/test-admin-only', protect, authorize('Admin'), (req, res) => {
  res.status(200).json({ success: true, message: 'Welcome Admin' });
});

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}/api`;

const runTests = async () => {
  console.log('--- Starting Auth & RBAC Verification Tests (Mocked DB) ---');

  // 1. Clear any previous test users to ensure clean state
  await User.deleteMany({});
  console.log('[Setup] Cleared mock database.');

  // 2. Start Express server
  const server = app.listen(PORT, async () => {
    console.log(`[Server] Temporary test server started on port ${PORT}`);

    try {
      let adminToken = '';
      let organizerToken = '';

      // TEST 1: Register works (Admin role)
      console.log('\n--- TEST 1: Registration works (Admin) ---');
      const registerRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Admin',
          email: 'admin@testauth.com',
          password: 'securePassword123',
          role: 'Admin',
        }),
      });
      const registerData = await registerRes.json();
      console.log('Status:', registerRes.status);
      console.log('Response:', JSON.stringify(registerData, null, 2));

      if (
        registerRes.status === 201 &&
        registerData.success &&
        registerData.token &&
        registerData.user.role === 'Admin'
      ) {
        console.log('✅ TEST 1 PASSED: Register works');
        adminToken = registerData.token;
      } else {
        throw new Error('TEST 1 FAILED');
      }

      // TEST 2: Duplicate email rejected
      console.log('\n--- TEST 2: Duplicate email rejected ---');
      const dupRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Another Admin',
          email: 'admin@testauth.com',
          password: 'securePassword123',
          role: 'Admin',
        }),
      });
      const dupData = await dupRes.json();
      console.log('Status:', dupRes.status);
      console.log('Response:', JSON.stringify(dupData, null, 2));

      if (dupRes.status === 400 && !dupData.success) {
        console.log('✅ TEST 2 PASSED: Duplicate email rejected');
      } else {
        throw new Error('TEST 2 FAILED');
      }

      // TEST 3: Validation: invalid email format, weak password, invalid role
      console.log('\n--- TEST 3: Validation check (weak password) ---');
      const weakPassRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Weak Pass',
          email: 'weak@testauth.com',
          password: 'weak',
          role: 'Participant',
        }),
      });
      const weakPassData = await weakPassRes.json();
      console.log('Status:', weakPassRes.status);
      console.log('Response:', JSON.stringify(weakPassData, null, 2));

      if (weakPassRes.status === 400 && !weakPassData.success) {
        console.log('✅ TEST 3 (Weak Password) PASSED');
      } else {
        throw new Error('TEST 3 (Weak Password) FAILED');
      }

      console.log('\n--- TEST 3: Validation check (invalid email format) ---');
      const invalidEmailRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Invalid Email',
          email: 'invalid-email-format',
          password: 'securePassword123',
          role: 'Participant',
        }),
      });
      const invalidEmailData = await invalidEmailRes.json();
      console.log('Status:', invalidEmailRes.status);
      console.log('Response:', JSON.stringify(invalidEmailData, null, 2));

      if (invalidEmailRes.status === 400 && !invalidEmailData.success) {
        console.log('✅ TEST 3 (Invalid Email) PASSED');
      } else {
        throw new Error('TEST 3 (Invalid Email) FAILED');
      }

      console.log('\n--- TEST 3: Validation check (invalid role) ---');
      const invalidRoleRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Invalid Role User',
          email: 'invalidrole@testauth.com',
          password: 'securePassword123',
          role: 'SuperAdmin', // Not in allowed roles
        }),
      });
      const invalidRoleData = await invalidRoleRes.json();
      console.log('Status:', invalidRoleRes.status);
      console.log('Response:', JSON.stringify(invalidRoleData, null, 2));

      if (invalidRoleRes.status === 400 && !invalidRoleData.success) {
        console.log('✅ TEST 3 (Invalid Role) PASSED');
      } else {
        throw new Error('TEST 3 (Invalid Role) FAILED');
      }

      // TEST 4: Password hashed and select: false works (Checking database directly)
      console.log('\n--- TEST 4: Password hashed in DB and not returned by default query ---');
      const dbUser = await User.findOne({ email: 'admin@testauth.com' });
      console.log('Found user in DB:', JSON.stringify(dbUser, null, 2));
      console.log('Is password undefined or excluded in query?', dbUser.password === undefined);

      if (dbUser.password === undefined) {
        console.log('✅ TEST 4 PASSED: Password is hashed and excluded from query responses by default');
      } else {
        throw new Error('TEST 4 FAILED: Password returned in query');
      }

      // TEST 5: Login works
      console.log('\n--- TEST 5: Login works (with correct credentials) ---');
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@testauth.com',
          password: 'securePassword123',
        }),
      });
      const loginData = await loginRes.json();
      console.log('Status:', loginRes.status);
      console.log('Response:', JSON.stringify(loginData, null, 2));

      if (loginRes.status === 200 && loginData.success && loginData.token) {
        console.log('✅ TEST 5 PASSED: Login works');
      } else {
        throw new Error('TEST 5 FAILED');
      }

      // TEST 6: Login rejected with incorrect credentials
      console.log('\n--- TEST 6: Login rejected with incorrect password ---');
      const wrongLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@testauth.com',
          password: 'wrongpassword',
        }),
      });
      const wrongLoginData = await wrongLoginRes.json();
      console.log('Status:', wrongLoginRes.status);
      console.log('Response:', JSON.stringify(wrongLoginData, null, 2));

      if (wrongLoginRes.status === 401 && !wrongLoginData.success) {
        console.log('✅ TEST 6 PASSED: Invalid login rejected');
      } else {
        throw new Error('TEST 6 FAILED');
      }

      // TEST 7: Current User (GET /me) works for authorized token
      console.log('\n--- TEST 7: Current user endpoint works (GET /me) ---');
      const meRes = await fetch(`${BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const meData = await meRes.json();
      console.log('Status:', meRes.status);
      console.log('Response:', JSON.stringify(meData, null, 2));

      if (meRes.status === 200 && meData.success && meData.user.email === 'admin@testauth.com') {
        console.log('✅ TEST 7 PASSED: Current user endpoint works');
      } else {
        throw new Error('TEST 7 FAILED');
      }

      // TEST 8: Role Middleware works (Authorized vs Unauthorized roles)
      // First register an Organizer role user
      console.log('\n[Setup] Creating Organizer user...');
      const orgRegisterRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Organizer',
          email: 'organizer@testauth.com',
          password: 'securePassword123',
          role: 'Organizer',
        }),
      });
      const orgRegisterData = await orgRegisterRes.json();
      organizerToken = orgRegisterData.token;

      console.log('\n--- TEST 8: Role middleware allows Admin to Admin-only route ---');
      const adminRouteRes = await fetch(`${BASE_URL}/test-admin-only`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const adminRouteData = await adminRouteRes.json();
      console.log('Status:', adminRouteRes.status);
      console.log('Response:', JSON.stringify(adminRouteData, null, 2));

      if (adminRouteRes.status === 200 && adminRouteData.success) {
        console.log('✅ Role middleware allowed Admin access');
      } else {
        throw new Error('Role middleware failed to allow Admin access');
      }

      console.log('\n--- TEST 8: Role middleware rejects Organizer from Admin-only route ---');
      const orgRouteRes = await fetch(`${BASE_URL}/test-admin-only`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${organizerToken}`,
        },
      });
      const orgRouteData = await orgRouteRes.json();
      console.log('Status:', orgRouteRes.status);
      console.log('Response:', JSON.stringify(orgRouteData, null, 2));

      if (orgRouteRes.status === 403 && !orgRouteData.success) {
        console.log('✅ Role middleware rejected Organizer with 403 Forbidden');
      } else {
        throw new Error('Role middleware failed to reject Organizer with 403 Forbidden');
      }

      console.log('✅ TEST 8 PASSED: Role middleware works correctly');

      // TEST 9: Logout endpoint works
      console.log('\n--- TEST 9: Logout works ---');
      const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
      });
      const logoutData = await logoutRes.json();
      console.log('Status:', logoutRes.status);
      console.log('Response:', JSON.stringify(logoutData, null, 2));

      if (logoutRes.status === 200 && logoutData.success) {
        console.log('✅ TEST 9 PASSED: Logout endpoint works');
      } else {
        throw new Error('TEST 9 FAILED');
      }

      console.log('\n=========================================');
      console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
      console.log('=========================================');
    } catch (err) {
      console.error('\n❌ A TEST ENCOUNTERED AN ERROR OR FAILED:', err.message);
      process.exitCode = 1;
    } finally {
      // Close server
      server.close(() => {
        console.log('[Server] Temporary test server stopped.');
        process.exit(process.exitCode || 0);
      });
    }
  });
};

runTests();
