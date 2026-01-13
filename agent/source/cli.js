#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';
import ConfigManager from './config/config-manager.js';
import OpenAIClient from './api/openai-client.js';
import ToolExecutor from './tools/tool-executor.js';
import FileTracker from './utils/file-tracker.js';
import ReadFileTool from './tools/read-file-tool.js';
import WriteFileTool from './tools/write-file-tool.js';
import BashExecuteTool from './tools/bash-execute-tool.js';
import EditFileTool from './tools/edit-file-tool.js';
import ListFilesTool from './tools/list-files-tool.js';
import SearchFilesTool from './tools/search-files-tool.js';
import WebSearchTool from './tools/web-search-tool.js';
import ExploreProjectTool from './tools/explore-project-tool.js';

const cli = meow(
	`
		Usage
		  $ agent [options]

		Options
		  --token, -t      API token (required)
		  --url, -u        API base URL (required, e.g., https://api.openai.com/v1)
		  --model, -m      Model to use (default: gpt-4)
		  --dir, -d        Working directory (default: current directory)
		  --config, -c     Path to config file

		Examples
		  $ agent --token=sk-xxx --url=https://api.openai.com/v1
		  $ agent --dir=/path/to/project
		  $ API_TOKEN=sk-xxx API_URL=https://api.openai.com/v1 agent

		Supported Providers
		  OpenAI:      https://api.openai.com/v1
		  OpenRouter:  https://openrouter.ai/api/v1
		  Local LLM:   http://localhost:1234/v1
		  Azure:       https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT
	`,
	{
		importMeta: import.meta,
		flags: {
			token: {type: 'string', alias: 't'},
			url: {type: 'string', alias: 'u'},
			model: {type: 'string', alias: 'm', default: 'gpt-4'},
			dir: {type: 'string', alias: 'd'},
			config: {type: 'string', alias: 'c'},
		},
	},
);

// Initialize configuration and components
async function initializeApp() {
	const configManager = new ConfigManager();
	const config = await configManager.load(cli.flags);

	if (!config || !config.apiToken) {
		console.error('Error: No API token found.');
		console.error('Please provide a token via:');
		console.error('  - CLI flag: --token=sk-xxx');
		console.error('  - Environment variable: API_TOKEN=sk-xxx');
		console.error('  - Config file: ~/.config/agent/config.json');
		process.exit(1);
	}

	if (!config.apiUrl) {
		console.error('Error: No API URL found.');
		console.error('Please provide a URL via:');
		console.error('  - CLI flag: --url=https://api.openai.com/v1');
		console.error('  - Environment variable: API_URL=https://api.openai.com/v1');
		console.error('  - Config file: ~/.config/agent/config.json');
		console.error('');
		console.error('Supported providers:');
		console.error('  - OpenAI:      https://api.openai.com/v1');
		console.error('  - OpenRouter:  https://openrouter.ai/api/v1');
		console.error('  - Local LLM:   http://localhost:1234/v1');
		console.error('  - Azure:       https://YOUR-RESOURCE.openai.azure.com/...');
		process.exit(1);
	}

	// Initialize components
	const apiClient = new OpenAIClient(config.apiToken, config.apiUrl);
	const fileTracker = new FileTracker();
	const toolExecutor = new ToolExecutor(config.workingDir, fileTracker);

	// Register tools
	toolExecutor.registerTool(new ReadFileTool(config.workingDir, fileTracker));
	toolExecutor.registerTool(new WriteFileTool(config.workingDir, fileTracker));
	toolExecutor.registerTool(new EditFileTool(config.workingDir, fileTracker));
	toolExecutor.registerTool(new BashExecuteTool(config.workingDir, fileTracker));
	toolExecutor.registerTool(new ListFilesTool(config.workingDir, fileTracker));
	toolExecutor.registerTool(new SearchFilesTool(config.workingDir, fileTracker));
	toolExecutor.registerTool(new ExploreProjectTool(config.workingDir, fileTracker));
	toolExecutor.registerTool(new WebSearchTool(config.workingDir, fileTracker));

	// Render the app
	render(
		<App
			config={config}
			apiClient={apiClient}
			toolExecutor={toolExecutor}
			fileTracker={fileTracker}
		/>,
	);
}

initializeApp().catch((error) => {
	console.error('Failed to initialize app:', error.message);
	process.exit(1);
});
