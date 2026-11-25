import { formatDate, type DateFormatStyle } from './util';

const rawLoads = await miyapad.storage.get('loads');
const loads = typeof rawLoads === 'number' ? rawLoads + 1 : 1;
await miyapad.storage.set('loads', loads);

const savedFormat = await miyapad.storage.get('dateFormat');
let dateFormat: DateFormatStyle = savedFormat === 'locale' ? 'locale' : 'iso';
const listeners = new Set<() => void>();

function setDateFormat(next: DateFormatStyle) {
	dateFormat = next;
	void miyapad.storage.set('dateFormat', next);
	for (const listener of listeners) listener();
}

function insertCurrentDate() {
	const editor = miyapad.editor;
	if (!editor) return;
	const { from, to } = editor.getSelection();
	const text = formatDate(dateFormat);
	editor.replaceRange(from, to, text);
	editor.setSelection(from + text.length, from + text.length);
	editor.focus();
}

// Expand {date} and {{date}} before World Info scanning and context truncation.
miyapad.context.setPlaceholder('date', () => formatDate(dateFormat));

// Inline settings drawer shown via Preferences -> Plugins -> Configure.
miyapad.hooks.settings({
	mode: 'inline',
	Component: function DateSettings() {
		const [style, setStyle] = miyapad.React.useState<DateFormatStyle>(dateFormat);
		miyapad.React.useEffect(() => {
			const sync = () => setStyle(dateFormat);
			listeners.add(sync);
			return () => { listeners.delete(sync); };
		}, []);
		return miyapad.html`
			<${miyapad.ui.SelectBox}
				label="Date format"
				value=${style}
				onValueChange=${(val: string) => setDateFormat(val === 'locale' ? 'locale' : 'iso')}
				options=${[
					{ name: 'ISO (YYYY-MM-DD)', value: 'iso' },
					{ name: 'Browser locale', value: 'locale' },
				]}/>`;
	},
});

// Editor toolbar button to insert the current date at the cursor.
miyapad.hooks.toolbar.push({
	title: 'Insert current date',
	icon: miyapad.html`
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<rect x="3" y="4" width="18" height="18" rx="2"/>
			<line x1="16" y1="2" x2="16" y2="6"/>
			<line x1="8" y1="2" x2="8" y2="6"/>
			<line x1="3" y1="10" x2="21" y2="10"/>
		</svg>`,
	onClick: insertCurrentDate,
});

// Collapsible sidebar section showing the live date preview and a quick-insert button.
miyapad.hooks.sidebar.push({
	label: 'Date Helper',
	Component: function DateSidebar() {
		const [style, setStyle] = miyapad.React.useState<DateFormatStyle>(dateFormat);
		miyapad.React.useEffect(() => {
			const sync = () => setStyle(dateFormat);
			listeners.add(sync);
			return () => { listeners.delete(sync); };
		}, []);
		return miyapad.html`
			<div style=${{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
				<small>Today: ${formatDate(style)} (loads: ${loads})</small>
				<button type="button" onClick=${insertCurrentDate}>Insert date at cursor</button>
			</div>`;
	},
});
