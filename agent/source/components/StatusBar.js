import React from 'react';
import {Box, Text} from 'ink';

function StatusBar({model, workingDir, messageCount}) {
	return (
		<Box borderStyle="single" paddingX={1}>
			<Text dimColor>Model: </Text>
			<Text>{model}</Text>
			<Text dimColor> | Working Dir: </Text>
			<Text>{workingDir}</Text>
			<Text dimColor> | Messages: </Text>
			<Text>{messageCount}</Text>
		</Box>
	);
}

export default StatusBar;
