import mongoose from 'mongoose';

const judgeAssignmentSchema = new mongoose.Schema(
  {
    judge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Judge reference is required'],
    },
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: [true, 'Hackathon reference is required'],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigner reference is required'],
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique judge assignments per hackathon
judgeAssignmentSchema.index({ judge: 1, hackathon: 1 }, { unique: true });

const JudgeAssignment = mongoose.model('JudgeAssignment', judgeAssignmentSchema);
export default JudgeAssignment;
