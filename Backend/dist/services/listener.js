"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startEventListener = void 0;
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const models_1 = require("../models");
// Map chainId to Viem Chain object
const CHAINS = {
    1: chains_1.mainnet,
    11155111: chains_1.sepolia,
    56: chains_1.bsc,
    97: chains_1.bscTestnet,
    137: chains_1.polygon,
    80002: chains_1.polygonAmoy,
    42161: chains_1.arbitrum,
    10: chains_1.optimism,
};
// Client cache
const clients = {};
const getClient = (chainId) => {
    if (!clients[chainId]) {
        const chain = CHAINS[chainId];
        if (!chain)
            throw new Error(`Chain ${chainId} not supported`);
        clients[chainId] = (0, viem_1.createPublicClient)({
            chain,
            transport: (0, viem_1.http)(), // Use env RPC URLs in production
        });
    }
    return clients[chainId];
};
const startEventListener = async () => {
    console.log("🚀 Starting Event Listener Service...");
    // Polling loop
    setInterval(async () => {
        try {
            await processSubscriptions();
        }
        catch (err) {
            console.error("Error in event listener loop:", err);
        }
    }, 10000); // Poll every 10 seconds
};
exports.startEventListener = startEventListener;
const processSubscriptions = async () => {
    const subscriptions = await models_1.Subscription.find({});
    for (const sub of subscriptions) {
        try {
            await processSubscription(sub);
        }
        catch (err) {
            console.error(`Error processing sub ${sub._id}:`, err);
        }
    }
};
const processSubscription = async (sub) => {
    const client = getClient(sub.chainId);
    const currentBlock = Number(await client.getBlockNumber());
    let startBlock = sub.lastProcessedBlock;
    if (startBlock === 0) {
        startBlock = currentBlock;
        sub.lastProcessedBlock = currentBlock;
        await sub.save();
        return;
    }
    if (startBlock >= currentBlock)
        return;
    // Limit range to avoid RPC limits
    const MAX_RANGE = 1000;
    const endBlock = Math.min(currentBlock, startBlock + MAX_RANGE);
    // Fetch logs for the contract
    const logs = await client.getLogs({
        address: sub.contractAddress,
        fromBlock: BigInt(startBlock + 1),
        toBlock: BigInt(endBlock),
    });
    if (logs.length > 0) {
        console.log(`Found ${logs.length} logs for ${sub.contractAddress} blocks ${startBlock + 1}-${endBlock}`);
        for (const log of logs) {
            try {
                // Decode the event using the subscription's ABI
                const decoded = (0, viem_1.decodeEventLog)({
                    abi: sub.abi,
                    data: log.data,
                    topics: log.topics,
                });
                // Create EventLog with decoded data
                await models_1.EventLog.create({
                    subscriptionId: sub._id,
                    blockNumber: Number(log.blockNumber),
                    transactionHash: log.transactionHash,
                    logIndex: Number(log.logIndex),
                    eventName: decoded.eventName,
                    payload: decoded.args, // Just the args, as we have top-level fields for others
                    status: 'PENDING',
                });
                console.log(`📝 Captured event: ${decoded.eventName} at block ${log.blockNumber}`);
            }
            catch (decodeErr) {
                // If decoding fails, save raw log data
                console.warn(`Failed to decode log: ${decodeErr.message}`);
                await models_1.EventLog.create({
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
