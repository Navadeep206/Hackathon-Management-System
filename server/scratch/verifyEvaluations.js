import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import Hackathon from '../models/Hackathon.js';
import Team from '../models/Team.js';
import Submission from '../models/Submission.js';
import JudgeAssignment from '../models/JudgeAssignment.js';
import Review from '../models/Review.js';

// --- DATABASE MOCKING SETUP ---
const testUsers = [];
const testHackathons = [];
const testTeams = [];
const testSubmissions = [];
const testJudgeAssignments = [];
const testReviews = [];

// Mock connection
mongoose.connect = async () => {
  console.log('[Mock DB] Mock database connected.');
  return mongoose;
};
Object.defineProperty(mongoose.connection, 'readyState', {
  get: () => 1,
});

// Mock User methods
User.findById = function (id) {
  const found = testUsers.find((u) => String(u._id) === String(id));
  return {
    then: (resolve) => resolve(found ? new User(found) : null),
  };
};

User.findOne = function (query) {
  const found = testUsers.find((u) => u.email === query.email);
  return {
    select: () => ({
      then: (resolve) => resolve(found ? new User(found) : null),
    }),
    then: (resolve) => resolve(found ? new User(found) : null),
  };
};

User.prototype.save = async function () {
  const plainObj = this.toObject();
  plainObj._id = this._id || new mongoose.Types.ObjectId();
  testUsers.push(plainObj);
  return this;
};

// Mock Hackathon
Hackathon.prototype.save = async function () {
  const plainObj = this.toObject();
  plainObj._id = this._id || new mongoose.Types.ObjectId();
  const existingIndex = testHackathons.findIndex(
    (h) => String(h._id) === String(plainObj._id)
  );
  if (existingIndex !== -1) {
    testHackathons[existingIndex] = plainObj;
  } else {
    testHackathons.push(plainObj);
  }
  return new Hackathon(plainObj);
};

Hackathon.findById = function (id) {
  const found = testHackathons.find((h) => String(h._id) === String(id));
  return {
    then: (resolve) => resolve(found ? new Hackathon(found) : null),
  };
};

Hackathon.create = async function (data) {
  const doc = new Hackathon(data);
  await doc.save();
  return doc;
};

// Mock Team
Team.create = async function (data) {
  const doc = new Team(data);
  const plainObj = doc.toObject();
  plainObj._id = doc._id || new mongoose.Types.ObjectId();
  testTeams.push(plainObj);
  return doc;
};

// Mock Submission
Submission.findById = function (id) {
  const found = testSubmissions.find((s) => String(s._id) === String(id));
  if (!found) {
    return {
      populate: () => ({
        populate: () => ({
          then: (resolve) => resolve(null),
        }),
      }),
      then: (resolve) => resolve(null),
    };
  }

  const makeChain = (item) => {
    return {
      populate: (path) => {
        const doc = new Submission(item);
        if (path === 'team') {
          const t = testTeams.find((team) => String(team._id) === String(item.team));
          if (t) doc.team = new Team(t);
        } else if (path === 'hackathon') {
          const h = testHackathons.find(
            (hack) => String(hack._id) === String(item.hackathon)
          );
          if (h) doc.hackathon = new Hackathon(h);
        }
        return makeChain(doc);
      },
      then: (resolve) => resolve(item instanceof Submission ? item : new Submission(item)),
    };
  };

  return makeChain(found);
};

Submission.create = async function (data) {
  const doc = new Submission(data);
  const plainObj = doc.toObject();
  plainObj._id = doc._id || new mongoose.Types.ObjectId();
  testSubmissions.push(plainObj);
  return doc;
};

// Mock JudgeAssignment
JudgeAssignment.findOne = function (query) {
  const found = testJudgeAssignments.find(
    (ja) =>
      String(ja.judge) === String(query.judge) &&
      String(ja.hackathon) === String(query.hackathon)
  );
  return {
    then: (resolve) => resolve(found ? new JudgeAssignment(found) : null),
  };
};

