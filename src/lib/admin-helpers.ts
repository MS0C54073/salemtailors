// Helpers for admin modules: WhatsApp messaging, currency, status formatting, dates.

export const SHOP_NAME = 'Salem Tailors';
export const SHOP_PHONE = '+260979287496';

// Salem operates in Lusaka, Zambia (CAT, UTC+02:00 — same offset as Cairo).
// All user-facing dates/times are formatted to this zone for consistency.
export const SHOP_TIMEZONE = 'Africa/Lusaka';
export const SHOP_LOCALE = 'en-GB';

const _withZone = (opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions => ({
  ...opts,
  timeZone: SHOP_TIMEZONE,
});

/** Date + time in Lusaka time, e.g. "25 Apr 2026, 14:30" */
export function formatDateTime(input: Date | string | null | undefined): string {
  if (!input) return '';
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(SHOP_LOCALE, _withZone({
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }));
}

/** Date only in Lusaka time, e.g. "25 Apr 2026" */
export function formatDate(input: Date | string | null | undefined): string {
  if (!input) return '';
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(SHOP_LOCALE, _withZone({
    day: '2-digit', month: 'short', year: 'numeric',
  }));
}

/** Time only in Lusaka time, e.g. "14:30" */
export function formatTime(input: Date | string | null | undefined): string {
  if (!input) return '';
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(SHOP_LOCALE, _withZone({
    hour: '2-digit', minute: '2-digit', hour12: false,
  }));
}

/** Long date label, e.g. "Saturday, 25 April 2026" */
export function formatDateLong(input: Date | string | null | undefined): string {
  if (!input) return '';
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(SHOP_LOCALE, _withZone({
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }));
}



export const ORDER_STATUS_FLOW = [
  { value: 'request_submitted', label: 'Received', color: 'bg-muted text-muted-foreground' },
  { value: 'consultation_scheduled', label: 'Awaiting Fabric', color: 'bg-secondary text-secondary-foreground' },
  { value: 'measurement_taken', label: 'Cutting', color: 'bg-secondary text-secondary-foreground' },
  { value: 'in_progress', label: 'Sewing', color: 'bg-primary/20 text-primary' },
  { value: 'ready_for_fitting', label: 'Fitting Ready', color: 'bg-gold/20 text-earth' },
  { value: 'adjustments_ongoing', label: 'Adjustments', color: 'bg-terracotta/20 text-terracotta' },
  { value: 'completed', label: 'Completed', color: 'bg-accent/20 text-accent' },
  { value: 'ready_for_pickup', label: 'Collected', color: 'bg-accent text-accent-foreground' },
] as const;

export function formatKwacha(amount: number | string | null | undefined): string {
  const n = Number(amount || 0);
  return `K${n.toLocaleString('en-ZM', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(message)}`;
}

export function buildStatusMessage(customerName: string, statusLabel: string, orderRef?: string): string {
  return `Hello ${customerName || 'Customer'} 👋,\n\nThis is ${SHOP_NAME}. Your order${orderRef ? ` (${orderRef})` : ''} status has been updated to: *${statusLabel}*.\n\nThank you for choosing us!`;
}

export function buildAppointmentMessage(customerName: string, type: string, when: string): string {
  return `Hello ${customerName || 'Customer'} 👋,\n\nYour ${type} appointment at ${SHOP_NAME} is confirmed for *${when}*.\n\nKatungu Market, Lusaka. See you soon!`;
}

export function buildPickupMessage(customerName: string, orderDesc?: string): string {
  return `Hello ${customerName || 'Customer'} 🎉,\n\nGood news! Your order${orderDesc ? ` (${orderDesc})` : ''} at ${SHOP_NAME} is *ready for pickup*.\n\nVisit us at Katungu Market, Lusaka. Thank you!`;
}

export function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function weekRange() {
  const { start } = todayRange();
  return { start: new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000), end: new Date() };
}

export function monthRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
}
