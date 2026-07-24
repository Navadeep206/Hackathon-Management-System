import mongoose from 'mongoose';

const hackathonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    theme: {
      type: String,
      required: [true, 'Theme is required'],
      trim: true,
    },
    mode: {
      type: String,
      required: [true, 'Mode is required'],
      enum: {
        values: ['Online', 'Offline'],
        message: 'Mode must be either Online or Offline',
      },
    },
    venue: {
      type: String,
      trim: true,
      default: '',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
    },
    bannerImage: {
      type: String,
      default: '',
    },
    prizePool: {
      type: Number,
      default: 0,
      min: [0, 'Prize pool must be a non-negative number'],
    },
    maxTeamSize: {
      type: Number,
      required: [true, 'Maximum team size is required'],
      min: [1, 'Maximum team size must be greater than 0'],
    },
    rules: {
      type: String,
      trim: true,
      default: '',
    },
    judgingCriteria: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      default: 'Upcoming',
      enum: {
        values: [
          'Upcoming',
          'Registration Open',
          'Registration Closed',
          'Ongoing',
          'Completed',
        ],
        message: 'Invalid status value',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator reference is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Custom date validation before saving
hackathonSchema.pre('validate', function (next) {
  // If startDate, registrationDeadline or endDate are missing, let the Mongoose validation fail normally
  if (!this.startDate || !this.registrationDeadline || !this.endDate) {
    return next();
  }

  // Registration deadline must be before Start Date
  if (new Date(this.registrationDeadline) >= new Date(this.startDate)) {
    this.invalidate(
      'registrationDeadline',
      'Registration deadline must be before the start date'
    );
  }

  // End Date must be after Start Date
  if (new Date(this.endDate) <= new Date(this.startDate)) {
    this.invalidate('endDate', 'End date must be after the start date');
  }

  next();
});

const Hackathon = mongoose.model('Hackathon', hackathonSchema);
export default Hackathon;
