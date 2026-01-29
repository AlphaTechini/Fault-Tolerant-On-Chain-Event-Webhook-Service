"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKey = exports.User = exports.AuthProvider = exports.DeliveryAttempt = exports.EventLog = exports.EventStatus = exports.Subscription = exports.PLAN_LIMITS = exports.PlanTier = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// --- Plan Tiers ---
var PlanTier;
(function (PlanTier) {
    PlanTier["FREE"] = "free";
    PlanTier["PRO"] = "pro";
    PlanTier["ENTERPRISE"] = "enterprise";
})(PlanTier || (exports.PlanTier = PlanTier = {}));
exports.PLAN_LIMITS = {
    [PlanTier.FREE]: { eventsPerMonth: 10000, subscriptions: 3 },
    [PlanTier.PRO]: { eventsPerMonth: 100000, subscriptions: 20 },
    [PlanTier.ENTERPRISE]: { eventsPerMonth: 1000000, subscriptions: 100 },
};
const SubscriptionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
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
exports.Subscription = mongoose_1.default.model('Subscription', SubscriptionSchema);
// --- Event Log ---
var EventStatus;
(function (EventStatus) {
    EventStatus["PENDING"] = "PENDING";
    EventStatus["PROCESSING"] = "PROCESSING";
    EventStatus["DELIVERED"] = "DELIVERED";
    EventStatus["FAILED"] = "FAILED";
})(EventStatus || (exports.EventStatus = EventStatus = {}));
const EventLogSchema = new mongoose_1.Schema({
    subscriptionId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Subscription', required: true },
    blockNumber: { type: Number, required: true },
    transactionHash: { type: String, required: true },
    eventName: { type: String, required: true },
    payload: { type: mongoose_1.default.Schema.Types.Mixed, required: true },
    status: { type: String, enum: Object.values(EventStatus), default: EventStatus.PENDING },
    nextRetryAt: { type: Date, default: Date.now },
    retryCount: { type: Number, default: 0 },
}, { timestamps: true });
EventLogSchema.index({ status: 1, nextRetryAt: 1 });
EventLogSchema.index({ subscriptionId: 1, createdAt: -1 });
exports.EventLog = mongoose_1.default.model('EventLog', EventLogSchema);
const DeliveryAttemptSchema = new mongoose_1.Schema({
    eventLogId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'EventLog', required: true },
    responseStatus: { type: Number },
    responseBody: { type: String },
    success: { type: Boolean, required: true },
    error: { type: String },
    timestamp: { type: Date, default: Date.now },
});
exports.DeliveryAttempt = mongoose_1.default.model('DeliveryAttempt', DeliveryAttemptSchema);
// --- User ---
var AuthProvider;
(function (AuthProvider) {
    AuthProvider["EMAIL"] = "email";
    AuthProvider["GOOGLE"] = "google";
    AuthProvider["GITHUB"] = "github";
})(AuthProvider || (exports.AuthProvider = AuthProvider = {}));
const UserSchema = new mongoose_1.Schema({
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
exports.User = mongoose_1.default.model('User', UserSchema);
const ApiKeySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    keyHash: { type: String, required: true },
    prefix: { type: String, required: true },
    lastUsedAt: { type: Date },
}, { timestamps: true });
ApiKeySchema.index({ userId: 1 });
ApiKeySchema.index({ keyHash: 1 }, { unique: true });
exports.ApiKey = mongoose_1.default.model('ApiKey', ApiKeySchema);
