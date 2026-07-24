import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import Hackathon from '../models/Hackathon.js';
import Team from '../models/Team.js';
import Submission from '../models/Submission.js';

// --- DATABASE MOCKING SETUP ---
const testUsers = [];
const testHackathons = [];
const testTeams = [];
const testSubmissions = [];

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

// Mock Hackathon save & find
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
Team.findOne = function (query) {
  const found = testTeams.find((t) => {
    if (query.leader && String(t.leader) !== String(query.leader)) return false;
    if (query.members && !t.members.some((m) => String(m) === String(query.members))) return false;
    if (query.status && query.status.$ne && t.status === query.status.$ne) return false;
    return true;
  });

  return {
    then: (resolve) => resolve(found ? new Team(found) : null),
  };
};

Team.create = async function (data) {
  const doc = new Team(data);
  const plainObj = doc.toObject();
  plainObj._id = doc._id || new mongoose.Types.ObjectId();
  testTeams.push(plainObj);
  return doc;
};

// Mock Submission
Submission.findOne = function (queryObj) {
  const found = testSubmissions.find((s) => {
    if (queryObj.team && String(s.team) !== String(queryObj.team)) return false;
    return true;
  });
  return {
    populate: () => ({
      populate: () => ({
        populate: () => ({
          then: (resolve) => resolve(found ? new Submission(found) : null),
        }),
      }),
    }),
    then: (resolve) => resolve(found ? new Submission(found) : null),
  };
};

