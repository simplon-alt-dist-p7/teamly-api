export class RestaurantNotFoundError extends Error {
  constructor(message = 'Restaurant not found') {
    super(message);
    this.name = 'RestaurantNotFoundError';
  }
}
