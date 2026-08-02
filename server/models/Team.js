import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: [true, 'Hackathon reference is required'],
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Team leader reference is required'],
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    maxMembers: {
      type: Number,
      required: [true, 'Maximum member count is required'],
      min: [1, 'Maximum members must be at least 1'],
    },
    inviteCode: {
      type: String,
      unique: true,
    },
    status: {
      type: String,
      default: 'Active',
      enum: {
        values: ['Active', 'Locked', 'Disbanded'],
        message: 'Invalid team status',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Enforce team name uniqueness within a single hackathon
teamSchema.index({ hackathon: 1, teamName: 1 }, { unique: true });

// Pre-validate hook to generate unique invite code if not provided
teamSchema.pre('validate', function () {
  if (!this.inviteCode) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'JOIN-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.inviteCode = code;
  }
});

const Team = mongoose.model('Team', teamSchema);
export default Team;
