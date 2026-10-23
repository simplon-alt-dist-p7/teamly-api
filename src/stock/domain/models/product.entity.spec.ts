import {
  EmptyProductNameError,
  EmptyProductUnitError,
  NegativeMinQuantityError,
  NegativeQuantityError,
} from '../errors/stock.errors';
import { Product, type ProductProps } from './product.entity';

const farine: ProductProps = {
  id: 'product-1',
  name: 'Farine',
  unit: 'kg',
  minQuantity: 2,
  quantity: 0,
  countedAt: null,
  supplierId: 'supplier-1',
  createdAt: new Date('2026-10-19T18:00:00'),
};

describe('Product', () => {
  it('trims the name and capitalizes the first letter', () => {
    const product = new Product({ ...farine, name: ' farine ' });

    expect(product.name).toBe('Farine');
  });

  it('trims the unit and lowercases it', () => {
    const product = new Product({ ...farine, unit: 'KG ' });

    expect(product.unit).toBe('kg');
  });

  it('accepts a decimal quantity', () => {
    const product = new Product({
      ...farine,
      quantity: 1.5,
      minQuantity: 1.5,
    });

    expect(product.quantity).toBe(1.5);
    expect(product.isUrgent()).toBe(true);
  });

  it('throws when the name is blank', () => {
    expect(() => new Product({ ...farine, name: '   ' })).toThrow(
      EmptyProductNameError,
    );
  });

  it('throws when the unit is blank', () => {
    expect(() => new Product({ ...farine, unit: '   ' })).toThrow(
      EmptyProductUnitError,
    );
  });

  it('throws when minQuantity is negative', () => {
    expect(() => new Product({ ...farine, minQuantity: -1 })).toThrow(
      NegativeMinQuantityError,
    );
  });

  it('throws when quantity is negative', () => {
    expect(() => new Product({ ...farine, quantity: -0.5 })).toThrow(
      NegativeQuantityError,
    );
  });

  describe('isUrgent', () => {
    it('is urgent when quantity equals minQuantity', () => {
      const product = new Product({
        ...farine,
        quantity: 2,
        minQuantity: 2,
      });

      expect(product.isUrgent()).toBe(true);
    });

    it('is urgent when quantity is below minQuantity', () => {
      const product = new Product({
        ...farine,
        quantity: 1,
        minQuantity: 2,
      });

      expect(product.isUrgent()).toBe(true);
    });

    it('is not urgent when quantity is above minQuantity', () => {
      const product = new Product({
        ...farine,
        quantity: 3,
        minQuantity: 2,
      });

      expect(product.isUrgent()).toBe(false);
    });
  });

  describe('isCheckedForCurrentList', () => {
    it('is false when the product has never been counted', () => {
      const product = new Product(farine);

      expect(product.isCheckedForCurrentList(null)).toBe(false);
    });

    it('is true when counted and the list has never been sent', () => {
      const product = new Product({
        ...farine,
        countedAt: new Date('2026-10-19T23:50:00'),
      });

      expect(product.isCheckedForCurrentList(null)).toBe(true);
    });

    it('is false when the count is before the last send', () => {
      const product = new Product({
        ...farine,
        countedAt: new Date('2026-10-19T22:00:00'),
      });

      expect(
        product.isCheckedForCurrentList(new Date('2026-10-19T23:00:00')),
      ).toBe(false);
    });

    it('is false when the count is exactly at the last send', () => {
      const sentAt = new Date('2026-10-19T23:00:00');
      const product = new Product({ ...farine, countedAt: sentAt });

      expect(product.isCheckedForCurrentList(sentAt)).toBe(false);
    });

    it('is true when the count is after the last send', () => {
      const product = new Product({
        ...farine,
        countedAt: new Date('2026-10-19T23:30:00'),
      });

      expect(
        product.isCheckedForCurrentList(new Date('2026-10-19T23:00:00')),
      ).toBe(true);
    });

    it('stays unchecked after midnight until it is counted again', () => {
      const countedBeforeClose = new Date('2026-10-19T23:50:00');
      const sentAfterMidnight = new Date('2026-10-20T00:04:00');
      const countedAgain = new Date('2026-10-20T00:10:00');

      const counted = new Product({
        ...farine,
        quantity: 1,
        countedAt: countedBeforeClose,
      });
      expect(counted.isCheckedForCurrentList(null)).toBe(true);

      expect(counted.isCheckedForCurrentList(sentAfterMidnight)).toBe(false);

      const countedAfterSend = counted.count(1.5, countedAgain);
      expect(countedAfterSend.quantity).toBe(1.5);
      expect(countedAfterSend.countedAt).toEqual(countedAgain);
      expect(countedAfterSend.isCheckedForCurrentList(sentAfterMidnight)).toBe(
        true,
      );
    });
  });

  it('rejects a negative quantity when counting', () => {
    const product = new Product(farine);

    expect(() => product.count(-1, new Date())).toThrow(NegativeQuantityError);
  });
});
