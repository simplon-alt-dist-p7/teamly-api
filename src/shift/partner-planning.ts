// TEMPORARY (v1): partner planning built on top of shifts, for a single client.
// To replace with a real feature (own model and module, no env variable).
// Why and how: docs/specs/planning-associes.md (teamly workspace).
// Partner planning: a restaurant used only to plan the partners of a client.
// Its employees see the whole planning and manage their own shifts.
export function isPartnerPlanning(restaurantId: string): boolean {
  const partnerRestaurantId = process.env.PARTNER_PLANNING_RESTAURANT_ID;
  return !!partnerRestaurantId && restaurantId === partnerRestaurantId;
}

// An empty note is stored as null.
export function cleanNote(note: string | undefined): string | null {
  return note?.trim() || null;
}
