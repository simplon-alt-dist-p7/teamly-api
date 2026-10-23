import {
  EmptySupplierNameError,
  SupplierCannotBeOrderedError,
} from '../errors/stock.errors';
import { Supplier, type SupplierProps } from './supplier.entity';

const storia: SupplierProps = {
  id: 'supplier-1',
  name: 'Storia',
  phone: '0612345678',
  restaurantId: 'restaurant-1',
  orderedAt: null,
  createdAt: new Date('2026-10-19T18:00:00'),
};

describe('Supplier', () => {
  it('trims the name and capitalizes the first letter', () => {
    const supplier = new Supplier({ ...storia, name: ' storia ' });

    expect(supplier.name).toBe('Storia');
  });

  it('throws when the name is blank', () => {
    expect(() => new Supplier({ ...storia, name: '   ' })).toThrow(
      EmptySupplierNameError,
    );
  });

  it('turns a blank phone into null', () => {
    const supplier = new Supplier({ ...storia, phone: '   ' });

    expect(supplier.phone).toBeNull();
    expect(supplier.canBeOrdered()).toBe(false);
  });

  it('trims a phone number', () => {
    const supplier = new Supplier({ ...storia, phone: ' 0612345678 ' });

    expect(supplier.phone).toBe('0612345678');
    expect(supplier.canBeOrdered()).toBe(true);
  });

  it('can be ordered when a phone number is set', () => {
    const supplier = new Supplier(storia);

    expect(supplier.canBeOrdered()).toBe(true);
  });

  describe('isOrderedSince', () => {
    it('is false when the supplier has never been ordered', () => {
      const supplier = new Supplier(storia);

      expect(supplier.isOrderedSince(null)).toBe(false);
    });

    it('is true when ordered and the list has never been sent', () => {
      const supplier = new Supplier({
        ...storia,
        orderedAt: new Date('2026-10-19T23:50:00'),
      });

      expect(supplier.isOrderedSince(null)).toBe(true);
    });

    it('is false when the order is before the last send', () => {
      const supplier = new Supplier({
        ...storia,
        orderedAt: new Date('2026-10-19T22:00:00'),
      });

      expect(supplier.isOrderedSince(new Date('2026-10-19T23:00:00'))).toBe(
        false,
      );
    });

    it('is true when the order is after the last send', () => {
      const supplier = new Supplier({
        ...storia,
        orderedAt: new Date('2026-10-20T00:10:00'),
      });

      expect(supplier.isOrderedSince(new Date('2026-10-20T00:04:00'))).toBe(
        true,
      );
    });
  });

  it('records the order time', () => {
    const supplier = new Supplier(storia);
    const orderedAt = new Date('2026-10-20T00:10:00');

    const ordered = supplier.order(orderedAt);

    expect(ordered.orderedAt).toEqual(orderedAt);
    expect(supplier.orderedAt).toBeNull();
  });

  it('refuses to order a supplier without a phone number', () => {
    const supplier = new Supplier({ ...storia, phone: null });

    expect(() => supplier.order(new Date())).toThrow(
      SupplierCannotBeOrderedError,
    );
  });
});
