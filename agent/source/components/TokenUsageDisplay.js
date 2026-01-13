import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';

function TokenUsageDisplay({tokenTracker}) {
	const [usage, setUsage] = useState(null);

	useEffect(() => {
		if (!tokenTracker) return;

		// Update usage every second
		const interval = setInterval(() => {
			const summary = tokenTracker.getSummary();
			setUsage(summary);
		}, 1000);

		// Initial load
		setUsage(tokenTracker.getSummary());

		return () => clearInterval(interval);
	}, [tokenTracker]);

	if (!usage || usage.totalTokens === 0) {
		return null;
	}

	const formatCost = cost => {
		return `$${cost.toFixed(4)}`;
	};

	const formatTokens = tokens => {
		if (tokens >= 1000) {
			return `${(tokens / 1000).toFixed(1)}k`;
		}

		return tokens.toString();
	};

	return (
		<Box borderStyle="single" paddingX={1} marginBottom={1}>
			<Text dimColor>Tokens: </Text>
			<Text color="cyan">{formatTokens(usage.totalInputTokens)}</Text>
			<Text dimColor> in / </Text>
			<Text color="green">{formatTokens(usage.totalOutputTokens)}</Text>
			<Text dimColor> out | Total: </Text>
			<Text bold>{formatTokens(usage.totalTokens)}</Text>
			<Text dimColor> | Cost: </Text>
			<Text color="yellow" bold>
				{formatCost(usage.totalCost)}
			</Text>
			<Text dimColor> | Requests: </Text>
			<Text>{usage.requests}</Text>
		</Box>
	);
}

export default TokenUsageDisplay;
