import React from 'react';
import {Box, Text} from 'ink';
import useAgentLoop from '../hooks/useAgentLoop.js';
import MessageList from './MessageList.js';
import InputBox from './InputBox.js';
import ThinkingIndicator from './ThinkingIndicator.js';
import StatusBar from './StatusBar.js';

function ChatInterface({config, grokClient, toolExecutor}) {
	const {messages, status, error, sendMessage} = useAgentLoop(
		grokClient,
		toolExecutor,
		config,
	);

	const isThinking = status !== 'idle';

	return (
		<Box flexDirection="column" padding={1}>
			<Box marginBottom={1}>
				<Text bold color="magenta">
					Grok Coding Agent
				</Text>
			</Box>

			<StatusBar
				model={config.model}
				workingDir={config.workingDir}
				messageCount={messages.length}
			/>

			<MessageList messages={messages} />

			{error && (
				<Box marginY={1}>
					<Text color="red">Error: {error}</Text>
				</Box>
			)}

			<ThinkingIndicator status={status} />

			<InputBox onSubmit={sendMessage} disabled={isThinking} />
		</Box>
	);
}

export default ChatInterface;
