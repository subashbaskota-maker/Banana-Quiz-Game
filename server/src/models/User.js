const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true },
  username: {
    type: String,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-z0-9_]+$/,
    unique: true,
    sparse: true
  },
  lastUsernameChangeAt: { type: Date },
  solvedCount: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);