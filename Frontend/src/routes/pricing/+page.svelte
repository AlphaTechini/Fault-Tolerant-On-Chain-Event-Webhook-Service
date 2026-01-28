<script lang="ts">
	// Pricing page for Contract Webhook API
</script>

<svelte:head>
	<title>Pricing | Contract Webhook API</title>
	<meta name="description" content="Simple, transparent pricing for reliable smart contract event delivery. Start free, scale as you grow." />
</svelte:head>

<div class="pricing-page">
	<!-- Header -->
	<header class="pricing-header">
		<nav class="nav">
			<a href="/" class="logo">Contract Webhook API</a>
			<div class="nav-links">
				<a href="/docs">Docs</a>
				<a href="/pricing" class="active">Pricing</a>
				<a href="/dashboard">Dashboard</a>
				<a href="/contact">Contact</a>
			</div>
		</nav>
	</header>

	<!-- Hero -->
	<section class="hero">
		<h1>Simple, transparent pricing</h1>
		<p>Start free. Scale as you grow. No hidden fees.</p>
	</section>

	<!-- Pricing Cards -->
	<section class="pricing-cards">
		<!-- Free Tier -->
		<div class="pricing-card">
			<div class="card-header">
				<h2>Free</h2>
				<div class="price">
					<span class="amount">$0</span>
					<span class="period">/month</span>
				</div>
				<p class="card-description">Perfect for testing and hobby projects</p>
			</div>
			<div class="card-features">
				<ul>
					<li class="included">
						<span class="icon">✓</span>
						<span>1,000 events/month</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>1 subscription</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>1 webhook endpoint</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>10 events/second throughput</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>7-day event retention</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>Basic delivery logs</span>
					</li>
					<li class="restricted">
						<span class="icon">—</span>
						<span>No webhook signing</span>
					</li>
					<li class="restricted">
						<span class="icon">—</span>
						<span>No replays</span>
					</li>
					<li class="restricted">
						<span class="icon">—</span>
						<span>Community support only</span>
					</li>
				</ul>
			</div>
			<a href="/dashboard" class="card-cta secondary">Get Started Free</a>
		</div>

		<!-- Pro Tier -->
		<div class="pricing-card featured">
			<div class="featured-badge">MOST POPULAR</div>
			<div class="card-header">
				<h2>Pro</h2>
				<div class="price">
					<span class="amount">$49</span>
					<span class="period">/month</span>
				</div>
				<p class="card-description">Ideal for production dApps and growing teams</p>
			</div>
			<div class="card-features">
				<ul>
					<li class="included">
						<span class="icon">✓</span>
						<span>100,000 events/month</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>10 subscriptions</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>5 webhook endpoints</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>100 events/second throughput</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>30-day event retention</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>Full delivery logs & analytics</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>Webhook signing & verification</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>Unlimited replays</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>Email support (24hr response)</span>
					</li>
				</ul>
			</div>
			<a href="/dashboard" class="card-cta primary">Start Pro Trial</a>
		</div>

		<!-- Enterprise Tier -->
		<div class="pricing-card">
			<div class="card-header">
				<h2>Enterprise</h2>
				<div class="price">
					<span class="amount">Custom</span>
				</div>
				<p class="card-description">For high-volume protocols and custom requirements</p>
			</div>
			<div class="card-features">
				<ul>
					<li class="included">
						<span class="icon">✓</span>
						<span>Unlimited events</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>Unlimited subscriptions</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>Unlimited webhook endpoints</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>Custom throughput limits</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>90-day event retention</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>Advanced analytics & monitoring</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>IP whitelisting</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>Custom SLA (99.99% uptime)</span>
					</li>
					<li class="included">
						<span class="icon">✓</span>
						<span>Dedicated support & Slack channel</span>
					</li>
				</ul>
			</div>
			<a href="/contact" class="card-cta secondary">Contact Sales</a>
		</div>
	</section>

	<!-- Feature Comparison -->
	<section class="comparison-section">
		<h2>Compare all features</h2>
		<div class="comparison-table-wrapper">
			<table class="comparison-table">
				<thead>
					<tr>
						<th>Feature</th>
						<th>Free</th>
						<th class="highlight">Pro</th>
						<th>Enterprise</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Monthly events</td>
						<td>1,000</td>
						<td class="highlight">100,000</td>
						<td>Unlimited</td>
					</tr>
					<tr>
						<td>Subscriptions</td>
						<td>1</td>
						<td class="highlight">10</td>
						<td>Unlimited</td>
					</tr>
					<tr>
						<td>Webhook endpoints</td>
						<td>1</td>
						<td class="highlight">5</td>
						<td>Unlimited</td>
					</tr>
					<tr>
						<td>Throughput</td>
						<td>10/sec</td>
						<td class="highlight">100/sec</td>
						<td>Custom</td>
					</tr>
					<tr>
						<td>Event retention</td>
						<td>7 days</td>
						<td class="highlight">30 days</td>
						<td>90 days</td>
					</tr>
					<tr>
						<td>Webhook signing</td>
						<td><span class="no">✗</span></td>
						<td class="highlight"><span class="yes">✓</span></td>
						<td><span class="yes">✓</span></td>
					</tr>
					<tr>
						<td>Replays</td>
						<td><span class="no">✗</span></td>
						<td class="highlight"><span class="yes">✓</span></td>
						<td><span class="yes">✓</span></td>
					</tr>
					<tr>
						<td>Delivery analytics</td>
						<td>Basic</td>
						<td class="highlight">Full</td>
						<td>Advanced</td>
					</tr>
					<tr>
						<td>IP whitelisting</td>
						<td><span class="no">✗</span></td>
						<td class="highlight"><span class="no">✗</span></td>
						<td><span class="yes">✓</span></td>
					</tr>
					<tr>
						<td>SLA</td>
						<td>—</td>
						<td class="highlight">99.9%</td>
						<td>99.99%</td>
					</tr>
					<tr>
						<td>Support</td>
						<td>Community</td>
						<td class="highlight">Email (24hr)</td>
						<td>Dedicated</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- FAQ -->
	<section class="pricing-faq">
		<h2>Frequently asked questions</h2>
		<div class="faq-grid">
			<div class="faq-item">
				<h3>What counts as an event?</h3>
				<p>Each smart contract event captured and delivered to your webhook counts as one event, regardless of payload size.</p>
			</div>
			<div class="faq-item">
				<h3>What happens if I exceed my limit?</h3>
				<p>Events are queued but delivery is paused until the next billing cycle or you upgrade. No data is lost.</p>
			</div>
			<div class="faq-item">
				<h3>Can I change plans anytime?</h3>
				<p>Yes. Upgrades are immediate, downgrades take effect at the next billing cycle. No lock-in contracts.</p>
			</div>
			<div class="faq-item">
				<h3>Do you offer annual billing?</h3>
				<p>Yes. Annual plans get 2 months free. Contact sales for enterprise annual agreements.</p>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="bottom-cta">
		<h2>Ready to get started?</h2>
		<p>Start with our free tier and upgrade when you need more power.</p>
		<div class="cta-buttons">
			<a href="/dashboard" class="btn primary">Start Free</a>
			<a href="/contact" class="btn secondary">Talk to Sales</a>
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
	.pricing-page {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
		color: #333;
		background: #fafafa;
	}

	/* Header & Nav */
	.pricing-header {
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
		transition: color 0.2s;
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
		font-size: 2.75rem;
		font-weight: 700;
		margin-bottom: 0.75rem;
	}

	.hero p {
		font-size: 1.25rem;
		opacity: 0.9;
	}

	/* Pricing Cards */
	.pricing-cards {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
		max-width: 1200px;
		margin: -3rem auto 4rem;
		padding: 0 2rem;
		position: relative;
		z-index: 10;
	}

	.pricing-card {
		background: #fff;
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 4px 20px rgba(0,0,0,0.08);
		display: flex;
		flex-direction: column;
		position: relative;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.pricing-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 30px rgba(0,0,0,0.12);
	}

	.pricing-card.featured {
		border: 2px solid #00bcd4;
		transform: scale(1.05);
	}

	.pricing-card.featured:hover {
		transform: scale(1.05) translateY(-4px);
	}

	.featured-badge {
		position: absolute;
		top: -12px;
		left: 50%;
		transform: translateX(-50%);
		background: #00bcd4;
		color: white;
		padding: 0.25rem 1rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.5px;
	}

	.card-header {
		text-align: center;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
		margin-bottom: 1.5rem;
	}

	.card-header h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #111;
		margin-bottom: 0.75rem;
	}

	.price {
		margin-bottom: 0.5rem;
	}

	.price .amount {
		font-size: 3rem;
		font-weight: 700;
		color: #111;
	}

	.price .period {
		font-size: 1rem;
		color: #6b7280;
	}

	.card-description {
		color: #6b7280;
		font-size: 0.95rem;
	}

	.card-features {
		flex: 1;
		margin-bottom: 2rem;
	}

	.card-features ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.card-features li {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.5rem 0;
		font-size: 0.95rem;
	}

	.card-features .icon {
		width: 20px;
		text-align: center;
		flex-shrink: 0;
	}

	.card-features .included .icon {
		color: #10b981;
		font-weight: 600;
	}

	.card-features .included span:last-child {
		color: #374151;
	}

	.card-features .restricted .icon {
		color: #9ca3af;
	}

	.card-features .restricted span:last-child {
		color: #9ca3af;
	}

	.card-cta {
		display: block;
		text-align: center;
		padding: 1rem;
		border-radius: 8px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s;
	}

	.card-cta.primary {
		background: #00bcd4;
		color: white;
	}

	.card-cta.primary:hover {
		background: #00acc1;
	}

	.card-cta.secondary {
		background: #f3f4f6;
		color: #374151;
	}

	.card-cta.secondary:hover {
		background: #e5e7eb;
	}

	/* Comparison Section */
	.comparison-section {
		max-width: 1000px;
		margin: 0 auto 4rem;
		padding: 0 2rem;
	}

	.comparison-section h2 {
		text-align: center;
		font-size: 1.75rem;
		font-weight: 700;
		margin-bottom: 2rem;
		color: #111;
	}

	.comparison-table-wrapper {
		overflow-x: auto;
	}

	.comparison-table {
		width: 100%;
		border-collapse: collapse;
		background: #fff;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(0,0,0,0.08);
	}

	.comparison-table th,
	.comparison-table td {
		padding: 1rem 1.5rem;
		text-align: center;
		border-bottom: 1px solid #e5e7eb;
	}

	.comparison-table th {
		background: #f9fafb;
		font-weight: 600;
		color: #374151;
	}

	.comparison-table th:first-child,
	.comparison-table td:first-child {
		text-align: left;
		font-weight: 500;
	}

	.comparison-table th.highlight {
		background: #e0f7fa;
		color: #00838f;
	}

	.comparison-table td.highlight {
		background: #f0fdfa;
		font-weight: 500;
	}

	.comparison-table .yes {
		color: #10b981;
		font-weight: 600;
	}

	.comparison-table .no {
		color: #d1d5db;
	}

	/* FAQ */
	.pricing-faq {
		max-width: 900px;
		margin: 0 auto 4rem;
		padding: 0 2rem;
	}

	.pricing-faq h2 {
		text-align: center;
		font-size: 1.75rem;
		font-weight: 700;
		margin-bottom: 2rem;
		color: #111;
	}

	.faq-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.faq-item {
		background: #fff;
		padding: 1.5rem;
		border-radius: 12px;
		box-shadow: 0 2px 10px rgba(0,0,0,0.05);
	}

	.faq-item h3 {
		font-size: 1rem;
		font-weight: 600;
		color: #111;
		margin-bottom: 0.5rem;
	}

	.faq-item p {
		color: #6b7280;
		font-size: 0.95rem;
		line-height: 1.6;
		margin: 0;
	}

	/* Bottom CTA */
	.bottom-cta {
		text-align: center;
		padding: 4rem 2rem;
		background: #1a1a2e;
		color: white;
	}

	.bottom-cta h2 {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	.bottom-cta p {
		color: #9ca3af;
		margin-bottom: 2rem;
	}

	.cta-buttons {
		display: flex;
		justify-content: center;
		gap: 1rem;
	}

	.btn {
		padding: 1rem 2rem;
		border-radius: 8px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s;
	}

	.btn.primary {
		background: #00bcd4;
		color: white;
	}

	.btn.primary:hover {
		background: #00acc1;
	}

	.btn.secondary {
		background: transparent;
		border: 2px solid #6b7280;
		color: #d1d5db;
	}

	.btn.secondary:hover {
		border-color: #9ca3af;
		color: white;
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
		transition: color 0.2s;
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
	@media (max-width: 1024px) {
		.pricing-cards {
			grid-template-columns: 1fr;
			max-width: 400px;
		}

		.pricing-card.featured {
			transform: none;
			order: -1;
		}

		.pricing-card.featured:hover {
			transform: translateY(-4px);
		}
	}

	@media (max-width: 768px) {
		.hero h1 {
			font-size: 2rem;
		}

		.nav-links {
			display: none;
		}

		.faq-grid {
			grid-template-columns: 1fr;
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
