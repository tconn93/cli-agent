import React from 'react';
import {Box, Text} from 'ink';

function PlanningIndicator({mode}) {
	if (mode === 'idle') {
		return null;
	}

	const modeInfo = {
		planning: {
			text: 'PLANNING MODE',
			color: 'blue',
			description: 'Read-only exploration',
		},
		awaiting_approval: {
			text: 'AWAITING APPROVAL',
			color: 'yellow',
			description: 'Plan ready for review - use /approve or /reject',
		},
	};

	const info = modeInfo[mode];
	if (!info) {
		return null;
	}

	return (
		<Box borderStyle="double" paddingX={1} marginY={1}>
			<Text bold color={info.color}>
				{info.text}
			</Text>
			<Text dimColor> - {info.description}</Text>
		</Box>
	);
}

export default PlanningIndicator;
