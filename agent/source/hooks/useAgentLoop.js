import {useState, useCallback} from 'react';

function useAgentLoop(grokClient, toolExecutor, config) {
	const [messages, setMessages] = useState([]);
	const [status, setStatus] = useState('idle'); // 'idle' | 'calling_api' | 'executing_tools'
	const [error, setError] = useState(null);

	const sendMessage = useCallback(
		async userInput => {
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
				setMessages(prev => [...prev, userMessage]);
				setStatus('calling_api');

				// 2. Call Grok API with user input
				let response = await grokClient.sendMessage(
					userInput,
					toolExecutor.getToolDefinitions(),
					{model: config.model},
				);

				// 3. Process the response and handle tool calls iteratively
				let continueLoop = true;
				let maxIterations = 10; // Safety limit to prevent infinite loops
				let iteration = 0;

				while (continueLoop && iteration < maxIterations) {
					iteration++;

					const {output} = response;

					// Extract assistant message and tool calls
					const assistantMessages = output.filter(
						item => item.type === 'message' && item.role === 'assistant',
					);
					const toolCalls = output.filter(
						item => item.type === 'function_call',
					);

					// Extract text content from assistant message
					let assistantText = '';
					if (assistantMessages.length > 0) {
						const content = assistantMessages[0].content || [];
						const textContent = content.find(c => c.type === 'output_text');
						if (textContent) {
							assistantText = textContent.text;
						}
					}

					// Add assistant message to display (if there's content or tool calls)
					if (assistantText || toolCalls.length > 0) {
						const assistantMessage = {
							role: 'assistant',
							content: assistantText || '(Using tools...)',
							tool_calls: toolCalls.length > 0 ? toolCalls : null,
							timestamp: Date.now(),
						};
						setMessages(prev => [...prev, assistantMessage]);
					}

					// Check if there are tool calls to execute
					if (toolCalls.length > 0) {
						setStatus('executing_tools');

						// Execute all tools in parallel
						const toolResults = await toolExecutor.executeAll(toolCalls);

						// Add tool results to display
						const toolResultMessages = toolResults.map(result => ({
							role: 'tool',
							content: result.output,
							call_id: result.call_id,
							timestamp: Date.now(),
						}));
						setMessages(prev => [...prev, ...toolResultMessages]);

						// Send tool results back to API
						setStatus('calling_api');
						response = await grokClient.sendMessage(
							toolResults,
							toolExecutor.getToolDefinitions(),
							{model: config.model},
						);

						// Loop continues to check if there are more tool calls
					} else {
						// No more tool calls, exit the loop
						continueLoop = false;
					}
				}

				// Safety check: if we hit max iterations, warn the user
				if (iteration >= maxIterations) {
					setMessages(prev => [
						...prev,
						{
							role: 'assistant',
							content:
								'⚠️ Maximum tool execution iterations reached. Stopping to prevent infinite loop.',
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
		[grokClient, toolExecutor, config.model],
	);

	const clearMessages = useCallback(() => {
		setMessages([]);
		setError(null);
		grokClient.resetConversation();
	}, [grokClient]);

	return {
		messages,
		status,
		error,
		sendMessage,
		clearMessages,
	};
}

export default useAgentLoop;
