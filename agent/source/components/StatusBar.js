import React from 'react';
import {Box, Text} from 'ink';

function StatusBar({model, workingDir, messageCount, activeAgents = 0}) {
	return (
		<Box borderStyle="single" paddingX={1}>
			<Text dimColor>Model: </Text>
			<Text>{model}</Text>
			<Text dimColor> | Working Dir: </Text>
			<Text>{workingDir}</Text>
			<Text dimColor> | Messages: </Text>
			<Text>{messageCount}</Text>
			<Text dimColor> | Active Tasks: </Text>
			<Text color="magenta">{activeAgents}</Text>
		</Box>
	);
}

export default StatusBar;
