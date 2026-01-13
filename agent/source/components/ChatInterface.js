import React, {useState, useMemo, useEffect} from 'react';
import {Box, Text, useApp} from 'ink';
import useAgentLoop from '../hooks/useAgentLoop.js';
import MessageList from './MessageList.js';
import InputBox from './InputBox.js';
import ThinkingIndicator from './ThinkingIndicator.js';
import StatusBar from './StatusBar.js';
import CommandHandler from '../utils/command-handler.js';
import {TodoReader} from '../utils/todo-reader.js';
import TaskListDisplay from './TaskListDisplay.js';
import PlanningIndicator from './PlanningIndicator.js';
import TokenUsageDisplay from './TokenUsageDisplay.js';

function ChatInterface({
	config,
	grokClient,
	toolExecutor,
	fileTracker,
	subAgentManager,
	planningModeManager,
	tokenTracker,
}) {
	const {messages, status, error, sendMessage, clearMessages} = useAgentLoop(
		grokClient,
		toolExecutor,
		config,
	);

	const [commandMessages, setCommandMessages] = useState([]);
	const [todos, setTodos] = useState([]);
	const [activeAgents, setActiveAgents] = useState(0);
	const [planningMode, setPlanningMode] = useState('idle');
	const commandHandler = useMemo(() => new CommandHandler(), []);
	const {exit} = useApp();

	// Poll TODO.md file every 2 seconds
	useEffect(() => {
		const interval = setInterval(async () => {
			try {
				const tasks = await TodoReader.readTodoFile(config.workingDir);
				setTodos(tasks);
			} catch (error) {
				// Silently ignore errors (file might not exist yet)
			}
		}, 2000);

		// Initial load
		TodoReader.readTodoFile(config.workingDir)
			.then(setTodos)
			.catch(() => {
				// Ignore
			});

		return () => clearInterval(interval);
	}, [config.workingDir]);

	// Poll active agents count
	useEffect(() => {
		const interval = setInterval(() => {
			if (subAgentManager) {
				setActiveAgents(subAgentManager.getActiveAgentCount());
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [subAgentManager]);

	// Poll planning mode state
	useEffect(() => {
		const interval = setInterval(() => {
			if (planningModeManager) {
				setPlanningMode(planningModeManager.getMode());
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [planningModeManager]);

	const isThinking = status !== 'idle';

	const handleInput = async input => {
		// Check if it's a command
		if (commandHandler.isCommand(input)) {
			// Execute command
			const result = commandHandler.execute(input, {
				clearMessages,
				toolExecutor,
				fileTracker,
				config,
				messages,
				grokClient,
				planningModeManager,
			});

			if (result) {
				// Check if this is an async command
				if (result.async && result.executor) {
					// Show initial message
					setCommandMessages(prev => [
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
						setCommandMessages(prev => [
							...prev,
							{
								role: 'system',
								content: asyncResult.message,
								success: asyncResult.success,
								timestamp: Date.now(),
							},
						]);
					} catch (error) {
						setCommandMessages(prev => [
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
					setCommandMessages(prev => [
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
	const allMessages = [...messages, ...commandMessages].sort(
		(a, b) => a.timestamp - b.timestamp,
	);

	return (
		<Box flexDirection="column" padding={1}>
			<Box marginBottom={1}>
				<Text bold color="magenta">
					Grok Coding Agent
				</Text>
				<Text dimColor> - Type /help for commands</Text>
			</Box>

			<StatusBar
				model={config.model}
				workingDir={config.workingDir}
				messageCount={messages.length}
				activeAgents={activeAgents}
			/>

			<TokenUsageDisplay tokenTracker={tokenTracker} />

			<PlanningIndicator mode={planningMode} />

			<TaskListDisplay todos={todos} />

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
