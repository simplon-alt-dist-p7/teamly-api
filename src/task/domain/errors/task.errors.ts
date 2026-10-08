export class EmptyTaskLabelError extends Error {
  constructor(message = 'Task label must not be empty') {
    super(message);
    this.name = 'EmptyTaskLabelError';
  }
}

export class EmptyTaskListNameError extends Error {
  constructor(message = 'Task list name must not be empty') {
    super(message);
    this.name = 'EmptyTaskListNameError';
  }
}
