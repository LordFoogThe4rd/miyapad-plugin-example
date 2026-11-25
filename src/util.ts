export type DateFormatStyle = 'iso' | 'locale';

export function formatIsoDate(date = new Date()): string {
	return date.toISOString().slice(0, 10);
}

export function formatDate(style: DateFormatStyle, date = new Date()): string {
	return style === 'locale' ? date.toLocaleDateString() : formatIsoDate(date);
}
