import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema(
  {
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: [true, 'Hackathon reference is required'],
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'Team reference is required'],
    },
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: [true, 'Submission reference is required'],
    },
    averageScore: {
      type: Number,
      required: [true, 'Average score is required'],
      min: [0, 'Score cannot be less than 0'],
    },
    rank: {
      type: Number,
      required: [true, 'Rank is required'],
      min: [1, 'Rank must be at least 1'],
    },
    position: {
      type: String,
      default: '',
      trim: true,
    },
    isWinner: {
      type: Boolean,
      default: false,
    },
    published: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique combination of hackathon and team to avoid duplicate rankings per hackathon
leaderboardSchema.index({ hackathon: 1, team: 1 }, { unique: true });

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
export default Leaderboard;