class MockJudgeAssignmentQuery {
  constructor(results) {
    this.results = results;
    this.populatePaths = [];
  }
  populate(path) {
    this.populatePaths.push(path);
    return this;
  }
  then(resolve) {
    const docs = this.results.map((item) => {
      const doc = new JudgeAssignment(item);
      this.populatePaths.forEach((path) => {
        if (path === 'hackathon') {
          const hack = testHackathons.find(
            (h) => String(h._id) === String(item.hackathon)
          );
          if (hack) doc.hackathon = new Hackathon(hack);
        } else if (path === 'judge') {
          const u = testUsers.find((user) => String(user._id) === String(item.judge));
          if (u) doc.judge = new User(u);
        } else if (path === 'assignedBy') {
          const u = testUsers.find((user) => String(user._id) === String(item.assignedBy));
          if (u) doc.assignedBy = new User(u);
        }
      });
      return doc;
    });
    resolve(docs);
  }
}

JudgeAssignment.find = function (query) {
  let filtered = [...testJudgeAssignments];
  if (query.judge) {
    filtered = filtered.filter((ja) => String(ja.judge) === String(query.judge));
  }
  if (query.hackathon) {
    filtered = filtered.filter((ja) => String(ja.hackathon) === String(query.hackathon));
  }
  return new MockJudgeAssignmentQuery(filtered);
};

JudgeAssignment.findById = function (id) {
  const found = testJudgeAssignments.find((ja) => String(ja._id) === String(id));
  if (!found) {
    return {
      populate: () => ({
        then: (resolve) => resolve(null),
      }),
      then: (resolve) => resolve(null),
    };
  }

  const makeChain = (item) => {
    return {
      populate: (path) => {
        const doc = new JudgeAssignment(item);
        if (path === 'hackathon') {
          const h = testHackathons.find(
            (hack) => String(hack._id) === String(item.hackathon)
          );
          if (h) doc.hackathon = new Hackathon(h);
        }
        return makeChain(doc);
      },
      then: (resolve) =>
        resolve(item instanceof JudgeAssignment ? item : new JudgeAssignment(item)),
    };
  };

  return makeChain(found);
};

JudgeAssignment.prototype.save = async function () {
  const plainObj = this.toObject();
  plainObj._id = this._id || new mongoose.Types.ObjectId();
  testJudgeAssignments.push(plainObj);
  return this;
};

JudgeAssignment.create = async function (data) {
  const doc = new JudgeAssignment(data);
  await doc.save();
  return doc;
};

JudgeAssignment.deleteOne = async (query) => {
  const index = testJudgeAssignments.findIndex(
    (ja) => String(ja._id) === String(query._id)
  );
  if (index !== -1) {
    testJudgeAssignments.splice(index, 1);
  }
  return { deletedCount: 1 };
};

// Mock Review
Review.findOne = function (query) {
  const found = testReviews.find(
    (r) =>
      String(r.judge) === String(query.judge) &&
      String(r.submission) === String(query.submission)
  );
  return {
    then: (resolve) => resolve(found ? new Review(found) : null),
  };
};

class MockReviewQuery {
  constructor(results) {
    this.results = results;
    this.populatePaths = [];
  }
  populate(path) {
    this.populatePaths.push(path);
    return this;
  }
  sort() {
    return this;
  }
  skip() {
    return this;
  }
  limit() {
    return this;
  }
  then(resolve) {
    const docs = this.results.map((item) => {
      const doc = new Review(item);
      this.populatePaths.forEach((path) => {
        if (path === 'submission') {
          const sub = testSubmissions.find(
            (s) => String(s._id) === String(item.submission)
          );
          if (sub) doc.submission = new Submission(sub);
        } else if (path === 'judge') {
          const u = testUsers.find((user) => String(user._id) === String(item.judge));
          if (u) doc.judge = new User(u);
        } else if (path === 'hackathon') {
          const h = testHackathons.find(
            (hack) => String(hack._id) === String(item.hackathon)
          );
          if (h) doc.hackathon = new Hackathon(h);
        }
      });
      return doc;
    });
    resolve(docs);
  }
}

Review.find = function (query) {
  let filtered = [...testReviews];
  if (query.submission) {
    filtered = filtered.filter((r) => String(r.submission) === String(query.submission));
  }
  if (query.judge) {
    filtered = filtered.filter((r) => String(r.judge) === String(query.judge));
  }
  if (query.hackathon) {
    filtered = filtered.filter((r) => String(r.hackathon) === String(query.hackathon));
  }
  return new MockReviewQuery(filtered);
};

