import mongoose, { Schema, Document } from 'mongoose';

export interface IApiKey extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    keyHash: string;
    prefix: string;
    lastUsedAt?: Date;
    createdAt: Date;
}

const ApiKeySchema: Schema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    keyHash: { type: String, required: true },
    prefix: { type: String, required: true },
    lastUsedAt: { type: Date },
}, { timestamps: true });

ApiKeySchema.index({ userId: 1 });
ApiKeySchema.index({ keyHash: 1 }, { unique: true });

export const ApiKey = mongoose.model<IApiKey>('ApiKey', ApiKeySchema);