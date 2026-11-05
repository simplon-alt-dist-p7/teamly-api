export class InvalidMonthError extends Error {
  constructor(yearMonth: string) {
    super(`Invalid month "${yearMonth}", expected format YYYY-MM`);
    this.name = 'InvalidMonthError';
  }
}
