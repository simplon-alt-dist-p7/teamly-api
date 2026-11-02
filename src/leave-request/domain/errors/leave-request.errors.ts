export class InvalidLeaveDatesError extends Error {
  constructor(message = 'endDate must be on or after startDate') {
    super(message);
    this.name = 'InvalidLeaveDatesError';
  }
}

export class LeaveRequestAlreadyDecidedError extends Error {
  constructor(message = 'Only a pending leave request can be decided') {
    super(message);
    this.name = 'LeaveRequestAlreadyDecidedError';
  }
}
