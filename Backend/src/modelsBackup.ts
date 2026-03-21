import mongoose, { Schema, Document } from 'mongoose';

// --- Plan Tiers ---
export enum PlanTier {
    FREE = 'free',
    PRO = 'pro',
    ENTERPRISE = 'enterprise',
}

export const PLAN_LIMITS = {
    [PlanTier.FREE]: { eventsPerMonth: 10000, subscriptions: 3 },
    [PlanTier.PRO]: { eventsPerMonth: 100000, subscriptions: 20 },
    [PlanTier.ENTERPRISE]: { eventsPerMonth: 1000000, subscriptions: 100 },
};

// --- Subscription ---
export interface ISubscription extends Document {
    userId: mongoose.Types.ObjectId;
    chainId: number;
    contractAddress: string;
    abi: any[];
    webhookUrl: string;
    webhookSecret?: string; // HMAC signing secret
    eventFilters?: string[];
    lastProcessedBlock: number;
    status: 'active' | 'paused';
    createdAt: Date;
}

const SubscriptionSchema: Schema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    chainId: { type: Number, required: true },
    contractAddress: { type: String, required: true },
    abi: { type: Array, required: true },
    webhookUrl: { type: String, required: true },
    webhookSecret: { type: String }, // Optional signing secret
    eventFilters: { type: [String], default: [] },
    lastProcessedBlock: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'paused'], default: 'active' },
}, { timestamps: true });

SubscriptionSchema.index({ userId: 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

// --- Event Log ---
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
    eventName: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: Object.values(EventStatus), default: EventStatus.PENDING },
    nextRetryAt: { type: Date, default: Date.now },
    retryCount: { type: Number, default: 0 },
}, { timestamps: true });

EventLogSchema.index({ status: 1, nextRetryAt: 1 });
EventLogSchema.index({ subscriptionId: 1, createdAt: -1 });

export const EventLog = mongoose.model<IEventLog>('EventLog', EventLogSchema);

// --- Delivery Attempt ---
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

// --- User ---
export enum AuthProvider {
    EMAIL = 'email',
    GOOGLE = 'google',
    GITHUB = 'github',
}

export interface IUser extends Document {
    email: string;
    passwordHash?: string;
    name: string;
    provider: AuthProvider;
    providerId?: string;
    // Plan & Usage
    plan: PlanTier;
    eventsThisMonth: number;
    lastUsageReset: Date;
    // Notifications
    emailNotifications: boolean;
    lastFailureNotification?: Date;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    name: { type: String, required: true, trim: true },
    provider: { type: String, enum: Object.values(AuthProvider), default: AuthProvider.EMAIL },
    providerId: { type: String },
    // Plan & Usage
    plan: { type: String, enum: Object.values(PlanTier), default: PlanTier.FREE },
    eventsThisMonth: { type: Number, default: 0 },
    lastUsageReset: { type: Date, default: Date.now },
    // Notifications
    emailNotifications: { type: Boolean, default: true },
    lastFailureNotification: { type: Date },
}, { timestamps: true });

UserSchema.index({ provider: 1, providerId: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);

// --- API Key ---
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
