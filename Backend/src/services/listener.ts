import { createPublicClient, http, decodeEventLog, Abi } from 'viem';
import { mainnet, sepolia, bsc, bscTestnet, polygon, polygonAmoy, arbitrum, optimism } from 'viem/chains';
import { Subscription, EventLog, ISubscription } from '../models';
import { env } from '../config';

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
const clients: Record<number, ReturnType<typeof createPublicClient>> = {};

const getClient = (chainId: number) => {
    if (!clients[chainId]) {
        const chain = CHAINS[chainId];
        if (!chain) throw new Error(`Chain ${chainId} not supported`);

        clients[chainId] = createPublicClient({
            chain,
            transport: http(), // Use env RPC URLs in production
        });
    }
    return clients[chainId];
};

export const startEventListener = async () => {
    console.log("🚀 Starting Event Listener Service...");

    // Polling loop
    setInterval(async () => {
        try {
            await processSubscriptions();
        } catch (err) {
            console.error("Error in event listener loop:", err);
        }
    }, 10000); // Poll every 10 seconds
};

const processSubscriptions = async () => {
    const subscriptions = await Subscription.find({});

    for (const sub of subscriptions) {
        try {
            await processSubscription(sub);
        } catch (err) {
            console.error(`Error processing sub ${sub._id}:`, err);
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
        console.log(`Found ${logs.length} logs for ${sub.contractAddress} blocks ${startBlock + 1}-${endBlock}`);

        for (const log of logs) {
            try {
                // Decode the event using the subscription's ABI
                const decoded = decodeEventLog({
                    abi: sub.abi as Abi,
                    data: log.data,
                    topics: log.topics,
                });

                // Create EventLog with decoded data
                await EventLog.create({
                    subscriptionId: sub._id,
                    blockNumber: Number(log.blockNumber),
                    transactionHash: log.transactionHash,
                    logIndex: Number(log.logIndex),
                    eventName: decoded.eventName,
                    payload: decoded.args, // Just the args, as we have top-level fields for others
                    status: 'PENDING',
                });

                console.log(`📝 Captured event: ${decoded.eventName} at block ${log.blockNumber}`);

            } catch (decodeErr: any) {
                // If decoding fails, save raw log data
                console.warn(`Failed to decode log: ${decodeErr.message}`);

                await EventLog.create({
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
            }
        }
    }

    // Update cursor
    sub.lastProcessedBlock = endBlock;
    await sub.save();
};
