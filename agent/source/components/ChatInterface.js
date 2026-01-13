import React, {useState, useMemo} from 'react';
import {Box, Text, useApp} from 'ink';
import useAgentLoop from '../hooks/useAgentLoop.js';
import MessageList from './MessageList.js';
import InputBox from './InputBox.js';
import ThinkingIndicator from './ThinkingIndicator.js';
import StatusBar from './StatusBar.js';
import CommandHandler from '../utils/command-handler.js';

function ChatInterface({config, apiClient, toolExecutor, fileTracker}) {
	const {messages, status, error, sendMessage, clearMessages} = useAgentLoop(
		apiClient,
		toolExecutor,
		config,
	);

	const [commandMessages, setCommandMessages] = useState([]);
	const commandHandler = useMemo(() => new CommandHandler(), []);
	const {exit} = useApp();

	const isThinking = status !== 'idle';

	const handleInput = async (input) => {
		// Check if it's a command
		if (commandHandler.isCommand(input)) {
			// Execute command
			const result = commandHandler.execute(input, {
				clearMessages,
				toolExecutor,
				fileTracker,
				config,
				messages,
				apiClient,
			});

			if (result) {
				// Check if this is an async command
				if (result.async && result.executor) {
					// Show initial message
					setCommandMessages((prev) => [
						...prev,
						{
							role: 'system',
							content: result.message,
							success: result.success,
							timestamp: Date.now(),
						},
					]);

					// Execute async operation
					try {
						const asyncResult = await result.executor();

						// Show final result
						setCommandMessages((prev) => [
							...prev,
							{
								role: 'system',
								content: asyncResult.message,
								success: asyncResult.success,
								timestamp: Date.now(),
							},
						]);
					} catch (error) {
						setCommandMessages((prev) => [
							...prev,
							{
								role: 'system',
								content: `Error: ${error.message}`,
								success: false,
								timestamp: Date.now(),
							},
						]);
					}
				} else {
					// Synchronous command
					setCommandMessages((prev) => [
						...prev,
						{
							role: 'system',
							content: result.message,
							success: result.success,
							timestamp: Date.now(),
						},
					]);

					// Handle exit command
					if (result.exit) {
						setTimeout(() => {
							exit();
						}, 100);
					}
				}

				return;
			}
		}

		// Not a command, send to agent
		sendMessage(input);
	};

	// Combine regular messages and command messages
	const allMessages = [...messages, ...commandMessages].sort((a, b) => a.timestamp - b.timestamp);

	return (
		<Box flexDirection="column" padding={1}>
			<Box marginBottom={1}>
				<Text bold color="magenta">
					OpenAI Coding Agent
				</Text>
				<Text dimColor> - Type /help for commands</Text>
			</Box>

			<StatusBar
				model={config.model}
				workingDir={config.workingDir}
				messageCount={messages.length}
			/>

			<MessageList messages={allMessages} />

			{error && (
				<Box marginY={1}>
					<Text color="red">Error: {error}</Text>
				</Box>
			)}

			<ThinkingIndicator status={status} />

			<InputBox onSubmit={handleInput} disabled={isThinking} />
		</Box>
	);
}

export default ChatInterface;
