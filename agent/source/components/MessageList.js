import React from 'react';
import {Box, Text} from 'ink';

function MessageList({messages}) {
	return (
		<Box flexDirection="column" marginY={1}>
			{messages.map((msg, index) => {
				if (msg.role === 'user') {
					return (
						<Box
							key={index}
							marginY={1}
							paddingX={1}
							borderStyle="round"
							borderColor="cyan"
						>
							<Box flexDirection="column">
								<Text bold color="cyan">
									You
								</Text>
								<Text>{msg.content}</Text>
							</Box>
						</Box>
					);
				}

				if (msg.role === 'assistant') {
					return (
						<Box
							key={index}
							marginY={1}
							paddingX={1}
							borderStyle="round"
							borderColor="green"
							flexDirection="column"
						>
							<Text bold color="green">
								Agent
							</Text>
							{msg.content && msg.content !== '(Using tools...)' && (
								<Box marginTop={1}>
									<Text>{msg.content}</Text>
								</Box>
							)}
							{msg.tool_calls && msg.tool_calls.length > 0 && (
								<Box marginTop={1} flexDirection="column">
									<Text dimColor>Using tools:</Text>
									{msg.tool_calls.map((call, callIndex) => (
										<Box key={callIndex} marginLeft={2} marginTop={1}>
											<Text color="yellow">▸ </Text>
											<Text bold>{call.name}</Text>
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
						const isError = result.error === true;

						return (
							<Box
								key={index}
								marginY={1}
								marginLeft={2}
								paddingX={1}
								borderStyle="single"
								borderColor={isError ? 'red' : 'gray'}
							>
								<Box flexDirection="column">
									<Text dimColor>
										Tool result:{' '}
										{isError ? (
											<Text color="red" bold>
												Error
											</Text>
										) : (
											<Text color="green" bold>
												Success
											</Text>
										)}
									</Text>
									{isError && result.message && (
										<Box marginTop={1}>
											<Text color="red">{result.message}</Text>
										</Box>
									)}
									{!isError && result.result && (
										<Box marginTop={1}>
											<Text dimColor>
												{JSON.stringify(result.result, null, 2).slice(0, 200)}
												{JSON.stringify(result.result).length > 200 && '...'}
											</Text>
										</Box>
									)}
								</Box>
							</Box>
						);
					} catch {
						return (
							<Box
								key={index}
								marginY={1}
								marginLeft={2}
								paddingX={1}
								borderStyle="single"
								borderColor="gray"
							>
								<Text dimColor>Tool result: {msg.content.slice(0, 100)}</Text>
							</Box>
						);
					}
				}

				if (msg.role === 'system') {
					return (
						<Box
							key={index}
							marginY={1}
							paddingX={1}
							borderStyle="round"
							borderColor={msg.success ? 'blue' : 'red'}
						>
							<Box flexDirection="column">
								<Text bold color={msg.success ? 'blue' : 'red'}>
									System
								</Text>
								<Text>{msg.content}</Text>
							</Box>
						</Box>
					);
				}

				return null;
			})}
		</Box>
	);
}

export default MessageList;
