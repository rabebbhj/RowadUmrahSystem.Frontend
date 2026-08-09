export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("fr-FR");
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR");
}

export function toDateInputValue(value: Date = new Date()) {
  const offset = value.getTimezoneOffset();
  const localTime = new Date(value.getTime() - offset * 60_000);
  return localTime.toISOString().slice(0, 10);
}

export function todayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function addDaysToDateInputValue(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}
