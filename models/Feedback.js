import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  feedbackText: {
    type: String,
    required: true,
  },
  // You can add a reference to a User model here if you implement user tracking
  // user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback; 