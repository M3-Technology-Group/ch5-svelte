/**
 * Any value a Crestron signal can carry.
 */
export type SignalValue = boolean | number | string | object;

/**
 * The subset of the Crestron CrComLib signal API that ch5-svelte depends on.
 *
 * Both `window.CrComLib` (from `@crestron/ch5-crcomlib`) and a `MicroComLib` instance satisfy this
 * interface, and so does any object that implements these four methods, such as a mock in tests.
 *
 * `type` is a CrComLib type string: `'b'`/`'boolean'`, `'n'`/`'number'`/`'numeric'`,
 * `'s'`/`'string'` or `'o'`/`'object'`. `name` is a signal name from a contract file, or a join
 * number as a string.
 */
export interface ComLib {
	/**
	 * Current value of a signal, or `defaultValue` (else `null`) if the signal has never been written.
	 */
	getState(type: string, name: string, defaultValue?: SignalValue): SignalValue | null;
	/**
	 * Subscribe to a signal. `callback` is invoked synchronously with the current value, then on every
	 * change. Returns the subscription id to pass to {@link ComLib.unsubscribeState}.
	 */
	subscribeState(
		type: string,
		name: string,
		callback: (value: unknown) => void,
		errorCallback?: (error: unknown) => void
	): string;
	/**
	 * Remove a subscription created by {@link ComLib.subscribeState}.
	 */
	unsubscribeState(type: string, name: string, subscriptionId: string): void;
	/**
	 * Write a value locally and send it to the control system.
	 */
	publishEvent(type: string, name: string, value: SignalValue): void;
}

const COM_LIB_METHODS = ['getState', 'subscribeState', 'unsubscribeState', 'publishEvent'] as const;

/**
 * Runtime check that `candidate` implements {@link ComLib}.
 */
export function isComLib(candidate: unknown): candidate is ComLib {
	if ((typeof candidate !== 'object' && typeof candidate !== 'function') || candidate === null) {
		return false;
	}
	const record = candidate as Record<string, unknown>;
	return COM_LIB_METHODS.every((method) => typeof record[method] === 'function');
}

/**
 * The Crestron CrComLib, as loaded by a `<script src="cr-com-lib.js">` tag onto `window.CrComLib`.
 *
 * Use this to opt into the CrComLib instead of the default MicroComLib:
 *
 * ```ts
 * import { Ch5Svelte, crComLibFromWindow } from 'ch5-svelte';
 * export const ch5 = new Ch5Svelte(crComLibFromWindow());
 * ```
 *
 * **Not the recommended path.** MicroComLib is the default for a reason: no script tag, no build
 * plugin, no ~1.8 MB UMD bundle. Reach for the CrComLib only if you have a concrete reason to need
 * it, most commonly that you also use native CH5 web components elsewhere on the page, which
 * MicroComLib does not implement.
 *
 * @throws {Error} if `window.CrComLib` is missing or is not the full CrComLib. MicroComLib installs a
 * receive-only `CrComLib` shim for Web XPanel, so this also throws when MicroComLib is in use.
 */
export function crComLibFromWindow(): ComLib {
	const candidate = (globalThis as { CrComLib?: unknown }).CrComLib;
	if (!isComLib(candidate)) {
		throw new Error(
			'ch5-svelte: window.CrComLib is not available. Include the cr-com-lib.js script before your app starts ' +
				'(see the README section "Using the Crestron CrComLib"). If you are using MicroComLib, ' +
				'construct Ch5Svelte without arguments instead.'
		);
	}
	return candidate;
}
