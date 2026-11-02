export class RejectLeaveRequestCommand {
  constructor(
    public readonly leaveRequestId: string,
    public readonly ownerId: string,
    public readonly managerNote: string | null,
  ) {}
}
