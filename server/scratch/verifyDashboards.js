import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import Hackathon from '../models/Hackathon.js';
import Team from '../models/Team.js';
import Registration from '../models/Registration.js';
import Submission from '../models/Submission.js';
import Review from '../models/Review.js';
import JudgeAssignment from '../models/JudgeAssignment.js';
import Leaderboard from '../models/Leaderboard.js';

// --- DATABASE MOCKING SETUP ---
const testUsers = [];
const testHackathons = [];
const testTeams = [];
const testRegistrations = [];
const testSubmissions = [];
const testReviews = [];
const testJudgeAssignments = [];
const testLeaderboards = [];

mongoose.connect = async () => {
  console.log('[Mock DB] Mock database connected.');
  return mongoose;
};
Object.defineProperty(mongoose.connection, 'readyState', {
  get: () => 1,
});

// A robust mock Mongoose Query class that supports chaining and Awaiting
class MockQuery {
  constructor(data, modelClass) {
    this.data = [...data];
    this.modelClass = modelClass;
  }
  populate() {
    return this;
  }
  select() {
    return this;
  }
  sort(criteria) {
    // Sort desc by default for dashboard lists
    this.data.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.registeredAt || a.submittedAt || 0);
      const dateB = new Date(b.createdAt || b.registeredAt || b.submittedAt || 0);
      return dateB - dateA;
    });
    return this;
  }
  limit(n) {
    this.data = this.data.slice(0, n);
    return this;
  }
  then(resolve) {
    // Return populated mock objects
    const populated = this.data.map((item) => {
      const doc = new this.modelClass(item);
      
      // Emulate populate fields
      if (this.modelClass === Hackathon) {
        const u = testUsers.find((user) => String(user._id) === String(item.createdBy));
        if (u) doc.createdBy = new User(u);
      } else if (this.modelClass === Registration) {
        const u = testUsers.find((user) => String(user._id) === String(item.participant));
        if (u) doc.participant = new User(u);
        const h = testHackathons.find((hack) => String(hack._id) === String(item.hackathon));
        if (h) doc.hackathon = new Hackathon(h);
      } else if (this.modelClass === Submission) {
        const t = testTeams.find((team) => String(team._id) === String(item.team));
        if (t) doc.team = new Team(t);
        const h = testHackathons.find((hack) => String(hack._id) === String(item.hackathon));
        if (h) doc.hackathon = new Hackathon(h);
      } else if (this.modelClass === Team) {
        const h = testHackathons.find((hack) => String(hack._id) === String(item.hackathon));
        if (h) doc.hackathon = new Hackathon(h);
      } else if (this.modelClass === JudgeAssignment) {
        const h = testHackathons.find((hack) => String(hack._id) === String(item.hackathon));
        if (h) doc.hackathon = new Hackathon(h);
      } else if (this.modelClass === Leaderboard) {
        const t = testTeams.find((team) => String(team._id) === String(item.team));
        if (t) doc.team = new Team(t);
        const h = testHackathons.find((hack) => String(hack._id) === String(item.hackathon));
        if (h) doc.hackathon = new Hackathon(h);
      }

      return doc;
    });

    resolve(populated);
  }
}

// Mock User methods
User.findById = function (id) {
  const found = testUsers.find((u) => String(u._id) === String(id));
  return {
    then: (resolve) => resolve(found ? new User(found) : null),
  };
};

User.countDocuments = async function (query = {}) {
  let filtered = [...testUsers];
  if (query.role) {
    filtered = filtered.filter((u) => u.role === query.role);
  }
  return filtered.length;
};

User.find = function () {
  return new MockQuery(testUsers, User);
};

User.prototype.save = async function () {
  const plainObj = this.toObject();
  plainObj._id = this._id || new mongoose.Types.ObjectId();
  plainObj.createdAt = plainObj.createdAt || new Date();
  testUsers.push(plainObj);
  return this;
};

// Mock Hackathon
Hackathon.countDocuments = async function (query = {}) {
  let filtered = [...testHackathons];
  if (query.createdBy) {
    filtered = filtered.filter((h) => String(h.createdBy) === String(query.createdBy));
  }
  if (query.status) {
    if (query.status.$in) {
      filtered = filtered.filter((h) => query.status.$in.includes(h.status));
    } else {
      filtered = filtered.filter((h) => h.status === query.status);
    }
  }
  return filtered.length;
};

Hackathon.find = function (query = {}) {
  let filtered = [...testHackathons];
  if (query.createdBy) {
    filtered = filtered.filter((h) => String(h.createdBy) === String(query.createdBy));
  }
  return new MockQuery(filtered, Hackathon);
};

