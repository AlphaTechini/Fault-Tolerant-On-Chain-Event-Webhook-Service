import mongoose, { Schema, Document } from 'mongoose';

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