import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Participant reference is required'],
    },
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: [true, 'Hackathon reference is required'],
    },
    status: {
      type: String,
      default: 'Pending',
      enum: {
        values: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
        message: 'Invalid registration status',
      },
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique registrations for a user per hackathon
registrationSchema.index({ participant: 1, hackathon: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;
