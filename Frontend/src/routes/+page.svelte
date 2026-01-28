<script lang="ts">
	// Landing page for Contract Webhook API
</script>

<div class="landing">
	<!-- Navbar -->
	<header class="navbar">
		<nav class="nav-container">
			<a href="/" class="nav-logo">Contract Webhook API</a>
			<div class="nav-links">
				<a href="/docs">Docs</a>
				<a href="/pricing">Pricing</a>
				<a href="/dashboard" class="nav-cta">Dashboard</a>
				<a href="/contact">Contact</a>
			</div>
			<button class="mobile-menu-btn" aria-label="Toggle menu">
				<span></span>
				<span></span>
				<span></span>
			</button>
		</nav>
	</header>

	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-overlay"></div>
		<div class="hero-content">
			<h1>Contract Webhook API</h1>
			<p class="tagline">
				Connect to your smart contracts and listen to events using webhooks and HTTP requests.
				No more ABI setup, no ethers.js connection logic — just simple, reliable event delivery.
			</p>
		</div>
	</section>

	<!-- Before/After Comparison -->
	<section class="comparison">
		<div class="comparison-container">
			<div class="before">
				<h3>BEFORE:</h3>
				<div class="code-block">
					<pre><code>{`import { ethers } from 'ethers';
import { abi } from './contract-abi.json';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(ADDRESS, abi, provider);

contract.on('Transfer', (from, to, value, event) => {
  // Handle missed events on reconnect?
  // What about RPC failures?
  // How do we retry failed processing?
  console.log(from, to, value);
});`}</code></pre>
				</div>
			</div>
			
			<div class="arrow">↓</div>
			
			<div class="after">
				<h3>AFTER:</h3>
				<div class="code-block">
					<pre><code>{`// Your webhook endpoint just receives:
app.post('/webhook', (req, res) => {
  const { eventName, from, to, value } = req.body;
  // That's it. Events delivered reliably.
  console.log(eventName, from, to, value);
  res.json({ received: true });
});`}</code></pre>
				</div>
			</div>
		</div>
	</section>

	<!-- Benefits Section -->
	<section class="benefits">
		<h2>BENEFITS:</h2>
		<div class="benefits-grid">
			<div class="benefit-card">
				<div class="benefit-icon">✨</div>
				<h3>Cleaner Code</h3>
				<p>Remove boilerplate RPC setup and event listeners from your codebase. Focus on business logic.</p>
			</div>
			<div class="benefit-card">
				<div class="benefit-icon">⚡</div>
				<h3>Faster Development</h3>
				<p>Skip weeks of infrastructure work. Start receiving events in minutes, not months.</p>
			</div>
			<div class="benefit-card">
				<div class="benefit-icon">😴</div>
				<h3>Sleep Better</h3>
				<p>No more 3am alerts for dropped connections. We handle the reliability so you don't have to.</p>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="cta-section">
		<a href="/docs" class="cta-btn primary">VIEW DOCS</a>
		<a href="/pricing" class="cta-btn secondary">VIEW PRICING</a>
	</section>

	<!-- Features Section -->
	<section class="features">
		<h2>FEATURES:</h2>
		<div class="features-grid">
			<div class="feature-card">
				<div class="feature-icon">🔌</div>
				<h3>Zero Infrastructure</h3>
				<p>No RPC subscriptions to manage. No WebSocket connections to maintain. Just HTTP webhooks.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">🔄</div>
				<h3>Automatic Retries</h3>
				<p>Failed deliveries are retried with exponential backoff. Never miss an event again.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">📦</div>
				<h3>Decoded Payloads</h3>
				<p>Events arrive as clean JSON with decoded arguments. No hex parsing required.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">🔗</div>
				<h3>Multi-Chain Support</h3>
				<p>Ethereum, Polygon, BSC, and more. One API for all your chains.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">📊</div>
				<h3>Delivery Logs</h3>
				<p>Full audit trail of every event and delivery attempt. Debug with confidence.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">🔒</div>
				<h3>Signed Payloads</h3>
				<p>Verify webhook authenticity with cryptographic signatures. Prevent spoofing.</p>
			</div>
		</div>
	</section>

	<!-- Who We Help Section -->
	<section class="who-we-help">
		<h2>WHO WE HELP:</h2>
		<div class="help-grid">
			<div class="help-card">
				<div class="help-icon">🚀</div>
				<h3>Web3 Startups</h3>
				<p>Launch faster by offloading event infrastructure. Focus your runway on product, not plumbing.</p>
			</div>
			<div class="help-card">
				<div class="help-icon">🌐</div>
				<h3>Web3 Protocols</h3>
				<p>Deliver real-time event notifications to your users without running your own indexers. Power your dApp with reliable on-chain data.</p>
			</div>
			<div class="help-card">
				<div class="help-icon">🔀</div>
				<h3>Web2 Apps Going Web3</h3>
				<p>Integrate blockchain events using familiar HTTP webhooks. No crypto expertise required — just standard REST APIs you already know.</p>
			</div>
		</div>
	</section>

	<!-- Built for Developers Section -->
	<section class="built-for-devs">
		<h2>Built for Developers</h2>
		<p class="dev-tagline">
			Use our simple REST API, code samples, and webhooks to start shipping in minutes. 
			Our clear documentation and reliable integrations make it easy and fast to go from test to production.
		</p>
		<a href="/docs" class="dev-cta">See API docs</a>
	</section>

	<!-- Testimonial Section -->
	<section class="testimonial">
		<div class="testimonial-container">
			<div class="quote-icon">"</div>
			<div class="testimonial-content">
				<blockquote>
					"We were losing events constantly with our homegrown listener — missed transfers, failed webhook retries, the works. After switching to this API, event delivery became a non-issue. We went from firefighting infrastructure to actually building features. It's the kind of reliability we assumed we'd have to build ourselves."
				</blockquote>
			</div>
			<div class="testimonial-author">
				<img src="/testimonial-1.png" alt="Marcus Chen" class="author-photo" />
				<div class="author-info">
					<strong>Marcus Chen</strong>
					<span>Lead Engineer, ChainPay Protocol</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Infrastructure Section -->
	<section class="infrastructure">
		<h2>How It Works</h2>
		<p class="infra-subtitle">Enterprise-grade architecture, zero operational burden</p>
		
		<div class="architecture-diagram">
			<img src="/architecture.png" alt="System Architecture" />
		</div>

		<div class="flow-steps">
			<div class="flow-step">
				<div class="step-number">1</div>
				<div class="step-content">
					<h4>Connect</h4>
					<p>Register your contract address and ABI. We handle the chain connections.</p>
				</div>
			</div>
			<div class="flow-connector">→</div>
			<div class="flow-step">
				<div class="step-number">2</div>
				<div class="step-content">
					<h4>Capture</h4>
					<p>Events are captured in real-time and persisted before delivery.</p>
				</div>
			</div>
			<div class="flow-connector">→</div>
			<div class="flow-step">
				<div class="step-number">3</div>
				<div class="step-content">
					<h4>Decode</h4>
					<p>Raw logs are decoded into clean, structured JSON payloads.</p>
				</div>
			</div>
			<div class="flow-connector">→</div>
			<div class="flow-step">
				<div class="step-number">4</div>
				<div class="step-content">
					<h4>Deliver</h4>
					<p>Webhooks are sent to your endpoint with automatic retries.</p>
				</div>
			</div>
		</div>

		<div class="infra-highlights">
			<div class="highlight">
				<span class="highlight-value">99.9%</span>
				<span class="highlight-label">Uptime SLA</span>
			</div>
			<div class="highlight">
				<span class="highlight-value">&lt;500ms</span>
				<span class="highlight-label">Avg Latency</span>
			</div>
			<div class="highlight">
				<span class="highlight-value">10+</span>
				<span class="highlight-label">Chains Supported</span>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="footer">
		<div class="footer-container">
			<div class="footer-brand">
				<h3>Contract Webhook API</h3>
				<p>Reliable smart contract event delivery for modern applications.</p>
				<div class="social-links">
					<a href="https://x.com" target="_blank" rel="noopener" aria-label="X (Twitter)">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
							<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
						</svg>
					</a>
					<a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
							<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
						</svg>
					</a>
					<a href="https://discord.com" target="_blank" rel="noopener" aria-label="Discord">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
							<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
						</svg>
					</a>
				</div>
			</div>
			
			<div class="footer-links">
				<div class="footer-column">
					<h4>Product</h4>
					<a href="/docs">Documentation</a>
					<a href="/pricing">Pricing</a>
					<a href="/changelog">Changelog</a>
					<a href="/status">Status</a>
				</div>
				<div class="footer-column">
					<h4>Company</h4>
					<a href="/about">About</a>
					<a href="/blog">Blog</a>
					<a href="/careers">Careers</a>
					<a href="/contact">Contact</a>
				</div>
				<div class="footer-column">
					<h4>Legal</h4>
					<a href="/privacy">Privacy Policy</a>
					<a href="/terms">Terms of Service</a>
					<a href="/security">Security</a>
				</div>
			</div>
		</div>
		
		<div class="footer-bottom">
			<p>&copy; 2026 Contract Webhook API. All rights reserved.</p>
		</div>
	</footer>
