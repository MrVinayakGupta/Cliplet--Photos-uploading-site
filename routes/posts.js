const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  postText: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // reference to the user who created the post
  },
  createdAt: {
    type: Date,
    default: Date.now // automatically sets current date & time
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // reference to users who liked the post
    }
  ],
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      commentText: {
        type: String,
        trim: true
      },
      commentedAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
