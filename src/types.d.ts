interface MiyapadPluginContext {
	readonly id: string;
	readonly name: string;
	readonly version: string;
	readonly storage: {
		get(key: string): Promise<unknown>;
		set(key: string, value: unknown): Promise<void>;
		delete(key: string): Promise<void>;
		keys(): Promise<string[]>;
	};
	readonly hooks: {
		prompt: { push(fn: (prompt: string) => string | Promise<string>): void };
		output: { push(fn: (text: string, info: { complete: boolean }) => void | Promise<void>): void };
		commands: Array<{ label: string; action: () => void }>;
	};
}

declare const miyapad: MiyapadPluginContext;
