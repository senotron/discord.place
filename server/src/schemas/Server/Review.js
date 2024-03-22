const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
  server: {
    id: {
      type: String,
      required: true
    }
  },
  user: {
    id: {
      type: String,
      required: true
    }
  },
  rating: {
    type: Number,
    required: true
  },
  content: {
    type: String,
    required: true,
    max: 256
  },
  approved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reviews', ReviewSchema);