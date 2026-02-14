<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Dashboard state
	let activeTab = $state('overview');
	let showCreateModal = $state(false);
	let modalType = $state<'apiKey' | 'subscription' | 'webhook' | 'success' | null>(null);
	let isLoading = $state(true);

	// User state
	let user = $state<{ id: string; email: string; name: string; provider?: string } | null>(null);

	const API_URL = 'http://localhost:3000';

	// Check authentication on mount
	onMount(async () => {
		if (!browser) return;

		const token = localStorage.getItem('token');
		if (!token) {
			window.location.href = '/login';
			return;
		}

		// Try to get user from localStorage first
		const storedUser = localStorage.getItem('user');
		if (storedUser) {
			try {
				user = JSON.parse(storedUser);
			} catch (e) {
				// Invalid stored user, fetch from API
			}
		}

		// Verify token and get fresh user data
		try {
			const response = await fetch(`${API_URL}/api/auth/me`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!response.ok) {
				// Token invalid, redirect to login
				localStorage.removeItem('token');
				localStorage.removeItem('user');
				window.location.href = '/login';
				return;
			}

			const data = await response.json();
			user = data.user;
			localStorage.setItem('user', JSON.stringify(data.user));
			await loadDashboardData();
		} catch (error) {
			// If we have a stored user, continue with that
			if (user) {
				await loadDashboardData();
			} else {
				localStorage.removeItem('token');
				localStorage.removeItem('user');
				window.location.href = '/login';
				return;
			}
		}

		isLoading = false;
	});

	function logout() {
		if (browser) {
			localStorage.removeItem('token');
			localStorage.removeItem('user');
			window.location.href = '/';
		}
	}

	// Get user initials for avatar
	function getUserInitials(name: string): string {
		if (!name) return '??';
		const parts = name.trim().split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
		}
		return name.slice(0, 2).toUpperCase();
	}

	// API States
	let stats = $state({
		eventsToday: 0,
		eventsThisMonth: 0,
		activeSubscriptions: 0,
		webhookSuccessRate: 100,
		eventsLimit: 0,
		usagePercent: 0
	});

	let subscriptions = $state<any[]>([]);
	let apiKeys = $state<any[]>([]);
	let recentEvents = $state<any[]>([]);
	let deliveryLogs = $state<any[]>([]); // This would ideally need a separate endpoint or expansion of stats
	
	// Fetch Dashboard Data
	async function loadDashboardData() {
		if (!user) return;
		const token = localStorage.getItem('token');
		const headers = { Authorization: `Bearer ${token}` };

		try {
			const [statsRes, subsRes, keysRes] = await Promise.all([
				fetch(`${API_URL}/api/stats`, { headers }),
				fetch(`${API_URL}/api/subscriptions`, { headers }),
				fetch(`${API_URL}/api/api-keys`, { headers })
			]);

			if (statsRes.ok) {
				const data = await statsRes.json();
				stats = {
					eventsToday: data.stats.eventsToday,
					eventsThisMonth: data.user.eventsThisMonth,
					activeSubscriptions: data.stats.activeSubscriptions,
					webhookSuccessRate: data.stats.deliverySuccessRate,
					eventsLimit: data.user.eventsLimit,
					usagePercent: data.user.usagePercent
				};
				// Map recent events
				recentEvents = data.recentEvents.map((e: any) => ({
					id: e._id,
					event: e.eventName,
					subscription: e.subscriptionId, // We might need to map ID to Name 
					status: e.status.toLowerCase(),
					time: new Date(e.createdAt).toLocaleTimeString()
				}));
			}

			if (subsRes.ok) {
				subscriptions = await subsRes.json();
			}

			if (keysRes.ok) {
				apiKeys = await keysRes.json();
			}

		} catch (error) {
			console.error("Failed to load dashboard data", error);
		}
	}

	function openModal(type: 'apiKey' | 'subscription' | 'webhook' | 'success') {
		modalType = type;
		showCreateModal = true;
	}

	function closeModal() {
		showCreateModal = false;
		modalType = null;
	}

	// Form states
	let newApiKeyName = $state('');
	
	// Subscription Form
	let newSubChain = $state('1');
	let newSubContract = $state('');
	let newSubAbi = $state('');
	let newSubWebhook = $state('');
	let newSubFilters = $state(''); // Comma separated
	
	// Success Modal State
	let createdSecret = $state<string | null>(null);
	let createdItemName = $state('');

	async function createApiKey() {
		const token = localStorage.getItem('token');
		try {
			const res = await fetch(`${API_URL}/api/api-keys`, {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ name: newApiKeyName })
			});
			
			if (res.ok) {
				const data = await res.json();
				// Show secret
				createdSecret = `Key: ${data.key}`; // Key is only returned once
				createdItemName = 'API Key Created';
				// Refresh list
				loadDashboardData();
				closeModal();
				showCreateModal = true; // Reopen for success message
				modalType = 'success';
			}
		} catch (err) {
			console.error(err);
		}
	}

	async function createSubscription() {
		const token = localStorage.getItem('token');
		try {
			// Parse ABI
			let abi = [];
			try {
				abi = JSON.parse(newSubAbi);
			} catch (e) {
				alert('Invalid ABI JSON');
				return;
			}

			const payload = {
				chainId: parseInt(newSubChain),
				contractAddress: newSubContract,
				abi,
				webhookUrl: newSubWebhook,
				eventFilters: newSubFilters ? newSubFilters.split(',').map(s => s.trim()) : [],
				enableSignature: true
			};

			const res = await fetch(`${API_URL}/api/subscriptions`, {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(payload)
			});

			if (res.ok) {
				const data = await res.json();
				if (data.webhookSecret) {
					createdSecret = data.webhookSecret;
					createdItemName = 'Subscription Created';
					modalType = 'success';
				} else {
					closeModal();
				}
				loadDashboardData();
			} else {
				const err = await res.json();
				alert(`Error: ${err.message || 'Failed to create subscription'}`);
			}
		} catch (err) {
			console.error(err);
		}
	}
