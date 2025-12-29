import os from 'os';
import path from 'path';
import fs from 'fs/promises';

class ConfigManager {
	constructor() {
		this.configPath = path.join(os.homedir(), '.config', 'agent', 'config.json');
	}

	async load(cliFlags = {}) {
		// Priority: CLI flags > Environment variables > Config file

		// 1. Check CLI flags first
		if (cliFlags.token) {
			return {
				apiToken: cliFlags.token,
				model: cliFlags.model || 'grok-beta',
				workingDir: cliFlags.dir || process.cwd(),
			};
		}

		// 2. Check environment variables
		if (process.env.GROK_API_TOKEN) {
			return {
				apiToken: process.env.GROK_API_TOKEN,
				model: process.env.GROK_MODEL || cliFlags.model || 'grok-beta',
				workingDir: cliFlags.dir || process.cwd(),
			};
		}

		// 3. Check config file
		try {
			const data = await fs.readFile(this.configPath, 'utf-8');
			const config = JSON.parse(data);

			return {
				apiToken: config.apiToken,
				model: cliFlags.model || config.model || 'grok-beta',
				workingDir: cliFlags.dir || config.workingDir || process.cwd(),
			};
		} catch {
			return null;
		}
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
