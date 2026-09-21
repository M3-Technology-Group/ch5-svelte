import type { ComLib } from './com-lib.js';

/**
 * Active Serial Signal subscription, returned by `Ch5Svelte.useSerial`.
 */
export interface SerialSignal {
	/**
	 * `$state` of the current value of the feedback signal. Set to write the value to the set signal.
	 */
	value: string;
}

/**
 * @internal
 */
export function createSerialSignal(
	comLib: ComLib,
	fbSignal: string,
	setSignal?: string
): SerialSignal {
	const _setSignal = setSignal ?? fbSignal;

	let value = $state((comLib.getState('s', fbSignal, '') as string | null) ?? '');

	$effect(() => {
		const sub = comLib.subscribeState('s', fbSignal, (v) => {
			value = v as string;
		});
		return () => {
			comLib.unsubscribeState('s', fbSignal, sub);
		};
	});

	return {
		get value() {
			return value;
		},
		set value(v) {
			comLib.publishEvent('s', _setSignal, v);
		}
	};
}
