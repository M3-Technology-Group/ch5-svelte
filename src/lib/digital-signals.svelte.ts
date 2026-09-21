import type { ComLib } from './com-lib.js';
import type { DigitalHoldTable } from './digital-hold.js';

/**
 * Active Digital Signal subscription, returned by `Ch5Svelte.useDigital`.
 */
export interface DigitalSignal {
	/**
	 * `$state` of the current value of the feedback signal. Set to `true` to hold the set signal
	 * (RepeatDigital) and to `false` to release it.
	 */
	value: boolean;
	/**
	 * Pulse the set signal: an instantaneous rising and falling edge.
	 */
	pulse: () => void;
}

/**
 * @internal
 */
export function createDigitalSignal(
	comLib: ComLib,
	holds: DigitalHoldTable,
	fbSignal: string,
	setSignal?: string
): DigitalSignal {
	const _setSignal = setSignal ?? fbSignal;

	let value = $state((comLib.getState('b', fbSignal, false) as boolean | null) ?? false);

	$effect(() => {
		const sub = comLib.subscribeState('b', fbSignal, (v) => {
			value = v as boolean;
		});
		return () => {
			comLib.unsubscribeState('b', fbSignal, sub);
			// If this signal is still held when the component is destroyed, release it.
			if (holds.isHeld(_setSignal)) {
				holds.set(_setSignal, false);
			}
		};
	});

	return {
		get value() {
			return value;
		},
		set value(v) {
			holds.set(_setSignal, v);
		},
		pulse: () => pulseDigital(comLib, _setSignal)
	};
}

/**
 * @internal
 */
export function pulseDigital(comLib: ComLib, signal: string): void {
	comLib.publishEvent('b', signal, true);
	comLib.publishEvent('b', signal, false);
}
