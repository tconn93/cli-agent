import React from 'react';
import {Box, Text} from 'ink';

function TaskListDisplay({todos}) {
	if (!todos || todos.length === 0) {
		return null;
	}

	const statusIcons = {
		pending: '○',
		in_progress: '◐',
		completed: '●',
	};

	const statusColors = {
		pending: 'gray',
		in_progress: 'yellow',
		completed: 'green',
	};

	return (
		<Box flexDirection="column" marginY={1} borderStyle="round" paddingX={1}>
			<Text bold color="magenta">
				Tasks
			</Text>
			{todos.map((todo, index) => (
				<Box key={index} marginTop={1}>
					<Text color={statusColors[todo.status]}>
						{statusIcons[todo.status]}{' '}
					</Text>
					<Text dimColor={todo.status === 'completed'}>{todo.content}</Text>
				</Box>
			))}
		</Box>
	);
}

export default TaskListDisplay;
