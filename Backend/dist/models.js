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
exports.DeliveryAttempt = exports.EventLog = exports.EventStatus = exports.Subscription = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SubscriptionSchema = new mongoose_1.Schema({
    chainId: { type: Number, required: true },
    contractAddress: { type: String, required: true },
    abi: { type: Array, required: true },
    webhookUrl: { type: String, required: true },
    lastProcessedBlock: { type: Number, default: 0 },
}, { timestamps: true });
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
// Index for polling/processing
EventLogSchema.index({ status: 1, nextRetryAt: 1 });
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
