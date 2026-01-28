<script lang="ts">
	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let error = $state('');

	const API_URL = 'http://localhost:3000';

	// Check for OAuth errors from URL
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const errorParam = urlParams.get('error');
		if (errorParam === 'email_exists') {
			const provider = urlParams.get('provider');
			error = `This email is already registered with ${provider}. Please sign in using that method.`;
		} else if (errorParam === 'oauth_failed') {
			error = 'OAuth authentication failed. Please try again.';
		} else if (errorParam === 'no_email') {
			error = 'Could not retrieve email from your account. Please try a different method.';
		}
	});

	async function handleEmailSignin(e: Event) {
		e.preventDefault();
		isLoading = true;
		error = '';

		try {
			const response = await fetch(`${API_URL}/api/auth/signin`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || data.error || 'Sign in failed');
			}

			// Store token and redirect
			localStorage.setItem('token', data.token);
			localStorage.setItem('user', JSON.stringify(data.user));
			window.location.href = '/dashboard';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong';
		} finally {
			isLoading = false;
		}
	}

	function handleGoogleSignin() {
		window.location.href = `${API_URL}/api/auth/google`;
	}

	function handleGithubSignin() {
		window.location.href = `${API_URL}/api/auth/github`;
	}
</script>

<svelte:head>
	<title>Sign In | Contract Webhook API</title>
	<meta name="description" content="Sign in to your Contract Webhook API account." />
</svelte:head>

<div class="auth-page">
	<div class="auth-container">
		<div class="auth-header">
			<a href="/" class="logo">Contract Webhook API</a>
			<h1>Welcome back</h1>
			<p>Sign in to continue to your dashboard</p>
		</div>

		<div class="oauth-buttons">
			<button type="button" class="oauth-btn google" onclick={handleGoogleSignin}>
				<svg viewBox="0 0 24 24" width="20" height="20">
					<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
					<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
					<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
					<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
				</svg>
				<span>Continue with Google</span>
			</button>

			<button type="button" class="oauth-btn github" onclick={handleGithubSignin}>
				<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
					<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
				</svg>
				<span>Continue with GitHub</span>
			</button>
		</div>

		<div class="divider">
			<span>or</span>
		</div>

		{#if error}
			<div class="error-message">
				{error}
			</div>
		{/if}

		<form onsubmit={handleEmailSignin} class="auth-form">
			<div class="form-group">
				<label for="email">Email</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					placeholder="you@example.com"
					required
				/>
			</div>

			<div class="form-group">
				<label for="password">Password</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					placeholder="••••••••"
					required
				/>
			</div>

			<button type="submit" class="submit-btn" disabled={isLoading}>
				{#if isLoading}
					<span class="spinner"></span>
					Signing in...
				{:else}
					Sign In
				{/if}
			</button>
		</form>

		<p class="switch-auth">
			Don't have an account? <a href="/signup">Sign up instead</a>
		</p>
	</div>
</div>

<style>
	.auth-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f0 100%);
		padding: 2rem;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
	}

	.auth-container {
		width: 100%;
		max-width: 440px;
		background: white;
		border-radius: 16px;
		padding: 2.5rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
	}

	.auth-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.logo {
		display: inline-block;
		font-weight: 700;
		font-size: 1.1rem;
		color: #00bcd4;
		text-decoration: none;
		margin-bottom: 1.5rem;
	}

	.auth-header h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: #111;
		margin: 0 0 0.5rem;
	}

	.auth-header p {
		color: #666;
		margin: 0;
	}

	.oauth-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.oauth-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background: white;
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.oauth-btn:hover {
		background: #f5f5f5;
		border-color: #ccc;
	}

	.oauth-btn.github {
		background: #24292e;
		border-color: #24292e;
		color: white;
	}

	.oauth-btn.github:hover {
		background: #1a1e22;
	}

	.divider {
		display: flex;
		align-items: center;
		margin: 1.5rem 0;
		color: #999;
		font-size: 0.85rem;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: #e5e7eb;
	}

	.divider span {
		padding: 0 1rem;
	}

	.error-message {
		background: #fef2f2;
		color: #dc2626;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		font-size: 0.9rem;
		margin-bottom: 1rem;
		border: 1px solid #fecaca;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-size: 0.9rem;
		font-weight: 500;
		color: #374151;
	}

	.form-group input {
		padding: 0.75rem 1rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.form-group input:focus {
		outline: none;
		border-color: #00bcd4;
		box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.1);
	}

	.submit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem;
		background: linear-gradient(135deg, #00bcd4 0%, #00838f 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		margin-top: 0.5rem;
	}

	.submit-btn:hover:not(:disabled) {
		box-shadow: 0 4px 12px rgba(0, 188, 212, 0.4);
		transform: translateY(-1px);
	}

	.submit-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.spinner {
		width: 18px;
		height: 18px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.switch-auth {
		text-align: center;
		margin-top: 1.5rem;
		color: #666;
		font-size: 0.95rem;
	}

	.switch-auth a {
		color: #00bcd4;
		text-decoration: none;
		font-weight: 500;
	}

	.switch-auth a:hover {
		text-decoration: underline;
	}
</style>
