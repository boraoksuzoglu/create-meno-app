import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    name:          { type: String, trim: true, maxlength: 100, default: null },
    passwordHash:  { type: String, required: true },
    role:          { type: String, enum: ['user', 'admin'], default: 'user' },
    resetPasswordToken:   { type: String, default: null, index: { sparse: true } },
    resetPasswordExpires: { type: Date,   default: null },
    preferences: {
      language: { type: String, enum: ['en', 'tr'], default: 'en' },
    },
  },
  { timestamps: true }
);

userSchema.methods.isValidPassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async function (password) {
  return bcrypt.hash(password, 10);
};

export default mongoose.model('User', userSchema);
