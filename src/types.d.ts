type ReactNode = unknown;
type ComponentType<P = Record<string, never>> = (props: P) => ReactNode;

interface PromptHookContext {
	readonly dryRun: boolean;
	readonly mode: 'completion' | 'chat' | 'fill';
	abort: () => void;
	params: (overrides: Record<string, unknown>) => void;
}

interface MessagesHookContext {
	readonly dryRun: boolean;
	abort: () => void;
	params: (overrides: Record<string, unknown>) => void;
}

interface ChatMessage {
	role: string;
	content: string;
}

interface ContextInjectionEntry {
	text: string;
	position?: 'before' | 'after' | 'depth';
	depth?: number;
	scanWorldInfo?: boolean;
}

interface PluginEditor {
	getText(): string;
	getSelection(): { from: number; to: number };
	replaceText(newText: string): void;
	replaceRange(from: number, to: number, insert: string): void;
	replaceRanges(changes: Array<{ from: number; to: number; insert: string }>): void;
	focus(): void;
	scrollIntoView(pos: number, options?: { y?: string }): void;
	setSelection(anchor: number, head: number): void;
	posAtCoords(coords: { x: number; y: number }): number | null;
	coordsAtPos(pos: number): { top: number; left: number; right: number; bottom: number } | null;
	readonly dom: HTMLElement;
}

interface PluginUiControls {
	readonly Modal: ComponentType<{
		isOpen: boolean;
		onClose: () => void;
		title: string;
		description?: string;
		children?: ReactNode;
	}>;
	readonly InputBox: ComponentType<{
		label: string;
		value: string | number;
		onValueChange: (value: string | number) => void;
		type?: string;
		placeholder?: string;
		readOnly?: boolean;
		disabled?: boolean;
	}>;
	readonly InputSlider: ComponentType<{
		label: string;
		value: number;
		onValueChange: (value: number) => void;
		min?: number;
		max?: number;
		step?: number;
		readOnly?: boolean;
	}>;
	readonly SelectBox: ComponentType<{
		label: string;
		value: string;
		onValueChange: (value: string) => void;
		options: Array<{ name: string; value: string }>;
		disabled?: boolean;
	}>;
	readonly Checkbox: ComponentType<{
		label: string;
		value: boolean;
		onValueChange: (value: boolean) => void;
		disabled?: boolean;
	}>;
	readonly CollapsibleGroup: ComponentType<{
		label: string;
		stateLabel?: string;
		expanded?: boolean;
		children?: ReactNode;
	}>;
}

type SqlParam = string | number | boolean | null;

interface PluginDbNamespace {
	get(key: string): Promise<unknown>;
	set(key: string, value: unknown): Promise<void>;
	delete(key: string): Promise<void>;
	keys(prefix?: string): Promise<string[]>;
	clear(): Promise<void>;
	/** Server-only raw SQL query returning rows (`undefined` in standalone mode). */
	query?: (sql: string, params?: SqlParam[]) => Promise<Record<string, unknown>[]>;
	/** Server-only raw SQL execution (`undefined` in standalone mode). */
	exec?: (sql: string, params?: SqlParam[]) => Promise<void>;
}

interface MiyapadPluginContext {
	readonly id: string;
	readonly name: string;
	readonly version: string;
	readonly React: {
		useState<T>(initial: T | (() => T)): [T, (next: T | ((prev: T) => T)) => void];
		useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
	};
	readonly html: (strings: TemplateStringsArray, ...values: unknown[]) => ReactNode;
	readonly ui: PluginUiControls;
	readonly editor: PluginEditor | undefined;
	readonly storage: PluginDbNamespace;
	readonly db: (name: string) => PluginDbNamespace;
	readonly sessionData: {
		readonly sessionId: number | undefined;
		get(key: string): unknown;
		keys(): string[];
		set(key: string, value: unknown, opts?: { sessionId?: number }): boolean;
		delete(key: string, opts?: { sessionId?: number }): boolean;
		clear(opts?: { sessionId?: number }): boolean;
	};
	readonly context: {
		setInjection(key: string, entry: ContextInjectionEntry | null): void;
		setPlaceholder(name: string, fn: (() => string) | null): void;
	};
	readonly events: {
		on(event: string, fn: (payload?: unknown) => void): void;
		once(event: string, fn: (payload?: unknown) => void): void;
		off(event: string, fn: (payload?: unknown) => void): void;
	};
	readonly generate: (options: {
		prompt?: string;
		messages?: ChatMessage[];
		connectionId?: string;
		samplerPresetId?: string;
		maxTokens?: number;
		temperature?: number;
		stop?: string[];
		params?: Record<string, unknown>;
		signal?: AbortSignal;
	}) => Promise<string>;
	readonly hooks: {
		prompt: { push(fn: (prompt: string, ctx: PromptHookContext) => string | Promise<string>): void };
		messages: { push(fn: (messages: ChatMessage[], ctx: MessagesHookContext) => ChatMessage[] | Promise<ChatMessage[]>): void };
		output: { push(fn: (text: string, info: { complete: boolean }) => void | Promise<void>): void };
		commands: Array<{ label: string; action: () => void }>;
		settings(entry: { mode?: 'inline' | 'modal'; Component: ComponentType }): void;
		sidebar: { push(entry: { label: string; Component: ComponentType; expanded?: boolean }): void };
		modals: { push(Component: ComponentType): void };
		toolbar: {
			push(entry: {
				title: string;
				icon: ReactNode | ComponentType;
				active?: boolean | (() => boolean);
				disabled?: boolean | (() => boolean);
				onClick: () => void;
			}): void;
		};
	};
}

declare const miyapad: MiyapadPluginContext;
