import React from 'react';
import ChatInterface from './components/ChatInterface.js';

export default function App({
	config,
	grokClient,
	toolExecutor,
	fileTracker,
	subAgentManager,
	planningModeManager,
	tokenTracker,
}) {
	return (
		<ChatInterface
			config={config}
			grokClient={grokClient}
			toolExecutor={toolExecutor}
			fileTracker={fileTracker}
			subAgentManager={subAgentManager}
			planningModeManager={planningModeManager}
			tokenTracker={tokenTracker}
		/>
	);
}