Review.countDocuments = async function (query) {
  let filtered = [...testReviews];
  if (query.submission) {
    filtered = filtered.filter((r) => String(r.submission) === String(query.submission));
  }
  if (query.judge) {
    filtered = filtered.filter((r) => String(r.judge) === String(query.judge));
  }
  if (query.hackathon) {
    filtered = filtered.filter((r) => String(r.hackathon) === String(query.hackathon));
  }
  return filtered.length;
};

Review.findById = function (id) {
  const found = testReviews.find((r) => String(r._id) === String(id));
  return {
    then: (resolve) => resolve(found ? new Review(found) : null),
  };
};

Review.prototype.save = async function () {
  // Pre-validate emulation (totalScore calculation)
  this.totalScore =
    (this.innovation || 0) +
    (this.technicalComplexity || 0) +
    (this.userInterface || 0) +
    (this.functionality || 0) +
    (this.scalability || 0) +
    (this.documentation || 0) +
    (this.presentation || 0);

  const plainObj = this.toObject();
  plainObj._id = this._id || new mongoose.Types.ObjectId();
  plainObj.totalScore = this.totalScore;

  const existingIdx = testReviews.findIndex((r) => String(r._id) === String(plainObj._id));
  if (existingIdx !== -1) {
    testReviews[existingIdx] = plainObj;
  } else {
    // Unique check
    const dup = testReviews.find(
      (r) =>
        String(r.judge) === String(plainObj.judge) &&
        String(r.submission) === String(plainObj.submission)
    );
    if (dup) {
      const err = new Error('Duplicate key error index: judge_1_submission_1');
      err.code = 11000;
      throw err;
    }
    testReviews.push(plainObj);
  }
  return this;
};

