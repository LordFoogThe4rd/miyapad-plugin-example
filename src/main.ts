import { formatDate, formatIsoDate, type DateFormatStyle } from './util';

const rawLoads = await miyapad.storage.get('loads');
const loads = typeof rawLoads === 'number' ? rawLoads + 1 : 1;
await miyapad.storage.set('loads', loads);

const savedFormat = await miyapad.storage.get('dateFormat');
let dateFormat: DateFormatStyle = savedFormat === 'locale' ? 'locale' : 'iso';
let modalOpen = false;
const listeners = new Set<() => void>();

function notify() {
	for (const listener of listeners) listener();
}

function setDateFormat(next: DateFormatStyle) {
	dateFormat = next;
	void miyapad.storage.set('dateFormat', next);
	notify();
}

function setModalOpen(open: boolean) {
	modalOpen = open;
	notify();
}

function insertTextAtCursor(text: string) {
	const editor = miyapad.editor;
	if (!editor) return;
	const { from, to } = editor.getSelection();
	editor.replaceRange(from, to, text);
	editor.setSelection(from + text.length, from + text.length);
	editor.focus();
}

function insertCurrentDate() {
	insertTextAtCursor(formatDate(dateFormat));
}

// Expand {date} and {{date}} before World Info scanning and context truncation.
miyapad.context.setPlaceholder('date', () => formatDate(dateFormat));

// Quick Switcher (> command) to open the custom date modal.
miyapad.hooks.commands.push({
	label: 'Example Plugin: Insert Custom Date…',
	action: () => setModalOpen(true),
});

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

// Editor toolbar buttons: insert today's date, or open the custom date modal.
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

miyapad.hooks.toolbar.push({
	title: 'Pick custom date…',
	icon: miyapad.html`
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<rect x="3" y="4" width="18" height="18" rx="2"/>
			<line x1="16" y1="2" x2="16" y2="6"/>
			<line x1="8" y1="2" x2="8" y2="6"/>
			<line x1="3" y1="10" x2="21" y2="10"/>
			<circle cx="12" cy="16" r="2"/>
		</svg>`,
	active: () => modalOpen,
	onClick: () => setModalOpen(true),
});

// Collapsible sidebar section showing the live date preview, quick insert, and modal trigger.
miyapad.hooks.sidebar.push({
	label: 'Date Helper',
	expanded: true,
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
				<button type="button" onClick=${() => setModalOpen(true)}>Pick custom date…</button>
			</div>`;
	},
});

// Custom modal mounted inside Modals.tsx via hooks.modals.
miyapad.hooks.modals.push(function CustomDateModal() {
	const [isOpen, setIsOpen] = miyapad.React.useState(modalOpen);
	const [pickedDate, setPickedDate] = miyapad.React.useState(() => formatIsoDate());
	miyapad.React.useEffect(() => {
		const sync = () => setIsOpen(modalOpen);
		listeners.add(sync);
		return () => { listeners.delete(sync); };
	}, []);

	const handleInsert = () => {
		const parsed = pickedDate ? new Date(`${pickedDate}T00:00:00`) : new Date();
		const text = Number.isNaN(parsed.getTime()) ? pickedDate : formatDate(dateFormat, parsed);
		setModalOpen(false);
		insertTextAtCursor(text);
	};

	return miyapad.html`
		<${miyapad.ui.Modal}
			isOpen=${isOpen}
			onClose=${() => setModalOpen(false)}
			title="Insert Custom Date"
			description="Choose any date to insert at the editor cursor using your configured format.">
			<div style=${{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<${miyapad.ui.InputBox}
					label="Date"
					type="date"
					value=${pickedDate}
					onValueChange=${(val: string | number) => setPickedDate(String(val))}/>
				<div style=${{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
					<button type="button" onClick=${() => setModalOpen(false)}>Cancel</button>
					<button type="button" onClick=${handleInsert}>Insert</button>
				</div>
			</div>
		</${miyapad.ui.Modal}>`;
});
