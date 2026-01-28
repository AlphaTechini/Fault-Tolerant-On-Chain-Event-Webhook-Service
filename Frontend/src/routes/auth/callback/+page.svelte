<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get('token');

		if (token) {
			// Store token
			localStorage.setItem('token', token);
			
			// Fetch user info
			fetch('http://localhost:3000/api/auth/me', {
				headers: { Authorization: `Bearer ${token}` }
			})
				.then(res => res.json())
				.then(data => {
					if (data.user) {
						localStorage.setItem('user', JSON.stringify(data.user));
					}
					window.location.href = '/dashboard';
				})
				.catch(() => {
					window.location.href = '/dashboard';
				});
		} else {
			// No token, redirect to login
			window.location.href = '/login?error=no_token';
		}
	});
</script>

<svelte:head>
	<title>Authenticating... | Contract Webhook API</title>
</svelte:head>

<div class="callback-page">
	<div class="loader">
		<div class="spinner"></div>
		<p>Completing authentication...</p>
	</div>
</div>

<style>
	.callback-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f0 100%);
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
	}

	.loader {
		text-align: center;
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid #e0e0e0;
		border-top-color: #00bcd4;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin: 0 auto 1.5rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.loader p {
		color: #666;
		font-size: 1.1rem;
	}
</style>
