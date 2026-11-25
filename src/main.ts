import { formatDate, formatIsoDate, type DateFormatStyle } from './util';

interface HistoryEntry {
	value: string;
	source: 'quick' | 'custom';
	insertedAt: string;
}

const rawLoads = await miyapad.storage.get('loads');
const loads = typeof rawLoads === 'number' ? rawLoads + 1 : 1;
await miyapad.storage.set('loads', loads);

const savedFormat = await miyapad.storage.get('dateFormat');
let dateFormat: DateFormatStyle = savedFormat === 'locale' ? 'locale' : 'iso';
let modalOpen = false;

// Named DB namespace (`history`): uses IndexedDB KV in standalone mode and SQLite on the server.
const historyDb = miyapad.db('history');
const hasSql = typeof historyDb.exec === 'function' && typeof historyDb.query === 'function';

if (hasSql) {
	await historyDb.exec!(
		'CREATE TABLE IF NOT EXISTS date_log (id INTEGER PRIMARY KEY AUTOINCREMENT, value TEXT NOT NULL, source TEXT NOT NULL, inserted_at TEXT NOT NULL)',
	);
}

let recentHistory: HistoryEntry[] = [];
let totalHistoryCount = 0;
let historySeq = 0;
const listeners = new Set<() => void>();

function notify() {
	for (const listener of listeners) listener();
}

async function refreshHistory() {
	if (hasSql) {
		const [rows, countRows] = await Promise.all([
			historyDb.query!(
				'SELECT value, source, inserted_at FROM date_log ORDER BY id DESC LIMIT ?',
				[5],
			),
			historyDb.query!('SELECT count(*) AS total FROM date_log'),
		]);
		recentHistory = rows.map(row => ({
			value: String(row.value ?? ''),
			source: row.source === 'custom' ? 'custom' : 'quick',
			insertedAt: String(row.inserted_at ?? ''),
		}));
		totalHistoryCount = Number(countRows[0]?.total ?? 0);
	} else {
		const keys = await historyDb.keys('entry/');
		totalHistoryCount = keys.length;
		const latestKeys = keys.slice(-5).reverse();
		const loaded = await Promise.all(latestKeys.map(k => historyDb.get(k)));
		recentHistory = loaded.filter((item): item is HistoryEntry =>
			Boolean(item && typeof item === 'object' && typeof (item as HistoryEntry).value === 'string'),
		);
	}
	notify();
}

async function recordInsertion(value: string, source: 'quick' | 'custom') {
	const insertedAt = new Date().toISOString();
	const key = `entry/${insertedAt}-${String(++historySeq).padStart(4, '0')}`;
	// Always write to the named KV namespace (works in both standalone and server modes).
	await historyDb.set(key, { value, source, insertedAt });
	// In server mode, also log to SQLite so SQL queries can filter/count/order directly.
	if (hasSql) {
		await historyDb.exec!(
			'INSERT INTO date_log (value, source, inserted_at) VALUES (?, ?, ?)',
			[value, source, insertedAt],
		);
	}
	await refreshHistory();
}

async function clearHistory() {
	await historyDb.clear();
	if (hasSql) {
		await historyDb.exec!('DELETE FROM date_log');
	}
	await refreshHistory();
}

await refreshHistory();

function setDateFormat(next: DateFormatStyle) {
	dateFormat = next;
	void miyapad.storage.set('dateFormat', next);
	notify();
}

function setModalOpen(open: boolean) {
	modalOpen = open;
	notify();
}

function insertTextAtCursor(text: string, source: 'quick' | 'custom') {
	const editor = miyapad.editor;
	if (!editor) return;
	const { from, to } = editor.getSelection();
	editor.replaceRange(from, to, text);
	editor.setSelection(from + text.length, from + text.length);
	editor.focus();
	void recordInsertion(text, source);
}

function insertCurrentDate() {
	insertTextAtCursor(formatDate(dateFormat), 'quick');
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

// Collapsible sidebar section showing the live date preview, DB mode, recent history, and quick actions.
miyapad.hooks.sidebar.push({
	label: 'Date Helper',
	expanded: true,
	Component: function DateSidebar() {
		const [, setTick] = miyapad.React.useState(0);
		miyapad.React.useEffect(() => {
			const sync = () => setTick(n => n + 1);
			listeners.add(sync);
			return () => { listeners.delete(sync); };
		}, []);
		return miyapad.html`
			<div style=${{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
				<small>Today: ${formatDate(dateFormat)} (loads: ${loads})</small>
				<small>DB: ${hasSql ? 'SQLite + KV (server)' : 'IndexedDB KV (standalone)'}</small>
				<button type="button" onClick=${insertCurrentDate}>Insert date at cursor</button>
				<button type="button" onClick=${() => setModalOpen(true)}>Pick custom date…</button>
				${totalHistoryCount > 0 && miyapad.html`
					<div style=${{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
						<small>Recent (${totalHistoryCount}):</small>
						${recentHistory.map((item, idx) => miyapad.html`
							<button
								key=${`${item.insertedAt}-${idx}`}
								type="button"
								title=${`Re-insert (${item.source})`}
								onClick=${() => insertTextAtCursor(item.value, item.source)}>
								${item.value} (${item.source})
							</button>`)}
						<button type="button" onClick=${() => void clearHistory()}>Clear history</button>
					</div>`}
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
		insertTextAtCursor(text, 'custom');
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
