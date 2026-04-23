// Helpers for admin modules: WhatsApp messaging, currency, status formatting.

export const SHOP_NAME = 'Salem Tailors';
export const SHOP_PHONE = '+260979287496';

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
