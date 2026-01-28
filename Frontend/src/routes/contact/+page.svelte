<script lang="ts">
	// Contact page with FAQ
	let expandedFaq = $state<string | null>(null);
	let contactName = $state('');
	let contactEmail = $state('');
	let contactSubject = $state('');
	let contactMessage = $state('');

	function toggleFaq(id: string) {
		expandedFaq = expandedFaq === id ? null : id;
	}

	const faqCategories = [
		{
			title: 'Getting Started',
			faqs: [
				{ 
					id: 'gs-1', 
					q: "I created a subscription but I'm not receiving any events. What's wrong?",
					a: "Check these common issues: 1) Your contract may not be emitting events yet. 2) The ABI may be malformed or missing the events you're tracking. 3) Your webhook URL may be unreachable from our servers. 4) You may be filtering for events that don't match what the contract emits. Use the Delivery Logs in your dashboard to see if we're capturing events but failing to deliver them."
				},
				{ 
					id: 'gs-2', 
					q: "Do I need the full contract ABI or just the event definitions?",
					a: "Either works. We only use the event definitions for decoding, so you can provide just the events you want to track. Example minimal ABI: [{\"type\":\"event\",\"name\":\"Transfer\",\"inputs\":[{\"name\":\"from\",\"type\":\"address\"},{\"name\":\"to\",\"type\":\"address\"},{\"name\":\"value\",\"type\":\"uint256\"}]}]"
				},
				{ 
					id: 'gs-3', 
					q: "How do I test my webhook endpoint before going live?",
					a: "Use the 'Test' button next to your webhook in the dashboard. We'll send a sample event payload to your endpoint and show you the response. You can also use a service like webhook.site to inspect payloads before pointing to your real endpoint."
				},
				{ 
					id: 'gs-4', 
					q: "Can I use localhost as my webhook URL?",
					a: "No, we need a publicly accessible HTTPS URL. For local development, use a tunneling service like ngrok, localtunnel, or Cloudflare Tunnel to expose your local server."
				}
			]
		},
		{
			title: 'Events & Delivery',
			faqs: [
				{ 
					id: 'ev-1', 
					q: "Why am I receiving duplicate events?",
					a: "This is expected behavior. We guarantee at-least-once delivery, which means you may receive the same event more than once (e.g., after a retry or infrastructure failover). Always use the event 'id' field to deduplicate. Store processed event IDs and skip any duplicates."
				},
				{ 
					id: 'ev-2', 
					q: "Events are arriving out of order. Is this a bug?",
					a: "Not a bug. We prioritize reliability over strict ordering. If ordering matters, use the 'blockNumber' and 'logIndex' fields to sort events on your end. Block number is the primary sort key; logIndex breaks ties within the same block."
				},
				{ 
					id: 'ev-3', 
					q: "There's a delay between on-chain events and webhook delivery. Why?",
					a: "We wait for block confirmations before delivering events to avoid sending events from reorged blocks. Ethereum mainnet: 12 confirmations (~3 min). Polygon: 32 confirmations (~1 min). This delay is intentional and protects you from false events."
				},
				{ 
					id: 'ev-4', 
					q: "My event args contain BigInt values. How do I parse them?",
					a: "All BigInt values are serialized as strings in the JSON payload (e.g., \"value\": \"1000000000000000000\"). Parse them with BigInt() in JavaScript or your language's equivalent. We never send numbers larger than JavaScript's safe integer limit as native numbers."
				},
				{ 
					id: 'ev-5', 
					q: "What happens to events if my endpoint is down for hours?",
					a: "Events queue up in our system. When your endpoint comes back, we resume delivery with the standard retry schedule. Events are retained for 7-90 days depending on your plan. For extended outages, use the Replay feature to bulk re-deliver."
				},
				{ 
					id: 'ev-6', 
					q: "Why did I receive an event with 'decoded: false'?",
					a: "This means we couldn't decode the event with your provided ABI. Common causes: 1) Proxy contracts where the implementation ABI differs from the proxy. 2) Upgradeable contracts where the ABI changed. 3) The event signature doesn't match any event in your ABI. The raw log data is still included so you can decode manually."
				}
			]
		},
		{
			title: 'Webhooks & Security',
			faqs: [
				{ 
					id: 'wh-1', 
					q: "How do I verify that a webhook actually came from you?",
					a: "If you set a signing secret, we include an X-Webhook-Signature header with each request. Compute HMAC-SHA256 of the raw request body using your secret and compare it to the signature. Use constant-time comparison to prevent timing attacks. See our docs for code examples."
				},
				{ 
					id: 'wh-2', 
					q: "What IP addresses do your webhooks come from?",
					a: "We send from a rotating pool of IP addresses. We don't publish a static list because it changes. Instead of IP whitelisting, use webhook signature verification. Enterprise plans can request dedicated egress IPs for a stable range."
				},
				{ 
					id: 'wh-3', 
					q: "My webhook keeps getting 'timeout' errors. What's happening?",
					a: "We wait 30 seconds for a response before timing out. If your handler takes longer, consider: 1) Acknowledging with 200 immediately, then processing asynchronously. 2) Optimizing database queries or external API calls. 3) Using a queue to decouple ingestion from processing."
				},
				{ 
					id: 'wh-4', 
					q: "Can I have multiple webhooks for the same subscription?",
					a: "Yes. Each webhook receives a copy of every event from the subscription. Useful for sending events to multiple services (analytics, notifications, database) without coupling them in your handler."
				},
				{ 
					id: 'wh-5', 
					q: "What response should my webhook return?",
					a: "Return any 2xx status code (200, 201, 204, etc.) to acknowledge receipt. The response body is ignored. Any other status code triggers a retry. If you can't process the event, return 2xx anyway and handle errors internally—retries won't help if your business logic is failing."
				}
			]
		},
		{
			title: 'Subscriptions & Filtering',
			faqs: [
				{ 
					id: 'sub-1', 
					q: "Can I filter events by specific argument values (e.g., transfers to my address)?",
					a: "Not currently. Filtering is by event name only. Argument-based filtering (topic filtering) is on our roadmap. For now, filter in your webhook handler by checking the args object before processing."
				},
				{ 
					id: 'sub-2', 
					q: "How do I monitor multiple contracts on the same chain?",
					a: "Create a separate subscription for each contract. There's no way to monitor multiple contracts in one subscription. Your plan limits the number of subscriptions you can have."
				},
				{ 
					id: 'sub-3', 
					q: "Can I change the ABI of an existing subscription?",
					a: "Yes, update the ABI via the API or dashboard. The new ABI applies to future events only. Historical events were decoded with the old ABI and won't be re-decoded. Consider creating a new subscription if you need consistent decoding."
				},
				{ 
					id: 'sub-4', 
					q: "What happens if I pause a subscription?",
					a: "We stop listening for new events. Events emitted while paused are NOT captured and cannot be recovered. If you need to maintain event capture but stop delivery, pause the webhook instead of the subscription."
				},
				{ 
					id: 'sub-5', 
					q: "Why can't I subscribe to a contract that was just deployed?",
					a: "New contracts may not be indexed immediately. Wait 1-2 minutes after deployment before creating a subscription. If you're using a fresh testnet contract, ensure you're on a supported chain."
				}
			]
		},
		{
			title: 'API & Authentication',
			faqs: [
				{ 
					id: 'api-1', 
					q: "I'm getting 401 Unauthorized on every request. Help!",
					a: "Check: 1) Your API key is in the Authorization header, not a query parameter. 2) Format is 'Bearer sk_live_xxx', not just 'sk_live_xxx'. 3) The key hasn't been revoked. 4) You're using a live key for production and test key for sandbox."
				},
				{ 
					id: 'api-2', 
					q: "Can I use the same API key for multiple environments?",
					a: "You can, but we recommend separate keys per environment. This way, if a key is compromised or you need to rotate, you don't affect all environments. Label keys clearly (e.g., 'Production', 'Staging', 'Local Dev')."
				},
				{ 
					id: 'api-3', 
					q: "I accidentally exposed my API key. What do I do?",
					a: "Revoke it immediately in the dashboard and create a new one. API keys with 'sk_live_' prefix can create/modify/delete resources. If you suspect unauthorized use, check your dashboard for unexpected subscriptions or webhooks."
				},
				{ 
					id: 'api-4', 
					q: "Is there a rate limit on the API?",
					a: "Yes. Standard limits are 100 requests/minute per API key. Subscription creation is limited to 10/minute. Replay requests are limited to 5/hour. You'll receive a 429 status code when rate limited, with a Retry-After header."
				}
			]
		},
		{
			title: 'Blockchain-Specific',
			faqs: [
				{ 
					id: 'bc-1', 
					q: "Do you support all EVM chains?",
					a: "We support major EVM chains: Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche, Base, and their testnets. We don't support non-EVM chains (Solana, Cosmos, etc.) or obscure EVM forks. Contact us for specific chain support."
				},
				{ 
					id: 'bc-2', 
					q: "What happens during a chain reorg?",
					a: "We wait for sufficient confirmations before delivering events, so reorgs typically don't affect you. If an event is delivered before we detect a reorg (rare), we'll send a new event with 'reorged: true' in the payload so you can undo the action."
				},
				{ 
					id: 'bc-3', 
					q: "The contract I want to monitor is a proxy. How do I get events?",
					a: "Use the proxy contract's address but the implementation contract's ABI. Events are emitted at the proxy address but use the implementation's event definitions. If the implementation upgrades, update your ABI."
				},
				{ 
					id: 'bc-4', 
					q: "Why am I missing events from internal transactions?",
					a: "We capture all events emitted during transaction execution, including from internal calls. If you're missing events: 1) Check the ABI includes those events. 2) Verify the event filters don't exclude them. 3) Internal calls to non-monitored contracts don't emit events you'd capture."
				},
				{ 
					id: 'bc-5', 
					q: "Can I track events from a contract that doesn't have a verified ABI?",
					a: "Yes, but you'll need to provide the ABI yourself. Decompile the bytecode using tools like Etherscan's decompiler or Heimdall. Alternatively, if you know the event signatures, create a minimal ABI with just those events."
				}
			]
		},
		{
			title: 'Replays & Debugging',
			faqs: [
				{ 
					id: 'rp-1', 
					q: "When should I use the replay feature?",
					a: "Use replays when: 1) Your webhook was down and you need to recover missed events. 2) A bug in your handler caused incorrect processing. 3) You're migrating to a new backend and need to backfill. Don't use replays as a poor man's indexer—that's not what we're for."
				},
				{ 
					id: 'rp-2', 
					q: "Can I replay events from before I created the subscription?",
					a: "No. We only capture events from when the subscription was created. Historical events before subscription creation are not available. For historical data, you need a blockchain indexer like The Graph or Dune."
				},
				{ 
					id: 'rp-3', 
					q: "How do I debug why a specific event failed to deliver?",
					a: "Go to Dashboard > Delivery Logs. Find the event by ID or timestamp. Click to see: HTTP status, response body (first 1KB), latency, retry count, and headers. Common issues: 500 errors (your server crashed), 404 (wrong endpoint path), timeout (handler too slow)."
				},
				{ 
					id: 'rp-4', 
					q: "Can I see the raw event data that was sent?",
					a: "Yes. In Delivery Logs, click on any event to see the full request payload we sent. This includes all headers and the complete JSON body. Useful for debugging payload parsing issues."
				}
			]
		},
		{
			title: 'Billing & Limits',
			faqs: [
				{ 
					id: 'bl-1', 
					q: "What counts as one event?",
					a: "Each smart contract event captured and delivered counts as one event. If you have multiple webhooks for one subscription, the event is counted once (not per webhook). Retries don't count as additional events."
				},
				{ 
					id: 'bl-2', 
					q: "What happens if I hit my monthly event limit?",
					a: "We continue capturing events but pause delivery until your next billing cycle or until you upgrade. No events are lost—they're queued. Upgrade to resume delivery immediately. We send warnings at 80% and 90% usage."
				},
				{ 
					id: 'bl-3', 
					q: "Can I get a refund for unused events?",
					a: "Plans don't roll over unused events. If you consistently use less than your limit, consider downgrading. Contact support for special circumstances."
				},
				{ 
					id: 'bl-4', 
					q: "Do test/sandbox events count against my limit?",
					a: "Testnet events (Goerli, Sepolia, Mumbai, etc.) count against your limit. They're processed the same as mainnet events. Plan accordingly if you're doing heavy testing."
				}
			]
		}
	];
