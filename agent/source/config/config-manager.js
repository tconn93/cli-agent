import os from 'os';
import path from 'path';
import fs from 'fs/promises';

class ConfigManager {
	constructor() {
		this.configPath = path.join(os.homedir(), '.config', 'agent', 'config.json');
	}

	async load(cliFlags = {}) {
		// Priority: CLI flags > Environment variables > Config file

		let config = {
			apiToken: null,
			apiUrl: null,
			model: null,
			workingDir: null,
		};

		// 1. Check CLI flags first (highest priority)
		if (cliFlags.token) {
			config.apiToken = cliFlags.token;
		}

		if (cliFlags.url) {
			config.apiUrl = cliFlags.url;
		}

		if (cliFlags.model) {
			config.model = cliFlags.model;
		}

		if (cliFlags.dir) {
			config.workingDir = cliFlags.dir;
		}

		// 2. Check environment variables (with backward compatibility)
		if (!config.apiToken) {
			// Check new generic env var first, then fall back to old Grok-specific one
			if (process.env.API_TOKEN) {
				config.apiToken = process.env.API_TOKEN;
			} else if (process.env.GROK_API_TOKEN) {
				console.warn(
					'WARNING: GROK_API_TOKEN is deprecated. Please use API_TOKEN instead.\n' +
					'Support for GROK_API_TOKEN will be removed in a future version.',
				);
				config.apiToken = process.env.GROK_API_TOKEN;
			}
		}

		if (!config.apiUrl) {
			config.apiUrl = process.env.API_URL;
		}

		if (!config.model) {
			// Check new generic env var first, then fall back to old Grok-specific one
			if (process.env.API_MODEL) {
				config.model = process.env.API_MODEL;
			} else if (process.env.GROK_MODEL) {
				console.warn(
					'WARNING: GROK_MODEL is deprecated. Please use API_MODEL instead.',
				);
				config.model = process.env.GROK_MODEL;
			}
		}

		if (!config.workingDir) {
			config.workingDir = process.cwd();
		}

		// 3. Check config file (lowest priority)
		if (!config.apiToken || !config.apiUrl) {
			try {
				const data = await fs.readFile(this.configPath, 'utf-8');
				const fileConfig = JSON.parse(data);

				if (!config.apiToken) {
					config.apiToken = fileConfig.apiToken;
				}

				if (!config.apiUrl) {
					config.apiUrl = fileConfig.apiUrl;
				}

				if (!config.model) {
					config.model = fileConfig.model;
				}

				if (!config.workingDir || config.workingDir === process.cwd()) {
					config.workingDir = fileConfig.workingDir || process.cwd();
				}
			} catch {
				// Config file doesn't exist or is invalid, continue with current config
			}
		}

		// 4. Apply defaults
		if (!config.model) {
			config.model = 'gpt-4';
		}

		if (!config.workingDir) {
			config.workingDir = process.cwd();
		}

		// 5. Validate required fields
		if (!config.apiToken) {
			return null; // Caller will handle missing token error
		}

		if (!config.apiUrl) {
			throw new Error(
				'API_URL is required. Please provide via:\n' +
				'  - CLI flag: --url=https://api.openai.com/v1\n' +
				'  - Environment variable: API_URL=https://api.openai.com/v1\n' +
				'  - Config file: ~/.config/agent/config.json\n\n' +
				'Examples:\n' +
				'  OpenAI:      https://api.openai.com/v1\n' +
				'  OpenRouter:  https://openrouter.ai/api/v1\n' +
				'  Local LLM:   http://localhost:1234/v1',
			);
		}

		// 6. Validate URL format
		try {
			const url = new URL(config.apiUrl);
			// Ensure it's http or https
			if (!['http:', 'https:'].includes(url.protocol)) {
				throw new Error('API_URL must use http:// or https:// protocol');
			}
		} catch (error) {
			if (error.message.includes('protocol')) {
				throw error;
			}

			throw new Error(`Invalid API_URL: ${error.message}`);
		}

		return config;
	}

	async save(config) {
		await fs.mkdir(path.dirname(this.configPath), {recursive: true});
		await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
	}

	getConfigPath() {
		return this.configPath;
	}
}

export default ConfigManager;
