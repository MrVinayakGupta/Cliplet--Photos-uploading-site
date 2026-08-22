const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  postTitle: {
    type: String,
    trim: true
  },
  postText: {
    type: String,
    trim: true
  },
  image: {
  url: { type: String },
  filename: { type: String }  // Cloudinary public_id
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
  ],
  category: {
    type: String,
    trim: true,
    enum: ["Travel", "Food", "Fashion", "Home Decor", "DIY", "Art", "Technology", "Other", "Art & Design", "Architecture", "Food & Travel", "Photography", "Illustration", "Nature"] // example categories
  }
}, { timestamps: true }); 

module.exports = mongoose.model('Post', postSchema);
