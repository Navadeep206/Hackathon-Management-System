import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: [true, 'Submission reference is required'],
    },
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: [true, 'Hackathon reference is required'],
    },
    judge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Judge reference is required'],
    },
    innovation: {
      type: Number,
      required: [true, 'Innovation score is required'],
      min: [0, 'Score cannot be less than 0'],
      max: [10, 'Score cannot be more than 10'],
    },
    technicalComplexity: {
      type: Number,
      required: [true, 'Technical complexity score is required'],
      min: [0, 'Score cannot be less than 0'],
      max: [10, 'Score cannot be more than 10'],
    },
    userInterface: {
      type: Number,
      required: [true, 'User interface score is required'],
      min: [0, 'Score cannot be less than 0'],
      max: [10, 'Score cannot be more than 10'],
    },
    functionality: {
      type: Number,
      required: [true, 'Functionality score is required'],
      min: [0, 'Score cannot be less than 0'],
      max: [10, 'Score cannot be more than 10'],
    },
    scalability: {
      type: Number,
      required: [true, 'Scalability score is required'],
      min: [0, 'Score cannot be less than 0'],
      max: [10, 'Score cannot be more than 10'],
    },
    documentation: {
      type: Number,
      required: [true, 'Documentation score is required'],
      min: [0, 'Score cannot be less than 0'],
      max: [10, 'Score cannot be more than 10'],
    },
    presentation: {
      type: Number,
      required: [true, 'Presentation score is required'],
      min: [0, 'Score cannot be less than 0'],
      max: [10, 'Score cannot be more than 10'],
    },
    totalScore: {
      type: Number,
      required: true,
    },
    feedback: {
      type: String,
      required: [true, 'Feedback is required'],
      trim: true,
    },
    status: {
      type: String,
      default: 'Pending',
      enum: {
        values: ['Pending', 'Completed'],
        message: 'Invalid status',
      },
    },
    reviewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique review per judge per submission
reviewSchema.index({ judge: 1, submission: 1 }, { unique: true });

// Auto calculate totalScore before validating
reviewSchema.pre('validate', function () {
  this.totalScore =
    (this.innovation || 0) +
    (this.technicalComplexity || 0) +
    (this.userInterface || 0) +
    (this.functionality || 0) +
    (this.scalability || 0) +
    (this.documentation || 0) +
    (this.presentation || 0);
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