Review.create = async function (data) {
  const doc = new Review(data);
  await doc.save();
  return doc;
};
// --- END DATABASE MOCKING SETUP ---

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}/api`;

const runTests = async () => {
  console.log('--- Starting Evaluations Module Verification Tests ---');

  // Seed Users
  const orgId = new mongoose.Types.ObjectId();
  const judgeId = new mongoose.Types.ObjectId();
  const observerJudgeId = new mongoose.Types.ObjectId(); // Non-assigned
  const participantId = new mongoose.Types.ObjectId();

  const mockUsers = [
    { _id: orgId, name: 'Organizer', email: 'org@test.com', role: 'Organizer' },
    { _id: judgeId, name: 'Assigned Judge', email: 'judge@test.com', role: 'Judge' },
    { _id: observerJudgeId, name: 'Unassigned Judge', email: 'unassigned@test.com', role: 'Judge' },
    { _id: participantId, name: 'Participant Leader', email: 'part@test.com', role: 'Participant' },
  ];
  testUsers.push(...mockUsers.map((u) => new User(u)));

  // Seed Hackathon
  const hackId = new mongoose.Types.ObjectId();
  await Hackathon.create({
    _id: hackId,
    title: 'Eval Hackathon',
    theme: 'AI',
    mode: 'Online',
    startDate: '2026-09-01T00:00:00Z',
    endDate: '2026-09-10T00:00:00Z',
    registrationDeadline: '2026-08-30T00:00:00Z',
    maxTeamSize: 4,
    status: 'Ongoing', // Ongoing hackathon
    createdBy: orgId,
  });

  // Seed Team & Submission
  const teamId = new mongoose.Types.ObjectId();
  await Team.create({
    _id: teamId,
    teamName: 'Alpha submitter',
    hackathon: hackId,
    leader: participantId,
    members: [participantId],
    maxMembers: 4,
    status: 'Active',
  });

  const subId = new mongoose.Types.ObjectId();
  await Submission.create({
    _id: subId,
    team: teamId,
    hackathon: hackId,
    projectName: 'Evaluation Project Tracker',
    problemStatement: 'Tracking evaluations is hard.',
    solution: 'Build automated tracker.',
    githubRepository: 'https://github.com/alpha/tracker',
    techStack: ['Node', 'React'],
    submittedBy: participantId,
  });

  console.log('[Setup] Seeded organizer, judges, participant, hackathon, and project submission.');

  // Generate Tokens
  const orgToken = jwt.sign({ id: orgId }, process.env.JWT_SECRET);
  const judgeToken = jwt.sign({ id: judgeId }, process.env.JWT_SECRET);
  const unassignedToken = jwt.sign({ id: observerJudgeId }, process.env.JWT_SECRET);
  const partToken = jwt.sign({ id: participantId }, process.env.JWT_SECRET);

  const server = app.listen(PORT, async () => {
    console.log(`[Server] Temporary test server running on port ${PORT}`);

    try {
      let assignmentId = '';
      let reviewId = '';

      // TEST 1: Organizer assigns a judge successfully
      console.log('\n--- TEST 1: Organizer assigns a judge successfully ---');
      const assignRes = await fetch(`${BASE_URL}/judges/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${orgToken}`,
        },
        body: JSON.stringify({
          judgeId,
          hackathonId: hackId,
        }),
      });
      const assignData = await assignRes.json();
      console.log('Status:', assignRes.status);
      console.log('Response:', JSON.stringify(assignData, null, 2));

      if (assignRes.status === 201 && assignData.success && assignData.assignment._id) {
        console.log('✅ TEST 1 PASSED: Judge assigned successfully');
        assignmentId = assignData.assignment._id;
      } else {
        throw new Error('TEST 1 FAILED');
      }

      // TEST 2: Assigned judge views their hackathon assignments
      console.log('\n--- TEST 2: Assigned judge views assignments ---');
      const getAssignRes = await fetch(`${BASE_URL}/judges/hackathons/my`, {
        headers: { Authorization: `Bearer ${judgeToken}` },
      });
      const getAssignData = await getAssignRes.json();
      console.log('Status:', getAssignRes.status);
      console.log('Count:', getAssignData.count);
      console.log('Hackathon Title:', getAssignData.assignments[0]?.hackathon?.title);

      if (
        getAssignRes.status === 200 &&
        getAssignData.success &&
        getAssignData.assignments[0]?.hackathon?.title === 'Eval Hackathon'
      ) {
        console.log('✅ TEST 2 PASSED: Judge assignments visible');
      } else {
        throw new Error('TEST 2 FAILED');
      }

      // TEST 3: Non-assigned judge is blocked from submitting a review
      console.log('\n--- TEST 3: Non-assigned judge is blocked ---');
      const blockRes = await fetch(`${BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${unassignedToken}`, // Unassigned
        },
        body: JSON.stringify({
          submissionId: subId,
          innovation: 9,
          technicalComplexity: 8,
          userInterface: 7,
          functionality: 9,
          scalability: 8,
          documentation: 9,
          presentation: 9,
          feedback: 'Excellent work!',
        }),
      });
      const blockData = await blockRes.json();
      console.log('Status:', blockRes.status);
      console.log('Response:', JSON.stringify(blockData, null, 2));

      if (blockRes.status === 403 && !blockData.success) {
        console.log('✅ TEST 3 PASSED: Non-assigned judge review blocked');
      } else {
        throw new Error('TEST 3 FAILED');
      }

      // TEST 4: Assigned judge submits a pending review successfully (total score auto-calculated)
      console.log('\n--- TEST 4: Assigned judge submits review successfully ---');
      const submitRes = await fetch(`${BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${judgeToken}`,
        },
        body: JSON.stringify({
          submissionId: subId,
          innovation: 8,
          technicalComplexity: 9,
          userInterface: 8,
          functionality: 9,
          scalability: 7,
          documentation: 8,
          presentation: 9,
          feedback: 'Very solid backend architecture.',
          status: 'Pending', // Pending evaluation
        }),
      });
      const submitData = await submitRes.json();
      console.log('Status:', submitRes.status);
      console.log('Response:', JSON.stringify(submitData, null, 2));

      if (
        submitRes.status === 201 &&
        submitData.success &&
        submitData.review.totalScore === 58 &&
        submitData.review.status === 'Pending'
      ) {
        console.log('✅ TEST 4 PASSED: Review submitted and total score auto-calculated (58)');
        reviewId = submitData.review._id;
      } else {
        throw new Error('TEST 4 FAILED');
      }

      // TEST 5: Judge updates the pending review successfully
      console.log('\n--- TEST 5: Judge updates pending review ---');
      const updateRes = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${judgeToken}`,
        },
        body: JSON.stringify({
          innovation: 9, // Boosted by 1 (New sum: 59)
          feedback: 'Improved UI design details. Solid layout.',
        }),
      });
      const updateData = await updateRes.json();
      console.log('Status:', updateRes.status);
      console.log('Updated Feedback:', updateData.review.feedback);
      console.log('Updated Total Score:', updateData.review.totalScore);

      if (
        updateRes.status === 200 &&
        updateData.success &&
        updateData.review.totalScore === 59
      ) {
        console.log('✅ TEST 5 PASSED: Pending review updated successfully (total score is now 59)');
      } else {
        throw new Error('TEST 5 FAILED');
      }

      // TEST 6: Judge completes the review (sets status Completed)
      console.log('\n--- TEST 6: Judge completes review ---');
      const completeRes = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${judgeToken}`,
        },
        body: JSON.stringify({
          status: 'Completed',
        }),
      });
      const completeData = await completeRes.json();
      console.log('Status:', completeRes.status);
      console.log('Final Status:', completeData.review.status);

      if (completeRes.status === 200 && completeData.review.status === 'Completed') {
        console.log('✅ TEST 6 PASSED: Review completed successfully');
      } else {
        throw new Error('TEST 6 FAILED');
      }

      // TEST 7: Judge attempt to update completed review is blocked
      console.log('\n--- TEST 7: Judge cannot update completed review ---');
      const blockUpdateRes = await fetch(`${BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${judgeToken}`,
        },
        body: JSON.stringify({
          innovation: 10,
        }),
      });
      const blockUpdateData = await blockUpdateRes.json();
      console.log('Status:', blockUpdateRes.status);
      console.log('Response:', JSON.stringify(blockUpdateData, null, 2));

      if (blockUpdateRes.status === 400 && !blockUpdateData.success) {
        console.log('✅ TEST 7 PASSED: Completed review locked against edits');
      } else {
        throw new Error('TEST 7 FAILED');
      }

      // TEST 8: Participant is blocked from viewing reviews until hackathon status is Completed
      console.log('\n--- TEST 8: Participant blocked from reading reviews during Ongoing status ---');
      const viewRes = await fetch(`${BASE_URL}/reviews/submission/${subId}`, {
        headers: { Authorization: `Bearer ${partToken}` },
      });
      const viewData = await viewRes.json();
      console.log('Status:', viewRes.status);
      console.log('Response:', JSON.stringify(viewData, null, 2));

      if (viewRes.status === 403 && !viewData.success) {
        console.log('✅ TEST 8 PASSED: Participant read access blocked during Ongoing status');
      } else {
        throw new Error('TEST 8 FAILED');
      }

      // TEST 9: Participant can view reviews after hackathon is Completed
      console.log('\n--- TEST 9: Participant can read reviews after hackathon Completed ---');
      // Set hackathon status to Completed in database mock
      const hackIdx = testHackathons.findIndex((h) => String(h._id) === String(hackId));
      testHackathons[hackIdx].status = 'Completed';

      const viewPastRes = await fetch(`${BASE_URL}/reviews/submission/${subId}`, {
        headers: { Authorization: `Bearer ${partToken}` },
      });
      const viewPastData = await viewPastRes.json();
      console.log('Status:', viewPastRes.status);
      console.log('Reviews Count:', viewPastData.reviews?.length);

      if (viewPastRes.status === 200 && viewPastData.success && viewPastData.reviews?.length === 1) {
        console.log('✅ TEST 9 PASSED: Participant read access allowed after hackathon completion');
      } else {
        throw new Error('TEST 9 FAILED');
      }

      console.log('\n======================================================');
      console.log('🎉 ALL EVALUATIONS SYSTEM TESTS PASSED SUCCESSFULLY! 🎉');
      console.log('======================================================');
    } catch (err) {
      console.error('\n❌ TEST SUITE FAILURE:', err.message);
      process.exitCode = 1;
    } finally {
      server.close(() => {
        console.log('[Server] Temporary test server stopped.');
        process.exit(process.exitCode || 0);
      });
    }
  });
};

runTests();