Submission.findById = function (id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error(`Cast to ObjectId failed for value "${id}"`);
    err.name = 'CastError';
    err.path = '_id';
    return {
      populate: () => ({
        populate: () => ({
          populate: () => ({
            then: (resolve, reject) => reject(err),
          }),
        }),
      }),
      then: (resolve, reject) => reject(err),
    };
  }

  const found = testSubmissions.find((s) => String(s._id) === String(id));
  if (!found) {
    return {
      populate: () => ({
        populate: () => ({
          populate: () => ({
            then: (resolve) => resolve(null),
          }),
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
        } else if (path === 'submittedBy') {
          const u = testUsers.find((user) => String(user._id) === String(item.submittedBy));
          if (u) doc.submittedBy = new User(u);
        }
        return makeChain(doc);
      },
      then: (resolve) =>
        resolve(item instanceof Submission ? item : new Submission(item)),
    };
  };

  return makeChain(found);
};

Submission.prototype.save = async function () {
  const plainObj = this.toObject();
  plainObj._id = this._id || new mongoose.Types.ObjectId();

  const existingIndex = testSubmissions.findIndex(
    (s) => String(s._id) === String(plainObj._id)
  );
  if (existingIndex !== -1) {
    testSubmissions[existingIndex] = plainObj;
  } else {
    // Unique check
    const dup = testSubmissions.find(
      (s) => String(s.team) === String(plainObj.team)
    );
    if (dup) {
      const err = new Error('Duplicate key error index: team_1');
      err.code = 11000;
      throw err;
    }
    testSubmissions.push(plainObj);
  }
  return this;
};

Submission.create = async function (data) {
  const doc = new Submission(data);
  await doc.save();
  return doc;
};

Submission.deleteOne = async (query) => {
  const index = testSubmissions.findIndex(
    (s) => String(s._id) === String(query._id)
  );
  if (index !== -1) {
    testSubmissions.splice(index, 1);
  }
  return { deletedCount: 1 };
};
// --- END DATABASE MOCKING SETUP ---

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}/api`;

const runTests = async () => {
  console.log('--- Starting Submissions Module Verification Tests ---');

  // Seed Users
  const orgId = new mongoose.Types.ObjectId();
  const leaderId = new mongoose.Types.ObjectId();
  const memberId = new mongoose.Types.ObjectId();
  const observerId = new mongoose.Types.ObjectId();

  const mockUsers = [
    { _id: orgId, name: 'Organizer 1', email: 'org@test.com', role: 'Organizer' },
    { _id: leaderId, name: 'Team Leader', email: 'leader@test.com', role: 'Participant' },
    { _id: memberId, name: 'Team Member', email: 'member@test.com', role: 'Participant' },
    { _id: observerId, name: 'Observer', email: 'obs@test.com', role: 'Participant' },
  ];
  testUsers.push(...mockUsers.map((u) => new User(u)));

  // Seed Hackathons (Open deadline & Closed deadline)
  const openHackId = new mongoose.Types.ObjectId();
  const closedHackId = new mongoose.Types.ObjectId();

  await Hackathon.create({
    _id: openHackId,
    title: 'Open Hackathon',
    theme: 'AI',
    mode: 'Online',
    startDate: '2026-09-01T00:00:00Z',
    endDate: '2026-09-10T00:00:00Z', // In future
    registrationDeadline: '2026-08-30T00:00:00Z',
    maxTeamSize: 4,
    status: 'Registration Open',
    createdBy: orgId,
  });

  await Hackathon.create({
    _id: closedHackId,
    title: 'Closed Hackathon',
    theme: 'AI',
    mode: 'Online',
    startDate: '2026-07-01T00:00:00Z',
    endDate: '2026-07-20T00:00:00Z', // In past (Today is July 24, 2026)
    registrationDeadline: '2026-06-30T00:00:00Z',
    maxTeamSize: 4,
    status: 'Ongoing',
    createdBy: orgId,
  });

  // Seed Teams
  const activeTeamId = new mongoose.Types.ObjectId();
  const expiredTeamId = new mongoose.Types.ObjectId();

  await Team.create({
    _id: activeTeamId,
    teamName: 'Alpha Submitter',
    hackathon: openHackId,
    leader: leaderId,
    members: [leaderId, memberId],
    maxMembers: 4,
    status: 'Active',
  });

  await Team.create({
    _id: expiredTeamId,
    teamName: 'Late Submitter',
    hackathon: closedHackId,
    leader: leaderId, // Same user leading both teams for test simplicity
    members: [leaderId],
    maxMembers: 4,
    status: 'Active',
  });

  console.log('[Setup] Seeded mock users, hackathons and teams.');

  // Generate Tokens
  const leaderToken = jwt.sign({ id: leaderId }, process.env.JWT_SECRET);
  const memberToken = jwt.sign({ id: memberId }, process.env.JWT_SECRET);
  const obsToken = jwt.sign({ id: observerId }, process.env.JWT_SECRET);

  const server = app.listen(PORT, async () => {
    console.log(`[Server] Temporary test server running on port ${PORT}`);

    try {
      let submissionId = '';

      // TEST 1: Team leader submits project successfully
      console.log('\n--- TEST 1: Team leader submits project successfully ---');
      const submitRes = await fetch(`${BASE_URL}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${leaderToken}`,
        },
        body: JSON.stringify({
          projectName: 'AI Smart Search',
          problemStatement: 'Information retrieval is slow.',
          solution: 'Build semantic indexing.',
          githubRepository: 'https://github.com/leader/smart-search',
          liveDemo: 'https://smart-search.demo.com',
          techStack: 'Node, React, Python',
          demoVideo: 'https://youtube.com/watch?v=123',
        }),
      });
      const submitData = await submitRes.json();
      console.log('Status:', submitRes.status);
      console.log('Response:', JSON.stringify(submitData, null, 2));

      if (submitRes.status === 201 && submitData.success && submitData.submission._id) {
        console.log('✅ TEST 1 PASSED: Project submitted successfully');
        submissionId = submitData.submission._id;
      } else {
        throw new Error('TEST 1 FAILED');
      }

      // TEST 2: Team member cannot submit project
      console.log('\n--- TEST 2: Team member cannot submit project ---');
      const memberSubRes = await fetch(`${BASE_URL}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({
          projectName: 'Fail Project',
          problemStatement: 'Fails',
          solution: 'Fails Solution',
          githubRepository: 'https://github.com/member/fail',
          techStack: 'None',
        }),
      });
      const memberSubData = await memberSubRes.json();
      console.log('Status:', memberSubRes.status);
      console.log('Response:', JSON.stringify(memberSubData, null, 2));

      if (memberSubRes.status === 403 && !memberSubData.success) {
        console.log('✅ TEST 2 PASSED: Team member write blocked');
      } else {
        throw new Error('TEST 2 FAILED');
      }

      // TEST 3: Duplicate submission blocked
      console.log('\n--- TEST 3: Duplicate submission blocked ---');
      const dupRes = await fetch(`${BASE_URL}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${leaderToken}`,
        },
        body: JSON.stringify({
          projectName: 'Duplicate Project',
          problemStatement: 'Dup',
          solution: 'Dup Solution',
          githubRepository: 'https://github.com/leader/dup',
          techStack: 'None',
        }),
      });
      const dupData = await dupRes.json();
      console.log('Status:', dupRes.status);
      console.log('Response:', JSON.stringify(dupData, null, 2));

      if (dupRes.status === 400 && !dupData.success) {
        console.log('✅ TEST 3 PASSED: Duplicate submission blocked');
      } else {
        throw new Error('TEST 3 FAILED');
      }

      // TEST 4: URL validations block incorrect formats
      console.log('\n--- TEST 4: URL validation testing ---');
      const urlRes = await fetch(`${BASE_URL}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${leaderToken}`, // (Will fail validation first)
        },
        body: JSON.stringify({
          projectName: 'URL Fails',
          problemStatement: 'Fails',
          solution: 'Fails Solution',
          githubRepository: 'invalid-github-url', // Invalid github URL
          techStack: 'None',
        }),
      });
      const urlData = await urlRes.json();
      console.log('Status:', urlRes.status);
      console.log('Response:', JSON.stringify(urlData, null, 2));

      if (urlRes.status === 400 && !urlData.success) {
        console.log('✅ TEST 4 PASSED: Invalid GitHub URL blocked');
      } else {
        throw new Error('TEST 4 FAILED');
      }

      // TEST 5: Leader updates submission successfully before deadline
      console.log('\n--- TEST 5: Leader updates submission successfully ---');
      const updateRes = await fetch(`${BASE_URL}/submissions/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${leaderToken}`,
        },
        body: JSON.stringify({
          projectName: 'AI Semantic indexing v2',
          techStack: 'Node, React, Python, TensorFlow',
        }),
      });
      const updateData = await updateRes.json();
      console.log('Status:', updateRes.status);
      console.log('Updated Name:', updateData.submission.projectName);
      console.log('Updated Tech Stack:', updateData.submission.techStack);

      if (
        updateRes.status === 200 &&
        updateData.success &&
        updateData.submission.projectName === 'AI Semantic indexing v2'
      ) {
        console.log('✅ TEST 5 PASSED: Leader updated submission');
      } else {
        throw new Error('TEST 5 FAILED');
      }

      // TEST 6: Submissions fail if hackathon deadline (endDate) has passed
      // We'll temporarily switch active team to expired team in mock database
      console.log('\n--- TEST 6: Submission fails after deadline ---');
      // Set leader to lead the expired team instead
      const teamIdx = testTeams.findIndex((t) => String(t._id) === String(activeTeamId));
      testTeams[teamIdx].leader = new mongoose.Types.ObjectId(); // Disconnect leader from active team

      const submitPastRes = await fetch(`${BASE_URL}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${leaderToken}`, // Leader now belongs to expired team
        },
        body: JSON.stringify({
          projectName: 'Late Entry',
          problemStatement: 'Fails',
          solution: 'Fails Solution',
          githubRepository: 'https://github.com/leader/late',
          techStack: 'Node',
        }),
      });
      const submitPastData = await submitPastRes.json();
      console.log('Status:', submitPastRes.status);
      console.log('Response:', JSON.stringify(submitPastData, null, 2));

      if (submitPastRes.status === 400 && !submitPastData.success) {
        console.log('✅ TEST 6 PASSED: Expired deadline submission blocked');
      } else {
        throw new Error('TEST 6 FAILED');
      }

      // Restore leader back to active team
      testTeams[teamIdx].leader = leaderId;

      // TEST 7: Member views submission details
      console.log('\n--- TEST 7: Team member views submission ---');
      const viewRes = await fetch(`${BASE_URL}/submissions/${submissionId}`, {
        headers: { Authorization: `Bearer ${memberToken}` },
      });
      const viewData = await viewRes.json();
      console.log('Status:', viewRes.status);
      console.log('Project Name:', viewData.submission.projectName);

      if (viewRes.status === 200 && viewData.success) {
        console.log('✅ TEST 7 PASSED: Member view permitted');
      } else {
        throw new Error('TEST 7 FAILED');
      }

      // TEST 8: Non-member is blocked from viewing
      console.log('\n--- TEST 8: Non-member view request blocked ---');
      const blockRes = await fetch(`${BASE_URL}/submissions/${submissionId}`, {
        headers: { Authorization: `Bearer ${obsToken}` },
      });
      const blockData = await blockRes.json();
      console.log('Status:', blockRes.status);
      console.log('Response:', JSON.stringify(blockData, null, 2));

      if (blockRes.status === 403 && !blockData.success) {
        console.log('✅ TEST 8 PASSED: Non-member view request blocked');
      } else {
        throw new Error('TEST 8 FAILED');
      }

      // TEST 9: Leader deletes submission successfully
      console.log('\n--- TEST 9: Leader deletes submission before deadline ---');
      const delRes = await fetch(`${BASE_URL}/submissions/${submissionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${leaderToken}` },
      });
      const delData = await delRes.json();
      console.log('Status:', delRes.status);
      console.log('Response:', JSON.stringify(delData, null, 2));

      const findDeleted = testSubmissions.find((s) => String(s._id) === String(submissionId));
      if (delRes.status === 200 && delData.success && !findDeleted) {
        console.log('✅ TEST 9 PASSED: Leader deleted submission successfully');
      } else {
        throw new Error('TEST 9 FAILED');
      }

      console.log('\n======================================================');
      console.log('🎉 ALL PROJECT SUBMISSION TESTS PASSED SUCCESSFULLY! 🎉');
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
