export class ApproveLeaveRequestCommand {
  constructor(
    public readonly leaveRequestId: string,
    public readonly ownerId: string,
  ) {}
}
