export class InvalidLeaveDatesError extends Error {
  constructor(message = 'endDate must be on or after startDate') {
    super(message);
    this.name = 'InvalidLeaveDatesError';
  }
}
