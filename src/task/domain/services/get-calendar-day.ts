/**
 * Renvoie le jour du calendrier pour un fuseau donné, sous forme de Date à minuit UTC.
 *
 * Le serveur tourne en UTC : à 00 h 30 à Paris, il se croit encore la veille.
 * Cette fonction donne le jour tel que le vit le restaurant.
 * @example
 * getCalendarDay(new Date('2026-10-09T22:30:00Z'), 'Europe/Paris')
 * // => 2026-10-10T00:00:00.000Z
 */

export function getCalendarDay(now: Date, timeZone: string): Date {
  const calendarDate = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  return new Date(`${calendarDate}T00:00:00.000Z`);
}
