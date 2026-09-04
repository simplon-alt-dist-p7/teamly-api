export class UpdateShiftCommand {
  constructor(
    public readonly shiftId: string,
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly ownerId: string,
  ) {}
}
