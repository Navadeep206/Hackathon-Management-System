import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import Hackathon from '../models/Hackathon.js';
import generateToken from '../utils/generateToken.js';

// --- DATABASE MOCKING SETUP ---
const testUsers = [];
const testHackathons = [];

// Mock Mongoose connection
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
  // Validate date constraints
  if (new Date(this.registrationDeadline) >= new Date(this.startDate)) {
    const err = new Error('Registration deadline must be before the start date');
    err.name = 'ValidationError';
    err.errors = {
      registrationDeadline: {
        message: 'Registration deadline must be before the start date',
      },
    };
    throw err;
  }
  if (new Date(this.endDate) <= new Date(this.startDate)) {
    const err = new Error('End date must be after the start date');
    err.name = 'ValidationError';
    err.errors = {
      endDate: { message: 'End date must be after the start date' },
    };
    throw err;
  }

  // Save in mock DB
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

// Filter helper
const filterHackathons = (list, queryObj) => {
  return list.filter((item) => {
    if (queryObj.mode && item.mode !== queryObj.mode) return false;
    if (queryObj.theme && item.theme !== queryObj.theme) return false;
    if (queryObj.status && item.status !== queryObj.status) return false;

    if (queryObj.$or) {
      const titleRegex = queryObj.$or[0].title.$regex;
      const themeRegex = queryObj.$or[1].theme.$regex;
      const tReg = new RegExp(titleRegex, 'i');
      const thReg = new RegExp(themeRegex, 'i');
      if (!tReg.test(item.title) && !thReg.test(item.theme)) return false;
    }
    return true;
  });
};

// Mock Query helper for Hackathon
class MockHackathonQuery {
  constructor(results) {
    this.results = results;
    this.sortFields = null;
    this.skipCount = 0;
    this.limitCount = null;
    this.populatePath = null;
  }

  sort(sortObj) {
    this.sortFields = sortObj;
    return this;
  }

  skip(num) {
    this.skipCount = num;
    return this;
  }

  limit(num) {
    this.limitCount = num;
    return this;
  }

  populate(path) {
    this.populatePath = path;
    return this;
  }

  then(resolve, reject) {
    let items = [...this.results];

    // Sort simulation
    if (this.sortFields) {
      const field = Object.keys(this.sortFields)[0];
      const direction = this.sortFields[field];
      items.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];
        if (valA instanceof Date) valA = valA.getTime();
        if (valB instanceof Date) valB = valB.getTime();
        if (valA < valB) return -1 * direction;
        if (valA > valB) return 1 * direction;
        return 0;
      });
    }

    // Pagination simulation
    if (this.skipCount) {
      items = items.slice(this.skipCount);
    }
    if (this.limitCount !== null) {
      items = items.slice(0, this.limitCount);
    }

    // Populate simulation
    const docs = items.map((item) => {
      const doc = new Hackathon(item);
      if (this.populatePath === 'createdBy') {
        const userObj = testUsers.find(
          (u) => String(u._id) === String(item.createdBy)
        );
        if (userObj) {
          doc.createdBy = new User(userObj);
        }
      }
      return doc;
    });

    resolve(docs);
  }
}

Hackathon.find = function (queryObj) {
  const filtered = filterHackathons(testHackathons, queryObj);
  return new MockHackathonQuery(filtered);
};

Hackathon.countDocuments = async (queryObj) => {
  const filtered = filterHackathons(testHackathons, queryObj);
  return filtered.length;
};

Hackathon.create = async function (data) {
  const doc = new Hackathon(data);
  await doc.save();
  return doc;
};

Hackathon.findById = function (id) {
  // Validate ID format (cast check)
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

  const found = testHackathons.find((h) => String(h._id) === String(id));
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
      const doc = new Hackathon(found);
      if (path === 'createdBy') {
        const userObj = testUsers.find(
          (u) => String(u._id) === String(found.createdBy)
        );
        if (userObj) {
          doc.createdBy = new User(userObj);
        }
      }
      return {
        then: (resolve) => resolve(doc),
      };
    },
    then: (resolve) => resolve(new Hackathon(found)),
  };
};

