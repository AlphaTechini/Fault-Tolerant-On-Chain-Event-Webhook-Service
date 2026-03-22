import { env } from './config';
import { connectDB } from './db';
import { startEventListener } from './services/listener';

const start = async () => {
    try {
        console.log('🔄 Init listener service...');
        await connectDB(env.MONGO_URI);
        startEventListener();
        console.log('✅ Blockchain Listener service started.');
    } catch (err) {
        console.error('❌ Failed to start listener service:', err);
        process.exit(1);
    }
};

start();
