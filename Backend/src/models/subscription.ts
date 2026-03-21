import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  chainId: number;
  contractAddress: string;
  abi: any[];
  webhook: string;
  webhookSecrets?: string;
  eventFilters?: string[];
  lastProcessedBlock: number;
  status: 'active' | 'paused';
  createdAt: date;
}

const SubscriptionSchema: Schema = new Schema ({
  userId { type: mongoose.Schema.Types.ObjectId, ref: User, required: true },
  chainId { type: Number, required: true },
  contractAddress { type: String, required: true },
  abi { type: Array, required: true },
  webhook { type: String, required: true },
  webhookSecrets { type: String },
  eventFilters { type: [String], default: [] },
  lastProcessedBlock { type: Number, required: true },
  status { type: String, enum: ['active', 'paused'], default: 'active' },
}, 
{ timestamps: true });

SubscriptionSchema.index ({ userId: 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
