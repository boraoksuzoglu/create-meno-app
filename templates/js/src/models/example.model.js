import mongoose from 'mongoose';

/**
 * Example model — rename/copy this for your own domain entities.
 */
const exampleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

exampleSchema.index({ title: 'text' });

export default mongoose.model('Example', exampleSchema);