Hackathon.findById = function (id) {
  const found = testHackathons.find((h) => String(h._id) === String(id));
  return {
    then: (resolve) => resolve(found ? new Hackathon(found) : null),
  };
};

Hackathon.create = async function (data) {
  const doc = new Hackathon(data);
  const plainObj = doc.toObject();
  plainObj._id = doc._id || new mongoose.Types.ObjectId();
  plainObj.createdAt = plainObj.createdAt || new Date();
  testHackathons.push(plainObj);
  return doc;
};

// Mock Team
Team.countDocuments = async function () {
  return testTeams.length;
};

Team.find = function (query = {}) {
  let filtered = [...testTeams];
  if (query.$or) {
    filtered = filtered.filter((t) => {
      const isLeader = String(t.leader) === String(query.$or[0].leader);
      const isMember = t.members.some((m) => String(m) === String(query.$or[1].members));
      return isLeader || isMember;
    });
  }
  return new MockQuery(filtered, Team);
};

Team.create = async function (data) {
  const doc = new Team(data);
  const plainObj = doc.toObject();
  plainObj._id = doc._id || new mongoose.Types.ObjectId();
  plainObj.createdAt = plainObj.createdAt || new Date();
  testTeams.push(plainObj);
  return doc;
};

// Mock Registration
Registration.countDocuments = async function (query = {}) {
  let filtered = [...testRegistrations];
  if (query.hackathon) {
    if (query.hackathon.$in) {
      filtered = filtered.filter((r) => query.hackathon.$in.map(String).includes(String(r.hackathon)));
    } else {
      filtered = filtered.filter((r) => String(r.hackathon) === String(query.hackathon));
    }
  }
  return filtered.length;
};

Registration.find = function (query = {}) {
  let filtered = [...testRegistrations];
  if (query.hackathon && query.hackathon.$in) {
    filtered = filtered.filter((r) => query.hackathon.$in.map(String).includes(String(r.hackathon)));
  }
  if (query.participant) {
    filtered = filtered.filter((r) => String(r.participant) === String(query.participant));
  }
  return new MockQuery(filtered, Registration);
};

Registration.create = async function (data) {
  const doc = new Registration(data);
  const plainObj = doc.toObject();
  plainObj._id = doc._id || new mongoose.Types.ObjectId();
  plainObj.createdAt = plainObj.createdAt || new Date();
  testRegistrations.push(plainObj);
  return doc;
};

// Mock Submission
Submission.countDocuments = async function (query = {}) {
  let filtered = [...testSubmissions];
  if (query.hackathon) {
    if (query.hackathon.$in) {
      filtered = filtered.filter((s) => query.hackathon.$in.map(String).includes(String(s.hackathon)));
    } else {
      filtered = filtered.filter((s) => String(s.hackathon) === String(query.hackathon));
    }
  }
  return filtered.length;
};

Submission.find = function (query = {}) {
  let filtered = [...testSubmissions];
  if (query.hackathon) {
    if (query.hackathon.$in) {
      filtered = filtered.filter((s) => query.hackathon.$in.map(String).includes(String(s.hackathon)));
    } else {
      filtered = filtered.filter((s) => String(s.hackathon) === String(query.hackathon));
    }
  }
  if (query.team && query.team.$in) {
    filtered = filtered.filter((s) => query.team.$in.map(String).includes(String(s.team)));
  }
  return new MockQuery(filtered, Submission);
};

Submission.create = async function (data) {
  const doc = new Submission(data);
  const plainObj = doc.toObject();
  plainObj._id = doc._id || new mongoose.Types.ObjectId();
  plainObj.createdAt = plainObj.createdAt || new Date();
  testSubmissions.push(plainObj);
  return doc;
};

// Mock Review
Review.countDocuments = async function (query = {}) {
  let filtered = [...testReviews];
  if (query.hackathon && query.hackathon.$in) {
    filtered = filtered.filter((r) => query.hackathon.$in.map(String).includes(String(r.hackathon)));
  }
  if (query.status) {
    filtered = filtered.filter((r) => r.status === query.status);
  }
  return filtered.length;
};

Review.find = function (query = {}) {
  let filtered = [...testReviews];
  if (query.judge) {
    filtered = filtered.filter((r) => String(r.judge) === String(query.judge));
  }
  return new MockQuery(filtered, Review);
};

Review.create = async function (data) {
  const doc = new Review(data);
  const plainObj = doc.toObject();
  plainObj._id = doc._id || new mongoose.Types.ObjectId();
  plainObj.createdAt = plainObj.createdAt || new Date();
  testReviews.push(plainObj);
  return doc;
};

