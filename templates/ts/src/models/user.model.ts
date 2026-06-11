import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  email: string;
  name: string | null;
  passwordHash: string;
  role: 'user' | 'admin';
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  preferences: { language: 'en' | 'tr' };
  isValidPassword(password: string): Promise<boolean>;
}

interface IUserModel extends Model<IUser> {
  hashPassword(password: string): Promise<string>;
}

const userSchema = new mongoose.Schema<IUser>(
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

userSchema.methods.isValidPassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async function (password: string): Promise<string> {
  return bcrypt.hash(password, 10);
};

export default mongoose.model<IUser, IUserModel>('User', userSchema);