Hackathon.deleteOne = async (query) => {
  const index = testHackathons.findIndex(
    (h) => String(h._id) === String(query._id)
  );
  if (index !== -1) {
    testHackathons.splice(index, 1);
  }
  return { deletedCount: 1 };
};
// --- END DATABASE MOCKING SETUP ---

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}/api`;

const runTests = async () => {
  console.log('--- Starting Hackathons CRUD & RBAC Verification Tests ---');

  // Create mock users in DB
  const org1Id = new mongoose.Types.ObjectId();
  const org2Id = new mongoose.Types.ObjectId();
  const partId = new mongoose.Types.ObjectId();
  const judgeId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();

  const mockUsers = [
    {
      _id: org1Id,
      name: 'Organizer One',
      email: 'org1@test.com',
      role: 'Organizer',
      isBlocked: false,
    },
    {
      _id: org2Id,
      name: 'Organizer Two',
      email: 'org2@test.com',
      role: 'Organizer',
      isBlocked: false,
    },
    {
      _id: partId,
      name: 'Participant One',
      email: 'part@test.com',
      role: 'Participant',
      isBlocked: false,
    },
    {
      _id: judgeId,
      name: 'Judge One',
      email: 'judge@test.com',
      role: 'Judge',
      isBlocked: false,
    },
    {
      _id: adminId,
      name: 'Admin One',
      email: 'admin@test.com',
      role: 'Admin',
      isBlocked: false,
    },
  ];

  testUsers.push(...mockUsers.map((u) => new User(u)));
  console.log('[Setup] Seeded mock users.');

  // Generate tokens
  const org1Token = jwt.sign({ id: org1Id }, process.env.JWT_SECRET);
  const org2Token = jwt.sign({ id: org2Id }, process.env.JWT_SECRET);
  const partToken = jwt.sign({ id: partId }, process.env.JWT_SECRET);
  const judgeToken = jwt.sign({ id: judgeId }, process.env.JWT_SECRET);
  const adminToken = jwt.sign({ id: adminId }, process.env.JWT_SECRET);

  const server = app.listen(PORT, async () => {
    console.log(`[Server] Temporary test server running on port ${PORT}`);

    try {
      let createdHackathonId = '';

      // TEST 1: Organizer can create hackathon
      console.log('\n--- TEST 1: Organizer can create hackathon ---');
      const createRes = await fetch(`${BASE_URL}/hackathons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${org1Token}`,
        },
        body: JSON.stringify({
          title: 'AI Global Hackathon',
          description: 'A global hackathon focused on AI innovation.',
          theme: 'Artificial Intelligence',
          mode: 'Online',
          startDate: '2026-09-01T09:00:00.000Z',
          endDate: '2026-09-03T18:00:00.000Z',
          registrationDeadline: '2026-08-25T23:59:59.000Z',
          prizePool: 50000,
          maxTeamSize: 4,
          rules: 'No plagiarism.',
          judgingCriteria: 'Originality, Feasibility.',
        }),
      });

      const createData = await createRes.json();
      console.log('Status:', createRes.status);
      console.log('Response:', JSON.stringify(createData, null, 2));

      if (
        createRes.status === 201 &&
        createData.success &&
        createData.hackathon._id
      ) {
        console.log('✅ TEST 1 PASSED: Organizer created hackathon');
        createdHackathonId = createData.hackathon._id;
      } else {
        throw new Error('TEST 1 FAILED');
      }

      // TEST 2: Participant cannot create hackathon
      console.log('\n--- TEST 2: Participant cannot create hackathon ---');
      const failRes = await fetch(`${BASE_URL}/hackathons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${partToken}`,
        },
        body: JSON.stringify({
          title: 'Hackathon from Participant',
          theme: 'Hacking',
          mode: 'Online',
          startDate: '2026-09-01T09:00:00.000Z',
          endDate: '2026-09-03T18:00:00.000Z',
          registrationDeadline: '2026-08-25T23:59:59.000Z',
          maxTeamSize: 3,
        }),
      });

      const failData = await failRes.json();
      console.log('Status:', failRes.status);
      console.log('Response:', JSON.stringify(failData, null, 2));

      if (failRes.status === 403 && !failData.success) {
        console.log('✅ TEST 2 PASSED: Participant rejected with 403 Forbidden');
      } else {
        throw new Error('TEST 2 FAILED');
      }

      // TEST 3: Judge cannot create hackathon
      console.log('\n--- TEST 3: Judge cannot create hackathon ---');
      const failResJudge = await fetch(`${BASE_URL}/hackathons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${judgeToken}`,
        },
        body: JSON.stringify({
          title: 'Hackathon from Judge',
          theme: 'Hacking',
          mode: 'Online',
          startDate: '2026-09-01T09:00:00.000Z',
          endDate: '2026-09-03T18:00:00.000Z',
          registrationDeadline: '2026-08-25T23:59:59.000Z',
          maxTeamSize: 3,
        }),
      });

      const failDataJudge = await failResJudge.json();
      console.log('Status:', failResJudge.status);
      console.log('Response:', JSON.stringify(failDataJudge, null, 2));

      if (failResJudge.status === 403 && !failDataJudge.success) {
        console.log('✅ TEST 3 PASSED: Judge rejected with 403 Forbidden');
      } else {
        throw new Error('TEST 3 FAILED');
      }

      // TEST 4: Organizer can edit own hackathon
      console.log('\n--- TEST 4: Organizer can edit own hackathon ---');
      const editRes = await fetch(`${BASE_URL}/hackathons/${createdHackathonId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${org1Token}`,
        },
        body: JSON.stringify({
          title: 'AI Global Hackathon v2',
          prizePool: 60000,
        }),
      });

      const editData = await editRes.json();
      console.log('Status:', editRes.status);
      console.log('Response:', JSON.stringify(editData, null, 2));

      if (
        editRes.status === 200 &&
        editData.success &&
        editData.hackathon.title === 'AI Global Hackathon v2' &&
        editData.hackathon.prizePool === 60000
      ) {
        console.log('✅ TEST 4 PASSED: Organizer edited own hackathon');
      } else {
        throw new Error('TEST 4 FAILED');
      }

      // TEST 5: Organizer cannot edit other organizer's hackathon
      console.log(
        "\n--- TEST 5: Organizer cannot edit other organizer's hackathon ---"
      );
      const editOtherRes = await fetch(
        `${BASE_URL}/hackathons/${createdHackathonId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${org2Token}`,
          },
          body: JSON.stringify({
            title: 'Hacked by Org 2',
          }),
        }
      );

      const editOtherData = await editOtherRes.json();
      console.log('Status:', editOtherRes.status);
      console.log('Response:', JSON.stringify(editOtherData, null, 2));

      if (editOtherRes.status === 403 && !editOtherData.success) {
        console.log(
          '✅ TEST 5 PASSED: Organizer 2 rejected from editing Organizer 1 hackathon'
        );
      } else {
        throw new Error('TEST 5 FAILED');
      }

      // TEST 6: Date validation rules enforced
      console.log(
        '\n--- TEST 6: Date validations: registration deadline > startDate rejected ---'
      );
      const invalidDateRes = await fetch(`${BASE_URL}/hackathons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${org1Token}`,
        },
        body: JSON.stringify({
          title: 'Bad Dates Hackathon',
          theme: 'Dates Check',
          mode: 'Online',
          startDate: '2026-09-01T09:00:00.000Z',
          endDate: '2026-09-03T18:00:00.000Z',
          registrationDeadline: '2026-09-02T23:59:59.000Z', // After start date!
          maxTeamSize: 4,
        }),
      });

      const invalidDateData = await invalidDateRes.json();
      console.log('Status:', invalidDateRes.status);
      console.log('Response:', JSON.stringify(invalidDateData, null, 2));

      if (invalidDateRes.status === 400 && !invalidDateData.success) {
        console.log('✅ TEST 6 PASSED: Invalid registration deadline rejected');
      } else {
        throw new Error('TEST 6 FAILED');
      }

      // Add a couple more mock hackathons for search, filters, pagination
      console.log('\n[Setup] Seeding more hackathons...');
      await Hackathon.create({
        title: 'Cyber Security Shield',
        theme: 'Cybersecurity',
        mode: 'Offline',
        venue: 'Tech Park Hall A',
        startDate: '2026-10-01T09:00:00.000Z',
        endDate: '2026-10-03T18:00:00.000Z',
        registrationDeadline: '2026-09-25T23:59:59.000Z',
        maxTeamSize: 2,
        status: 'Upcoming',
        createdBy: org1Id,
      });

      await Hackathon.create({
        title: 'Green Tech Innovation',
        theme: 'Climate Change & Tech',
        mode: 'Online',
        startDate: '2026-11-01T09:00:00.000Z',
        endDate: '2026-11-03T18:00:00.000Z',
        registrationDeadline: '2026-10-25T23:59:59.000Z',
        maxTeamSize: 5,
        status: 'Registration Open',
        createdBy: org2Id,
      });

      // TEST 7: Search works
      console.log('\n--- TEST 7: Search works (search=cyber) ---');
      const searchRes = await fetch(`${BASE_URL}/hackathons?search=cyber`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${partToken}` },
      });
      const searchData = await searchRes.json();
      console.log('Status:', searchRes.status);
      console.log('Count:', searchData.count);
      console.log(
        'Hackathons found:',
        searchData.hackathons.map((h) => h.title)
      );

      if (
        searchRes.status === 200 &&
        searchData.count === 1 &&
        searchData.hackathons[0].title === 'Cyber Security Shield'
      ) {
        console.log('✅ TEST 7 PASSED: Search by title/theme works');
      } else {
        throw new Error('TEST 7 FAILED');
      }

      // TEST 8: Filters work (mode=Online, status=Registration Open)
      console.log(
        '\n--- TEST 8: Filters work (mode=Online & status=Registration Open) ---'
      );
      const filterRes = await fetch(
        `${BASE_URL}/hackathons?mode=Online&status=Registration+Open`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      const filterData = await filterRes.json();
      console.log('Status:', filterRes.status);
      console.log('Count:', filterData.count);
      console.log(
        'Hackathons found:',
        filterData.hackathons.map((h) => h.title)
      );

      if (
        filterRes.status === 200 &&
        filterData.count === 1 &&
        filterData.hackathons[0].title === 'Green Tech Innovation'
      ) {
        console.log('✅ TEST 8 PASSED: Filtering works');
      } else {
        throw new Error('TEST 8 FAILED');
      }

      // TEST 9: Pagination works (page=1&limit=2)
      console.log('\n--- TEST 9: Pagination works (limit=2) ---');
      const paginationRes = await fetch(`${BASE_URL}/hackathons?page=1&limit=2`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${judgeToken}` },
      });
      const paginationData = await paginationRes.json();
      console.log('Status:', paginationRes.status);
      console.log('Count:', paginationData.count);
      console.log('Total:', paginationData.total);
      console.log('Pages:', paginationData.pages);

      if (
        paginationRes.status === 200 &&
        paginationData.count === 2 &&
        paginationData.total === 3 &&
        paginationData.pages === 2
      ) {
        console.log('✅ TEST 9 PASSED: Pagination works');
      } else {
        throw new Error('TEST 9 FAILED');
      }

      // TEST 10: Invalid ObjectId format handles correctly (CastError -> 400)
      console.log('\n--- TEST 10: Invalid ObjectId handled correctly ---');
      const invalidIdRes = await fetch(`${BASE_URL}/hackathons/invalid-id-string`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${org1Token}` },
      });
      const invalidIdData = await invalidIdRes.json();
      console.log('Status:', invalidIdRes.status);
      console.log('Response:', JSON.stringify(invalidIdData, null, 2));

      if (invalidIdRes.status === 400 && !invalidIdData.success) {
        console.log(
          '✅ TEST 10 PASSED: CastError caught and returned as 400 Bad Request'
        );
      } else {
        throw new Error('TEST 10 FAILED');
      }

      // TEST 11: Organizer can delete own hackathon
      console.log('\n--- TEST 11: Organizer can delete own hackathon ---');
      const deleteRes = await fetch(`${BASE_URL}/hackathons/${createdHackathonId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${org1Token}` },
      });
      const deleteData = await deleteRes.json();
      console.log('Status:', deleteRes.status);
      console.log('Response:', JSON.stringify(deleteData, null, 2));

      const checkDeleted = testHackathons.find(
        (h) => String(h._id) === String(createdHackathonId)
      );

      if (deleteRes.status === 200 && deleteData.success && !checkDeleted) {
        console.log('✅ TEST 11 PASSED: Organizer deleted own hackathon');
      } else {
        throw new Error('TEST 11 FAILED');
      }

      console.log('\n======================================================');
      console.log('🎉 ALL HACKATHON CRUD & RBAC TESTS PASSED SUCCESSFULLY! 🎉');
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
