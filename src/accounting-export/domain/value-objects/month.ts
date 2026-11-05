import { tz } from '@date-fns/tz';
import { addMonths, format, isValid, parse } from 'date-fns';
import { InvalidMonthError } from '../errors/month.errors';

// Les restaurants sont en France : un mois commence et finit à minuit, heure de Paris.
const PARIS = tz('Europe/Paris');
const YEAR_MONTH_FORMAT = 'yyyy-MM';

export type MonthProps = {
  readonly yearMonth: string;
};

export class Month {
  readonly yearMonth: string;
  readonly start: Date;
  readonly end: Date;

  constructor(props: MonthProps) {
    this.yearMonth = props.yearMonth;
    this.start = parseYearMonth(props.yearMonth);
    this.end = addMonths(this.start, 1, { in: PARIS });
  }
}

// "2026-11" → le 1er novembre 2026 à minuit, heure de Paris.
// Refuse tout ce qui n'est pas exactement au format AAAA-MM ("2026-13", "2026-1", "novembre").
function parseYearMonth(yearMonth: string): Date {
  const date = parse(yearMonth, YEAR_MONTH_FORMAT, new Date(), { in: PARIS });
  console.log(date);
  const isExactFormat =
    isValid(date) && format(date, YEAR_MONTH_FORMAT) === yearMonth;
  if (!isExactFormat) {
    throw new InvalidMonthError(yearMonth);
  }

  return date;
}
