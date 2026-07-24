import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import Hackathon from '../models/Hackathon.js';
import Registration from '../models/Registration.js';
import Team from '../models/Team.js';

// --- DATABASE MOCKING SETUP ---
const testUsers = [];
const testHackathons = [];
const testRegistrations = [];
const testTeams = [];

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

// Mock Registration
Registration.findOne = function (query) {
  const found = testRegistrations.find(
    (r) =>
      String(r.participant) === String(query.participant) &&
      String(r.hackathon) === String(query.hackathon) &&
      r.status === query.status
  );
  return {
    then: (resolve) => resolve(found ? new Registration(found) : null),
  };
};

Registration.create = async function (data) {
  const doc = new Registration(data);
  const plainObj = doc.toObject();
  plainObj._id = doc._id || new mongoose.Types.ObjectId();
  testRegistrations.push(plainObj);
  return doc;
};

// Mock Team
class MockTeamQuery {
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
      const doc = new Team(item);
      this.populatePaths.forEach((path) => {
        if (path === 'hackathon') {
          const hack = testHackathons.find(
            (h) => String(h._id) === String(item.hackathon)
          );
          if (hack) doc.hackathon = new Hackathon(hack);
        } else if (path === 'leader') {
          const u = testUsers.find((user) => String(user._id) === String(item.leader));
          if (u) doc.leader = new User(u);
        } else if (path === 'members') {
          doc.members = item.members.map((memberId) => {
            const u = testUsers.find((user) => String(user._id) === String(memberId));
            return u ? new User(u) : memberId;
          });
        }
      });
      return doc;
    });
    resolve(docs);
  }
}

Team.find = function (queryObj) {
  let filtered = [...testTeams];

  if (queryObj.$or) {
    const leaderId = queryObj.$or[0].leader;
    const memberId = queryObj.$or[1].members;
    filtered = filtered.filter(
      (t) =>
        String(t.leader) === String(leaderId) ||
        t.members.some((m) => String(m) === String(memberId))
    );
  }

  if (queryObj.hackathon) {
    filtered = filtered.filter(
      (t) => String(t.hackathon) === String(queryObj.hackathon)
    );
  }

  if (queryObj.status) {
    if (queryObj.status.$ne) {
      filtered = filtered.filter((t) => t.status !== queryObj.status.$ne);
    } else {
      filtered = filtered.filter((t) => t.status === queryObj.status);
    }
  }

  return new MockTeamQuery(filtered);
};

Team.findOne = function (queryObj) {
  const found = testTeams.find((t) => {
    if (queryObj.status && queryObj.status.$ne && t.status === queryObj.status.$ne) {
      return false;
    }

    if (queryObj.hackathon && String(t.hackathon) !== String(queryObj.hackathon)) {
      return false;
    }

    if (queryObj.inviteCode && t.inviteCode !== queryObj.inviteCode) {
      return false;
    }

    if (queryObj.teamName) {
      let isMatch = false;
      if (queryObj.teamName.$regex) {
        isMatch = queryObj.teamName.$regex.test(t.teamName);
      } else {
        isMatch = t.teamName.toLowerCase() === queryObj.teamName.toLowerCase();
      }
      if (!isMatch) return false;
    }

    if (queryObj.$or) {
      const leaderId = queryObj.$or[0].leader;
      const memberId = queryObj.$or[1].members;
      const matches =
        String(t.leader) === String(leaderId) ||
        t.members.some((m) => String(m) === String(memberId));
      if (!matches) return false;
    }

    return true;
  });

  return {
    then: (resolve) => resolve(found ? new Team(found) : null),
  };
};

