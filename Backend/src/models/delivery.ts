import mongoose, { Schema, Document } from 'mongoose';

export interface IDeliveryAttempt extends Document {
    eventLogId: mongoose.Types.ObjectId;
    responseStatus?: number;
    responseBody?: string;
    success: boolean;
    error?: string;
    timestamp: Date;
}

const DeliveryAttemptSchema: Schema = new Schema({
    eventLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventLog', required: true },
    responseStatus: { type: Number },
    responseBody: { type: String },
    success: { type: Boolean, required: true },
    error: { type: String },
    timestamp: { type: Date, default: Date.now },
});

export const DeliveryAttempt = mongoose.model<IDeliveryAttempt>('DeliveryAttempt', DeliveryAttemptSchema);