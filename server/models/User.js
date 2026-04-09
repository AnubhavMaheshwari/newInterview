const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    select: false
  },
  googleId: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  avatar: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'contributor', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);