Team.findById = function (id) {
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

  const found = testTeams.find((t) => String(t._id) === String(id));
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
        const doc = new Team(item);
        if (path === 'hackathon') {
          const h = testHackathons.find(
            (hack) => String(hack._id) === String(item.hackathon)
          );
          if (h) doc.hackathon = new Hackathon(h);
        } else if (path === 'leader') {
          const u = testUsers.find((user) => String(user._id) === String(item.leader));
          if (u) doc.leader = new User(u);
        } else if (path === 'members') {
          doc.members = item.members.map((memberId) => {
            const u = testUsers.find((user) => String(user._id) === String(memberId));
            return u ? new User(u) : memberId;
          });
        }
        return makeChain(doc);
      },
      then: (resolve) => resolve(item instanceof Team ? item : new Team(item)),
    };
  };

  return makeChain(found);
};

Team.prototype.save = async function () {
  if (!this.inviteCode) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'JOIN-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.inviteCode = code;
  }

  const plainObj = this.toObject();
  plainObj._id = this._id || new mongoose.Types.ObjectId();
  plainObj.inviteCode = this.inviteCode;

  const existingIndex = testTeams.findIndex(
    (t) => String(t._id) === String(plainObj._id)
  );

  if (existingIndex !== -1) {
    testTeams[existingIndex] = plainObj;
  } else {
    // Enforce name uniqueness
    const duplicate = testTeams.find(
      (t) =>
        String(t.hackathon) === String(plainObj.hackathon) &&
        t.teamName.toLowerCase() === plainObj.teamName.toLowerCase() &&
        t.status !== 'Disbanded'
    );
    if (duplicate) {
      const err = new Error('Team name is already taken for this hackathon');
      throw err;
    }
    testTeams.push(plainObj);
  }
  return this;
};

