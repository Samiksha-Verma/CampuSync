const mongoose = require('mongoose');

const testAttemptSchema = new mongoose.Schema(
  {
    // Auth-service Student _id (not a Mongoose ref - lives in a different DB).
    studentId: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['aptitude', 'coding', 'reasoning', 'web-development', 'backend'],
      required: true,
    },
    // Question _ids shown, in the order presented. Real Mongoose ObjectIds as
    // strings - Question lives in this same service/database.
    questions: {
      type: [String],
      required: true,
    },
    // Parallel array to `questions` - the option index the student picked for each
    // one, or -1 for a question left unanswered.
    answers: {
      type: [Number],
      required: true,
    },
    // Computed server-side from the real Question.correctOptionIndex values - never
    // trusts a client-submitted score.
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
      required: true,
    },
    // Client-reported (see README, Phase 7) - the timer is client-managed by design,
    // so this is trusted for the student's own record-keeping, not enforced.
    timeTakenSeconds: {
      type: Number,
      required: true,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
