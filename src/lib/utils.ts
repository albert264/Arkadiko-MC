export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDate(date: Date): string {
  return date.toISOString();
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
