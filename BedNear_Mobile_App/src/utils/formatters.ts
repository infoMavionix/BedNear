export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}
export function formatDate(value?: string | null): string {
  if (!value) return 'Not confirmed';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not confirmed';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
export function isAvailabilityRecent(value?: string | null, hours = 24): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time <= Date.now() && Date.now() - time <= hours * 60 * 60 * 1000;
}
