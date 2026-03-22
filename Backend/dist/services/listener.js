"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startEventListener = void 0;
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const models_1 = require("../models");
const config_1 = require("../config");
const queue_1 = require("./queue");
const logger_1 = __importDefault(require("../utils/logger"));
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
        const customRpcs = config_1.env.RPC_URLS[chainId];
        let transport;
        if (customRpcs && customRpcs.length > 0) {
            // Create a prioritized fallback list of RPC providers
            const transports = customRpcs.map(url => (0, viem_1.http)(url));
            transport = (0, viem_1.fallback)(transports, { rank: true, retryCount: 3 });
        }
        else {
            // Default viem public transport if no fallback configuration is found
            transport = (0, viem_1.http)();
        }
        clients[chainId] = (0, viem_1.createPublicClient)({
            chain,
            transport,
        });
    }
    return clients[chainId];
};
const startEventListener = async () => {
    logger_1.default.info("🚀 Starting Event Listener Service...");
    // Polling loop
    setInterval(async () => {
        try {
            await processSubscriptions();
        }
        catch (err) {
            logger_1.default.error({ err }, "Error in event listener loop");
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
            logger_1.default.error({ err, subscriptionId: sub._id }, `Error processing sub ${sub._id}`);
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
        logger_1.default.info({
            logCount: logs.length,
            contractAddress: sub.contractAddress,
            chainId: sub.chainId,
            blockRange: { start: startBlock + 1, end: endBlock }
        }, `Found ${logs.length} logs`);
        for (const log of logs) {
            try {
                // Decode the event using the subscription's ABI
                const decoded = (0, viem_1.decodeEventLog)({
                    abi: sub.abi,
                    data: log.data,
                    topics: log.topics,
                });
                // --- Deduplication Shield (Redis) ---
                const dedupeKey = `event:dedupe:${log.transactionHash}:${log.logIndex}`;
                // Set key with 72-hour TTL (259200 seconds), only if it doesn't already exist
                const isNew = await queue_1.redisConnection.set(dedupeKey, '1', 'EX', 259200, 'NX');
                if (!isNew) {
                    logger_1.default.debug({
                        transactionHash: log.transactionHash,
                        logIndex: log.logIndex
                    }, 'Skip: Event already processed (Redis cache hit)');
                    continue; // Skip to next log
                }
                // --- Permanent Storage (MongoDB) ---
                let eventLog;
                try {
                    // Create EventLog with decoded data
                    eventLog = await models_1.EventLog.create({
                        subscriptionId: sub._id,
                        blockNumber: Number(log.blockNumber),
                        transactionHash: log.transactionHash,
                        logIndex: Number(log.logIndex),
                        eventName: decoded.eventName,
                        payload: decoded.args, // Just the args, as we have top-level fields for others
                        status: 'PENDING',
                    });
                }
                catch (dbErr) {
                    // E11000 is MongoDB's Duplicate Key error code
                    if (dbErr.code === 11000) {
                        logger_1.default.warn({
                            transactionHash: log.transactionHash,
                            logIndex: log.logIndex
                        }, 'Skip: Event rejected by DB unique index (Cache miss/expiry but DB caught it)');
                        continue;
                    }
                    throw dbErr; // Rethrow other unexpected errors
                }
                // Enqueue to BullMQ
                await queue_1.deliveryQueue.add('deliver', { eventId: eventLog._id.toString() });
                logger_1.default.info({
                    eventName: decoded.eventName,
                    blockNumber: Number(log.blockNumber),
                    transactionHash: log.transactionHash,
                    subscriptionId: sub._id
                }, `📝 Captured event: ${decoded.eventName}`);
            }
            catch (decodeErr) {
                // If decoding fails, save raw log data
                logger_1.default.warn({
                    err: decodeErr,
                    transactionHash: log.transactionHash,
                    subscriptionId: sub._id
                }, `Failed to decode log: ${decodeErr.message}`);
                // Create raw event log fallback
                let eventLog;
                try {
                    eventLog = await models_1.EventLog.create({
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
                catch (dbErr) {
                    if (dbErr.code === 11000) {
                        continue; // Same duplicate check for decode-failed logs
                    }
                    throw dbErr;
                }
                // Enqueue to BullMQ even if decode failed (user might want raw)
                await queue_1.deliveryQueue.add('deliver', { eventId: eventLog._id.toString() });
            }
        }
    }
    // Update cursor
    sub.lastProcessedBlock = endBlock;
    await sub.save();
};
