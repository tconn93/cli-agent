import React from 'react';
import ChatInterface from './components/ChatInterface.js';

export default function App({config, apiClient, toolExecutor, fileTracker}) {
	return (
		<ChatInterface
			config={config}
			apiClient={apiClient}
			toolExecutor={toolExecutor}
			fileTracker={fileTracker}
		/>
	);
}
