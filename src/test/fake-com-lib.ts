import type { ComLib, SignalValue } from '../lib/com-lib.js';

type Callback = (value: unknown) => void;

export interface Published {
	type: string;
	name: string;
	value: SignalValue;
}

const SEED: Record<string, SignalValue> = { b: false, n: 0, s: '', o: {} };

function key(type: string, name: string): string {
	return `${type.charAt(0).toLowerCase()}:${name}`;
}

/**
 * In-memory {@link ComLib} for tests. Mirrors the behaviour ch5-svelte relies on: synchronous
 * replay on subscribe, `getState` default until written, and publishes that echo to local
 * subscribers and are recorded for assertions.
 */
export class FakeComLib implements ComLib {
	readonly published: Published[] = [];
	readonly #values = new Map<string, SignalValue>();
	readonly #subs = new Map<string, Map<string, Callback>>();
	#nextId = 0;

	getState(type: string, name: string, defaultValue?: SignalValue): SignalValue | null {
		const current = this.#values.get(key(type, name));
		return current !== undefined ? current : (defaultValue ?? null);
	}

	subscribeState(type: string, name: string, callback: Callback): string {
		const k = key(type, name);
		const id = `${name}-${++this.#nextId}`;
		let subs = this.#subs.get(k);
		if (subs === undefined) {
			subs = new Map();
			this.#subs.set(k, subs);
		}
		subs.set(id, callback);
		callback(this.#values.get(k) ?? SEED[type.charAt(0).toLowerCase()]);
		return id;
	}

	unsubscribeState(type: string, name: string, subscriptionId: string): void {
		this.#subs.get(key(type, name))?.delete(subscriptionId);
	}

	publishEvent(type: string, name: string, value: SignalValue): void {
		this.published.push({ type, name, value });
		this.#write(type, name, value);
	}

	/** Simulate feedback arriving from the control system. */
	receive(type: string, name: string, value: SignalValue): void {
		this.#write(type, name, value);
	}

	subscriberCount(type: string, name: string): number {
		return this.#subs.get(key(type, name))?.size ?? 0;
	}

	publishedTo(name: string): Published[] {
		return this.published.filter((p) => p.name === name);
	}

	#write(type: string, name: string, value: SignalValue): void {
		const k = key(type, name);
		this.#values.set(k, value);
		for (const callback of Array.from(this.#subs.get(k)?.values() ?? [])) {
			callback(value);
		}
	}
}
