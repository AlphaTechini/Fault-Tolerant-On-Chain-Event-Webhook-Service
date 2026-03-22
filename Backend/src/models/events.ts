import mongoose, { Schema, Document } from 'mongoose';

export enum EventStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    DELIVERED = 'DELIVERED',
    FAILED = 'FAILED',
}

export interface IEventLog extends Document {
    subscriptionId: mongoose.Types.ObjectId;
    blockNumber: number;
    transactionHash: string;
    logIndex: number;
    eventName: string;
    payload: any;
    status: EventStatus;
    nextRetryAt: Date;
    retryCount: number;
    createdAt: Date;
}

const EventLogSchema: Schema = new Schema({
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
    blockNumber: { type: Number, required: true },
    transactionHash: { type: String, required: true },
    logIndex: { type: Number, required: true },
    eventName: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: Object.values(EventStatus), default: EventStatus.PENDING },
    nextRetryAt: { type: Date, default: Date.now },
    retryCount: { type: Number, default: 0 },
}, { timestamps: true });

EventLogSchema.index({ status: 1, nextRetryAt: 1 });
EventLogSchema.index({ subscriptionId: 1, createdAt: -1 });
// Enforce strict deduplication at the DB layer
EventLogSchema.index({ transactionHash: 1, logIndex: 1 }, { unique: true });

export const EventLog = mongoose.model<IEventLog>('EventLog', EventLogSchema);

export interface IDeadLetterEvent extends IEventLog {
    failedAt: Date;
    lastError: string;
}

const DeadLetterEventSchema: Schema = new Schema({
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
    blockNumber: { type: Number, required: true },
    transactionHash: { type: String, required: true },
    logIndex: { type: Number, required: true },
    eventName: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, default: EventStatus.FAILED },
    retryCount: { type: Number, required: true },
    failedAt: { type: Date, default: Date.now },
    lastError: { type: String, required: true },
}, { timestamps: true });

DeadLetterEventSchema.index({ subscriptionId: 1, failedAt: -1 });

export const DeadLetterEvent = mongoose.model<IDeadLetterEvent>('DeadLetterEvent', DeadLetterEventSchema);
