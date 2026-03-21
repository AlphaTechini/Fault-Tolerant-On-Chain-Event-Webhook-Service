# Backend Subsystem

This directory contains the core processing, ingestion, and delivery logic for the Webhook Service built on Fastify and Node.js.

## Architectural Decisions & Tradeoffs

### Ingestion (Viem & Fallbacks)
I utilize `viem` for interacting with EVM chains. Instead of managing a complex custom state machine for RPC circuit breaking, I leverage `viem`'s native `fallback()` transport.
- **Tradeoff**: While absolute customizability over explicit circuit breaker states is lost, the project gains immense stability by outsourcing connection fallback and node ranking to `viem`. This keeps the `listener.ts` service remarkably thin and maintainable.

### Delivery (BullMQ & Redis)
Instead of building a custom messaging queue on raw Redis Streams or performing insecure polling on MongoDB, I implemented **BullMQ**.
- **Tradeoff**: It introduces a heavier framework dependency and ties the delivery mechanism to BullMQ's specific worker ecosystem. However, it natively solves the fundamental requirements for exponential backoff retries, explicit job state tracking (Dead Letter Queues), and horizontal concurrent webhook deliveries without having to reinvent the wheel.

*For full high-level system diagrams and overarching system principles, please refer to the [Root Architecture Readme](../Readme.md).*
