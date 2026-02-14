# Fault-Tolerant On-Chain Event Webhook Service

A production-ready infrastructure for reliably consuming smart contract events as HTTP webhooks with built-in fault tolerance, retry logic, and observability.

## 1. Project Overview

### Problem Statement
Most Web3 applications require real-time on-chain event processing, but implementing reliable blockchain listeners is complex and error-prone. Teams repeatedly face the same challenges:
- RPC connection drops causing missed events
- Silent data loss from webhook delivery failures  
- Duplicated ABI decoding logic across services
- Operational complexity of maintaining listener infrastructure
- Difficulty in replaying missed events

### Solution Approach
This service provides a centralized, fault-tolerant event ingestion and delivery system that:
- **Eliminates operational overhead** - No need to run and maintain blockchain listeners
- **Guarantees delivery** - Events are persisted before delivery with automatic retries
- **Simplifies integration** - HTTP-based API with standard webhook payloads
- **Provides observability** - Full delivery history and replay capabilities
- **Scales efficiently** - Shared infrastructure reduces per-project complexity

### Target Audience
- Web3 development teams building dApp backends
- Infrastructure engineers managing blockchain integrations
- Product teams wanting to focus on business logic over plumbing
- Organizations requiring reliable event delivery for critical workflows

## 2. System Architecture

The system follows a **queue-driven, event-sourcing architecture** with clear separation of concerns:

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Blockchain    │    │   Event Listener │    │   Event Storage  │
│   (Ethereum,    │◄───┤   Service        │◄───┤   (MongoDB)      │
│   Polygon, etc) │    │                  │    │                  │
└─────────────────┘    └──────────────────┘    └──────────────────┘
                              │                           │
                              ▼                           ▼
                    ┌──────────────────┐    ┌──────────────────┐
                    │   Delivery       │    │   API Layer      │
                    │   Service        │◄───┤   (Fastify)      │
                    └──────────────────┘    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Webhook        │
                    │   Endpoints      │
                    └──────────────────┘
```

### Key Components

**Event Listener Service**
- Polls supported blockchains every 10 seconds
- Uses Viem for blockchain interaction and ABI decoding
- Supports multiple chains: Ethereum, Sepolia, BSC, Polygon, Arbitrum, Optimism
- Persists raw logs before any processing

**Delivery Service** 
- Processes delivery queue every 5 seconds
- Implements exponential backoff with 5 retry attempts (1min, 5min, 30min, 2hr, 12hr)
- Signs payloads with HMAC-SHA256 when webhook secrets are configured
- Tracks all delivery attempts with full response details

**API Layer**
- Fastify server with Zod validation
- RESTful endpoints for subscription management
- Authentication via JWT or API keys
- Rate limiting (100 requests/minute)

**Data Model**
- **Subscriptions**: Chain, contract, ABI, webhook configuration
- **Event Logs**: Persisted events with delivery status
- **Delivery Attempts**: Full history of delivery attempts
- **Users**: Authentication and plan management

## 3. Design Decisions

### Polling vs WebSocket Subscriptions
**Chosen**: Polling every 10 seconds
**Why**: Simpler failure recovery, better compatibility across RPC providers, easier to reason about consistency
**Trade-offs**: Slightly higher latency (≤10s), more frequent RPC calls
**Alternative Considered**: WebSocket subscriptions with reconnection logic - rejected due to complexity and provider-specific quirks

### MongoDB vs PostgreSQL
**Chosen**: MongoDB
**Why**: Flexible schema for ABI storage, natural document structure for event logs, simpler operational requirements
**Trade-offs**: Less ACID guarantees, potential consistency issues in distributed scenarios
**Alternative Considered**: PostgreSQL with JSONB - would provide stronger consistency but more complex schema evolution

### Centralized vs Distributed Processing
**Chosen**: Centralized single-instance processing
**Why**: Simpler coordination, easier debugging, sufficient for moderate scale
**Trade-offs**: Single point of failure, limited horizontal scaling
**Alternative Considered**: Distributed workers with message queues - overkill for current scale requirements

### Retry Strategy
**Chosen**: Fixed exponential backoff (5 attempts with specific delays)
**Why**: Predictable behavior, prevents overwhelming failing endpoints, aligns with common webhook best practices
**Trade-offs**: Less adaptive to different failure modes
**Alternative Considered**: Adaptive retry based on error types - added complexity without significant benefit

## 4. Internal Structure

```
Backend/
├── src/
│   ├── index.ts          # Fastify server entry point
│   ├── config.ts         # Environment validation with Zod
│   ├── db/               # Database connection
│   ├── middleware/       # Authentication middleware
│   ├── models.ts         # Mongoose schemas and interfaces
│   ├── routes/           # API route handlers
│   │   ├── subscriptions.ts  # Core subscription management
│   │   ├── auth.ts           # Authentication endpoints  
│   │   ├── apiKeys.ts        # API key management
│   │   ├── stats.ts          # Usage statistics
│   │   └── replays.ts        # Event replay functionality
│   └── services/         # Background services
│       ├── listener.ts   # Blockchain event polling
│       ├── delivery.ts   # Webhook delivery with retries
│       └── email.ts      # Failure notifications
├── scripts/              # Development utilities
└── package.json          # Dependencies: Fastify, Viem, Mongoose, Zod

