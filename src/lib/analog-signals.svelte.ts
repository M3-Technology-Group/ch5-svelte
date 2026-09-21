import type { ComLib } from './com-lib.js';

/**
 * Active Analog Signal subscription, returned by `Ch5Svelte.useAnalog`.
 */
export interface AnalogSignal {
	/**
	 * `$state` of the current value of the feedback signal. Set to write the value to the set signal.
	 */
	value: number;
}

/**
 * @internal
 */
export function createAnalogSignal(
	comLib: ComLib,
	fbSignal: string,
	setSignal?: string
): AnalogSignal {
	const _setSignal = setSignal ?? fbSignal;

	let value = $state((comLib.getState('n', fbSignal, 0) as number | null) ?? 0);

	$effect(() => {
		const sub = comLib.subscribeState('n', fbSignal, (v) => {
			value = v as number;
		});
		return () => {
			comLib.unsubscribeState('n', fbSignal, sub);
		};
	});

	return {
		get value() {
			return value;
		},
		set value(v) {
			comLib.publishEvent('n', _setSignal, v);
		}
	};
}
