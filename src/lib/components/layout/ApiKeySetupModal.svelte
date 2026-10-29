<script lang="ts">
	import { appState } from '../../stores/appState.svelte';
	import { api } from '../../api/client';
	import { portal } from '../../utils/portal';
	import { AI_PROVIDERS, getProviderConfig, getSavedKeyForProvider } from '../../utils/aiProviders';
	import type { AIConnectionStatus } from '../../types';
	import { Key, Check, RefreshCw, Eye, EyeOff, ExternalLink, Wifi, AlertCircle, X } from 'lucide-svelte';

	let selectedProvider = $state(appState.preferences.ai_provider || 'gemini');
	let selectedModel = $state(appState.preferences.ai_model || 'gemini-2.5-flash');
	let apiKeyInput = $state('');
	let showKey = $state(false);
	let isSaving = $state(false);
	let isTesting = $state(false);
	let isLoadingModels = $state(false);
	let liveModels = $state<Record<string, string[]>>({});
	let testStatus = $state<AIConnectionStatus | null>(null);
	let errorMsg = $state('');

	const activeProvider = $derived(getProviderConfig(selectedProvider));
	const availableModels = $derived(liveModels[selectedProvider] || activeProvider.models);

	// Sync state when modal opens
	$effect(() => {
		if (appState.apiKeyModalOpen) {
			const prov = appState.preferences.ai_provider || 'gemini';
			const cfg = getProviderConfig(prov);
			selectedProvider = cfg.id;
			const currentModel = appState.preferences.ai_model;
			selectedModel = currentModel && cfg.models.includes(currentModel) ? currentModel : cfg.defaultModel;
			apiKeyInput = getSavedKeyForProvider(appState.preferences, cfg.id);
			testStatus = null;
			errorMsg = '';
		}
	});

	function selectProvider(providerId: string) {
		const cfg = getProviderConfig(providerId);
		selectedProvider = cfg.id;
		const models = liveModels[cfg.id] || cfg.models;
		if (!models.includes(selectedModel)) {
			selectedModel = cfg.defaultModel;
		}
		apiKeyInput = getSavedKeyForProvider(appState.preferences, cfg.id);
		testStatus = null;
		errorMsg = '';
	}

	async function handleRefreshModels() {
		try {
			isLoadingModels = true;
			errorMsg = '';
			const res = await api.listAIModels(selectedProvider, apiKeyInput.trim() || undefined);
			if (res.models && res.models.length > 0) {
				liveModels = { ...liveModels, [selectedProvider]: res.models };
				if (!res.models.includes(selectedModel)) {
					selectedModel = res.default_model || res.models[0];
				}
			}
		} catch (e: any) {
			errorMsg = e?.message || 'Could not load models.';
		} finally {
			isLoadingModels = false;
		}
	}

	async function handleTestConnection() {
		const trimmed = apiKeyInput.trim();
		if (!trimmed) {
			errorMsg = `Enter your ${activeProvider.name} API key first.`;
			return;
		}
		try {
			isTesting = true;
			errorMsg = '';
			testStatus = await api.testAIConnection(selectedProvider, selectedModel, trimmed);
			if (!testStatus.connected) {
				errorMsg = testStatus.message || 'Connection test failed.';
			} else {
				// Auto-save the verified key so it is immediately persisted
				const payload: Record<string, any> = {
					...appState.preferences,
					ai_provider: selectedProvider,
					ai_model: selectedModel,
					[activeProvider.keyField]: trimmed
				};
				const updated = await api.updatePreferences(payload);
				appState.preferences = updated;
			}
		} catch (e: any) {
			errorMsg = e?.message || 'Connection test failed.';
		} finally {
			isTesting = false;
		}
	}

	async function handleSaveKey(e?: Event) {
		if (e) e.preventDefault();
		const trimmed = apiKeyInput.trim();
		if (!trimmed) {
			errorMsg = `Please enter your ${activeProvider.name} API key.`;
			return;
		}

		try {
			isSaving = true;
			errorMsg = '';
			const payload: Record<string, any> = {
				...appState.preferences,
				ai_provider: selectedProvider,
				ai_model: selectedModel,
				[activeProvider.keyField]: trimmed
			};
			const updated = await api.updatePreferences(payload);
			appState.preferences = updated;
			appState.apiKeyModalOpen = false;
			appState.showToast(`${activeProvider.name} API key saved to your account`, 'success');
		} catch (e: any) {
			errorMsg = e?.message || 'Could not save API key. Please try again.';
		} finally {
			isSaving = false;
		}
	}
</script>