</script>

<svelte:head>
	<title>Contact & Support | Contract Webhook API</title>
	<meta name="description" content="Get help with Contract Webhook API. Browse our comprehensive FAQ or contact our support team." />
</svelte:head>

<div class="contact-page">
	<!-- Header -->
	<header class="page-header">
		<nav class="nav">
			<a href="/" class="logo">Contract Webhook API</a>
			<div class="nav-links">
				<a href="/docs">Docs</a>
				<a href="/pricing">Pricing</a>
				<a href="/dashboard">Dashboard</a>
				<a href="/contact" class="active">Contact</a>
			</div>
		</nav>
	</header>

	<!-- Hero -->
	<section class="hero">
		<h1>How can we help?</h1>
		<p>Browse our FAQ or send us a message</p>
	</section>

	<!-- FAQ Section -->
	<section class="faq-section">
		<h2>Frequently Asked Questions</h2>
		<p class="faq-intro">Common questions and troubleshooting guides for developers</p>

		<div class="faq-categories">
			{#each faqCategories as category}
				<div class="faq-category">
					<h3>{category.title}</h3>
					<div class="faq-list">
						{#each category.faqs as faq}
							<div class="faq-item {expandedFaq === faq.id ? 'expanded' : ''}">
								<button class="faq-question" onclick={() => toggleFaq(faq.id)}>
									<span>{faq.q}</span>
									<span class="faq-toggle">{expandedFaq === faq.id ? '−' : '+'}</span>
								</button>
								{#if expandedFaq === faq.id}
									<div class="faq-answer">
										<p>{faq.a}</p>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Contact Form Section -->
	<section class="contact-section">
		<div class="contact-grid">
			<div class="contact-info">
				<h2>Still have questions?</h2>
				<p>Our team typically responds within 24 hours on business days.</p>
				
				<div class="contact-methods">
					<div class="contact-method">
						<span class="method-icon">📧</span>
						<div>
							<h4>Email</h4>
							<a href="mailto:support@contractwebhook.io">support@contractwebhook.io</a>
						</div>
					</div>
					<div class="contact-method">
						<span class="method-icon">💬</span>
						<div>
							<h4>Discord</h4>
							<a href="https://discord.gg/example" target="_blank" rel="noopener">Join our community</a>
						</div>
					</div>
					<div class="contact-method">
						<span class="method-icon">🐦</span>
						<div>
							<h4>Twitter/X</h4>
							<a href="https://x.com/example" target="_blank" rel="noopener">@ContractWebhook</a>
						</div>
					</div>
				</div>

				<div class="enterprise-box">
					<h4>Enterprise Support</h4>
					<p>Need dedicated support, custom SLAs, or private Slack access?</p>
					<a href="/pricing" class="enterprise-link">Learn about Enterprise →</a>
				</div>
			</div>

			<div class="contact-form-wrapper">
				<form class="contact-form">
					<div class="form-group">
						<label for="name">Name</label>
						<input type="text" id="name" bind:value={contactName} placeholder="Your name" required />
					</div>
					<div class="form-group">
						<label for="email">Email</label>
						<input type="email" id="email" bind:value={contactEmail} placeholder="you@company.com" required />
					</div>
					<div class="form-group">
						<label for="subject">Subject</label>
						<select id="subject" bind:value={contactSubject} required>
							<option value="">Select a topic</option>
							<option value="technical">Technical Issue</option>
							<option value="billing">Billing Question</option>
							<option value="enterprise">Enterprise Inquiry</option>
							<option value="feature">Feature Request</option>
							<option value="other">Other</option>
						</select>
					</div>
					<div class="form-group">
						<label for="message">Message</label>
						<textarea id="message" bind:value={contactMessage} placeholder="Describe your question or issue..." rows="5" required></textarea>
					</div>
					<button type="submit" class="submit-btn">Send Message</button>
				</form>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="footer">
		<div class="footer-container">
			<div class="footer-brand">
				<h3>Contract Webhook API</h3>
				<p>Reliable smart contract event delivery.</p>
			</div>
			<div class="footer-links">
				<div class="footer-column">
					<h4>Product</h4>
					<a href="/docs">Documentation</a>
					<a href="/pricing">Pricing</a>
					<a href="/changelog">Changelog</a>
				</div>
				<div class="footer-column">
					<h4>Company</h4>
					<a href="/about">About</a>
					<a href="/contact">Contact</a>
					<a href="/blog">Blog</a>
				</div>
				<div class="footer-column">
					<h4>Legal</h4>
					<a href="/privacy">Privacy</a>
					<a href="/terms">Terms</a>
				</div>
			</div>
		</div>
		<div class="footer-bottom">
			<p>© 2026 Contract Webhook API. All rights reserved.</p>
		</div>
	</footer>
</div>

<style>
	.contact-page {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
		color: #333;
		background: #fafafa;
	}

	/* Header */
	.page-header {
		background: #fff;
		border-bottom: 1px solid #e5e7eb;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.nav {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo {
		font-weight: 700;
		font-size: 1.25rem;
		color: #111;
		text-decoration: none;
	}

	.nav-links {
		display: flex;
		gap: 2rem;
	}

	.nav-links a {
		color: #6b7280;
		text-decoration: none;
		font-weight: 500;
	}

	.nav-links a:hover,
	.nav-links a.active {
		color: #00bcd4;
	}

	/* Hero */
	.hero {
		text-align: center;
		padding: 4rem 2rem;
		background: linear-gradient(135deg, #00897b, #00acc1);
		color: white;
	}

	.hero h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	.hero p {
		font-size: 1.2rem;
		opacity: 0.9;
	}

	/* FAQ Section */
	.faq-section {
		max-width: 1000px;
		margin: 0 auto;
		padding: 4rem 2rem;
	}

	.faq-section h2 {
		font-size: 2rem;
		font-weight: 700;
		text-align: center;
		margin-bottom: 0.5rem;
		color: #111;
	}

	.faq-intro {
		text-align: center;
		color: #6b7280;
		margin-bottom: 3rem;
	}

	.faq-categories {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}

	.faq-category h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #00838f;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #00bcd4;
	}

	.faq-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.faq-item {
		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		overflow: hidden;
		transition: box-shadow 0.2s;
	}

	.faq-item:hover {
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
	}

	.faq-item.expanded {
		border-color: #00bcd4;
	}

	.faq-question {
		width: 100%;
		padding: 1rem 1.25rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: none;
		border: none;
		text-align: left;
		font-size: 0.95rem;
		font-weight: 500;
		color: #374151;
		cursor: pointer;
		gap: 1rem;
	}

	.faq-question:hover {
		background: #f9fafb;
	}

	.faq-toggle {
		font-size: 1.25rem;
		color: #00bcd4;
		flex-shrink: 0;
	}

	.faq-answer {
		padding: 0 1.25rem 1.25rem;
		border-top: 1px solid #e5e7eb;
		background: #f9fafb;
	}

	.faq-answer p {
		margin: 1rem 0 0;
		color: #4b5563;
		line-height: 1.7;
		font-size: 0.95rem;
	}

	/* Contact Section */
	.contact-section {
		background: #fff;
		padding: 4rem 2rem;
		border-top: 1px solid #e5e7eb;
	}

	.contact-grid {
		max-width: 1000px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4rem;
	}

	.contact-info h2 {
		font-size: 1.75rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		color: #111;
	}

	.contact-info > p {
		color: #6b7280;
		margin-bottom: 2rem;
	}

	.contact-methods {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		margin-bottom: 2rem;
	}

	.contact-method {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.method-icon {
		font-size: 1.5rem;
		width: 48px;
		height: 48px;
		background: #e0f7fa;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.contact-method h4 {
		font-size: 0.9rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 0.25rem;
	}

	.contact-method a {
		color: #00838f;
		text-decoration: none;
		font-size: 0.95rem;
	}

	.contact-method a:hover {
		text-decoration: underline;
	}

	.enterprise-box {
		background: #1a1a2e;
		color: #fff;
		padding: 1.5rem;
		border-radius: 12px;
	}

	.enterprise-box h4 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
	}

	.enterprise-box p {
		margin: 0 0 1rem;
		font-size: 0.9rem;
		color: #a0aec0;
	}

	.enterprise-link {
		color: #00bcd4;
		text-decoration: none;
		font-weight: 500;
	}

	.enterprise-link:hover {
		text-decoration: underline;
	}

	/* Contact Form */
	.contact-form-wrapper {
		background: #f9fafb;
		padding: 2rem;
		border-radius: 12px;
		border: 1px solid #e5e7eb;
	}

	.contact-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group label {
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
		font-size: 0.95rem;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		padding: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		font-size: 0.95rem;
		font-family: inherit;
		background: #fff;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #00bcd4;
		box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.1);
	}

	.submit-btn {
		background: #00bcd4;
		color: #fff;
		border: none;
		padding: 1rem;
		border-radius: 6px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.submit-btn:hover {
		background: #00acc1;
	}

	/* Footer */
	.footer {
		background: #111;
		color: #9ca3af;
		padding: 4rem 2rem 2rem;
	}

	.footer-container {
		max-width: 1100px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 4rem;
	}

	.footer-brand h3 {
		color: white;
		font-size: 1.25rem;
		margin-bottom: 0.5rem;
	}

	.footer-brand p {
		font-size: 0.9rem;
	}

	.footer-links {
		display: flex;
		gap: 4rem;
	}

	.footer-column h4 {
		color: white;
		font-size: 0.9rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.footer-column a {
		display: block;
		color: #9ca3af;
		text-decoration: none;
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
	}

	.footer-column a:hover {
		color: white;
	}

	.footer-bottom {
		max-width: 1100px;
		margin: 3rem auto 0;
		padding-top: 2rem;
		border-top: 1px solid #333;
		text-align: center;
		font-size: 0.85rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.hero h1 {
			font-size: 1.75rem;
		}

		.nav-links {
			display: none;
		}

		.contact-grid {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.footer-container {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.footer-links {
			flex-wrap: wrap;
			gap: 2rem;
		}
	}
</style>
