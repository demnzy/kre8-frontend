import type { UserPreferences } from '../types';

export interface AIProviderConfig {
	id: 'gemini' | 'openai' | 'anthropic' | 'groq' | 'openrouter' | 'deepseek';
	name: string;
	tagline: string;
	models: string[];
	defaultModel: string;
	keyField: 'gemini_api_key' | 'openai_api_key' | 'anthropic_api_key' | 'groq_api_key' | 'openrouter_api_key' | 'deepseek_api_key';
	keyPlaceholder: string;
	docsUrl: string;
	docsLabel: string;
}

export const AI_PROVIDERS: AIProviderConfig[] = [
	{
		id: 'gemini',
		name: 'Google Gemini',
		tagline: 'Fast multimodal & script generation',
		models: [
			'gemini-2.5-flash',
			'gemini-2.5-pro',
			'gemini-2.5-flash-lite',
			'gemini-3-flash-preview',
			'gemini-3.1-pro-preview'
		],
		defaultModel: 'gemini-2.5-flash',
		keyField: 'gemini_api_key',
		keyPlaceholder: 'AIzaSy...',
		docsUrl: 'https://aistudio.google.com/app/apikey',
		docsLabel: 'Get key from Google AI Studio'
	},
	{
		id: 'openai',
		name: 'OpenAI',
		tagline: 'GPT-4o, GPT-4.1 & o-series reasoning',
		models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1', 'o4-mini', 'o3-mini'],
		defaultModel: 'gpt-4o-mini',
		keyField: 'openai_api_key',
		keyPlaceholder: 'sk-proj-...',
		docsUrl: 'https://platform.openai.com/api-keys',
		docsLabel: 'Get key from OpenAI Platform'
	},
	{
		id: 'anthropic',
		name: 'Anthropic Claude',
		tagline: 'Natural storytelling & editorial tone',
		models: [
			'claude-sonnet-4-20250514',
			'claude-3-7-sonnet-latest',
			'claude-3-5-sonnet-latest',
			'claude-3-5-haiku-latest'
		],
		defaultModel: 'claude-sonnet-4-20250514',
		keyField: 'anthropic_api_key',
		keyPlaceholder: 'sk-ant-api03-...',
		docsUrl: 'https://console.anthropic.com/settings/keys',
		docsLabel: 'Get key from Anthropic Console'
	},
	{
		id: 'groq',
		name: 'Groq',
		tagline: 'Ultra-low latency open models',
		models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'qwen-qwq-32b', 'gemma2-9b-it'],
		defaultModel: 'llama-3.3-70b-versatile',
		keyField: 'groq_api_key',
		keyPlaceholder: 'gsk_...',
		docsUrl: 'https://console.groq.com/keys',
		docsLabel: 'Get key from Groq Console'
	},
	{
		id: 'openrouter',
		name: 'OpenRouter',
		tagline: 'Unified router for 200+ models',
		models: [
			'deepseek/deepseek-chat',
			'deepseek/deepseek-r1',
			'anthropic/claude-3.7-sonnet',
			'openai/gpt-4o-mini',
			'meta-llama/llama-3.3-70b-instruct'
		],
		defaultModel: 'deepseek/deepseek-chat',
		keyField: 'openrouter_api_key',
		keyPlaceholder: 'sk-or-v1-...',
		docsUrl: 'https://openrouter.ai/keys',
		docsLabel: 'Get key from OpenRouter'
	},
	{
		id: 'deepseek',
		name: 'DeepSeek',
		tagline: 'Direct V3 & R1 reasoning API',
		models: ['deepseek-chat', 'deepseek-reasoner'],
		defaultModel: 'deepseek-chat',
		keyField: 'deepseek_api_key',
		keyPlaceholder: 'sk-...',
		docsUrl: 'https://platform.deepseek.com/api_keys',
		docsLabel: 'Get key from DeepSeek Platform'
	}
];

export function getProviderConfig(providerId?: string | null): AIProviderConfig {
	const id = (providerId || 'gemini').toLowerCase();
	return AI_PROVIDERS.find((p) => p.id === id) || AI_PROVIDERS[0];
}

export const getProviderInfo = getProviderConfig;

export function getSavedKeyForProvider(prefs: Partial<UserPreferences> | null | undefined, providerId?: string | null): string {
	if (!prefs) return '';
	const cfg = getProviderConfig(providerId || prefs.ai_provider);
	const val = prefs[cfg.keyField];
	return typeof val === 'string' ? val.trim() : '';
}

export function hasSavedKeyForActiveProvider(prefs: Partial<UserPreferences> | null | undefined): boolean {
	return getSavedKeyForProvider(prefs).length > 0;
}

