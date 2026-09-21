import type { ComLib } from './com-lib.js';

/**
 * How often a held digital is re-published as a RepeatDigital, in milliseconds.
 */
export const REPEAT_DIGITAL_INTERVAL_MS = 250;

/**
 * Press-and-hold state for one `Ch5Svelte` instance.
 *
 * A held digital is published as `{ repeatdigital: true }` immediately and again every
 * {@link REPEAT_DIGITAL_INTERVAL_MS} until released, then as `{ repeatdigital: false }` once. The
 * periodic re-send lets the control system drop the press if the UI disappears mid-hold, and it
 * does not trigger the CH5 emulator.
 *
 * @internal
 */
export class DigitalHoldTable {
	readonly #comLib: ComLib;
	readonly #active = new Map<string, ReturnType<typeof setInterval>>();

	constructor(comLib: ComLib) {
		this.#comLib = comLib;
	}

	isHeld(signal: string): boolean {
		return this.#active.has(signal);
	}

	/**
	 * Idempotent: holding an already-held signal or releasing an unheld one does nothing.
	 */
	set(signal: string, held: boolean): void {
		if (held) {
			if (this.#active.has(signal)) return;
			this.#comLib.publishEvent('o', signal, { repeatdigital: true });
			this.#active.set(
				signal,
				setInterval(() => {
					this.#comLib.publishEvent('o', signal, { repeatdigital: true });
				}, REPEAT_DIGITAL_INTERVAL_MS)
			);
			return;
		}
		const timer = this.#active.get(signal);
		if (timer === undefined) return;
		clearInterval(timer);
		this.#active.delete(signal);
		this.#comLib.publishEvent('o', signal, { repeatdigital: false });
	}

	/**
	 * Release every held signal.
	 */
	releaseAll(): void {
		for (const signal of Array.from(this.#active.keys())) {
			this.set(signal, false);
		}
	}
}
