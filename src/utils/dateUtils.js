// saflash — Date utilities
import { format, formatDistanceToNow, isToday, isYesterday, differenceInDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return format(date, "d 'de' MMMM, yyyy", { locale: es });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return format(date, 'dd/MM/yyyy');
}

export function formatRelative(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isToday(date)) return 'Hoy';
  if (isYesterday(date)) return 'Ayer';
  return formatDistanceToNow(date, { addSuffix: true, locale: es });
}


export function daysBetween(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return 0;
  const d1 = startOfDay(new Date(dateStr1));
  const d2 = startOfDay(new Date(dateStr2));
  return differenceInDays(d2, d1);
}

export function isTodayCheck(dateStr) {
  if (!dateStr) return false;
  return isToday(new Date(dateStr));
}

export function getCurrentMonthYear() {
  const now = new Date();
  return format(now, 'MMMM yyyy', { locale: es });
}

export { isToday, isYesterday };
