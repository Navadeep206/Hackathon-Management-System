import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import Hackathon from '../models/Hackathon.js';
import Registration from '../models/Registration.js';

// --- DATABASE MOCKING SETUP ---
const testUsers = [];
const testHackathons = [];
const testRegistrations = [];

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

// Mock Hackathon save
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
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error(`Cast to ObjectId failed for value "${id}"`);
    err.name = 'CastError';
    err.path = '_id';
    return {
      then: (resolve, reject) => reject(err),
    };
  }
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

// Mock Registration methods
class MockRegistrationQuery {
  constructor(results) {
    this.results = results;
    this.populatePath = null;
  }

  populate(path) {
    this.populatePath = path;
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
      const doc = new Registration(item);
      if (this.populatePath === 'hackathon') {
        const hackObj = testHackathons.find(
          (h) => String(h._id) === String(item.hackathon)
        );
        if (hackObj) {
          doc.hackathon = new Hackathon(hackObj);
        }
      } else if (this.populatePath === 'participant') {
        const userObj = testUsers.find(
          (u) => String(u._id) === String(item.participant)
        );
        if (userObj) {
          doc.participant = new User(userObj);
        }
      }
      return doc;
    });
    resolve(docs);
  }
}

Registration.find = function (queryObj) {
  let filtered = [...testRegistrations];
  if (queryObj.participant) {
    filtered = filtered.filter(
      (r) => String(r.participant) === String(queryObj.participant)
    );
  }
  if (queryObj.hackathon) {
    filtered = filtered.filter(
      (r) => String(r.hackathon) === String(queryObj.hackathon)
    );
  }
  if (queryObj.status) {
    filtered = filtered.filter((r) => r.status === queryObj.status);
  }
  return new MockRegistrationQuery(filtered);
};

Registration.countDocuments = async function (queryObj) {
  let filtered = [...testRegistrations];
  if (queryObj.participant) {
    filtered = filtered.filter(
      (r) => String(r.participant) === String(queryObj.participant)
    );
  }
  if (queryObj.hackathon) {
    filtered = filtered.filter(
      (r) => String(r.hackathon) === String(queryObj.hackathon)
    );
  }
  if (queryObj.status) {
    filtered = filtered.filter((r) => r.status === queryObj.status);
  }
  return filtered.length;
};

Registration.findOne = function (queryObj) {
  const found = testRegistrations.find(
    (r) =>
      String(r.participant) === String(queryObj.participant) &&
      String(r.hackathon) === String(queryObj.hackathon)
  );
  return {
    then: (resolve) => resolve(found ? new Registration(found) : null),
  };
};

Registration.findById = function (id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error(`Cast to ObjectId failed for value "${id}"`);
    err.name = 'CastError';
    err.path = '_id';
    return {
      populate: () => ({
        then: (resolve, reject) => reject(err),
      }),
      then: (resolve, reject) => reject(err),
    };
  }

  const found = testRegistrations.find((r) => String(r._id) === String(id));
  if (!found) {
    return {
      populate: () => ({
        then: (resolve) => resolve(null),
      }),
      then: (resolve) => resolve(null),
    };
  }

  return {
    populate: (path) => {
      const doc = new Registration(found);
      if (path === 'hackathon') {
        const hackObj = testHackathons.find(
          (h) => String(h._id) === String(found.hackathon)
        );
        if (hackObj) {
          doc.hackathon = new Hackathon(hackObj);
        }
      }
      return {
        then: (resolve) => resolve(doc),
      };
    },
    then: (resolve) => resolve(new Registration(found)),
  };
};

