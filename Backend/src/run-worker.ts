import { env } from './config';
import { connectDB } from './db';
import { startDeliveryService } from './services/delivery';

const start = async () => {
    try {
        console.log('🔄 Init delivery worker...');
        await connectDB(env.MONGO_URI);
        startDeliveryService();
        console.log('✅ Delivery worker started processing queue.');
    } catch (err) {
        console.error('❌ Failed to start delivery worker:', err);
        process.exit(1);
    }
};

start();
