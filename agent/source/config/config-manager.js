import os from 'os';
import path from 'path';
import fs from 'fs/promises';

class ConfigManager {
	constructor() {
		this.configPath = path.join(
			os.homedir(),
			'.config',
			'agent',
			'config.json',
		);
	}

	async load(cliFlags = {}) {
		// Priority: CLI flags > Environment variables > Config file

		// Default pricing per 1M tokens (USD)
		const defaultPricing = {
			inputCostPer1M: 5.0, // $5 per 1M input tokens (example)
			outputCostPer1M: 15.0, // $15 per 1M output tokens (example)
		};

		// Load config file first (if it exists) to use as base
		let fileConfig = {};
		try {
			const data = await fs.readFile(this.configPath, 'utf-8');
			fileConfig = JSON.parse(data);
		} catch {
			// Config file doesn't exist or is invalid, use defaults
		}

		// Build final config with priority: CLI > Env > File > Defaults
		const apiToken =
			cliFlags.token || process.env.GROK_API_TOKEN || fileConfig.apiToken;

		if (!apiToken) {
			return null; // No API token found
		}

		const model =
			cliFlags.model ||
			process.env.GROK_MODEL ||
			fileConfig.model ||
			'grok-beta';

		const workingDir = cliFlags.dir || fileConfig.workingDir || process.cwd();

		const pricing = fileConfig.pricing || defaultPricing;

		return {
			apiToken,
			model,
			workingDir,
			pricing,
		};
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
