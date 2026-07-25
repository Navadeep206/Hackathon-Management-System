import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import Hackathon from '../models/Hackathon.js';
import Team from '../models/Team.js';
import Submission from '../models/Submission.js';
import Review from '../models/Review.js';
import Leaderboard from '../models/Leaderboard.js';

// --- DATABASE MOCKING SETUP ---
const testUsers = [];
const testHackathons = [];
const testTeams = [];
const testSubmissions = [];
const testReviews = [];
const testLeaderboards = [];

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
Submission.find = function (query) {
  const filtered = testSubmissions.filter((s) => String(s.hackathon) === String(query.hackathon));
  return {
    then: (resolve) => resolve(filtered.map((s) => new Submission(s))),
  };
};

Submission.findById = function (id) {
  const found = testSubmissions.find((s) => String(s._id) === String(id));
  return {
    then: (resolve) => resolve(found ? new Submission(found) : null),
  };
};

Submission.create = async function (data) {
  const doc = new Submission(data);
  const plainObj = doc.toObject();
  plainObj._id = doc._id || new mongoose.Types.ObjectId();
  testSubmissions.push(plainObj);
  return doc;
};

// Mock Review
Review.find = function (query) {
  const filtered = testReviews.filter((r) => String(r.hackathon) === String(query.hackathon));
  return {
    then: (resolve) => resolve(filtered.map((r) => new Review(r))),
  };
};

Review.create = async function (data) {
  const doc = new Review(data);
  const plainObj = doc.toObject();
  plainObj._id = doc._id || new mongoose.Types.ObjectId();
  // emulation of auto calculate totalScore before validating
  plainObj.totalScore =
    (data.innovation || 0) +
    (data.technicalComplexity || 0) +
    (data.userInterface || 0) +
    (data.functionality || 0) +
    (data.scalability || 0) +
    (data.documentation || 0) +
    (data.presentation || 0);

  testReviews.push(plainObj);
  return new Review(plainObj);
};

// Mock Leaderboard
Leaderboard.findOne = function (query) {
  const found = testLeaderboards.find((l) => String(l.hackathon) === String(query.hackathon));
  return {
    then: (resolve) => resolve(found ? new Leaderboard(found) : null),
  };
};

class MockLeaderboardQuery {
  constructor(results) {
    this.results = results;
    this.populatePaths = [];
    this.sortFields = null;
  }
  sort(fields) {
    this.sortFields = fields;
    if (fields.rank === 1) {
      this.results.sort((a, b) => a.rank - b.rank);
    }
    return this;
  }
  populate(path) {
    this.populatePaths.push(path);
    return this;
  }
  then(resolve) {
    const docs = this.results.map((item) => {
      const doc = new Leaderboard(item);
      this.populatePaths.forEach((p) => {
        if (p === 'team') {
          const t = testTeams.find((team) => String(team._id) === String(item.team));
          if (t) doc.team = new Team(t);
        } else if (p === 'submission') {
          const s = testSubmissions.find((sub) => String(sub._id) === String(item.submission));
          if (s) doc.submission = new Submission(s);
        }
      });
      return doc;
    });
    resolve(docs);
  }
}

Leaderboard.find = function (query) {
  const filtered = testLeaderboards.filter((l) => String(l.hackathon) === String(query.hackathon));
  return new MockLeaderboardQuery(filtered);
};

Leaderboard.create = async function (data) {
  const doc = new Leaderboard(data);
  const plainObj = doc.toObject();
  plainObj._id = doc._id || new mongoose.Types.ObjectId();
  testLeaderboards.push(plainObj);
  return new Leaderboard(plainObj);
};

Leaderboard.updateMany = async function (query, update) {
  testLeaderboards.forEach((l) => {
    if (String(l.hackathon) === String(query.hackathon)) {
      l.published = update.published;
    }
  });
  return { modifiedCount: testLeaderboards.length };
};
// --- END DATABASE MOCKING SETUP ---

const PORT = 5122;
const BASE_URL = `http://localhost:${PORT}/api`;

