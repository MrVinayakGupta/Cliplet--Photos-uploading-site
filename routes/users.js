const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose").default;

mongoose.connect("mongodb://127.0.0.1:27017/PinterestCloneReplica");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post' // assuming you have a Post model
    }
  ],
  dp: {
    type: String, // store image URL or file path
    default: ''
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

// ✅ Apply the plugin correctly
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);