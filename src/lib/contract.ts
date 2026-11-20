/**
 * The signal names of one signal type, split by direction.
 */
export interface SignalNames {
	/**
	 * Names of the states: control system to panel (feedback to show).
	 */
	states: string;
	/**
	 * Names of the events: panel to control system (user actions).
	 */
	events: string;
}

/**
 * The shape of a contract type, passed to {@link Ch5Svelte} as `new Ch5Svelte<MyContract>()` to
 * have signal names checked at compile time.
 *
 * Each member is a union of the signal names the contract defines. Use `never` where the contract
 * has no signals of that kind:
 *
 * ```ts
 * import { Ch5Svelte, type Ch5Contract } from 'ch5-svelte';
 *
 * interface RoomContract extends Ch5Contract {
 * 	digital: { states: 'Mic.Mute'; events: 'Mic.MutePress' };
 * 	analog: { states: 'Mic.Level'; events: 'Mic.LevelSet' };
 * 	serial: { states: 'Status.Text'; events: never };
 * }
 *
 * export const ch5 = new Ch5Svelte<RoomContract>();
 * ```
 *
 * An instance with a count above 1 has an index in its signal names (`Lights[0].On`,
 * `Lights[1].On`, ...). Write these once, as a template literal type with `${number}` in place of
 * the index. Any number is then accepted, so a loop index works; the range is not checked:
 *
 * ```ts
 * interface LightsContract extends Ch5Contract {
 * 	digital: { states: `Lights[${number}].On`; events: `Lights[${number}].Press` };
 * 	analog: { states: never; events: never };
 * 	serial: { states: `Lights[${number}].Name`; events: never };
 * }
 * ```
 *
 * `Ch5Contract` itself accepts any string, and is the default: a plain `new Ch5Svelte()` takes any
 * signal name or join number.
 */
export interface Ch5Contract {
	digital: SignalNames;
	analog: SignalNames;
	serial: SignalNames;
}

/**
 * Return type of the `use*` methods: `Writable` when an event is given, or when the single name is
 * also an event of the contract (always the case without a contract); otherwise `Readonly`.
 *
 * @internal
 */
export type SignalFor<State, Event, Events, Writable, Readonly> = Event extends undefined
	? [State] extends [Events]
		? Writable
		: Readonly
	: Writable;
