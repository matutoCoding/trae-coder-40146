import { Weekday, WEEKDAY_LABEL } from '@/types/booking';

export const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

export const parseDate = (dateStr: string): Date => {
  return new Date(dateStr.replace(/-/g, '/'));
};

export const getWeekday = (date: Date | string): Weekday => {
  const d = typeof date === 'string' ? parseDate(date) : date;
  return d.getDay() as Weekday;
};

export const getWeekdayLabel = (date: Date | string): string => {
  const weekday = getWeekday(date);
  return WEEKDAY_LABEL[weekday];
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addWeeks = (date: Date, weeks: number): Date => {
  return addDays(date, weeks * 7);
};

export const getDateRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  let current = new Date(start);

  while (current <= end) {
    dates.push(formatDate(current));
    current = addDays(current, 1);
  }

  return dates;
};

export const getWeekDates = (baseDate: string): string[] => {
  const base = parseDate(baseDate);
  const weekday = base.getDay();
  const monday = addDays(base, -weekday + (weekday === 0 ? -6 : 1));
  const dates: string[] = [];

  for (let i = 0; i < 7; i++) {
    dates.push(formatDate(addDays(monday, i)));
  }

  return dates;
};

export const generatePeriodDates = (
  startDate: string,
  weekday: Weekday,
  weeks: number
): string[] => {
  const dates: string[] = [];
  const start = parseDate(startDate);
  const startWeekday = start.getDay() as Weekday;

  let daysUntilWeekday: number;
  if (weekday >= startWeekday) {
    daysUntilWeekday = weekday - startWeekday;
  } else {
    daysUntilWeekday = 7 - (startWeekday - weekday);
  }

  const firstDate = addDays(start, daysUntilWeekday);

  for (let i = 0; i < weeks; i++) {
    dates.push(formatDate(addWeeks(firstDate, i)));
  }

  return dates;
};

export const calculateHours = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startTotal = startHour + startMin / 60;
  const endTotal = endHour + endMin / 60;

  return Math.max(0, endTotal - startTotal);
};

export const formatTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const isToday = (dateStr: string): boolean => {
  const today = formatDate(new Date());
  return dateStr === today;
};

export const isPast = (dateStr: string): boolean => {
  const today = formatDate(new Date());
  return dateStr < today;
};

export const getMonthDates = (year: number, month: number): string[] => {
  const dates: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(formatDate(new Date(year, month - 1, day)));
  }

  return dates;
};

export const getRelativeDateLabel = (dateStr: string): string => {
  if (isToday(dateStr)) return '今天';
  const tomorrow = formatDate(addDays(new Date(), 1));
  if (dateStr === tomorrow) return '明天';
  return getWeekdayLabel(dateStr);
};
