import { Command } from '@nestjs/cqrs';

type DuplicateWeekCommandProps = {
  readonly restaurantId: string;
  readonly referenceDate: Date;
  readonly ownerId: string;
};
export class DuplicateWeekCommand extends Command<void> {
  constructor(public readonly props: DuplicateWeekCommandProps) {
    super();
  }
}
