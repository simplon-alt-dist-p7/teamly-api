export class DeleteShiftCommand {
  constructor(
    public readonly shiftId: string,
    public readonly ownerId: string,
  ) {}
}
