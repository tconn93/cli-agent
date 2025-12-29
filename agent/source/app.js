import React from 'react';
import ChatInterface from './components/ChatInterface.js';

export default function App({config, grokClient, toolExecutor, fileTracker}) {
	return (
		<ChatInterface
			config={config}
			grokClient={grokClient}
			toolExecutor={toolExecutor}
			fileTracker={fileTracker}
		/>
	);
}
