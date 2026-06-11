import mongoose, { Document } from 'mongoose';

export interface IExample extends Document {
  title: string;
  description: string;
  isActive: boolean;
}

const exampleSchema = new mongoose.Schema<IExample>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

exampleSchema.index({ title: 'text' });

export default mongoose.model<IExample>('Example', exampleSchema);