{#if appState.apiKeyModalOpen}
	<div use:portal class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
		<button
			type="button"
			onclick={() => (appState.apiKeyModalOpen = false)}
			class="absolute inset-0 cursor-default"
			aria-label="Close modal"
		></button>

		<div class="relative w-full max-w-lg bg-[#0e0717] border border-amber-400/40 shadow-2xl z-10 overflow-hidden">
			<!-- Header -->
			<div class="px-6 py-4 border-b border-purple-900/40 flex items-center justify-between bg-[#12091d]">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-400">
						<Key class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-base font-bold text-white">Set Up Your AI API Key</h3>
						<p class="text-xs text-slate-400">Choose your AI provider and save your key for scripts and ideas.</p>
					</div>
				</div>
				<button
					type="button"
					onclick={() => (appState.apiKeyModalOpen = false)}
					class="text-slate-400 hover:text-white p-1 transition-colors"
					aria-label="Close"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<!-- Form Body -->
			<form onsubmit={handleSaveKey} class="p-6 space-y-4">
				<!-- Provider Picker -->
				<div>
					<span class="block text-xs font-medium text-slate-300 mb-2">1. Choose Provider</span>
					<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
						{#each AI_PROVIDERS as provider}
							{@const isSelected = selectedProvider === provider.id}
							{@const hasSaved = getSavedKeyForProvider(appState.preferences, provider.id).length > 0}
							<button
								type="button"
								onclick={() => selectProvider(provider.id)}
								class="p-2.5 border text-left transition-all flex flex-col justify-between {isSelected
									? 'bg-amber-400/15 border-amber-400 text-white'
									: 'bg-black/60 border-purple-900/40 text-slate-300 hover:border-purple-600'}"
							>
								<div class="flex items-center justify-between gap-1">
									<span class="text-xs font-bold truncate {isSelected ? 'text-amber-300' : 'text-white'}">
										{provider.name}
									</span>
									{#if hasSaved}
										<span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Key saved"></span>
									{/if}
								</div>
								<span class="text-[10px] text-slate-400 truncate mt-0.5">{provider.defaultModel}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Model Picker -->
				<div>
					<div class="flex items-center justify-between mb-1.5">
						<label for="modal-ai-model" class="text-xs font-medium text-slate-300">2. Select Model</label>
						<button
							type="button"
							onclick={handleRefreshModels}
							disabled={isLoadingModels}
							class="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 disabled:opacity-50"
						>
							<RefreshCw class="w-3 h-3 {isLoadingModels ? 'animate-spin' : ''}" />
							<span>{isLoadingModels ? 'Loading...' : 'Refresh Models'}</span>
						</button>
					</div>
					<select
						id="modal-ai-model"
						bind:value={selectedModel}
						class="w-full px-3 py-2 bg-black border border-purple-900/60 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
					>
						{#each availableModels as m}
							<option value={m}>{m}</option>
						{/each}
					</select>
				</div>

				<!-- API Key Input -->
				<div>
					<div class="flex items-center justify-between mb-1.5">
						<label for="modal-api-key" class="text-xs font-medium text-slate-300">
							3. {activeProvider.name} API Key
						</label>
						<a
							href={activeProvider.docsUrl}
							target="_blank"
							rel="noreferrer"
							class="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
						>
							<span>{activeProvider.docsLabel}</span>
							<ExternalLink class="w-3 h-3" />
						</a>
					</div>
					<div class="relative">
						<input
							id="modal-api-key"
							type={showKey ? 'text' : 'password'}
							bind:value={apiKeyInput}
							placeholder={activeProvider.keyPlaceholder}
							class="w-full px-3 py-2 pr-10 bg-black border border-purple-900/60 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
						/>
						<button
							type="button"
							onclick={() => (showKey = !showKey)}
							class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
							aria-label={showKey ? 'Hide API key' : 'Show API key'}
						>
							{#if showKey}
								<EyeOff class="w-3.5 h-3.5" />
							{:else}
								<Eye class="w-3.5 h-3.5" />
							{/if}
						</button>
					</div>
					<p class="text-[11px] text-slate-400 mt-1">
						Saved to your account so it stays active whenever you sign in.
					</p>
				</div>

				<!-- Connection Status / Error -->
				{#if errorMsg}
					<div class="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
						<AlertCircle class="w-4 h-4 shrink-0 text-rose-400" />
						<span>{errorMsg}</span>
					</div>
				{:else if testStatus && testStatus.connected}
					<div class="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
						<span class="flex items-center gap-1.5">
							<Check class="w-4 h-4 text-emerald-400" />
							<span>Connected to {activeProvider.name} ({selectedModel}) — Key saved!</span>
						</span>
						{#if testStatus.latency_ms}
							<span class="font-mono text-[11px]">{testStatus.latency_ms} ms</span>
						{/if}
					</div>
				{/if}

				<!-- Actions -->
				<div class="pt-2 border-t border-purple-900/40 flex items-center justify-between gap-2">
					<button
						type="button"
						onclick={handleTestConnection}
						disabled={isTesting || isSaving}
						class="px-3.5 py-2 border border-purple-800 hover:border-amber-400 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
					>
						{#if isTesting}
							<RefreshCw class="w-3.5 h-3.5 animate-spin text-amber-400" />
							<span>Testing...</span>
						{:else}
							<Wifi class="w-3.5 h-3.5 text-amber-400" />
							<span>Test Connection</span>
						{/if}
					</button>

					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={() => (appState.apiKeyModalOpen = false)}
							class="px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors"
						>
							Later
						</button>
						<button
							type="submit"
							disabled={isSaving}
							class="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
						>
							<Check class="w-3.5 h-3.5" />
							<span>{isSaving ? 'Saving...' : 'Save API Key'}</span>
						</button>
					</div>
				</div>
			</form>
		</div>
	</div>
{/if}