Registration.prototype.save = async function () {
  const plainObj = this.toObject();
  plainObj._id = this._id || new mongoose.Types.ObjectId();
  const existingIndex = testRegistrations.findIndex(
    (r) => String(r._id) === String(plainObj._id)
  );
  if (existingIndex !== -1) {
    testRegistrations[existingIndex] = plainObj;
  } else {
    // Unique check
    const dup = testRegistrations.find(
      (r) =>
        String(r.participant) === String(plainObj.participant) &&
        String(r.hackathon) === String(plainObj.hackathon)
    );
    if (dup) {
      const err = new Error('Duplicate key error index: participant_1_hackathon_1');
      err.code = 11000;
      throw err;
    }
    testRegistrations.push(plainObj);
  }
  return this;
};

Registration.create = async function (data) {
  const doc = new Registration(data);
  await doc.save();
  return doc;
};
// --- END DATABASE MOCKING SETUP ---

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}/api`;

const runTests = async () => {
  console.log('--- Starting Registrations Verification Tests ---');

  // Create mock users
  const org1Id = new mongoose.Types.ObjectId();
  const org2Id = new mongoose.Types.ObjectId();
  const part1Id = new mongoose.Types.ObjectId();
  const part2Id = new mongoose.Types.ObjectId();
  const judgeId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();

  const mockUsers = [
    { _id: org1Id, name: 'Organizer 1', email: 'org1@test.com', role: 'Organizer' },
    { _id: org2Id, name: 'Organizer 2', email: 'org2@test.com', role: 'Organizer' },
    { _id: part1Id, name: 'Participant 1', email: 'part1@test.com', role: 'Participant' },
    { _id: part2Id, name: 'Participant 2', email: 'part2@test.com', role: 'Participant' },
    { _id: judgeId, name: 'Judge 1', email: 'judge@test.com', role: 'Judge' },
    { _id: adminId, name: 'Admin 1', email: 'admin@test.com', role: 'Admin' },
  ];
  testUsers.push(...mockUsers.map((u) => new User(u)));

  // Generate tokens
  const org1Token = jwt.sign({ id: org1Id }, process.env.JWT_SECRET);
  const org2Token = jwt.sign({ id: org2Id }, process.env.JWT_SECRET);
  const part1Token = jwt.sign({ id: part1Id }, process.env.JWT_SECRET);
  const part2Token = jwt.sign({ id: part2Id }, process.env.JWT_SECRET);
  const judgeToken = jwt.sign({ id: judgeId }, process.env.JWT_SECRET);
  const adminToken = jwt.sign({ id: adminId }, process.env.JWT_SECRET);

  // Seed mock Hackathons
  const openHackId = new mongoose.Types.ObjectId();
  const closedHackId = new mongoose.Types.ObjectId();
  const expiredHackId = new mongoose.Types.ObjectId();

  await Hackathon.create({
    _id: openHackId,
    title: 'Open Hackathon',
    theme: 'Theme 1',
    mode: 'Online',
    startDate: '2026-09-01T00:00:00Z',
    endDate: '2026-09-03T00:00:00Z',
    registrationDeadline: '2026-08-30T00:00:00Z',
    maxTeamSize: 4,
    status: 'Registration Open',
    createdBy: org1Id,
  });

  await Hackathon.create({
    _id: closedHackId,
    title: 'Closed Hackathon',
    theme: 'Theme 2',
    mode: 'Online',
    startDate: '2026-09-01T00:00:00Z',
    endDate: '2026-09-03T00:00:00Z',
    registrationDeadline: '2026-08-30T00:00:00Z',
    maxTeamSize: 4,
    status: 'Registration Closed',
    createdBy: org1Id,
  });

  await Hackathon.create({
    _id: expiredHackId,
    title: 'Expired Hackathon',
    theme: 'Theme 3',
    mode: 'Online',
    startDate: '2026-09-01T00:00:00Z',
    endDate: '2026-09-03T00:00:00Z',
    registrationDeadline: '2026-07-20T00:00:00Z', // Deadline already passed (Today is July 24, 2026)
    maxTeamSize: 4,
    status: 'Registration Open',
    createdBy: org2Id,
  });

  console.log('[Setup] Seeded mock users & hackathons.');

  const server = app.listen(PORT, async () => {
    console.log(`[Server] Temporary test server running on port ${PORT}`);

    try {
      let registrationId = '';

      // TEST 1: Participant can register successfully
      console.log('\n--- TEST 1: Participant can register successfully ---');
      const regRes = await fetch(`${BASE_URL}/registrations/${openHackId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${part1Token}` },
      });
      const regData = await regRes.json();
      console.log('Status:', regRes.status);
      console.log('Response:', JSON.stringify(regData, null, 2));

      if (regRes.status === 201 && regData.success && regData.status === 'Pending') {
        console.log('✅ TEST 1 PASSED: Registration submitted successfully');
      } else {
        throw new Error('TEST 1 FAILED');
      }

      // Find registration ID in mock database
      registrationId = testRegistrations[0]._id;

      // TEST 2: Duplicate registration blocked
      console.log('\n--- TEST 2: Duplicate registration blocked ---');
      const dupRes = await fetch(`${BASE_URL}/registrations/${openHackId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${part1Token}` },
      });
      const dupData = await dupRes.json();
      console.log('Status:', dupRes.status);
      console.log('Response:', JSON.stringify(dupData, null, 2));

      if (dupRes.status === 400 && !dupData.success) {
        console.log('✅ TEST 2 PASSED: Duplicate registration blocked');
      } else {
        throw new Error('TEST 2 FAILED');
      }

      // TEST 3: Organizer/Judge cannot register
      console.log('\n--- TEST 3: Organizer/Judge role block validation ---');
      const judgeRegRes = await fetch(`${BASE_URL}/registrations/${openHackId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${judgeToken}` },
      });
      const judgeRegData = await judgeRegRes.json();
      console.log('Status:', judgeRegRes.status);
      console.log('Response:', JSON.stringify(judgeRegData, null, 2));

      if (judgeRegRes.status === 403 && !judgeRegData.success) {
        console.log('✅ TEST 3 PASSED: Non-participant registration blocked');
      } else {
        throw new Error('TEST 3 FAILED');
      }

      // TEST 4: Registration blocked if deadline passed or status closed
      console.log('\n--- TEST 4a: Registration on CLOSED status hackathon blocked ---');
      const closedRes = await fetch(`${BASE_URL}/registrations/${closedHackId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${part2Token}` },
      });
      const closedData = await closedRes.json();
      console.log('Status:', closedRes.status);
      console.log('Response:', JSON.stringify(closedData, null, 2));

      if (closedRes.status === 400 && !closedData.success) {
        console.log('✅ TEST 4a PASSED: Closed status block works');
      } else {
        throw new Error('TEST 4a FAILED');
      }

      console.log('\n--- TEST 4b: Registration on EXPIRED deadline hackathon blocked ---');
      const expiredRes = await fetch(`${BASE_URL}/registrations/${expiredHackId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${part2Token}` },
      });
      const expiredData = await expiredRes.json();
      console.log('Status:', expiredRes.status);
      console.log('Response:', JSON.stringify(expiredData, null, 2));

      if (expiredRes.status === 400 && !expiredData.success) {
        console.log('✅ TEST 4b PASSED: Passed deadline block works');
      } else {
        throw new Error('TEST 4b FAILED');
      }

      // TEST 5: View own registrations
      console.log('\n--- TEST 5: Participant views own registrations ---');
      const myRes = await fetch(`${BASE_URL}/registrations/my`, {
        headers: { Authorization: `Bearer ${part1Token}` },
      });
      const myData = await myRes.json();
      console.log('Status:', myRes.status);
      console.log('Count:', myData.count);

      if (myRes.status === 200 && myData.success && myData.count === 1) {
        console.log('✅ TEST 5 PASSED: Participant read own registrations successfully');
      } else {
        throw new Error('TEST 5 FAILED');
      }

      // Seed another pending registration for participant 2 on openHack
      await Registration.create({
        participant: part2Id,
        hackathon: openHackId,
        status: 'Pending',
      });
      const part2RegId = testRegistrations[1]._id;

      // TEST 6: Participant cancels pending registration
      console.log('\n--- TEST 6: Participant cancels pending registration ---');
      const cancelRes = await fetch(`${BASE_URL}/registrations/${part2RegId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${part2Token}` },
      });
      const cancelData = await cancelRes.json();
      console.log('Status:', cancelRes.status);
      console.log('Response:', JSON.stringify(cancelData, null, 2));

      const updatedReg2 = testRegistrations.find((r) => String(r._id) === String(part2RegId));
      if (cancelRes.status === 200 && cancelData.success && updatedReg2.status === 'Cancelled') {
        console.log('✅ TEST 6 PASSED: Pending registration successfully cancelled');
      } else {
        throw new Error('TEST 6 FAILED');
      }

      // TEST 7: Organizer approves registration for own hackathon
      console.log('\n--- TEST 7: Organizer approves registration ---');
      const approveRes = await fetch(`${BASE_URL}/registrations/${registrationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${org1Token}`,
        },
        body: JSON.stringify({
          status: 'Approved',
          remarks: 'Welcome to the hackathon!',
        }),
      });
      const approveData = await approveRes.json();
      console.log('Status:', approveRes.status);
      console.log('Response:', JSON.stringify(approveData, null, 2));

      const updatedReg1 = testRegistrations.find((r) => String(r._id) === String(registrationId));
      if (
        approveRes.status === 200 &&
        approveData.success &&
        updatedReg1.status === 'Approved' &&
        updatedReg1.approvedAt !== undefined
      ) {
        console.log('✅ TEST 7 PASSED: Organizer approved registration');
      } else {
        throw new Error('TEST 7 FAILED');
      }

      // TEST 8: Organizer cannot approve or access another organizer's hackathon registrations
      console.log(
        "\n--- TEST 8: Organizer cannot access registrations of another organizer's hackathons ---"
      );
      const crossRes = await fetch(`${BASE_URL}/registrations/hackathon/${openHackId}`, {
        headers: { Authorization: `Bearer ${org2Token}` }, // Organizer 2 querying Organizer 1 hackathon
      });
      const crossData = await crossRes.json();
      console.log('Status:', crossRes.status);
      console.log('Response:', JSON.stringify(crossData, null, 2));

      if (crossRes.status === 403 && !crossData.success) {
        console.log('✅ TEST 8 PASSED: Access blocked correctly (403 Forbidden)');
      } else {
        throw new Error('TEST 8 FAILED');
      }

      // TEST 9: Admin can view registrations, but cannot approve/reject
      console.log('\n--- TEST 9a: Admin can view registrations ---');
      const adminViewRes = await fetch(`${BASE_URL}/registrations/hackathon/${openHackId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const adminViewData = await adminViewRes.json();
      console.log('Status:', adminViewRes.status);
      console.log('Count:', adminViewData.count);

      if (adminViewRes.status === 200 && adminViewData.success) {
        console.log('✅ TEST 9a PASSED: Admin viewed registrations');
      } else {
        throw new Error('TEST 9a FAILED');
      }

      console.log('\n--- TEST 9b: Admin cannot approve/reject registrations ---');
      const adminApproveRes = await fetch(`${BASE_URL}/registrations/${registrationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'Approved',
        }),
      });
      const adminApproveData = await adminApproveRes.json();
      console.log('Status:', adminApproveRes.status);
      console.log('Response:', JSON.stringify(adminApproveData, null, 2));

      if (adminApproveRes.status === 403 && !adminApproveData.success) {
        console.log('✅ TEST 9b PASSED: Admin status edit blocked');
      } else {
        throw new Error('TEST 9b FAILED');
      }

      console.log('\n======================================================');
      console.log('🎉 ALL HACKATHON REGISTRATION TESTS PASSED SUCCESSFULLY! 🎉');
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