Frontend/
└── SvelteKit dashboard for subscription management and monitoring
```

### Core Responsibilities

**index.ts**: Server initialization, plugin registration, background service startup
**models.ts**: Data model definitions with TypeScript interfaces and Mongoose schemas
**listener.ts**: Blockchain interaction, log fetching, ABI decoding, event persistence
**delivery.ts**: Delivery queue processing, retry logic, webhook signing, usage tracking
**subscriptions.ts**: CRUD operations for subscriptions with plan limit enforcement
**authMiddleware.ts**: Dual authentication support (JWT + API keys)

## 5. Data Flow

### Event Ingestion Flow
1. **Polling**: Listener service polls each subscription's chain every 10s
2. **Log Fetching**: Retrieves logs from `lastProcessedBlock + 1` to current block (max 1000 blocks)
3. **ABI Decoding**: Attempts to decode logs using subscription's ABI
4. **Persistence**: Stores decoded events (or raw logs on decode failure) in EventLog collection
5. **Cursor Update**: Updates subscription's `lastProcessedBlock`

### Webhook Delivery Flow
1. **Queue Processing**: Delivery service finds PENDING/FAILED events ready for retry
2. **Plan Validation**: Checks user's monthly event limit before delivery
3. **Payload Construction**: Builds standardized JSON payload with event metadata
4. **Signature Generation**: Adds HMAC signature if webhook secret configured
5. **HTTP Delivery**: POSTs to webhook URL with 30s timeout
6. **Result Recording**: Creates DeliveryAttempt record with success/failure details
7. **Retry Logic**: Updates event status and schedules next retry if failed

### Error Propagation
- **Blockchain errors**: Logged and retried on next polling cycle
- **Decoding errors**: Raw logs stored with error details, delivery proceeds
- **Webhook failures**: Automatic retries with exponential backoff
- **Permanent failures**: Email notifications sent (if enabled), manual replay available
- **Rate limiting**: 429 responses with clear error messages

## 6. Scalability Considerations

### Current Limitations
- **Single instance**: All processing happens in one Node.js process
- **Polling frequency**: 10s minimum latency for event detection
- **Block range**: Limited to 1000 blocks per poll to avoid RPC timeouts
- **Memory usage**: In-memory client cache for blockchain connections

### Scaling Pathways
**Horizontal Scaling**:
- Shard by chain ID or contract address
- Use message queues (Redis/RabbitMQ) for inter-service communication
- Separate listener and delivery services into independent processes

**Performance Optimization**:
- Implement WebSocket subscriptions for real-time event detection
- Add database connection pooling and query optimization
- Use Redis for caching frequently accessed subscription data

**High Availability**:
- Database replication for MongoDB
- Load balancing across multiple API instances
- Leader election for listener service coordination

### Resource Requirements
- **CPU**: Moderate (blockchain parsing and JSON processing)
- **Memory**: Low-Medium (in-memory client cache, delivery queue)
- **Storage**: High (event logs accumulate over time)
- **Network**: High (constant RPC calls and webhook deliveries)

## 7. Reliability and Failure Handling

### Fault Tolerance Mechanisms

**Event Persistence**
- Events stored before any delivery attempt
- Atomic operations ensure no data loss during processing
- MongoDB durability provides crash recovery

**Retry Logic**
- 5 retry attempts with documented exponential backoff
- Failed deliveries remain queryable for manual replay
- Delivery state fully observable through API

**Idempotency Support**
- Webhook consumers should implement idempotency keys
- Event IDs provided in all payloads for duplicate detection
- Multiple deliveries of same event are expected and safe

**Failure Boundaries**
- **Listener failures**: Next poll cycle recovers automatically
- **Delivery failures**: Isolated to specific events, don't affect others
- **Database failures**: Entire system pauses until DB recovery
- **RPC failures**: Individual subscription retries, others continue

### Monitoring and Observability

**Logging Strategy**
- Structured JSON logging with Fastify logger
- Error details captured at appropriate levels
- Delivery success/failure metrics available

**Metrics Available**
- Events processed per subscription
- Delivery success rates
- Retry counts and patterns
- Monthly usage by plan tier

**Alerting**
- Email notifications for permanent delivery failures
- Configurable notification preferences per user
- Dashboard visibility into all delivery attempts

## 8. Development Workflow

### Prerequisites
- Node.js 18+
- pnpm package manager
- MongoDB instance (local or Atlas)

### Local Setup

**Backend**
```bash
cd Backend
pnpm install
cp .env.example .env
# Edit .env with your MongoDB URI and other settings
pnpm dev
```

**Frontend**
```bash
cd Frontend  
pnpm install
pnpm dev
```

### Environment Variables
Required variables (validated at startup):
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT token signing
- `GOOGLE_CLIENT_ID/SECRET`: OAuth2 credentials
- `GITHUB_CLIENT_ID/SECRET`: OAuth2 credentials  
- `FRONTEND_URL`: Base URL for redirects (default: http://localhost:5173)

Optional:
- `RESEND_API_KEY`: For email failure notifications
- `PORT`: Server port (default: 3000)

### Testing Strategy
Current test coverage is minimal (placeholder test script). Recommended improvements:
- Unit tests for ABI decoding and payload construction
- Integration tests for webhook delivery flow
- End-to-end tests with mock blockchain and webhook endpoints

### Authentication
Supports two authentication methods:
1. **JWT Tokens**: Standard bearer tokens from login/signup
2. **API Keys**: `sk_live_` prefixed keys for machine-to-machine communication

## 9. Future Improvements

### Near-term Enhancements
- **WebSocket Support**: Real-time event detection for lower latency
- **Advanced Filtering**: Topic-based filtering beyond event names
- **Batch Delivery**: Send multiple events in single webhook call
- **Custom Headers**: Allow users to configure additional webhook headers

### Medium-term Roadmap
- **Multi-tenant Isolation**: Separate data stores per customer
- **Usage Analytics**: Detailed dashboards for event patterns
- **SLA Monitoring**: Alerting for delivery time violations
- **Archive Storage**: Move old events to cheaper storage tiers

### Long-term Vision
- **Cross-chain Event Correlation**: Detect related events across chains
- **Smart Contract Verification**: Auto-fetch verified ABIs from block explorers
- **Event Schema Registry**: Standardize event formats across contracts
- **Serverless Deployment**: Lambda/Azure Functions for cost efficiency

### Technical Debt Considerations
- **Testing Coverage**: Critical need for comprehensive test suite
- **Error Handling**: Some error paths lack detailed logging
- **Configuration Management**: Environment variables could be centralized
- **Documentation**: API documentation should be generated from Zod schemas

---

This implementation demonstrates a pragmatic approach to solving real-world Web3 infrastructure challenges. The architecture prioritizes correctness and reliability over novelty, making it suitable for production deployments where missed events have business consequences.