</div>

<style>
	.landing {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
		color: #333;
	}

	/* Navbar */
	.navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
		z-index: 1000;
	}

	.nav-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.nav-logo {
		font-weight: 700;
		font-size: 1.25rem;
		color: #111;
		text-decoration: none;
	}

	.nav-links {
		display: flex;
		gap: 2rem;
		align-items: center;
	}

	.nav-links a {
		color: #555;
		text-decoration: none;
		font-weight: 500;
		font-size: 0.95rem;
		transition: color 0.2s;
	}

	.nav-links a:hover {
		color: #00bcd4;
	}

	.nav-links .nav-cta {
		background: #00bcd4;
		color: white;
		padding: 0.5rem 1.25rem;
		border-radius: 6px;
		transition: background 0.2s, transform 0.2s;
	}

	.nav-links .nav-cta:hover {
		background: #00acc1;
		color: white;
		transform: translateY(-1px);
	}

	.mobile-menu-btn {
		display: none;
		flex-direction: column;
		gap: 5px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
	}

	.mobile-menu-btn span {
		display: block;
		width: 24px;
		height: 2px;
		background: #333;
		transition: all 0.3s;
	}

	/* Hero Section */
	.hero {
		position: relative;
		min-height: 70vh;
		padding-top: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-image: url('/hero-bg.png');
		background-size: cover;
		background-position: center;
	}

	.hero-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(0, 150, 136, 0.85), rgba(0, 188, 212, 0.85));
	}

	.hero-content {
		position: relative;
		z-index: 1;
		text-align: center;
		max-width: 800px;
		padding: 2rem;
		color: white;
	}

	.hero h1 {
		font-size: 3.5rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		text-shadow: 0 2px 10px rgba(0,0,0,0.2);
	}

	.tagline {
		font-size: 1.25rem;
		line-height: 1.8;
		opacity: 0.95;
	}

	/* Comparison Section */
	.comparison {
		background: linear-gradient(135deg, #00897b, #00acc1);
		padding: 4rem 2rem;
	}

	.comparison-container {
		max-width: 800px;
		margin: 0 auto;
		text-align: center;
	}

	.before, .after {
		margin-bottom: 1rem;
	}

	.before h3, .after h3 {
		color: white;
		font-size: 1.25rem;
		margin-bottom: 1rem;
	}

	.code-block {
		background: #1e1e1e;
		border-radius: 8px;
		padding: 1.5rem;
		text-align: left;
		overflow-x: auto;
	}

	.code-block pre {
		margin: 0;
	}

	.code-block code {
		color: #d4d4d4;
		font-family: 'Fira Code', 'Monaco', monospace;
		font-size: 0.85rem;
		line-height: 1.6;
	}

	.arrow {
		color: #ff5252;
		font-size: 2.5rem;
		margin: 1.5rem 0;
	}

	/* Benefits Section */
	.benefits {
		padding: 4rem 2rem;
		background: #f5f5f5;
		text-align: center;
	}

	.benefits h2 {
		font-size: 1.5rem;
		margin-bottom: 3rem;
		color: #333;
	}

	.benefits-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 2rem;
		max-width: 1000px;
		margin: 0 auto;
	}

	.benefit-card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		text-align: center;
		box-shadow: 0 4px 20px rgba(0,0,0,0.08);
		transition: transform 0.2s;
	}

	.benefit-card:hover {
		transform: translateY(-4px);
	}

	.benefit-icon {
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}

	.benefit-card h3 {
		font-size: 1.25rem;
		margin-bottom: 0.75rem;
		color: #333;
	}

	.benefit-card p {
		color: #666;
		line-height: 1.6;
	}

	/* CTA Section */
	.cta-section {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		padding: 4rem 2rem;
		background: #fff;
	}

	.cta-btn {
		padding: 1rem 2.5rem;
		font-size: 1rem;
		font-weight: 600;
		text-decoration: none;
		border-radius: 4px;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.cta-btn.primary {
		background: #00bcd4;
		color: white;
	}

	.cta-btn.secondary {
		background: #00bcd4;
		color: white;
	}

	.cta-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
	}

	/* Features Section */
	.features {
		padding: 4rem 2rem;
		background: #fff;
		text-align: center;
	}

	.features h2 {
		font-size: 1.5rem;
		margin-bottom: 3rem;
		color: #333;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 2rem;
		max-width: 1000px;
		margin: 0 auto;
	}

	.feature-card {
		background: linear-gradient(135deg, #b2ebf2, #80deea);
		border-radius: 12px;
		padding: 2rem;
		text-align: center;
		transition: transform 0.2s;
	}

	.feature-card:hover {
		transform: translateY(-4px);
	}

	.feature-icon {
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}

	.feature-card h3 {
		font-size: 1.25rem;
		margin-bottom: 0.75rem;
		color: #00695c;
	}

	.feature-card p {
		color: #004d40;
		line-height: 1.6;
	}

	/* Who We Help Section */
	.who-we-help {
		padding: 4rem 2rem;
		background: #f0f9ff;
		text-align: center;
	}

	.who-we-help h2 {
		font-size: 1.5rem;
		margin-bottom: 3rem;
		color: #333;
	}

	.help-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		max-width: 1000px;
		margin: 0 auto;
	}

	.help-card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		text-align: center;
		border: 2px solid #e0f2fe;
		transition: transform 0.2s, border-color 0.2s;
	}

	.help-card:hover {
		transform: translateY(-4px);
		border-color: #00bcd4;
	}

	.help-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.help-card h3 {
		font-size: 1.25rem;
		margin-bottom: 0.75rem;
		color: #0077b6;
	}

	.help-card p {
		color: #555;
		line-height: 1.6;
	}

	/* Built for Developers Section */
	.built-for-devs {
		padding: 5rem 2rem;
		background: #e8f4f8;
		text-align: center;
	}

	.built-for-devs h2 {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: #1a1a1a;
	}

	.dev-tagline {
		font-size: 1.15rem;
		line-height: 1.8;
		color: #444;
		max-width: 700px;
		margin: 0 auto 2rem;
	}

	.dev-cta {
		display: inline-block;
		padding: 1rem 2rem;
		background: #1a1a1a;
		color: white;
		text-decoration: none;
		border-radius: 6px;
		font-weight: 600;
		transition: background 0.2s, transform 0.2s;
	}

	.dev-cta:hover {
		background: #333;
		transform: translateY(-2px);
	}

	/* Testimonial Section */
	.testimonial {
		padding: 4rem 2rem;
		background: linear-gradient(135deg, #e8f4f8, #d4edda);
	}

	.testimonial-container {
		max-width: 900px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 2rem;
		align-items: start;
	}

	.quote-icon {
		font-size: 5rem;
		font-weight: 700;
		color: #5c6bc0;
		line-height: 1;
		font-family: Georgia, serif;
	}

	.testimonial-content blockquote {
		font-size: 1.25rem;
		line-height: 1.8;
		color: #333;
		font-style: normal;
		margin: 0;
	}

	.testimonial-author {
		background: #6d4c7d;
		padding: 1.5rem;
		border-radius: 12px;
		text-align: center;
		min-width: 200px;
	}

	.author-photo {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		object-fit: cover;
		margin-bottom: 1rem;
		border: 3px solid rgba(255,255,255,0.3);
	}

	.author-info {
		color: white;
	}

	.author-info strong {
		display: block;
		font-size: 1.1rem;
		margin-bottom: 0.25rem;
	}

	.author-info span {
		font-size: 0.9rem;
		opacity: 0.9;
	}

	/* Infrastructure Section */
	.infrastructure {
		padding: 5rem 2rem;
		background: #1a1a2e;
		color: white;
		text-align: center;
	}

	.infrastructure h2 {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	.infra-subtitle {
		color: #aaa;
		font-size: 1.1rem;
		margin-bottom: 3rem;
	}

	.architecture-diagram {
		max-width: 800px;
		margin: 0 auto 4rem;
	}

	.architecture-diagram img {
		width: 100%;
		border-radius: 12px;
	}

	.flow-steps {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 4rem;
	}

	.flow-step {
		background: rgba(255,255,255,0.05);
		border: 1px solid rgba(255,255,255,0.1);
		border-radius: 12px;
		padding: 1.5rem;
		min-width: 180px;
		text-align: left;
	}

	.step-number {
		width: 32px;
		height: 32px;
		background: #00bcd4;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.step-content h4 {
		font-size: 1.1rem;
		margin-bottom: 0.5rem;
		color: #00bcd4;
	}

	.step-content p {
		font-size: 0.9rem;
		color: #bbb;
		line-height: 1.5;
	}

	.flow-connector {
		color: #00bcd4;
		font-size: 1.5rem;
	}

	.infra-highlights {
		display: flex;
		justify-content: center;
		gap: 4rem;
		flex-wrap: wrap;
	}

	.highlight {
		text-align: center;
	}

	.highlight-value {
		display: block;
		font-size: 2.5rem;
		font-weight: 700;
		color: #00bcd4;
	}

	.highlight-label {
		font-size: 0.9rem;
		color: #888;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	/* Footer */
	.footer {
		background: #111;
		color: #ccc;
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
		margin-bottom: 0.75rem;
	}

	.footer-brand p {
		font-size: 0.9rem;
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}

	.social-links {
		display: flex;
		gap: 1rem;
	}

	.social-links a {
		color: #888;
		transition: color 0.2s;
	}

	.social-links a:hover {
		color: #00bcd4;
	}

	.footer-links {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
	}

	.footer-column h4 {
		color: white;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 1px;
		margin-bottom: 1rem;
	}

	.footer-column a {
		display: block;
		color: #888;
		text-decoration: none;
		font-size: 0.9rem;
		padding: 0.35rem 0;
		transition: color 0.2s;
	}

	.footer-column a:hover {
		color: #00bcd4;
	}

	.footer-bottom {
		max-width: 1100px;
		margin: 3rem auto 0;
		padding-top: 2rem;
		border-top: 1px solid #333;
		text-align: center;
	}

	.footer-bottom p {
		font-size: 0.85rem;
		color: #666;
	}

	@media (max-width: 768px) {
		.hero h1 {
			font-size: 2.5rem;
		}

		.cta-section {
			flex-direction: column;
			align-items: center;
		}

		.built-for-devs h2 {
			font-size: 2rem;
		}

		.testimonial-container {
			grid-template-columns: 1fr;
			text-align: center;
		}

		.quote-icon {
			font-size: 3rem;
		}

		.testimonial-author {
			margin: 0 auto;
		}

		.nav-links {
			display: none;
		}

		.mobile-menu-btn {
			display: flex;
		}

		.flow-steps {
			flex-direction: column;
		}

		.flow-connector {
			transform: rotate(90deg);
		}

		.infra-highlights {
			gap: 2rem;
		}

		.footer-container {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.footer-links {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
	}
</style>