Team.create = async function (data) {
  const doc = new Team(data);
  await doc.save();
  return doc;
};
// --- END DATABASE MOCKING SETUP ---

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}/api`;

const runTests = async () => {
  console.log('--- Starting Teams Module Verification Tests ---');

  // Seed Users
  const orgId = new mongoose.Types.ObjectId();
  const part1Id = new mongoose.Types.ObjectId(); // Leader
  const part2Id = new mongoose.Types.ObjectId(); // Member 1
  const part3Id = new mongoose.Types.ObjectId(); // Member 2
  const part4Id = new mongoose.Types.ObjectId(); // Excess Member (blocked by maxTeamSize)

  const mockUsers = [
    { _id: orgId, name: 'Organizer 1', email: 'org@test.com', role: 'Organizer' },
    { _id: part1Id, name: 'Participant 1', email: 'p1@test.com', role: 'Participant' },
    { _id: part2Id, name: 'Participant 2', email: 'p2@test.com', role: 'Participant' },
    { _id: part3Id, name: 'Participant 3', email: 'p3@test.com', role: 'Participant' },
    { _id: part4Id, name: 'Participant 4', email: 'p4@test.com', role: 'Participant' },
  ];
  testUsers.push(...mockUsers.map((u) => new User(u)));

  // Seed Hackathon
  const hackId = new mongoose.Types.ObjectId();
  await Hackathon.create({
    _id: hackId,
    title: 'Test Hackathon',
    theme: 'Design',
    mode: 'Online',
    startDate: '2026-09-01T00:00:00Z',
    endDate: '2026-09-03T00:00:00Z',
    registrationDeadline: '2026-08-30T00:00:00Z',
    maxTeamSize: 3, // Capacity limit of 3 members
    status: 'Registration Open',
    createdBy: orgId,
  });

  // Seed Registrations (All participants have Approved registrations)
  await Registration.create({ participant: part1Id, hackathon: hackId, status: 'Approved' });
  await Registration.create({ participant: part2Id, hackathon: hackId, status: 'Approved' });
  await Registration.create({ participant: part3Id, hackathon: hackId, status: 'Approved' });
  await Registration.create({ participant: part4Id, hackathon: hackId, status: 'Approved' });

  console.log('[Setup] Seeded mock users, hackathon and registration records.');

  // Generate Tokens
  const p1Token = jwt.sign({ id: part1Id }, process.env.JWT_SECRET);
  const p2Token = jwt.sign({ id: part2Id }, process.env.JWT_SECRET);
  const p3Token = jwt.sign({ id: part3Id }, process.env.JWT_SECRET);
  const p4Token = jwt.sign({ id: part4Id }, process.env.JWT_SECRET);

  const server = app.listen(PORT, async () => {
    console.log(`[Server] Temporary test server running on port ${PORT}`);

    try {
      let teamId = '';
      let inviteCode = '';

      // TEST 1: Approved Participant can create team successfully
      console.log('\n--- TEST 1: Participant can create team successfully ---');
      const createRes = await fetch(`${BASE_URL}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${p1Token}`,
        },
        body: JSON.stringify({
          teamName: 'Alpha Coding',
          hackathon: hackId,
        }),
      });
      const createData = await createRes.json();
      console.log('Status:', createRes.status);
      console.log('Response:', JSON.stringify(createData, null, 2));

      if (
        createRes.status === 201 &&
        createData.success &&
        createData.team.leader === String(part1Id) &&
        createData.team.members.includes(String(part1Id))
      ) {
        console.log('✅ TEST 1 PASSED: Team created successfully');
        teamId = createData.team._id;
        inviteCode = createData.team.inviteCode;
      } else {
        throw new Error('TEST 1 FAILED');
      }

      // TEST 2: Duplicate team name in same hackathon blocked
      console.log('\n--- TEST 2: Duplicate team name blocked ---');
      const dupRes = await fetch(`${BASE_URL}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${p2Token}`, // Different user, same name
        },
        body: JSON.stringify({
          teamName: 'Alpha Coding',
          hackathon: hackId,
        }),
      });
      const dupData = await dupRes.json();
      console.log('Status:', dupRes.status);
      console.log('Response:', JSON.stringify(dupData, null, 2));

      if (dupRes.status === 400 && !dupData.success) {
        console.log('✅ TEST 2 PASSED: Duplicate team name blocked');
      } else {
        throw new Error('TEST 2 FAILED');
      }

      // TEST 3: User joins team using invite code
      console.log('\n--- TEST 3: User joins team using invite code ---');
      const joinRes = await fetch(`${BASE_URL}/teams/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${p2Token}`,
        },
        body: JSON.stringify({ inviteCode }),
      });
      const joinData = await joinRes.json();
      console.log('Status:', joinRes.status);
      console.log('Members:', joinData.team.members);

      if (
        joinRes.status === 200 &&
        joinData.success &&
        joinData.team.members.includes(String(part2Id))
      ) {
        console.log('✅ TEST 3 PASSED: Member joined successfully');
      } else {
        throw new Error('TEST 3 FAILED');
      }

      // TEST 4: Double membership blocked (User 2 tries to join again / join another team)
      console.log('\n--- TEST 4: Double membership within hackathon blocked ---');
      const doubleRes = await fetch(`${BASE_URL}/teams/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${p2Token}`,
        },
        body: JSON.stringify({ inviteCode }),
      });
      const doubleData = await doubleRes.json();
      console.log('Status:', doubleRes.status);
      console.log('Response:', JSON.stringify(doubleData, null, 2));

      if (doubleRes.status === 400 && !doubleData.success) {
        console.log('✅ TEST 4 PASSED: Double membership rejected');
      } else {
        throw new Error('TEST 4 FAILED');
      }

      // TEST 5: User 3 joins team (Members: 3, Max Capacity: 3)
      console.log('\n--- TEST 5: Join team up to max capacity ---');
      const join3Res = await fetch(`${BASE_URL}/teams/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${p3Token}`,
        },
        body: JSON.stringify({ inviteCode }),
      });
      const join3Data = await join3Res.json();
      console.log('Status:', join3Res.status);
      console.log('Members Count:', join3Data.team.members.length);

      if (join3Res.status === 200 && join3Data.team.members.length === 3) {
        console.log('✅ TEST 5 PASSED: Team filled to max capacity');
      } else {
        throw new Error('TEST 5 FAILED');
      }

      // TEST 6: User 4 tries to join, fails due to maxTeamSize limit
      console.log('\n--- TEST 6: Join team fails if full ---');
      const join4Res = await fetch(`${BASE_URL}/teams/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${p4Token}`,
        },
        body: JSON.stringify({ inviteCode }),
      });
      const join4Data = await join4Res.json();
      console.log('Status:', join4Res.status);
      console.log('Response:', JSON.stringify(join4Data, null, 2));

      if (join4Res.status === 400 && !join4Data.success) {
        console.log('✅ TEST 6 PASSED: Reached limit enforcement works');
      } else {
        throw new Error('TEST 6 FAILED');
      }

      // TEST 7: Leader transfers leadership
      console.log('\n--- TEST 7: Leader transfers leadership to Participant 2 ---');
      const transRes = await fetch(`${BASE_URL}/teams/${teamId}/transfer-leadership`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${p1Token}`,
        },
        body: JSON.stringify({ memberId: part2Id }),
      });
      const transData = await transRes.json();
      console.log('Status:', transRes.status);
      console.log('New Leader:', transData.team.leader);

      if (
        transRes.status === 200 &&
        transData.success &&
        transData.team.leader === String(part2Id)
      ) {
        console.log('✅ TEST 7 PASSED: Leadership transferred successfully');
      } else {
        throw new Error('TEST 7 FAILED');
      }

      // TEST 8: New Leader removes Participant 1 (former leader)
      console.log('\n--- TEST 8: New leader removes member ---');
      const removeRes = await fetch(
        `${BASE_URL}/teams/${teamId}/remove-member/${part1Id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${p2Token}` }, // Caller is User 2 (new leader)
        }
      );
      const removeData = await removeRes.json();
      console.log('Status:', removeRes.status);
      console.log('Response:', JSON.stringify(removeData, null, 2));

      const updatedTeam = testTeams.find((t) => String(t._id) === String(teamId));
      if (
        removeRes.status === 200 &&
        removeData.success &&
        !updatedTeam.members.includes(String(part1Id))
      ) {
        console.log('✅ TEST 8 PASSED: Member removed successfully');
      } else {
        throw new Error('TEST 8 FAILED');
      }

      // TEST 9: Regular member leaves team successfully
      console.log('\n--- TEST 9: Member leaves team successfully ---');
      const leaveRes = await fetch(`${BASE_URL}/teams/${teamId}/leave`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${p3Token}` }, // Participant 3 leaves
      });
      const leaveData = await leaveRes.json();
      console.log('Status:', leaveRes.status);
      console.log('Response:', JSON.stringify(leaveData, null, 2));

      const finalTeam = testTeams.find((t) => String(t._id) === String(teamId));
      if (
        leaveRes.status === 200 &&
        leaveData.success &&
        !finalTeam.members.includes(String(part3Id))
      ) {
        console.log('✅ TEST 9 PASSED: Member left team successfully');
      } else {
        throw new Error('TEST 9 FAILED');
      }

      // TEST 10: Leader disbands/deletes team successfully
      console.log('\n--- TEST 10: Leader disbands team ---');
      const deleteRes = await fetch(`${BASE_URL}/teams/${teamId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${p2Token}` }, // Leader disbands
      });
      const deleteData = await deleteRes.json();
      console.log('Status:', deleteRes.status);
      console.log('Response:', JSON.stringify(deleteData, null, 2));

      const disbandedTeam = testTeams.find((t) => String(t._id) === String(teamId));
      if (
        deleteRes.status === 200 &&
        deleteData.success &&
        disbandedTeam.status === 'Disbanded'
      ) {
        console.log('✅ TEST 10 PASSED: Team disbanded successfully');
      } else {
        throw new Error('TEST 10 FAILED');
      }

      console.log('\n======================================================');
      console.log('🎉 ALL HACKATHON TEAMS TESTS PASSED SUCCESSFULLY! 🎉');
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
