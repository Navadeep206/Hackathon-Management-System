import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'Team reference is required'],
      unique: true, // One submission per team
    },
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: [true, 'Hackathon reference is required'],
    },
    projectName: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    problemStatement: {
      type: String,
      required: [true, 'Problem statement is required'],
      trim: true,
    },
    solution: {
      type: String,
      required: [true, 'Solution is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    githubRepository: {
      type: String,
      required: [true, 'GitHub repository URL is required'],
      trim: true,
    },
    liveDemo: {
      type: String,
      trim: true,
      default: '',
    },
    techStack: [
      {
        type: String,
        trim: true,
      },
    ],
    screenshots: [
      {
        type: String,
      },
    ],
    presentationPDF: {
      type: String,
      default: '',
    },
    demoVideo: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      default: 'Pending',
      enum: {
        values: ['Pending', 'Under Review', 'Approved', 'Rejected'],
        message: 'Invalid submission status',
      },
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitter reference is required'],
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