</script>

<svelte:head>
	<title>Dashboard | Contract Webhook API</title>
	<meta name="description" content="Manage your smart contract event subscriptions, webhooks, and API keys." />
</svelte:head>

<div class="dashboard">
	<!-- Sidebar -->
	<aside class="sidebar">
		<div class="sidebar-header">
			<a href="/" class="logo">Contract Webhook API</a>
		</div>
		<nav class="sidebar-nav">
			<button class="nav-item {activeTab === 'overview' ? 'active' : ''}" onclick={() => activeTab = 'overview'}>
				<span class="nav-icon">📊</span>
				Overview
			</button>
			<button class="nav-item {activeTab === 'subscriptions' ? 'active' : ''}" onclick={() => activeTab = 'subscriptions'}>
				<span class="nav-icon">📡</span>
				Subscriptions
			</button>
			<button class="nav-item {activeTab === 'apiKeys' ? 'active' : ''}" onclick={() => activeTab = 'apiKeys'}>
				<span class="nav-icon">🔑</span>
				API Keys
			</button>
			<button class="nav-item {activeTab === 'logs' ? 'active' : ''}" onclick={() => activeTab = 'logs'}>
				<span class="nav-icon">📋</span>
				Delivery Logs
			</button>
			<div class="nav-divider"></div>
			<button class="nav-item {activeTab === 'settings' ? 'active' : ''}" onclick={() => activeTab = 'settings'}>
				<span class="nav-icon">⚙️</span>
				Settings
			</button>
		</nav>
		<div class="sidebar-footer">
			<div class="plan-badge">
				<span class="plan-name">Pro Plan</span>
				<span class="plan-usage">89,234 / 100,000 events</span>
			</div>
			<a href="/pricing" class="upgrade-link">Upgrade Plan</a>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="main-content">
		<!-- Top Bar -->
		<header class="top-bar">
			<div class="page-title">
				{#if activeTab === 'overview'}
					<h1>Overview</h1>
				{:else if activeTab === 'subscriptions'}
					<h1>Subscriptions</h1>
				{:else if activeTab === 'webhooks'}
					<h1>Webhooks</h1>
				{:else if activeTab === 'apiKeys'}
					<h1>API Keys</h1>
				{:else if activeTab === 'logs'}
					<h1>Delivery Logs</h1>
				{:else if activeTab === 'settings'}
					<h1>Settings</h1>
				{/if}
			</div>
			<div class="top-bar-actions">
				<a href="/docs" class="top-link">Docs</a>
				<div class="user-menu">
					<span class="user-avatar">{user ? getUserInitials(user.name) : '??'}</span>
					<span class="user-name">{user?.name || 'Loading...'}</span>
					<button class="logout-btn" onclick={logout} title="Sign out">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
							<polyline points="16,17 21,12 16,7"/>
							<line x1="21" y1="12" x2="9" y2="12"/>
						</svg>
					</button>
				</div>
			</div>
		</header>

		<!-- Content Area -->
		<div class="content-area">
			<!-- Overview Tab -->
			{#if activeTab === 'overview'}
				<div class="stats-grid">
					<div class="stat-card">
						<div class="stat-icon">📈</div>
						<div class="stat-content">
							<span class="stat-value">{stats.eventsToday.toLocaleString()}</span>
							<span class="stat-label">Events Today</span>
						</div>
					</div>
					<div class="stat-card">
						<div class="stat-icon">📊</div>
						<div class="stat-content">
							<span class="stat-value">{stats.eventsThisMonth.toLocaleString()}</span>
							<span class="stat-label">Events This Month</span>
						</div>
					</div>
					<div class="stat-card">
						<div class="stat-icon">📡</div>
						<div class="stat-content">
							<span class="stat-value">{stats.activeSubscriptions}</span>
							<span class="stat-label">Active Subscriptions</span>
						</div>
					</div>
					<div class="stat-card">
						<div class="stat-icon">✅</div>
						<div class="stat-content">
							<span class="stat-value">{stats.webhookSuccessRate}%</span>
							<span class="stat-label">Delivery Success Rate</span>
						</div>
					</div>
				</div>

				<div class="dashboard-grid">
					<div class="dashboard-card">
						<div class="card-header">
							<h2>Recent Events</h2>
							<button class="link-btn" onclick={() => activeTab = 'logs'}>View All</button>
						</div>
						<div class="event-list">
							{#each recentEvents as event}
								<div class="event-item">
									<div class="event-info">
										<span class="event-name">{event.event}</span>
										<span class="event-sub">{event.subscription}</span>
									</div>
									<div class="event-meta">
										<span class="event-status {event.status}">{event.status}</span>
										<span class="event-time">{event.time}</span>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<div class="dashboard-card">
						<div class="card-header">
							<h2>Active Subscriptions</h2>
							<button class="link-btn" onclick={() => activeTab = 'subscriptions'}>View All</button>
						</div>
						<div class="subscription-list">
							{#each subscriptions.filter(s => s.status === 'active') as sub}
								<div class="subscription-item">
									<div class="sub-info">
										<span class="sub-name">{sub.name}</span>
										<span class="sub-chain">{sub.chain}</span>
									</div>
									<div class="sub-stats">
										<span class="sub-events">{sub.eventsToday.toLocaleString()} today</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>

				<div class="quick-actions">
					<h2>Quick Actions</h2>
					<div class="actions-grid">
						<button class="action-card" onclick={() => openModal('subscription')}>
							<span class="action-icon">➕</span>
							<span class="action-label">New Subscription</span>
						</button>
						<button class="action-card" onclick={() => openModal('apiKey')}>
							<span class="action-icon">🔑</span>
							<span class="action-label">Create API Key</span>
						</button>
						<a href="/docs" class="action-card">
							<span class="action-icon">📖</span>
							<span class="action-label">View Docs</span>
						</a>
					</div>
				</div>
			{/if}

			<!-- Subscriptions Tab -->
			{#if activeTab === 'subscriptions'}
				<div class="tab-header">
					<p class="tab-description">Manage your smart contract event subscriptions</p>
					<button class="primary-btn" onclick={() => openModal('subscription')}>+ New Subscription</button>
				</div>

					<table class="data-table">
						<thead>
							<tr>
								<th>Chain</th>
								<th>Contract</th>
								<th>Webhook</th>
								<th>Events</th>
								<th>Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each subscriptions as sub}
								<tr>
									<td>
										<span class="chain-badge">Chain {sub.chainId}</span>
									</td>
									<td><code>{sub.contractAddress.slice(0, 10)}...</code></td>
									<td><code class="url-code">{sub.webhookUrl}</code></td>
									<td>
										{#if sub.eventFilters && sub.eventFilters.length > 0}
											{#each sub.eventFilters as event}
												<span class="event-badge">{event}</span>
											{/each}
										{:else}
											<span class="event-badge">All Events</span>
										{/if}
									</td>
									<td>
										<span class="status-badge {sub.status}">{sub.status}</span>
									</td>
									<td>
										<div class="action-btns">
											<button class="icon-btn" title="Replay">🔄</button>
											<button class="icon-btn danger" title="Delete">🗑️</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
			{/if}



			<!-- API Keys Tab -->
			{#if activeTab === 'apiKeys'}
				<div class="tab-header">
					<p class="tab-description">Manage your API keys for authentication</p>
					<button class="primary-btn" onclick={() => openModal('apiKey')}>+ Create Key</button>
				</div>

				<div class="info-box">
					<span class="info-icon">ℹ️</span>
					<p>API keys are shown only once at creation. Store them securely.</p>
				</div>

				<div class="table-container">
					<table class="data-table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Key</th>
								<th>Created</th>
								<th>Last Used</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each apiKeys as key}
								<tr>
									<td><strong>{key.name}</strong></td>
									<td><code>{key.prefix}</code></td>
									<td>{key.created}</td>
									<td>{key.lastUsed}</td>
									<td>
										<div class="action-btns">
											<button class="icon-btn danger" title="Revoke">🗑️</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}

			<!-- Delivery Logs Tab -->
			{#if activeTab === 'logs'}
				<div class="tab-header">
					<p class="tab-description">View webhook delivery attempts and debug issues</p>
					<div class="tab-filters">
						<select class="filter-select">
							<option value="all">All Statuses</option>
							<option value="success">Success (2xx)</option>
							<option value="error">Errors (4xx/5xx)</option>
						</select>
						<select class="filter-select">
							<option value="all">All Subscriptions</option>
							{#each subscriptions as sub}
								<option value={sub.id}>{sub.name}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="table-container">
					<table class="data-table">
						<thead>
							<tr>
								<th>Event ID</th>
								<th>Webhook</th>
								<th>Status</th>
								<th>Latency</th>
								<th>Time</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each deliveryLogs as log}
								<tr>
									<td><code>{log.eventId}</code></td>
									<td><code class="url-code">{log.webhook}</code></td>
									<td>
										<span class="http-status {log.status >= 200 && log.status < 300 ? 'success' : 'error'}">
											{log.status}
										</span>
									</td>
									<td>{log.latency}</td>
									<td>{log.time}</td>
									<td>
										<div class="action-btns">
											<button class="icon-btn" title="View Details">👁️</button>
											<button class="icon-btn" title="Retry">🔄</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}

			<!-- Settings Tab -->
			{#if activeTab === 'settings'}
				<div class="settings-section">
					<h2>Account Settings</h2>
					<div class="settings-card">
						<div class="setting-row">
							<div class="setting-info">
								<h3>Name</h3>
								<p>{user?.name || 'Loading...'}</p>
							</div>
							<button class="secondary-btn">Change</button>
						</div>
						<div class="setting-row">
							<div class="setting-info">
								<h3>Email Address</h3>
								<p>{user?.email || 'Loading...'}</p>
							</div>
							<button class="secondary-btn">Change</button>
						</div>
						<div class="setting-row">
							<div class="setting-info">
								<h3>Authentication</h3>
								<p>{user?.provider === 'email' ? 'Email & Password' : user?.provider === 'google' ? 'Google' : user?.provider === 'github' ? 'GitHub' : 'Loading...'}</p>
							</div>
							{#if user?.provider === 'email'}
								<button class="secondary-btn">Update Password</button>
							{/if}
						</div>
					</div>
				</div>

				<div class="settings-section">
					<h2>Notifications</h2>
					<div class="settings-card">
						<div class="setting-row">
							<div class="setting-info">
								<h3>Email Alerts</h3>
								<p>Receive alerts for failed deliveries</p>
							</div>
							<label class="toggle">
								<input type="checkbox" checked />
								<span class="toggle-slider"></span>
							</label>
						</div>
						<div class="setting-row">
							<div class="setting-info">
								<h3>Usage Alerts</h3>
								<p>Alert when approaching plan limits</p>
							</div>
							<label class="toggle">
								<input type="checkbox" checked />
								<span class="toggle-slider"></span>
							</label>
						</div>
					</div>
				</div>

				<div class="settings-section">
					<h2>Billing</h2>
					<div class="settings-card">
						<div class="setting-row">
							<div class="setting-info">
								<h3>Current Plan</h3>
								<p>Pro - $49/month</p>
							</div>
							<a href="/pricing" class="secondary-btn">Manage Plan</a>
						</div>
						<div class="setting-row">
							<div class="setting-info">
								<h3>Payment Method</h3>
								<p>Visa ending in 4242</p>
							</div>
							<button class="secondary-btn">Update</button>
						</div>
					</div>
				</div>

				<div class="settings-section danger-zone">
					<h2>Danger Zone</h2>
					<div class="settings-card">
						<div class="setting-row">
							<div class="setting-info">
								<h3>Delete Account</h3>
								<p>Permanently delete your account and all data</p>
							</div>
							<button class="danger-btn">Delete Account</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</main>

	<!-- Modal -->
	{#if showCreateModal}
		<div class="modal-overlay" onclick={closeModal}>
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					{#if modalType === 'apiKey'}
						<h2>Create API Key</h2>
					{:else if modalType === 'subscription'}
						<h2>New Subscription</h2>
					{:else if modalType === 'webhook'}
						<h2>Add Webhook</h2>
					{/if}
					<button class="modal-close" onclick={closeModal}>×</button>
				</div>
				<div class="modal-body">
					{#if modalType === 'apiKey'}
						<div class="form-group">
							<label for="keyName">Key Name</label>
							<input type="text" id="keyName" placeholder="e.g., Production Key" bind:value={newApiKeyName} />
						</div>
					{:else if modalType === 'subscription'}
						<div class="form-group">
							<label for="chain">Chain</label>
							<select id="chain" bind:value={newSubChain}>
								<option value="1">Ethereum Mainnet</option>
								<option value="11155111">Sepolia (Testnet)</option>
								<option value="137">Polygon</option>
								<option value="56">BSC</option>
								<option value="42161">Arbitrum</option>
								<option value="10">Optimism</option>
							</select>
						</div>
						<div class="form-group">
							<label for="contract">Contract Address</label>
							<input type="text" id="contract" placeholder="0x..." bind:value={newSubContract} />
						</div>
						<div class="form-group">
							<label for="webhook">Webhook URL</label>
							<input type="url" id="webhook" placeholder="https://yourapp.com/events" bind:value={newSubWebhook} />
						</div>
						<div class="form-group">
							<label for="abi">Contract ABI (JSON)</label>
							<textarea id="abi" placeholder='[&#123;"type":"event","name":"Transfer"...&#125;]' rows="5" bind:value={newSubAbi}></textarea>
						</div>
						<div class="form-group">
							<label for="filters">Event Filters (Optional)</label>
							<input type="text" id="filters" placeholder="Transfer, Approval (comma separated)" bind:value={newSubFilters} />
							<span class="form-hint">Leave empty to listen to all events in ABI</span>
						</div>
					{:else if modalType === 'success'}
						<div class="success-message">
							<div class="success-icon">✅</div>
							<h3>{createdItemName}</h3>
							<p>Here is your secret/key. <strong>It will not be shown again.</strong></p>
							<div class="secret-box">
								<code>{createdSecret}</code>
								<button class="copy-btn" onclick={() => navigator.clipboard.writeText(createdSecret || '')}>Copy</button>
							</div>
						</div>
					{/if}
				</div>
				<div class="modal-footer">
					{#if modalType === 'success'}
						<button class="primary-btn" onclick={closeModal}>Close</button>
					{:else}
						<button class="secondary-btn" onclick={closeModal}>Cancel</button>
						<button class="primary-btn" onclick={modalType === 'apiKey' ? createApiKey : createSubscription}>
							{modalType === 'apiKey' ? 'Create Key' : 'Create Subscription'}
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Layout */
	.dashboard {
		display: flex;
		min-height: 100vh;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
		background: #f5f7fa;
	}

	/* Sidebar */
	.sidebar {
		width: 260px;
		background: #1a1a2e;
		color: #fff;
		display: flex;
		flex-direction: column;
		position: fixed;
		top: 0;
		left: 0;
		height: 100vh;
	}

	.sidebar-header {
		padding: 1.5rem;
		border-bottom: 1px solid rgba(255,255,255,0.1);
	}

	.logo {
		color: #fff;
		text-decoration: none;
		font-weight: 700;
		font-size: 1.1rem;
	}

	.sidebar-nav {
		flex: 1;
		padding: 1rem 0;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.85rem 1.5rem;
		background: none;
		border: none;
		color: #a0aec0;
		font-size: 0.95rem;
		text-align: left;
		cursor: pointer;
		transition: all 0.15s;
	}

	.nav-item:hover {
		background: rgba(255,255,255,0.05);
		color: #fff;
	}

	.nav-item.active {
		background: rgba(0, 188, 212, 0.15);
		color: #00bcd4;
		border-left: 3px solid #00bcd4;
	}

	.nav-icon {
		font-size: 1.1rem;
	}

	.nav-divider {
		height: 1px;
		background: rgba(255,255,255,0.1);
		margin: 1rem 0;
	}

	.sidebar-footer {
		padding: 1.5rem;
		border-top: 1px solid rgba(255,255,255,0.1);
	}

	.plan-badge {
		background: rgba(255,255,255,0.1);
		border-radius: 8px;
		padding: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.plan-name {
		display: block;
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.plan-usage {
		font-size: 0.85rem;
		color: #a0aec0;
	}

	.upgrade-link {
		display: block;
		text-align: center;
		color: #00bcd4;
		text-decoration: none;
		font-size: 0.9rem;
	}

	.upgrade-link:hover {
		text-decoration: underline;
	}

	/* Main Content */
	.main-content {
		flex: 1;
		margin-left: 260px;
		display: flex;
		flex-direction: column;
	}

	/* Top Bar */
	.top-bar {
		background: #fff;
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid #e2e8f0;
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.page-title h1 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1a1a2e;
		margin: 0;
	}

	.top-bar-actions {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.top-link {
		color: #6b7280;
		text-decoration: none;
		font-size: 0.95rem;
	}

	.top-link:hover {
		color: #00bcd4;
	}

	.user-menu {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-avatar {
		width: 36px;
		height: 36px;
		background: linear-gradient(135deg, #00897b, #00acc1);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		font-weight: 600;
		font-size: 0.85rem;
	}

	.user-name {
		font-weight: 500;
		color: #374151;
	}

	.logout-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: none;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s;
	}

	.logout-btn:hover {
		background: #fef2f2;
		border-color: #fecaca;
		color: #dc2626;
	}

	/* Content Area */
	.content-area {
		padding: 2rem;
		flex: 1;
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: #fff;
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		box-shadow: 0 1px 3px rgba(0,0,0,0.08);
	}

	.stat-icon {
		font-size: 2rem;
	}

	.stat-content {
		display: flex;
		flex-direction: column;
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 700;
		color: #1a1a2e;
	}

	.stat-label {
		font-size: 0.9rem;
		color: #6b7280;
	}

	/* Dashboard Grid */
	.dashboard-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.dashboard-card {
		background: #fff;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0,0,0,0.08);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.card-header h2 {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1a1a2e;
		margin: 0;
	}

	.link-btn {
		background: none;
		border: none;
		color: #00bcd4;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.link-btn:hover {
		text-decoration: underline;
	}

	/* Event List */
	.event-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.event-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: #f9fafb;
		border-radius: 8px;
	}

	.event-info {
		display: flex;
		flex-direction: column;
	}

	.event-name {
		font-weight: 500;
		color: #374151;
	}

	.event-sub {
		font-size: 0.85rem;
		color: #6b7280;
	}

	.event-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.event-status {
		font-size: 0.8rem;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		font-weight: 500;
	}

	.event-status.delivered {
		background: #d1fae5;
		color: #047857;
	}

	.event-status.retrying {
		background: #fef3c7;
		color: #b45309;
	}

	.event-time {
		font-size: 0.8rem;
		color: #9ca3af;
		margin-top: 0.25rem;
	}

	/* Subscription List */
	.subscription-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.subscription-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: #f9fafb;
		border-radius: 8px;
	}

	.sub-info {
		display: flex;
		flex-direction: column;
	}

	.sub-name {
		font-weight: 500;
		color: #374151;
	}

	.sub-chain {
		font-size: 0.85rem;
		color: #6b7280;
	}

	.sub-events {
		font-size: 0.9rem;
		color: #00bcd4;
		font-weight: 500;
	}

	/* Quick Actions */
	.quick-actions h2 {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1a1a2e;
		margin-bottom: 1rem;
	}

	.actions-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
	}

	.action-card {
		background: #fff;
		border: 2px dashed #e2e8f0;
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
	}

	.action-card:hover {
		border-color: #00bcd4;
		background: #f0fdfa;
	}

	.action-icon {
		font-size: 1.75rem;
	}

	.action-label {
		font-size: 0.95rem;
		font-weight: 500;
		color: #374151;
	}

	/* Tab Header */
	.tab-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.tab-description {
		color: #6b7280;
		margin: 0;
	}

	.tab-filters {
		display: flex;
		gap: 1rem;
	}

	.filter-select {
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		font-size: 0.9rem;
		background: #fff;
	}

	/* Buttons */
	.primary-btn {
		background: #00bcd4;
		color: #fff;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.primary-btn:hover {
		background: #00acc1;
	}

	.secondary-btn {
		background: #f3f4f6;
		color: #374151;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		text-decoration: none;
		display: inline-block;
	}

	.secondary-btn:hover {
		background: #e5e7eb;
	}

	.danger-btn {
		background: #fee2e2;
		color: #dc2626;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
	}

	.danger-btn:hover {
		background: #fecaca;
	}

	/* Table */
	.table-container {
		background: #fff;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0,0,0,0.08);
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
	}

	.data-table th {
		text-align: left;
		padding: 1rem;
		background: #f9fafb;
		font-weight: 600;
		color: #374151;
		font-size: 0.9rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.data-table td {
		padding: 1rem;
		border-bottom: 1px solid #f3f4f6;
		color: #4b5563;
		font-size: 0.95rem;
	}

	.data-table code {
		background: #f3f4f6;
		padding: 0.2rem 0.4rem;
		border-radius: 4px;
		font-family: 'Fira Code', monospace;
		font-size: 0.85rem;
	}

	.url-code {
		max-width: 300px;
		display: inline-block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chain-badge {
		background: #e0f2fe;
		color: #0369a1;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.event-badge {
		background: #f3e8ff;
		color: #7c3aed;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		font-size: 0.8rem;
		margin-right: 0.25rem;
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.status-badge.active {
		background: #d1fae5;
		color: #047857;
	}

	.status-badge.paused {
		background: #fef3c7;
		color: #b45309;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.status-indicator.healthy .status-dot {
		background: #10b981;
	}

	.http-status {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-family: monospace;
		font-weight: 600;
	}

	.http-status.success {
		background: #d1fae5;
		color: #047857;
	}

	.http-status.error {
		background: #fee2e2;
		color: #dc2626;
	}

	.action-btns {
		display: flex;
		gap: 0.5rem;
	}

	.icon-btn {
		background: #f3f4f6;
		border: none;
		padding: 0.5rem;
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.icon-btn:hover {
		background: #e5e7eb;
	}

	.icon-btn.danger:hover {
		background: #fee2e2;
	}

	/* Info Box */
	.info-box {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: #e0f2fe;
		padding: 1rem 1.5rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.info-icon {
		font-size: 1.25rem;
	}

	.info-box p {
		margin: 0;
		color: #0369a1;
		font-size: 0.95rem;
	}

	/* Settings */
	.settings-section {
		margin-bottom: 2rem;
	}

	.settings-section h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a1a2e;
		margin-bottom: 1rem;
	}

	.settings-card {
		background: #fff;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0,0,0,0.08);
	}

	.setting-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid #f3f4f6;
	}

	.setting-row:last-child {
		border-bottom: none;
	}

	.setting-info h3 {
		font-size: 1rem;
		font-weight: 500;
		color: #374151;
		margin: 0 0 0.25rem;
	}

	.setting-info p {
		font-size: 0.9rem;
		color: #6b7280;
		margin: 0;
	}

	/* Toggle */
	.toggle {
		position: relative;
		display: inline-block;
		width: 50px;
		height: 28px;
	}

	.toggle input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: #e2e8f0;
		transition: 0.3s;
		border-radius: 28px;
	}

	.toggle-slider:before {
		position: absolute;
		content: "";
		height: 22px;
		width: 22px;
		left: 3px;
		bottom: 3px;
		background: #fff;
		transition: 0.3s;
		border-radius: 50%;
	}

	.toggle input:checked + .toggle-slider {
		background: #00bcd4;
	}

	.toggle input:checked + .toggle-slider:before {
		transform: translateX(22px);
	}

	.danger-zone h2 {
		color: #dc2626;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0,0,0,0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: #fff;
		border-radius: 12px;
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: #9ca3af;
		cursor: pointer;
	}

	.modal-close:hover {
		color: #374151;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.modal-footer {
		padding: 1.5rem;
		border-top: 1px solid #e2e8f0;
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
	}

	/* Form */
	.form-group {
		margin-bottom: 1.25rem;
	}

	.form-group label {
		display: block;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
		font-size: 0.95rem;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		font-size: 0.95rem;
		font-family: inherit;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #00bcd4;
		box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.1);
	}

	.form-hint {
		display: block;
		font-size: 0.85rem;
		color: #6b7280;
		margin-top: 0.5rem;
	}

	/* Success Modal */
	.success-message {
		text-align: center;
		padding: 1rem 0;
	}

	.success-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.success-message h3 {
		font-size: 1.5rem;
		color: #111;
		margin: 0 0 0.5rem;
	}

	.success-message p {
		color: #6b7280;
		margin: 0 0 1.5rem;
	}

	.secret-box {
		background: #f3f4f6;
		padding: 1rem;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		border: 1px dashed #cbd5e1;
	}

	.secret-box code {
		font-family: 'Fira Code', monospace;
		color: #0d9488;
		font-weight: 600;
		word-break: break-all;
		text-align: left;
	}

	.copy-btn {
		background: #fff;
		border: 1px solid #e2e8f0;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.85rem;
		transition: all 0.2s;
	}

	.copy-btn:hover {
		background: #f8fafc;
		border-color: #cbd5e1;
	}

	/* Responsive */
	@media (max-width: 1200px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.actions-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 768px) {
		.sidebar {
			display: none;
		}

		.main-content {
			margin-left: 0;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.dashboard-grid {
			grid-template-columns: 1fr;
		}

		.actions-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
