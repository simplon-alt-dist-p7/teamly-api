import {
  EmptySupplierNameError,
  SupplierCannotBeOrderedError,
} from '../errors/stock.errors';

export type SupplierProps = {
  readonly id: string;
  readonly name: string;
  readonly phone: string | null;
  readonly restaurantId: string;
  readonly orderedAt: Date | null;
  readonly createdAt: Date;
};

export class Supplier {
  readonly id: string;
  readonly name: string;
  readonly phone: string | null;
  readonly restaurantId: string;
  readonly orderedAt: Date | null;
  readonly createdAt: Date;

  constructor(props: SupplierProps) {
    const trimmedName = props.name.trim();
    if (trimmedName === '') {
      throw new EmptySupplierNameError();
    }

    const name = trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1);
    const phone = props.phone?.trim() ?? '';

    this.id = props.id;
    this.name = name;
    this.phone = phone === '' ? null : phone;
    this.restaurantId = props.restaurantId;
    this.orderedAt = props.orderedAt;
    this.createdAt = props.createdAt;
  }

  canBeOrdered(): boolean {
    return this.phone !== null;
  }

  isOrderedSince(stockSentAt: Date | null): boolean {
    return (
      this.orderedAt !== null &&
      (stockSentAt === null || this.orderedAt > stockSentAt)
    );
  }

  order(orderedAt: Date): Supplier {
    if (!this.canBeOrdered()) {
      throw new SupplierCannotBeOrderedError();
    }

    return new Supplier({
      id: this.id,
      name: this.name,
      phone: this.phone,
      restaurantId: this.restaurantId,
      orderedAt,
      createdAt: this.createdAt,
    });
  }
}
