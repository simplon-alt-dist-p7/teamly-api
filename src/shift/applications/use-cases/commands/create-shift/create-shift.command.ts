export class CreateShiftCommand {
  constructor(
    public readonly employeeId: string,
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly ownerId: string,
  ) {}
}