const runTests = async () => {
  console.log('--- Starting Leaderboard & Results Module Verification Tests ---');

  // Seed Users
  const orgId = new mongoose.Types.ObjectId();
  const participantId = new mongoose.Types.ObjectId();
  const judgeId = new mongoose.Types.ObjectId();

  const mockUsers = [
    { _id: orgId, name: 'Organizer', email: 'org@test.com', role: 'Organizer' },
    { _id: participantId, name: 'Participant Leader', email: 'part@test.com', role: 'Participant' },
    { _id: judgeId, name: 'Judge Assigned', email: 'judge@test.com', role: 'Judge' },
  ];
  testUsers.push(...mockUsers.map((u) => new User(u)));

  // Seed Hackathon
  const hackId = new mongoose.Types.ObjectId();
  await Hackathon.create({
    _id: hackId,
    title: 'Ranking Challenge',
    theme: 'AI & Web3',
    mode: 'Online',
    startDate: '2026-09-01T00:00:00Z',
    endDate: '2026-09-10T00:00:00Z',
    registrationDeadline: '2026-08-30T00:00:00Z',
    maxTeamSize: 4,
    status: 'Ongoing',
    createdBy: orgId,
  });

  // Seed Teams
  const teamId1 = new mongoose.Types.ObjectId();
  const teamId2 = new mongoose.Types.ObjectId();
  const teamId3 = new mongoose.Types.ObjectId();
  const teamId4 = new mongoose.Types.ObjectId();

  await Team.create({ _id: teamId1, teamName: 'Team One', hackathon: hackId, leader: participantId, members: [participantId], maxMembers: 4 });
  await Team.create({ _id: teamId2, teamName: 'Team Two', hackathon: hackId, leader: participantId, members: [participantId], maxMembers: 4 });
  await Team.create({ _id: teamId3, teamName: 'Team Three', hackathon: hackId, leader: participantId, members: [participantId], maxMembers: 4 });
  await Team.create({ _id: teamId4, teamName: 'Team Four', hackathon: hackId, leader: participantId, members: [participantId], maxMembers: 4 });

  // Seed Submissions with specific timestamps to test tie-breakers
  const subId1 = new mongoose.Types.ObjectId();
  const subId2 = new mongoose.Types.ObjectId();
  const subId3 = new mongoose.Types.ObjectId();
  const subId4 = new mongoose.Types.ObjectId();

  // Team One
  await Submission.create({
    _id: subId1,
    team: teamId1,
    hackathon: hackId,
    projectName: 'Project Alpha',
    problemStatement: 'Problem A',
    solution: 'Sol A',
    githubRepository: 'https://github.com/one/a',
    submittedBy: participantId,
    submittedAt: new Date('2026-09-05T12:00:00Z'),
  });

  // Team Two
  await Submission.create({
    _id: subId2,
    team: teamId2,
    hackathon: hackId,
    projectName: 'Project Beta',
    problemStatement: 'Problem B',
    solution: 'Sol B',
    githubRepository: 'https://github.com/two/b',
    submittedBy: participantId,
    submittedAt: new Date('2026-09-05T13:00:00Z'),
  });

  // Team Three
  await Submission.create({
    _id: subId3,
    team: teamId3,
    hackathon: hackId,
    projectName: 'Project Gamma',
    problemStatement: 'Problem C',
    solution: 'Sol C',
    githubRepository: 'https://github.com/three/c',
    submittedBy: participantId,
    submittedAt: new Date('2026-09-05T11:00:00Z'),
  });

  // Team Four
  await Submission.create({
    _id: subId4,
    team: teamId4,
    hackathon: hackId,
    projectName: 'Project Delta',
    problemStatement: 'Problem D',
    solution: 'Sol D',
    githubRepository: 'https://github.com/four/d',
    submittedBy: participantId,
    submittedAt: new Date('2026-09-05T10:00:00Z'),
  });

  console.log('[Setup] Seeded Hackathon, 4 Teams, and 4 Submissions with varying submission times.');

  // Generate Tokens
  const orgToken = jwt.sign({ id: orgId }, process.env.JWT_SECRET);
  const partToken = jwt.sign({ id: participantId }, process.env.JWT_SECRET);

  const server = app.listen(PORT, async () => {
    console.log(`[Server] Verification test server running on port ${PORT}`);

    try {
      // TEST 1: Generate leaderboard fails because there are NO reviews
      console.log('\n--- TEST 1: Generation fails with missing reviews ---');
      const gen1Res = await fetch(`${BASE_URL}/leaderboard/${hackId}/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      const gen1Data = await gen1Res.json();
      console.log('Status:', gen1Res.status);
      console.log('Response:', JSON.stringify(gen1Data, null, 2));

      if (gen1Res.status === 400 && gen1Data.message.includes('Missing reviews')) {
        console.log('✅ TEST 1 PASSED: Correctly caught missing reviews error');
      } else {
        throw new Error('TEST 1 FAILED');
      }

      // Seed pending review
      await Review.create({
        submission: subId1,
        hackathon: hackId,
        judge: judgeId,
        innovation: 8,
        technicalComplexity: 8,
        userInterface: 8,
        functionality: 8,
        scalability: 8,
        documentation: 8,
        presentation: 8,
        feedback: 'Good',
        status: 'Pending', // Pending review
      });

      // TEST 2: Generate leaderboard fails because review status is Pending
      console.log('\n--- TEST 2: Generation fails with pending reviews ---');
      const gen2Res = await fetch(`${BASE_URL}/leaderboard/${hackId}/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      const gen2Data = await gen2Res.json();
      console.log('Status:', gen2Res.status);
      console.log('Response:', JSON.stringify(gen2Data, null, 2));

      if (gen2Res.status === 400 && gen2Data.message.includes('Reviews not completed')) {
        console.log('✅ TEST 2 PASSED: Correctly caught pending reviews error');
      } else {
        throw new Error('TEST 2 FAILED');
      }

      // Clear reviews and seed completed reviews with specific scores to test rankings & tie-breakers:
      // We want to test tie-breakers. Let's make:
      // Team 4: Average Score = 66 (highest)
      // Team 1, 2, 3: Average Score = 65 (tie)
      // Let's break ties between 1, 2, 3:
      //   - Team 2 has Innovation = 9
      //   - Team 3 has Innovation = 8, submittedAt = 11:00Z
      //   - Team 1 has Innovation = 8, submittedAt = 12:00Z
      // So correct ranking should be:
      //   1. Team Four (Score 66, "1st Place", isWinner = true)
      //   2. Team Two (Score 65, Innovation 9, "2nd Place", isWinner = true)
      //   3. Team Three (Score 65, Innovation 8, submitted 11:00Z, "3rd Place", isWinner = true)
      //   4. Team One (Score 65, Innovation 8, submitted 12:00Z, Position "", isWinner = false)
      testReviews.length = 0; // Clear

      // Team One (Score 65, Innovation 8, Time 12:00)
      await Review.create({
        submission: subId1,
        hackathon: hackId,
        judge: judgeId,
        innovation: 8,
        technicalComplexity: 9,
        userInterface: 9,
        functionality: 10,
        scalability: 9,
        documentation: 10,
        presentation: 10,
        status: 'Completed',
        feedback: 'Solid',
      }); // Sum: 65

      // Team Two (Score 65, Innovation 9, Time 13:00)
      await Review.create({
        submission: subId2,
        hackathon: hackId,
        judge: judgeId,
        innovation: 9,
        technicalComplexity: 9,
        userInterface: 9,
        functionality: 10,
        scalability: 9,
        documentation: 9,
        presentation: 10,
        status: 'Completed',
        feedback: 'Good innovation',
      }); // Sum: 65

      // Team Three (Score 65, Innovation 8, Time 11:00)
      await Review.create({
        submission: subId3,
        hackathon: hackId,
        judge: judgeId,
        innovation: 8,
        technicalComplexity: 9,
        userInterface: 9,
        functionality: 10,
        scalability: 9,
        documentation: 10,
        presentation: 10,
        status: 'Completed',
        feedback: 'Earlier time than Team One',
      }); // Sum: 65

      // Team Four (Score 66, Innovation 8, Time 10:00)
      await Review.create({
        submission: subId4,
        hackathon: hackId,
        judge: judgeId,
        innovation: 8,
        technicalComplexity: 10,
        userInterface: 9,
        functionality: 10,
        scalability: 9,
        documentation: 10,
        presentation: 10,
        status: 'Completed',
        feedback: 'Highest Score',
      }); // Sum: 66

      console.log('[Setup] Seeded 4 completed judge reviews with tailored scores to trigger tie-breaker logic.');

      // TEST 3: Generate leaderboard successfully
      console.log('\n--- TEST 3: Generate leaderboard successfully ---');
      const genSuccessRes = await fetch(`${BASE_URL}/leaderboard/${hackId}/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      const genSuccessData = await genSuccessRes.json();
      console.log('Status:', genSuccessRes.status);
      console.log('Response Leaderboard:', JSON.stringify(genSuccessData.leaderboard, null, 2));

      if (genSuccessRes.status === 201 && genSuccessData.success) {
        const lb = genSuccessData.leaderboard;
        // Check exact ranking sequence:
        const first = lb[0];
        const second = lb[1];
        const third = lb[2];
        const fourth = lb[3];

        if (
          first.team === 'Team Four' && first.rank === 1 && first.position === '1st Place' &&
          second.team === 'Team Two' && second.rank === 2 && second.position === '2nd Place' &&
          third.team === 'Team Three' && third.rank === 3 && third.position === '3rd Place' &&
          fourth.team === 'Team One' && fourth.rank === 4 && fourth.position === ''
        ) {
          console.log('✅ TEST 3 PASSED: Rankings, scores, tie-breaker sorting, and positions match expectations!');
        } else {
          throw new Error('TEST 3 FAILED: Sorting or positions incorrect.');
        }
      } else {
        throw new Error('TEST 3 FAILED');
      }

      // TEST 4: Generate leaderboard second time is blocked
      console.log('\n--- TEST 4: Block duplicate leaderboard generation ---');
      const genDupRes = await fetch(`${BASE_URL}/leaderboard/${hackId}/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      const genDupData = await genDupRes.json();
      console.log('Status:', genDupRes.status);
      console.log('Response:', JSON.stringify(genDupData, null, 2));

      if (genDupRes.status === 400 && genDupData.message.includes('already been generated')) {
        console.log('✅ TEST 4 PASSED: Duplicate leaderboard generation blocked');
      } else {
        throw new Error('TEST 4 FAILED');
      }

      // TEST 5: Participant is blocked from viewing leaderboard before publication
      console.log('\n--- TEST 5: Participant blocked from viewing unpublished results ---');
      const viewBlockRes = await fetch(`${BASE_URL}/leaderboard/${hackId}`, {
        headers: { Authorization: `Bearer ${partToken}` },
      });
      const viewBlockData = await viewBlockRes.json();
      console.log('Status:', viewBlockRes.status);
      console.log('Response:', JSON.stringify(viewBlockData, null, 2));

      if (viewBlockRes.status === 403 && !viewBlockData.success) {
        console.log('✅ TEST 5 PASSED: Participant read access blocked before publication');
      } else {
        throw new Error('TEST 5 FAILED');
      }

      // TEST 6: Publish leaderboard results successfully
      console.log('\n--- TEST 6: Publish leaderboard results successfully ---');
      const pubRes = await fetch(`${BASE_URL}/leaderboard/${hackId}/publish`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      const pubData = await pubRes.json();
      console.log('Status:', pubRes.status);
      console.log('Response:', JSON.stringify(pubData, null, 2));

      if (pubRes.status === 200 && pubData.success) {
        // Verify hackathon status became Completed
        const h = testHackathons.find((hack) => String(hack._id) === String(hackId));
        if (h.status === 'Completed') {
          console.log('✅ TEST 6 PASSED: Leaderboard published and hackathon status set to Completed');
        } else {
          throw new Error('TEST 6 FAILED: Hackathon status not updated');
        }
      } else {
        throw new Error('TEST 6 FAILED');
      }

      // TEST 7: Block duplicate publication
      console.log('\n--- TEST 7: Block duplicate publication ---');
      const pubDupRes = await fetch(`${BASE_URL}/leaderboard/${hackId}/publish`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      const pubDupData = await pubDupRes.json();
      console.log('Status:', pubDupRes.status);
      console.log('Response:', JSON.stringify(pubDupData, null, 2));

      if (pubDupRes.status === 400 && pubDupData.message.includes('already been published')) {
        console.log('✅ TEST 7 PASSED: Duplicate publication blocked');
      } else {
        throw new Error('TEST 7 FAILED');
      }

      // TEST 8: Participant can view leaderboard after publication
      console.log('\n--- TEST 8: Participant can view leaderboard after publication ---');
      const viewAllowRes = await fetch(`${BASE_URL}/leaderboard/${hackId}`, {
        headers: { Authorization: `Bearer ${partToken}` },
      });
      const viewAllowData = await viewAllowRes.json();
      console.log('Status:', viewAllowRes.status);
      console.log('Count:', viewAllowData.leaderboard?.length);

      if (viewAllowRes.status === 200 && viewAllowData.success && viewAllowData.leaderboard?.length === 4) {
        console.log('✅ TEST 8 PASSED: Participant read allowed after publication');
      } else {
        throw new Error('TEST 8 FAILED');
      }

      // TEST 9: Winners endpoint returns only top 3 teams
      console.log('\n--- TEST 9: Winners endpoint returns top 3 teams only ---');
      const winRes = await fetch(`${BASE_URL}/leaderboard/${hackId}/winners`, {
        headers: { Authorization: `Bearer ${partToken}` },
      });
      const winData = await winRes.json();
      console.log('Status:', winRes.status);
      console.log('Winners Count:', winData.winners?.length);
      console.log('Winners Details:', JSON.stringify(winData.winners, null, 2));

      if (
        winRes.status === 200 &&
        winData.success &&
        winData.winners?.length === 3 &&
        winData.winners[0].team === 'Team Four' &&
        winData.winners[1].team === 'Team Two' &&
        winData.winners[2].team === 'Team Three'
      ) {
        console.log('✅ TEST 9 PASSED: Winners endpoint correctly returned top three teams in order');
      } else {
        throw new Error('TEST 9 FAILED');
      }

      console.log('\n======================================================');
      console.log('🎉 ALL LEADERBOARD MODULE TESTS PASSED SUCCESSFULLY! 🎉');
      console.log('======================================================');
    } catch (err) {
      console.error('\n❌ TEST SUITE FAILURE:', err.message);
      process.exitCode = 1;
    } finally {
      server.close(() => {
        console.log('[Server] Test server stopped.');
        process.exit(process.exitCode || 0);
      });
    }
  });
};

runTests();
