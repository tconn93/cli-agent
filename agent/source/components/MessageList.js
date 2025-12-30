import React from 'react';
import {Box, Text} from 'ink';

function MessageList({messages}) {
	return (
		<Box flexDirection="column" marginY={1}>
			{messages.map((msg, index) => {
				if (msg.role === 'user') {
					return (
						<Box key={index} marginY={1}>
							<Text bold color="cyan">
								You:{' '}
							</Text>
							<Text>{msg.content}</Text>
						</Box>
					);
				}

				if (msg.role === 'assistant') {
					return (
						<Box key={index} marginY={1} flexDirection="column">
							<Text bold color="green">
								Agent:{' '}
							</Text>
							<Text>{msg.content || '(Using tools...)'}</Text>
							{msg.tool_calls && msg.tool_calls.length > 0 && (
								<Box marginTop={1} flexDirection="column">
									{msg.tool_calls.map((call, callIndex) => (
										<Box key={callIndex}>
											<Text dimColor>→ Executing: </Text>
											<Text color="yellow">{call.name}</Text>
										</Box>
									))}
								</Box>
							)}
						</Box>
					);
				}

				if (msg.role === 'tool') {
					try {
						const result = JSON.parse(msg.content);
						return (
							<Box key={index} marginY={1} flexDirection="column">
								<Text dimColor>
									Tool result:{' '}
									{result.error ? (
										<Text color="red">Error - {result.message}</Text>
									) : (
										<Text color="green">Success</Text>
									)}
								</Text>
							</Box>
						);
					} catch {
						return null;
					}
				}

				if (msg.role === 'system') {
					return (
						<Box key={index} marginY={1} flexDirection="column">
							<Text bold color={msg.success ? 'blue' : 'red'}>
								System:{' '}
							</Text>
							<Text>{msg.content}</Text>
						</Box>
					);
				}

				return null;
			})}
		</Box>
	);
}

export default MessageList;
