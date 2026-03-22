import { createPublicClient, http, fallback, decodeEventLog, Abi } from 'viem';
import { mainnet, sepolia, bsc, bscTestnet, polygon, polygonAmoy, arbitrum, optimism } from 'viem/chains';
import { Subscription, EventLog, ISubscription } from '../models';
import { env } from '../config';
import { deliveryQueue } from './queue';
import logger from '../utils/logger';

// Map chainId to Viem Chain object
const CHAINS: Record<number, any> = {
    1: mainnet,
    11155111: sepolia,
    56: bsc,
    97: bscTestnet,
    137: polygon,
    80002: polygonAmoy,
    42161: arbitrum,
    10: optimism,
};

// Client cache
const clients: Record<number, any> = {};

const getClient = (chainId: number) => {
    if (!clients[chainId]) {
        const chain = CHAINS[chainId];
        if (!chain) throw new Error(`Chain ${chainId} not supported`);

        const customRpcs = env.RPC_URLS[chainId];
        let transport;

        if (customRpcs && customRpcs.length > 0) {
            // Create a prioritized fallback list of RPC providers
            const transports = customRpcs.map(url => http(url));
            transport = fallback(transports, { rank: true, retryCount: 3 });
        } else {
            // Default viem public transport if no fallback configuration is found
            transport = http(); 
        }

        clients[chainId] = createPublicClient({
            chain,
            transport,
        });
    }
    return clients[chainId];
};

export const startEventListener = async () => {
    logger.info("🚀 Starting Event Listener Service...");

    // Polling loop
    setInterval(async () => {
        try {
            await processSubscriptions();
        } catch (err) {
            logger.error({ err }, "Error in event listener loop");
        }
    }, 10000); // Poll every 10 seconds
};

const processSubscriptions = async () => {
    const subscriptions = await Subscription.find({});

    for (const sub of subscriptions) {
        try {
            await processSubscription(sub);
        } catch (err) {
            logger.error({ err, subscriptionId: sub._id }, `Error processing sub ${sub._id}`);
        }
    }
};

const processSubscription = async (sub: ISubscription) => {
    const client = getClient(sub.chainId);
    const currentBlock = Number(await client.getBlockNumber());

    let startBlock = sub.lastProcessedBlock;
    if (startBlock === 0) {
        startBlock = currentBlock;
        sub.lastProcessedBlock = currentBlock;
        await sub.save();
        return;
    }

    if (startBlock >= currentBlock) return;

    // Limit range to avoid RPC limits
    const MAX_RANGE = 1000;
    const endBlock = Math.min(currentBlock, startBlock + MAX_RANGE);

    // Fetch logs for the contract
    const logs = await client.getLogs({
        address: sub.contractAddress as `0x${string}`,
        fromBlock: BigInt(startBlock + 1),
        toBlock: BigInt(endBlock),
    });

    if (logs.length > 0) {
        logger.info({ 
            logCount: logs.length, 
            contractAddress: sub.contractAddress, 
            chainId: sub.chainId,
            blockRange: { start: startBlock + 1, end: endBlock }
        }, `Found ${logs.length} logs`);

        for (const log of logs) {
            try {
                // Decode the event using the subscription's ABI
                const decoded = decodeEventLog({
                    abi: sub.abi as Abi,
                    data: log.data,
                    topics: log.topics,
                });

                // Create EventLog with decoded data
                const eventLog = await EventLog.create({
                    subscriptionId: sub._id,
                    blockNumber: Number(log.blockNumber),
                    transactionHash: log.transactionHash,
                    logIndex: Number(log.logIndex),
                    eventName: decoded.eventName,
                    payload: decoded.args, // Just the args, as we have top-level fields for others
                    status: 'PENDING',
                });

                // Enqueue to BullMQ
                await deliveryQueue.add('deliver', { eventId: eventLog._id.toString() });

                logger.info({ 
                    eventName: decoded.eventName, 
                    blockNumber: Number(log.blockNumber),
                    transactionHash: log.transactionHash,
                    subscriptionId: sub._id
                }, `📝 Captured event: ${decoded.eventName}`);

            } catch (decodeErr: any) {
                // If decoding fails, save raw log data
                logger.warn({ 
                    err: decodeErr, 
                    transactionHash: log.transactionHash,
                    subscriptionId: sub._id 
                }, `Failed to decode log: ${decodeErr.message}`);

                const eventLog = await EventLog.create({
                    subscriptionId: sub._id,
                    blockNumber: Number(log.blockNumber),
                    transactionHash: log.transactionHash,
                    logIndex: Number(log.logIndex), // Still capture index
                    eventName: 'UnknownEvent',
                    payload: {
                        raw: {
                            data: log.data,
                            topics: log.topics,
                        },
                        decodeError: decodeErr.message,
                    },
                    status: 'PENDING',
                });

                // Enqueue to BullMQ even if decode failed (user might want raw)
                await deliveryQueue.add('deliver', { eventId: eventLog._id.toString() });
            }
        }
    }

    // Update cursor
    sub.lastProcessedBlock = endBlock;
    await sub.save();
};
