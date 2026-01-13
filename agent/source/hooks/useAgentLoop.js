import {useState, useCallback} from 'react';

function useAgentLoop(apiClient, toolExecutor, config) {
	const [messages, setMessages] = useState([]);
	const [status, setStatus] = useState('idle'); // 'idle' | 'calling_api' | 'executing_tools'
	const [error, setError] = useState(null);

	const sendMessage = useCallback(
		async (userInput) => {
			if (!userInput.trim()) {
				return;
			}

			try {
				setError(null);

				// 1. Add user message to conversation display
				const userMessage = {
					role: 'user',
					content: userInput,
					timestamp: Date.now(),
				};
				setMessages((prev) => [...prev, userMessage]);

				// 2. Add user message to API client history
				apiClient.addUserMessage(userInput);
				setStatus('calling_api');

				// 3. Start agent loop
				let continueLoop = true;
				let maxIterations = 10; // Safety limit to prevent infinite loops
				let iteration = 0;

				while (continueLoop && iteration < maxIterations) {
					iteration++;

					// Call OpenAI API with full message history
					const response = await apiClient.sendMessage(
						toolExecutor.getToolDefinitions(),
						{model: config.model},
					);

					// Extract content and tool calls
					const {content, tool_calls} = response;

					// Add assistant message to API client history
					apiClient.addAssistantMessage(content, tool_calls);

					// Add assistant message to display
					const displayMessage = {
						role: 'assistant',
						content: content || '(Using tools...)',
						tool_calls: tool_calls.length > 0 ? tool_calls : null,
						timestamp: Date.now(),
					};
					setMessages((prev) => [...prev, displayMessage]);

					// Check for tool calls
					if (tool_calls && tool_calls.length > 0) {
						setStatus('executing_tools');

						// Transform OpenAI tool_calls to executor format
						const executorToolCalls = tool_calls.map((tc) => ({
							name: tc.function.name,
							call_id: tc.id,
							arguments: tc.function.arguments,
						}));

						// Execute tools in parallel
						const toolResults = await toolExecutor.executeAll(executorToolCalls);

						// Add tool results to display
						const toolResultMessages = toolResults.map((result) => ({
							role: 'tool',
							content: result.output,
							call_id: result.call_id,
							timestamp: Date.now(),
						}));
						setMessages((prev) => [...prev, ...toolResultMessages]);

						// Add tool results to API client history
						apiClient.addToolResults(toolResults);

						// Continue loop to get final response
						setStatus('calling_api');
					} else {
						// No tool calls, we're done
						continueLoop = false;
					}
				}

				// Safety check: if we hit max iterations, warn the user
				if (iteration >= maxIterations) {
					setMessages((prev) => [
						...prev,
						{
							role: 'assistant',
							content: '⚠️ Maximum tool execution iterations reached. Stopping to prevent infinite loop.',
							timestamp: Date.now(),
						},
					]);
				}

				setStatus('idle');
			} catch (err) {
				setError(err.message);
				setStatus('idle');
			}
		},
		[apiClient, toolExecutor, config.model],
	);

	const clearMessages = useCallback(() => {
		setMessages([]);
		setError(null);
		apiClient.resetConversation();
	}, [apiClient]);

	return {
		messages,
		status,
		error,
		sendMessage,
		clearMessages,
	};
}

export default useAgentLoop;
