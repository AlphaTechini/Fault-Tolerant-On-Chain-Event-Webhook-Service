import Fastify from 'fastify';
import { parseAbiItem } from 'viem';

// --- Configuration ---
const API_URL = 'http://localhost:3000';
const WEBHOOK_PORT = 3001;
const WEBHOOK_URL = `http://localhost:${WEBHOOK_PORT}/webhook`;

// Example: Listen for USDC Transfer on Mainnet (or any active contract)
// USDC Mainnet: 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
// Event: Transfer(address indexed from, address indexed to, uint256 value)
const TARGET_CHAIN = 1;
const TARGET_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const TARGET_ABI = [
    parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')
];

// --- Mock Webhook Server ---
const webhookServer = Fastify();
const receivedEvents: any[] = [];

webhookServer.post('/webhook', async (request, reply) => {
    console.log('🪝 Webhook received!', request.body);
    receivedEvents.push(request.body);
    return { received: true };
});

const startTest = async () => {
    try {
        // 1. Start Webhook Server
        await webhookServer.listen({ port: WEBHOOK_PORT });
        console.log(`✅ Mock Webhook Server listening at ${WEBHOOK_URL}`);

        // 2. Register Subscription
        console.log('📝 Registering subscription...');
        const regRes = await fetch(`${API_URL}/subscriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chainId: TARGET_CHAIN,
                contractAddress: TARGET_CONTRACT,
                abi: TARGET_ABI, // In strict mode, might need JSON.stringify(TARGET_ABI) but body is objects
                webhookUrl: WEBHOOK_URL,
            }),
        });

        if (!regRes.ok) {
            throw new Error(`Failed to register: ${regRes.status} ${await regRes.text()}`);
        }
        const sub = await regRes.json();
        console.log('✅ Subscription registered:', sub);

        // 3. Wait for event
        console.log('⏳ Waiting for events (this might take a few seconds)...');

        // Poll receivedEvents
        let loops = 0;
        const interval = setInterval(() => {
            loops++;
            if (receivedEvents.length > 0) {
                console.log('🎉 TEST PASSED! Received event:', receivedEvents[0]);
                clearInterval(interval);
                process.exit(0);
            }
            if (loops > 20) { // 20 * 2s = 40s timeout
                console.error('❌ Timeout waiting for event. Check if backend is running and contract is active.');
                clearInterval(interval);
                process.exit(1);
            }
        }, 2000);

    } catch (err) {
        console.error('❌ Test failed:', err);
        process.exit(1);
    }
};

startTest();
