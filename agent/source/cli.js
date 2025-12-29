#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';
import ConfigManager from './config/config-manager.js';
import GrokClient from './api/grok-client.js';
import ToolExecutor from './tools/tool-executor.js';
import FileTracker from './utils/file-tracker.js';
import ReadFileTool from './tools/read-file-tool.js';
import WriteFileTool from './tools/write-file-tool.js';
import BashExecuteTool from './tools/bash-execute-tool.js';
import EditFileTool from './tools/edit-file-tool.js';
import ListFilesTool from './tools/list-files-tool.js';
import SearchFilesTool from './tools/search-files-tool.js';
import WebSearchTool from './tools/web-search-tool.js';

const cli = meow(
	`
		Usage
		  $ agent [options]

		Options
		  --token, -t      Grok API token
		  --model, -m      Model to use (default: grok-beta)
		  --dir, -d        Working directory (default: current directory)
		  --config, -c     Path to config file

		Examples
		  $ agent --token=xai-xxx
		  $ agent --dir=/path/to/project
		  $ GROK_API_TOKEN=xai-xxx agent
	`,
	{
		importMeta: import.meta,
		flags: {
			token: {type: 'string', alias: 't'},
			model: {type: 'string', alias: 'm', default: 'grok-beta'},
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
		console.error('  - CLI flag: --token=xai-xxx');
		console.error('  - Environment variable: GROK_API_TOKEN=xai-xxx');
		console.error('  - Config file: ~/.config/agent/config.json');
		process.exit(1);
	}

	// Initialize components
	const grokClient = new GrokClient(config.apiToken);
	const fileTracker = new FileTracker();
	const toolExecutor = new ToolExecutor(config.workingDir, fileTracker);

	// Register tools
	toolExecutor.registerTool(new ReadFileTool(config.workingDir, fileTracker));
	toolExecutor.registerTool(new WriteFileTool(config.workingDir, fileTracker));
	toolExecutor.registerTool(new EditFileTool(config.workingDir, fileTracker));
	toolExecutor.registerTool(new BashExecuteTool(config.workingDir, fileTracker));
	toolExecutor.registerTool(new ListFilesTool(config.workingDir, fileTracker));
	toolExecutor.registerTool(new SearchFilesTool(config.workingDir, fileTracker));
	toolExecutor.registerTool(new WebSearchTool(config.workingDir, fileTracker));

	// Render the app
	render(
		<App
			config={config}
			grokClient={grokClient}
			toolExecutor={toolExecutor}
			fileTracker={fileTracker}
		/>,
	);
}

initializeApp().catch((error) => {
	console.error('Failed to initialize app:', error.message);
	process.exit(1);
});
