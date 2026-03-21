import CircuitBreaker from 'opossum';

// --- Circuit Breaker Setup ---
// WARNING (Scaling Concern):
// This is an in-memory Circuit Breaker instance per Node.js worker.
// If the backend scales horizontally to multiple worker instances, these states will NOT be shared.
// Each instance will need to independently discover if an endpoint is failing.
// For true distributed fault tolerance, a Redis-backed Circuit Breaker should be used.
const circuitBreakers = new Map<string, CircuitBreaker>();

export const getCircuitBreaker = (subscriptionId: string): CircuitBreaker => {
    if (!circuitBreakers.has(subscriptionId)) {
        // The action executed by the circuit breaker
        const requestAction = async (url: string, payload: string, headers: any) => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: payload,
                    signal: controller.signal,
                });

                const bodyText = await response.text();

                // Opossum requires an error to be thrown to count as a failure
                if (!response.ok) {
                    const err = new Error(`HTTP ${response.status}`);
                    (err as any).responseStatus = response.status;
                    (err as any).responseBody = bodyText;
                    throw err;
                }

                return {
                    status: response.status,
                    body: bodyText,
                    ok: response.ok
                };
            } finally {
                clearTimeout(timeout);
            }
        };

        const breaker = new CircuitBreaker(requestAction, {
            timeout: 35000, // Slightly higher than fetch timeout
            errorThresholdPercentage: 50,
            resetTimeout: 300000, // Wait 5 minutes before retrying when Open
        });

        breaker.on('open', () => console.warn(`🔴 Circuit breaker opened for Sub ${subscriptionId}`));
        breaker.on('close', () => console.info(`🟢 Circuit breaker closed for Sub ${subscriptionId}`));
        breaker.on('halfOpen', () => console.info(`🟡 Circuit breaker half-open for Sub ${subscriptionId}, testing next request.`));
        
        circuitBreakers.set(subscriptionId, breaker);
    }
    return circuitBreakers.get(subscriptionId)!;
};