// Mock JudgeAssignment
JudgeAssignment.find = function (query = {}) {
  let filtered = [...testJudgeAssignments];
  if (query.judge) {
    filtered = filtered.filter((ja) => String(ja.judge) === String(query.judge));
  }
  return new MockQuery(filtered, JudgeAssignment);
};

JudgeAssignment.create = async function (data) {
  const doc = new JudgeAssignment(data);
  const plainObj = doc.toObject();
  plainObj._id = doc._id || new mongoose.Types.ObjectId();
  plainObj.createdAt = plainObj.createdAt || new Date();
  testJudgeAssignments.push(plainObj);
  return doc;
};

// Mock Leaderboard
Leaderboard.find = function (query = {}) {
  let filtered = [...testLeaderboards];
  if (query.team && query.team.$in) {
    filtered = filtered.filter((l) => query.team.$in.map(String).includes(String(l.team)));
  }
  if (query.published) {
    filtered = filtered.filter((l) => l.published === query.published);
  }
  return new MockQuery(filtered, Leaderboard);
};
// --- END DATABASE MOCKING SETUP ---

const PORT = 5123;
const BASE_URL = `http://localhost:${PORT}/api/dashboard`;

const runTests = async () => {
  console.log('--- Starting Role-Based Dashboards Module Verification Tests ---');

  // Seed Users
  const adminId = new mongoose.Types.ObjectId();
  const orgId = new mongoose.Types.ObjectId();
  const partId = new mongoose.Types.ObjectId();
  const judgeId = new mongoose.Types.ObjectId();

  testUsers.push(
    new User({ _id: adminId, name: 'Admin', email: 'admin@test.com', role: 'Admin' }),
    new User({ _id: orgId, name: 'Organizer', email: 'org@test.com', role: 'Organizer' }),
    new User({ _id: partId, name: 'Participant', email: 'part@test.com', role: 'Participant' }),
    new User({ _id: judgeId, name: 'Judge', email: 'judge@test.com', role: 'Judge' })
  );

  // Seed Hackathon
  const hackId = new mongoose.Types.ObjectId();
  await Hackathon.create({
    _id: hackId,
    title: 'Dashboard Hackathon',
    theme: 'Management',
    mode: 'Online',
    startDate: '2026-09-01T00:00:00Z',
    endDate: '2026-09-10T00:00:00Z',
    registrationDeadline: '2026-08-30T00:00:00Z',
    maxTeamSize: 4,
    status: 'Ongoing',
    createdBy: orgId,
  });

  // Seed Team
  const teamId = new mongoose.Types.ObjectId();
  await Team.create({
    _id: teamId,
    teamName: 'Dashboard Devs',
    hackathon: hackId,
    leader: partId,
    members: [partId],
    maxMembers: 4,
  });

  // Seed Registration
  await Registration.create({
    participant: partId,
    hackathon: hackId,
    status: 'Approved',
  });

  // Seed Submission
  const subId = new mongoose.Types.ObjectId();
  await Submission.create({
    _id: subId,
    team: teamId,
    hackathon: hackId,
    projectName: 'Super Dashboard Engine',
    problemStatement: 'Problem',
    solution: 'Solution',
    githubRepository: 'https://github.com/dash/board',
    submittedBy: partId,
    status: 'Approved',
  });

  // Seed Judge Assignment
  await JudgeAssignment.create({
    judge: judgeId,
    hackathon: hackId,
    assignedBy: orgId,
  });

  // Seed Completed Review
  await Review.create({
    submission: subId,
    hackathon: hackId,
    judge: judgeId,
    innovation: 9,
    technicalComplexity: 9,
    userInterface: 8,
    functionality: 9,
    scalability: 9,
    documentation: 9,
    presentation: 9,
    status: 'Completed',
    feedback: 'Amazing job',
  });

  console.log('[Setup] Seeded admin, organizer, participant, judge, hackathon, team, registration, submission, and completed reviews.');

  // Tokens
  const adminToken = jwt.sign({ id: adminId }, process.env.JWT_SECRET);
  const orgToken = jwt.sign({ id: orgId }, process.env.JWT_SECRET);
  const partToken = jwt.sign({ id: partId }, process.env.JWT_SECRET);
  const judgeToken = jwt.sign({ id: judgeId }, process.env.JWT_SECRET);

  const server = app.listen(PORT, async () => {
    console.log(`[Server] Dashboard test server running on port ${PORT}`);

    try {
      // TEST 1: Admin views admin dashboard
      console.log('\n--- TEST 1: Admin views admin dashboard ---');
      const adRes = await fetch(`${BASE_URL}/admin`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const adData = await adRes.json();
      console.log('Status:', adRes.status);
      console.log('Stats:', JSON.stringify(adData.stats, null, 2));

      if (
        adRes.status === 200 &&
        adData.success &&
        adData.stats.totalUsers === 4 &&
        adData.stats.totalHackathons === 1 &&
        adData.stats.totalSubmissions === 1 &&
        adData.stats.totalReviews === 1
      ) {
        console.log('✅ TEST 1 PASSED: Admin sees global stats');
      } else {
        throw new Error('TEST 1 FAILED');
      }

      // TEST 2: Participant is blocked from viewing admin dashboard
      console.log('\n--- TEST 2: Participant blocked from admin dashboard ---');
      const adBlockRes = await fetch(`${BASE_URL}/admin`, {
        headers: { Authorization: `Bearer ${partToken}` },
      });
      const adBlockData = await adBlockRes.json();
      console.log('Status:', adBlockRes.status);
      console.log('Response:', JSON.stringify(adBlockData, null, 2));

      if (adBlockRes.status === 403 && !adBlockData.success) {
        console.log('✅ TEST 2 PASSED: Participant blocked from admin access with 403');
      } else {
        throw new Error('TEST 2 FAILED');
      }

      // TEST 3: Organizer views organizer dashboard
      console.log('\n--- TEST 3: Organizer views organizer dashboard ---');
      const orgRes = await fetch(`${BASE_URL}/organizer`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      const orgData = await orgRes.json();
      console.log('Status:', orgRes.status);
      console.log('Stats:', JSON.stringify(orgData.stats, null, 2));

      if (
        orgRes.status === 200 &&
        orgData.success &&
        orgData.stats.myHackathons === 1 &&
        orgData.stats.registrationCount === 1 &&
        orgData.stats.teamsRegistered === 1 &&
        orgData.stats.totalSubmissions === 1 &&
        orgData.stats.pendingReviews === 0
      ) {
        console.log('✅ TEST 3 PASSED: Organizer sees their hackathons stats');
      } else {
        throw new Error('TEST 3 FAILED');
      }

      // TEST 4: Participant views participant dashboard
      console.log('\n--- TEST 4: Participant views participant dashboard ---');
      const partRes = await fetch(`${BASE_URL}/participant`, {
        headers: { Authorization: `Bearer ${partToken}` },
      });
      const partData = await partRes.json();
      console.log('Status:', partRes.status);
      console.log('Stats:', JSON.stringify(partData.stats, null, 2));

      if (
        partRes.status === 200 &&
        partData.success &&
        partData.stats.registeredHackathons === 1 &&
        partData.stats.myTeam === 1 &&
        partData.stats.submissionStatus === 'Approved'
      ) {
        console.log('✅ TEST 4 PASSED: Participant sees their workspace stats');
      } else {
        throw new Error('TEST 4 FAILED');
      }

      // TEST 5: Judge views judge dashboard
      console.log('\n--- TEST 5: Judge views judge dashboard ---');
      const judgeRes = await fetch(`${BASE_URL}/judge`, {
        headers: { Authorization: `Bearer ${judgeToken}` },
      });
      const judgeData = await judgeRes.json();
      console.log('Status:', judgeRes.status);
      console.log('Stats:', JSON.stringify(judgeData.stats, null, 2));
      console.log('Projects list count:', judgeData.assignedProjectsList?.length);

      if (
        judgeRes.status === 200 &&
        judgeData.success &&
        judgeData.stats.assignedHackathons === 1 &&
        judgeData.stats.assignedProjects === 1 &&
        judgeData.stats.completedReviews === 1 &&
        judgeData.stats.pendingReviews === 0 &&
        judgeData.assignedProjectsList[0].projectName === 'Super Dashboard Engine' &&
        judgeData.assignedProjectsList[0].status === 'Completed'
      ) {
        console.log('✅ TEST 5 PASSED: Judge sees their assignment stats & reviews list');
      } else {
        throw new Error('TEST 5 FAILED');
      }

      console.log('\n======================================================');
      console.log('🎉 ALL DASHBOARD SYSTEM TESTS PASSED SUCCESSFULLY! 🎉');
      console.log('======================================================');
    } catch (err) {
      console.error('\n❌ TEST SUITE FAILURE:', err.message);
      process.exitCode = 1;
    } finally {
      server.close(() => {
        console.log('[Server] Dashboard test server stopped.');
        process.exit(process.exitCode || 0);
      });
    }
  });
};

runTests();
