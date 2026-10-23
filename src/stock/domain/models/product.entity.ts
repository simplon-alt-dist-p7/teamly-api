import {
  EmptyProductNameError,
  EmptyProductUnitError,
  NegativeMinQuantityError,
  NegativeQuantityError,
} from '../errors/stock.errors';

export type ProductProps = {
  readonly id: string;
  readonly name: string;
  readonly unit: string;
  readonly minQuantity: number;
  readonly quantity: number;
  readonly countedAt: Date | null;
  readonly supplierId: string;
  readonly createdAt: Date;
};

export class Product {
  readonly id: string;
  readonly name: string;
  readonly unit: string;
  readonly minQuantity: number;
  readonly quantity: number;
  readonly countedAt: Date | null;
  readonly supplierId: string;
  readonly createdAt: Date;

  constructor(props: ProductProps) {
    const name = formatName(props.name);
    const unit = props.unit.trim().toLowerCase();
    if (unit === '') {
      throw new EmptyProductUnitError();
    }
    if (props.minQuantity < 0) {
      throw new NegativeMinQuantityError();
    }
    if (props.quantity < 0) {
      throw new NegativeQuantityError();
    }

    this.id = props.id;
    this.name = name;
    this.unit = unit;
    this.minQuantity = props.minQuantity;
    this.quantity = props.quantity;
    this.countedAt = props.countedAt;
    this.supplierId = props.supplierId;
    this.createdAt = props.createdAt;
  }

  isUrgent(): boolean {
    return this.quantity <= this.minQuantity;
  }

  isCheckedForCurrentList(stockSentAt: Date | null): boolean {
    if (this.countedAt === null) {
      return false;
    }
    if (stockSentAt === null) {
      return true;
    }
    return this.countedAt > stockSentAt;
  }

  count(quantity: number, countedAt: Date): Product {
    return new Product({
      id: this.id,
      name: this.name,
      unit: this.unit,
      minQuantity: this.minQuantity,
      quantity,
      countedAt,
      supplierId: this.supplierId,
      createdAt: this.createdAt,
    });
  }
}

function formatName(name: string): string {
  const trimmedName = name.trim();
  if (trimmedName === '') {
    throw new EmptyProductNameError();
  }

  return trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1);
}
