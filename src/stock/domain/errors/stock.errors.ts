export class EmptyProductNameError extends Error {
  constructor(message = 'Product name must not be empty') {
    super(message);
    this.name = 'EmptyProductNameError';
  }
}

export class EmptyProductUnitError extends Error {
  constructor(message = 'Product unit must not be empty') {
    super(message);
    this.name = 'EmptyProductUnitError';
  }
}

export class NegativeMinQuantityError extends Error {
  constructor(message = 'Minimum quantity must be zero or greater') {
    super(message);
    this.name = 'NegativeMinQuantityError';
  }
}

export class NegativeQuantityError extends Error {
  constructor(message = 'Quantity must be zero or greater') {
    super(message);
    this.name = 'NegativeQuantityError';
  }
}

export class EmptySupplierNameError extends Error {
  constructor(message = 'Supplier name must not be empty') {
    super(message);
    this.name = 'EmptySupplierNameError';
  }
}

export class SupplierCannotBeOrderedError extends Error {
  constructor(message = 'Supplier cannot be ordered without a phone number') {
    super(message);
    this.name = 'SupplierCannotBeOrderedError';
  }
}
