import { MicroComLib } from 'microcomlib';
import { isComLib, type ComLib } from './com-lib.js';
import { DigitalHoldTable } from './digital-hold.js';
import { createDigitalSignal, pulseDigital, type DigitalSignal } from './digital-signals.svelte.js';
import { createAnalogSignal, type AnalogSignal } from './analog-signals.svelte.js';
import { createSerialSignal, type SerialSignal } from './serial-signals.svelte.js';

/**
 * Crestron CH5 signals as Svelte 5 runes.
 *
 * Create one instance for your app, export it, and call the `use*` methods from your components:
 *
 * ```ts
 * // src/lib/ch5.ts
 * import { Ch5Svelte } from 'ch5-svelte';
 *
 * export const ch5 = new Ch5Svelte();
 * ```
 *
 * ```svelte
 * <script lang="ts">
 *   import { ch5 } from '$lib/ch5';
 *
 *   const toggle = ch5.useDigital('Toggle.Out', 'Toggle.Toggle');
 * </script>
 *
 * <button onclick={() => toggle.pulse()}>Toggle is {toggle.value ? 'on' : 'off'}</button>
 * ```
 *
 * With no constructor argument the instance uses MicroComLib. Pass
 * {@link crComLibFromWindow | crComLibFromWindow()} to use the Crestron CrComLib instead, or any
 * object that implements {@link ComLib}.
 */
export class Ch5Svelte {
	/**
	 * The com lib this instance talks to. Use it directly for anything ch5-svelte does not wrap.
	 */
	readonly comLib: ComLib;

	readonly #holds: DigitalHoldTable;

	/**
	 * @param comLib The signal layer to use. Defaults to `MicroComLib.getInstance()`, which also
	 * installs the host hooks that Crestron panels and Web XPanel deliver feedback through. When
	 * using Web XPanel, create this instance before calling `WebXPanel.initialize()`.
	 * @throws {TypeError} if `comLib` is given but does not implement {@link ComLib}.
	 */
	constructor(comLib?: ComLib) {
		if (comLib !== undefined && !isComLib(comLib)) {
			throw new TypeError(
				'Ch5Svelte: comLib must implement getState, subscribeState, unsubscribeState and publishEvent. ' +
					'Use crComLibFromWindow() for the Crestron CrComLib, or omit the argument to use MicroComLib.'
			);
		}
		this.comLib = comLib ?? MicroComLib.getInstance();
		this.#holds = new DigitalHoldTable(this.comLib);
	}

	/**
	 * Subscribe to a digital signal.
	 *
	 * The returned `value` is a `$state<boolean>` rune that follows the feedback signal. Setting
	 * `value` to `true` holds the set signal as a RepeatDigital, re-sent every 250 ms, and setting
	 * it to `false` releases it. A held signal is released automatically when the component that
	 * called `useDigital` is destroyed. `pulse()` sends an instantaneous rising and falling edge,
	 * which is the right choice for anything that does not need a persistent hold.
	 *
	 * Must be called during component initialization, because it uses `$effect` to manage the
	 * subscription.
	 *
	 * @param fbSignal Signal name in the contract file, or join number as a string, to receive feedback from.
	 * @param setSignal Signal name or join number to write to. Defaults to `fbSignal`.
	 */
	useDigital(fbSignal: string, setSignal?: string): DigitalSignal {
		return createDigitalSignal(this.comLib, this.#holds, fbSignal, setSignal);
	}

	/**
	 * Subscribe to an analog signal.
	 *
	 * The returned `value` is a `$state<number>` rune that follows the feedback signal. Setting
	 * `value` writes it to the set signal, which makes it suitable for `bind:value` on a range or
	 * number input.
	 *
	 * Must be called during component initialization, because it uses `$effect` to manage the
	 * subscription.
	 *
	 * @param fbSignal Signal name in the contract file, or join number as a string, to receive feedback from.
	 * @param setSignal Signal name or join number to write to. Defaults to `fbSignal`.
	 */
	useAnalog(fbSignal: string, setSignal?: string): AnalogSignal {
		return createAnalogSignal(this.comLib, fbSignal, setSignal);
	}

	/**
	 * Subscribe to a serial signal.
	 *
	 * The returned `value` is a `$state<string>` rune that follows the feedback signal. Setting
	 * `value` writes it to the set signal, which makes it suitable for `bind:value` on a text input.
	 *
	 * Must be called during component initialization, because it uses `$effect` to manage the
	 * subscription.
	 *
	 * @param fbSignal Signal name in the contract file, or join number as a string, to receive feedback from.
	 * @param setSignal Signal name or join number to write to. Defaults to `fbSignal`.
	 */
	useSerial(fbSignal: string, setSignal?: string): SerialSignal {
		return createSerialSignal(this.comLib, fbSignal, setSignal);
	}

	/**
	 * Hold (`true`) or release (`false`) a digital signal without subscribing to feedback.
	 *
	 * Uses RepeatDigital under the hood: while held, the signal is re-sent every 250 ms so the
	 * control system can drop the press if the UI disconnects. Holding an already-held signal or
	 * releasing an unheld one does nothing.
	 *
	 * @param signal Signal name in the contract file, or join number as a string.
	 * @param value `true` to hold, `false` to release.
	 */
	setDigital(signal: string, value: boolean): void {
		this.#holds.set(signal, value);
	}

	/**
	 * Pulse a digital signal: an instantaneous rising and falling edge. Use this for anything that
	 * does not need a persistent hold.
	 *
	 * @param signal Signal name in the contract file, or join number as a string.
	 */
	pulseDigital(signal: string): void {
		pulseDigital(this.comLib, signal);
	}

	/**
	 * Write an analog value without subscribing to feedback.
	 *
	 * @param signal Signal name in the contract file, or join number as a string.
	 * @param value Value to send, 0 to 65535.
	 */
	setAnalog(signal: string, value: number): void {
		this.comLib.publishEvent('n', signal, value);
	}

	/**
	 * Write a serial value without subscribing to feedback.
	 *
	 * @param signal Signal name in the contract file, or join number as a string.
	 * @param value String to send.
	 */
	setSerial(signal: string, value: string): void {
		this.comLib.publishEvent('s', signal, value);
	}

	/**
	 * Release every digital signal this instance is currently holding. Useful in a `beforeunload`
	 * handler, or whenever the UI is about to go away without its components being destroyed.
	 */
	releaseAll(): void {
		this.#holds.releaseAll();
	}
}
