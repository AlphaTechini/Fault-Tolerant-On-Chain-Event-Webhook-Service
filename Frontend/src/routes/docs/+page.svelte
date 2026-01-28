<script lang="ts">
	let activeSection = $state('introduction');

	const sections = [
		{ id: 'introduction', label: 'Introduction', subsections: [] },
		{ id: 'quick-start', label: 'Quick Start', subsections: [] },
		{ id: 'authentication', label: 'Authentication', subsections: [
			{ id: 'api-keys', label: 'API Keys' }
		]},
		{ id: 'subscriptions', label: 'Subscriptions', subsections: [] },
		{ id: 'webhooks', label: 'Webhooks', subsections: [] },
		{ id: 'replays', label: 'Replays', subsections: [] },
		{ id: 'rate-limits', label: 'Rate Limits', subsections: [] },
		{ id: 'errors', label: 'Errors & Debugging', subsections: [] },
		{ id: 'security', label: 'Security Notes', subsections: [] },
		{ id: 'faq', label: 'FAQ', subsections: [] }
	];

	function scrollToSection(id: string) {
		activeSection = id;
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}
</script>

<svelte:head>
	<title>Documentation | Contract Webhook API</title>
	<meta name="description" content="Complete documentation for the Contract Webhook API - reliable smart contract event delivery via webhooks." />
</svelte:head>

<div class="docs-layout">
	<!-- Sidebar -->
	<aside class="sidebar">
		<div class="sidebar-header">
			<a href="/" class="logo">Contract Webhook API</a>
		</div>
		<nav class="sidebar-nav">
			{#each sections as section}
				<button 
					class="nav-item {activeSection === section.id ? 'active' : ''}"
					onclick={() => scrollToSection(section.id)}
				>
					{section.label}
				</button>
				{#if section.subsections.length > 0}
					{#each section.subsections as sub}
						<button 
							class="nav-item sub {activeSection === sub.id ? 'active' : ''}"
							onclick={() => scrollToSection(sub.id)}
						>
							{sub.label}
						</button>
					{/each}
				{/if}
			{/each}
		</nav>
	</aside>

	<!-- Main Content -->
	<main class="content">
		<!-- SECTION 1: Introduction -->
		<section id="introduction" class="doc-section">
			<div class="section-header">
				<span class="section-badge">GETTING STARTED</span>
				<h1>Introduction</h1>
			</div>

			<div class="content-block">
				<h2>What this platform does</h2>
				<p>
					Contract Webhook API is a managed infrastructure service that connects your applications to on-chain smart contract events 
					via reliable HTTP webhooks. You register a contract address and ABI, specify which events to listen for, and we deliver 
					decoded event payloads to your webhook endpoint — with persistence, retries, and guaranteed delivery.
				</p>
			</div>

			<div class="content-block">
				<h2>The problem space</h2>
				
				<h3>Why on-chain event consumption is fragile</h3>
				<p>
					Listening to blockchain events sounds simple until it isn't. RPC providers drop WebSocket connections without warning. 
					Nodes fall behind, return stale data, or rate-limit you at the worst possible moment. Your listener crashes at 3am 
					and misses a week of transfers before anyone notices.
				</p>

				<h3>Why listeners, RPCs, and retries fail in practice</h3>
				<p>
					Most teams start with <code>ethers.js</code> or <code>web3.js</code> event listeners. They work great in development. 
					Then production happens: the RPC endpoint goes down, the listener process gets OOM-killed, or the database transaction 
					fails mid-processing. Suddenly you're writing retry logic, checkpoint persistence, reconnection handlers, and dead letter 
					queues. You've built half an event-sourcing system when you just wanted to track token transfers.
				</p>

				<h3>Why this keeps showing up across teams</h3>
				<p>
					Every team building on-chain integrations eventually hits the same wall. Some build custom indexers. Some pay for expensive 
					indexing services that do far more than they need. Some accept data loss as a cost of doing business. None of these are 
					good options for teams that just need reliable event delivery without the infrastructure overhead.
				</p>
			</div>

			<div class="content-block">
				<h2>Design philosophy</h2>
				<ul class="philosophy-list">
					<li><strong>Events are persisted before delivery</strong> — We capture and store events before attempting delivery. If your endpoint is down, events queue up safely.</li>
					<li><strong>Failures are expected, not exceptional</strong> — Every delivery attempt is tracked. Retries are automatic. No silent failures.</li>
					<li><strong>Delivery is at-least-once</strong> — You may receive the same event more than once. Design your handlers to be idempotent.</li>
					<li><strong>Correctness over optimism</strong> — We wait for block confirmations before delivery. We don't guess. We verify.</li>
				</ul>
			</div>

			<div class="content-block">
				<h2>What this platform does NOT do</h2>
				<ul class="not-list">
					<li><strong>No transactions</strong> — We don't send transactions on your behalf</li>
					<li><strong>No wallets</strong> — We don't manage or store private keys</li>
					<li><strong>No signing</strong> — We don't sign anything with your credentials</li>
					<li><strong>No general-purpose indexing</strong> — We deliver events, not historical blockchain state</li>
				</ul>
				<p class="philosophy-note">After this section, no more philosophy. Just mechanics.</p>
			</div>
		</section>

		<!-- SECTION 2: Quick Start -->
		<section id="quick-start" class="doc-section">
			<div class="section-header">
				<span class="section-badge">GETTING STARTED</span>
				<h1>Quick Start</h1>
			</div>
			<p class="section-intro">The fastest possible success path. If you only read this section and nothing else, you should still succeed.</p>

			<div class="content-block">
				<h2>Step 1: Create an API key</h2>
				<div class="step-content">
					<p><strong>Where:</strong> Dashboard → API Keys → Create New Key</p>
					<p><strong>Header format:</strong></p>
					<div class="code-example">
						<div class="code-header">HTTP Header</div>
						<pre><code>Authorization: Bearer YOUR_API_KEY</code></pre>
					</div>
				</div>
			</div>

			<div class="content-block">
				<h2>Step 2: Create a subscription</h2>
				<div class="step-content">
					<div class="code-example">
						<div class="code-header">POST /api/subscriptions</div>
						<pre><code>{`{
  "chainId": 1,
  "contractAddress": "0x1234...abcd",
  "abi": [...],
  "eventFilters": ["Transfer", "Approval"]  // Optional
}`}</code></pre>
					</div>
					<ul class="param-list">
						<li><strong>chainId</strong> — The blockchain network ID (1 = Ethereum mainnet)</li>
						<li><strong>contractAddress</strong> — The smart contract to monitor</li>
						<li><strong>abi</strong> — Contract ABI (full or event-only)</li>
						<li><strong>eventFilters</strong> — Optional. Specific event names to capture</li>
					</ul>
				</div>
			</div>

			<div class="content-block">
				<h2>Step 3: Register a webhook</h2>
				<div class="step-content">
					<div class="code-example">
						<div class="code-header">POST /api/webhooks</div>
						<pre><code>{`{
  "subscriptionId": "sub_abc123",
  "url": "https://yourapp.com/webhook",
  "secret": "whsec_optional_signing_secret"  // Optional
}`}</code></pre>
					</div>
					<ul class="param-list">
						<li><strong>url</strong> — Your HTTPS endpoint that will receive events</li>
						<li><strong>secret</strong> — Optional signing secret for payload verification</li>
					</ul>
				</div>
			</div>

			<div class="content-block">
				<h2>Step 4: Receive events</h2>
				<div class="step-content">
					<p>Your webhook will receive POST requests with this payload:</p>
					<div class="code-example">
						<div class="code-header">Example Webhook Payload</div>
						<pre><code>{`{
  "id": "evt_xyz789",
  "subscriptionId": "sub_abc123",
  "chainId": 1,
  "blockNumber": 19234567,
  "transactionHash": "0xabc...def",
  "eventName": "Transfer",
  "args": {
    "from": "0x1111...1111",
    "to": "0x2222...2222",
    "value": "1000000000000000000"
  },
  "timestamp": "2026-01-28T08:30:00Z"
}`}</code></pre>
					</div>
					<p>Respond with a <code>2xx</code> status code to acknowledge receipt.</p>
				</div>
			</div>
		</section>

		<!-- SECTION 3: Authentication -->
		<section id="authentication" class="doc-section">
			<div class="section-header">
				<span class="section-badge">REFERENCE</span>
				<h1>Authentication</h1>
			</div>

			<div class="content-block" id="api-keys">
				<h2>API Keys</h2>
				
				<h3>Creating keys</h3>
				<p>Navigate to Dashboard → API Keys → Create New Key. Keys are shown once at creation. Store them securely.</p>

				<h3>Using keys</h3>
				<div class="code-example">
					<div class="code-header">HTTP Request</div>
					<pre><code>{`curl -X GET https://api.contractwebhook.io/api/subscriptions \\
  -H "Authorization: Bearer sk_live_abc123..."`}</code></pre>
				</div>

				<h3>Rotating keys</h3>
				<p>Create a new key before revoking the old one. Update your application, verify it works, then revoke the old key from the dashboard.</p>
			</div>
		</section>

		<!-- SECTION 4: Subscriptions -->
		<section id="subscriptions" class="doc-section">
			<div class="section-header">
				<span class="section-badge">REFERENCE</span>
				<h1>Subscriptions</h1>
			</div>

			<div class="content-block">
				<h2>Creating a subscription</h2>
				
				<h3>Required fields</h3>
				<table class="param-table">
					<thead>
						<tr><th>Field</th><th>Type</th><th>Description</th></tr>
					</thead>
					<tbody>
						<tr><td><code>chainId</code></td><td>number</td><td>Network ID (1=Ethereum, 137=Polygon, etc.)</td></tr>
						<tr><td><code>contractAddress</code></td><td>string</td><td>Contract address to monitor</td></tr>
						<tr><td><code>abi</code></td><td>array</td><td>Contract ABI for event decoding</td></tr>
					</tbody>
				</table>

				<h3>Optional fields</h3>
				<table class="param-table">
					<thead>
						<tr><th>Field</th><th>Type</th><th>Description</th></tr>
					</thead>
					<tbody>
						<tr><td><code>eventFilters</code></td><td>string[]</td><td>Event names to capture. Empty = all events</td></tr>
						<tr><td><code>startBlock</code></td><td>number</td><td>Block to start listening from</td></tr>
					</tbody>
				</table>
			</div>

			<div class="content-block">
				<h2>ABI handling</h2>
				
				<h3>Supported formats</h3>
				<ul>
					<li>Full contract ABI (standard Solidity compiler output)</li>
					<li>Event-only ABI (array of event definitions)</li>
					<li>Human-readable ABI (<code>"event Transfer(address,address,uint256)"</code>)</li>
				</ul>

				<h3>What happens on decode failure</h3>
				<p>If an event cannot be decoded with the provided ABI, we deliver the raw log data with <code>"decoded": false</code>. Your handler receives the event but must decode it manually.</p>
			</div>

			<div class="content-block">
				<h2>Event filtering</h2>
				
				<h3>By event name</h3>
				<div class="code-example">
					<div class="code-header">Filter specific events</div>
					<pre><code>{`{
  "eventFilters": ["Transfer", "Approval"]
}`}</code></pre>
				</div>

				<h3>Why filters matter</h3>
				<p>High-activity contracts can emit thousands of events per hour. Filtering reduces noise, lowers latency, and keeps your webhook queue focused on events you actually care about.</p>
			</div>
		</section>

		<!-- SECTION 5: Webhooks -->
		<section id="webhooks" class="doc-section">
			<div class="section-header">
				<span class="section-badge">REFERENCE</span>
				<h1>Webhooks</h1>
			</div>

			<div class="content-block">
				<h2>Delivery behavior</h2>
				
				<h3>At-least-once delivery</h3>
				<p>Every event is delivered at least once. Network issues, timeouts, or your endpoint returning errors trigger retries. Design handlers to be idempotent using the <code>id</code> field.</p>

				<h3>No strict ordering guarantees</h3>
				<p>Events are delivered in approximate order but not strictly sequential. If ordering matters, use <code>blockNumber</code> and <code>logIndex</code> to sort on your end.</p>
			</div>

			<div class="content-block">
				<h2>Payload format</h2>
				
				<h3>JSON schema</h3>
				<table class="param-table">
					<thead>
						<tr><th>Field</th><th>Type</th><th>Description</th></tr>
					</thead>
					<tbody>
						<tr><td><code>id</code></td><td>string</td><td>Unique event ID (for deduplication)</td></tr>
						<tr><td><code>subscriptionId</code></td><td>string</td><td>Your subscription reference</td></tr>
						<tr><td><code>chainId</code></td><td>number</td><td>Network the event occurred on</td></tr>
						<tr><td><code>blockNumber</code></td><td>number</td><td>Block containing the event</td></tr>
						<tr><td><code>transactionHash</code></td><td>string</td><td>Transaction that emitted the event</td></tr>
						<tr><td><code>logIndex</code></td><td>number</td><td>Position within the block's logs</td></tr>
						<tr><td><code>eventName</code></td><td>string</td><td>Decoded event name</td></tr>
						<tr><td><code>args</code></td><td>object</td><td>Decoded event arguments</td></tr>
						<tr><td><code>timestamp</code></td><td>string</td><td>ISO 8601 delivery timestamp</td></tr>
					</tbody>
				</table>

				<h3>Example payload</h3>
				<div class="code-example">
					<div class="code-header">Webhook POST Body</div>
					<pre><code>{`{
  "id": "evt_01HN4X...",
  "subscriptionId": "sub_abc123",
  "chainId": 1,
  "blockNumber": 19234567,
  "transactionHash": "0xabc123...",
  "logIndex": 42,
  "eventName": "Transfer",
  "args": {
    "from": "0x1111...1111",
    "to": "0x2222...2222", 
    "value": "1000000000000000000"
  },
  "timestamp": "2026-01-28T09:30:00.000Z"
}`}</code></pre>
				</div>
			</div>

			<div class="content-block">
				<h2>Signing & verification</h2>
				
				<h3>How to verify</h3>
				<p>If you provided a signing secret, each request includes an <code>X-Webhook-Signature</code> header:</p>
				<div class="code-example">
					<div class="code-header">Node.js Verification</div>
					<pre><code>{`const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}</code></pre>
				</div>

				<h3>Why you should</h3>
				<p>Without verification, anyone who discovers your webhook URL can send fake events. Always verify in production.</p>
			</div>

			<div class="content-block">
				<h2>Retries</h2>
				
				<h3>When retries happen</h3>
				<ul>
					<li>Your endpoint returns a non-2xx status code</li>
					<li>Connection timeout (30 seconds)</li>
					<li>Network error (DNS failure, connection refused)</li>
				</ul>

				<h3>When they stop</h3>
				<p>After 5 attempts with exponential backoff (1min, 5min, 30min, 2hr, 12hr). Failed events are marked as <code>dead</code> and visible in your dashboard for manual replay.</p>
			</div>
		</section>

		<!-- SECTION 6: Replays -->
		<section id="replays" class="doc-section">
			<div class="section-header">
				<span class="section-badge">REFERENCE</span>
				<h1>Replays</h1>
			</div>

			<div class="content-block">
				<h2>When to replay</h2>
				<ul>
					<li><strong>Webhook downtime</strong> — Your endpoint was down and events failed delivery</li>
					<li><strong>Consumer bugs</strong> — Your handler had a bug that caused incorrect processing</li>
				</ul>
			</div>

			<div class="content-block">
				<h2>How to replay</h2>
				<div class="code-example">
					<div class="code-header">POST /api/replays</div>
					<pre><code>{`{
  "subscriptionId": "sub_abc123",
  "fromTimestamp": "2026-01-27T00:00:00Z",
  "toTimestamp": "2026-01-28T00:00:00Z"
}`}</code></pre>
				</div>
				<ul class="param-list">
					<li><strong>Time range</strong> — Specify start and end timestamps for the replay window</li>
					<li><strong>Subscription scope</strong> — Replays are scoped to a single subscription</li>
				</ul>
			</div>

			<div class="content-block">
				<h2>What replays guarantee</h2>
				<ul>
					<li><strong>Same payloads</strong> — You receive the exact same event data as the original delivery</li>
					<li><strong>New delivery attempts</strong> — Each replayed event counts as a fresh delivery with its own retry policy</li>
				</ul>
			</div>
		</section>

		<!-- SECTION 7: Rate Limits -->
		<section id="rate-limits" class="doc-section">
			<div class="section-header">
				<span class="section-badge">REFERENCE</span>
				<h1>Rate Limits</h1>
			</div>

			<div class="content-block">
				<h2>API limits</h2>
				<table class="param-table">
					<thead>
						<tr><th>Endpoint</th><th>Limit</th></tr>
					</thead>
					<tbody>
						<tr><td>All API endpoints</td><td>100 requests/minute per API key</td></tr>
						<tr><td>Subscription creation</td><td>10 per minute</td></tr>
						<tr><td>Replay requests</td><td>5 per hour</td></tr>
					</tbody>
				</table>
			</div>

			<div class="content-block">
				<h2>Webhook throughput expectations</h2>
				<table class="param-table">
					<thead>
						<tr><th>Plan</th><th>Events/second</th></tr>
					</thead>
					<tbody>
						<tr><td>Free</td><td>10 events/sec</td></tr>
						<tr><td>Pro</td><td>100 events/sec</td></tr>
						<tr><td>Enterprise</td><td>Custom</td></tr>
					</tbody>
				</table>
				<p>Events exceeding your throughput limit are queued, not dropped. Delivery is delayed but guaranteed.</p>
			</div>
		</section>

		<!-- SECTION 8: Errors & Debugging -->
		<section id="errors" class="doc-section">
			<div class="section-header">
				<span class="section-badge">REFERENCE</span>
				<h1>Errors & Debugging</h1>
			</div>

			<div class="content-block">
				<h2>API errors</h2>
				
				<h3>Status codes</h3>
				<table class="param-table">
					<thead>
						<tr><th>Code</th><th>Meaning</th></tr>
					</thead>
					<tbody>
						<tr><td><code>400</code></td><td>Invalid request body or parameters</td></tr>
						<tr><td><code>401</code></td><td>Missing or invalid API key</td></tr>
						<tr><td><code>403</code></td><td>API key lacks permission for this action</td></tr>
						<tr><td><code>404</code></td><td>Resource not found</td></tr>
						<tr><td><code>429</code></td><td>Rate limit exceeded</td></tr>
						<tr><td><code>500</code></td><td>Internal server error</td></tr>
					</tbody>
				</table>

				<h3>Common causes</h3>
				<ul>
					<li><strong>400 on subscription creation</strong> — Invalid ABI format or unsupported chain ID</li>
					<li><strong>401 on all requests</strong> — API key not in <code>Authorization: Bearer</code> format</li>
					<li><strong>429 suddenly</strong> — Tight loop or retry storm. Add exponential backoff.</li>
				</ul>
			</div>

			<div class="content-block">
				<h2>Delivery failures</h2>
				
				<h3>What counts as failure</h3>
				<ul>
					<li>Non-2xx response from your endpoint</li>
					<li>Request timeout (30 seconds)</li>
					<li>Connection error (DNS, TLS, network)</li>
				</ul>

				<h3>How to inspect delivery attempts</h3>
				<p>Dashboard → Subscriptions → [Your Subscription] → Delivery Logs</p>
				<p>Each attempt shows: timestamp, HTTP status, response body (first 1KB), and retry count.</p>
			</div>
		</section>

		<!-- SECTION 9: Security Notes -->
		<section id="security" class="doc-section">
			<div class="section-header">
				<span class="section-badge">REFERENCE</span>
				<h1>Security Notes</h1>
			</div>

			<div class="content-block">
				<h2>No private keys</h2>
				<p>We never ask for, store, or have access to your private keys. This service is read-only. We listen to public blockchain events and deliver them to you.</p>
			</div>

			<div class="content-block">
				<h2>Signed webhooks</h2>
				<p>Always configure a webhook secret and verify signatures. This prevents attackers from injecting fake events into your system.</p>
			</div>

			<div class="content-block">
				<h2>Recommended practices</h2>
				<ul>
					<li>Use HTTPS endpoints only (we reject HTTP URLs)</li>
					<li>Rotate API keys periodically</li>
					<li>Use separate API keys for different environments (dev, staging, prod)</li>
					<li>Validate event data before processing (check contract address, chain ID)</li>
					<li>Implement idempotency using event IDs</li>
				</ul>
			</div>
		</section>

		<!-- SECTION 10: FAQ -->
		<section id="faq" class="doc-section">
			<div class="section-header">
				<span class="section-badge">REFERENCE</span>
				<h1>FAQ</h1>
			</div>

			<div class="content-block faq-list">
				<div class="faq-item">
					<h3>Can I receive events from multiple contracts in one subscription?</h3>
					<p>No. One subscription = one contract. Create multiple subscriptions for multiple contracts.</p>
				</div>

				<div class="faq-item">
					<h3>How fast are events delivered after they're emitted on-chain?</h3>
					<p>Typically under 500ms after block confirmation. We wait for 2-12 confirmations depending on the chain to avoid delivering events from reorged blocks.</p>
				</div>

				<div class="faq-item">
					<h3>What happens if my webhook is down for a week?</h3>
					<p>Events queue up. When your endpoint comes back, we deliver them in order with standard retry logic. Use replays for bulk re-processing if needed.</p>
				</div>

				<div class="faq-item">
					<h3>Do you support testnets?</h3>
					<p>Yes. Goerli, Sepolia, Mumbai, and other major testnets are supported. Same API, same reliability.</p>
				</div>

				<div class="faq-item">
					<h3>Can I filter by specific argument values (e.g., transfers to my address)?</h3>
					<p>Not yet. Current filtering is by event name only. Topic-based filtering is on the roadmap.</p>
				</div>

				<div class="faq-item">
					<h3>What's the maximum payload size?</h3>
					<p>Events with decoded arguments exceeding 1MB are truncated. Raw log data is always included for large events.</p>
				</div>

				<div class="faq-item">
					<h3>How do I handle duplicate events?</h3>
					<p>Use the <code>id</code> field. Store processed event IDs and skip duplicates. This is required for at-least-once delivery semantics.</p>
				</div>
			</div>
		</section>

		<!-- Footer -->
		<footer class="docs-footer">
			<p>© 2026 Contract Webhook API. All rights reserved.</p>
			<p><a href="/">Back to Home</a> · <a href="/pricing">Pricing</a> · <a href="https://github.com" target="_blank" rel="noopener">GitHub</a></p>
		</footer>
	</main>
</div>

<style>
	/* Layout */
	.docs-layout {
		display: flex;
		min-height: 100vh;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
	}

	/* Sidebar */
	.sidebar {
		width: 280px;
		background: #fff;
		border-right: 1px solid #e5e7eb;
		position: fixed;
		top: 0;
		left: 0;
		height: 100vh;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.sidebar-header {
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.logo {
		font-weight: 700;
		font-size: 1.1rem;
		color: #111;
		text-decoration: none;
	}

	.sidebar-nav {
		padding: 1rem 0;
		flex: 1;
	}

	.nav-item {
		display: block;
		width: 100%;
		padding: 0.75rem 1.5rem;
		text-align: left;
		background: none;
		border: none;
		border-left: 4px solid transparent;
		font-size: 0.95rem;
		color: #374151;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.nav-item:hover {
		background: #f3f4f6;
		color: #111;
	}

	.nav-item.active {
		border-left-color: #00bcd4;
		background: #e0f7fa;
		color: #00838f;
		font-weight: 600;
	}

	.nav-item.sub {
		padding-left: 2.5rem;
		font-size: 0.9rem;
	}

	/* Main Content */
	.content {
		flex: 1;
		margin-left: 280px;
		padding: 3rem 4rem;
		max-width: 900px;
		background: #fafafa;
	}

	/* Section Styles */
	.doc-section {
		margin-bottom: 4rem;
		padding-bottom: 3rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.doc-section:last-of-type {
		border-bottom: none;
	}

	.section-header {
		margin-bottom: 2rem;
	}

	.section-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		background: #e0f7fa;
		color: #00838f;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border-radius: 4px;
		margin-bottom: 0.75rem;
	}

	.section-header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #111;
		margin: 0;
	}

	.section-intro {
		font-size: 1.1rem;
		color: #6b7280;
		margin-bottom: 2rem;
	}

	/* Content Blocks */
	.content-block {
		margin-bottom: 2.5rem;
	}

	.content-block h2 {
		font-size: 1.35rem;
		font-weight: 600;
		color: #111;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #00bcd4;
		display: inline-block;
	}

	.content-block h3 {
		font-size: 1.1rem;
		font-weight: 600;
		color: #374151;
		margin: 1.5rem 0 0.75rem;
	}

	.content-block p {
		color: #4b5563;
		line-height: 1.7;
		margin-bottom: 1rem;
	}

	.content-block ul {
		margin: 1rem 0;
		padding-left: 1.5rem;
	}

	.content-block li {
		color: #4b5563;
		line-height: 1.7;
		margin-bottom: 0.5rem;
	}

	.content-block code {
		background: #f3f4f6;
		padding: 0.2rem 0.4rem;
		border-radius: 4px;
		font-family: 'Fira Code', monospace;
		font-size: 0.9em;
		color: #d63384;
	}

	/* Code Examples */
	.code-example {
		background: #1e293b;
		border-radius: 8px;
		overflow: hidden;
		margin: 1rem 0;
	}

	.code-header {
		background: #334155;
		color: #94a3b8;
		padding: 0.5rem 1rem;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.code-example pre {
		margin: 0;
		padding: 1rem;
		overflow-x: auto;
	}

	.code-example code {
		background: none;
		padding: 0;
		color: #e2e8f0;
		font-family: 'Fira Code', monospace;
		font-size: 0.9rem;
		line-height: 1.6;
	}

	/* Tables */
	.param-table {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0;
		font-size: 0.95rem;
	}

	.param-table th {
		text-align: left;
		padding: 0.75rem 1rem;
		background: #f3f4f6;
		border-bottom: 2px solid #e5e7eb;
		font-weight: 600;
		color: #374151;
	}

	.param-table td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e5e7eb;
		color: #4b5563;
	}

	.param-table code {
		background: #e5e7eb;
	}

	/* Lists */
	.philosophy-list li,
	.not-list li {
		margin-bottom: 1rem;
	}

	.param-list {
		list-style: none;
		padding-left: 0;
	}

	.param-list li {
		padding: 0.5rem 0;
		border-bottom: 1px dashed #e5e7eb;
	}

	.philosophy-note {
		font-style: italic;
		color: #6b7280;
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px dashed #e5e7eb;
	}

	/* FAQ */
	.faq-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.faq-item {
		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
	}

	.faq-item h3 {
		font-size: 1rem;
		font-weight: 600;
		color: #111;
		margin: 0 0 0.75rem;
	}

	.faq-item p {
		margin: 0;
		color: #4b5563;
	}

	/* Footer */
	.docs-footer {
		margin-top: 4rem;
		padding-top: 2rem;
		border-top: 1px solid #e5e7eb;
		text-align: center;
	}

	.docs-footer p {
		color: #6b7280;
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
	}

	.docs-footer a {
		color: #00838f;
		text-decoration: none;
	}

	.docs-footer a:hover {
		text-decoration: underline;
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.content {
			padding: 2rem;
		}
	}

	@media (max-width: 768px) {
		.sidebar {
			display: none;
		}

		.content {
			margin-left: 0;
			padding: 1.5rem;
		}
	}
</style>
