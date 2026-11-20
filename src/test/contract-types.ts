/**
 * Compile-time tests for the contract typing of `Ch5Svelte`. Nothing here runs: `pnpm check` fails
 * if a line that must compile does not, or if a `@ts-expect-error` line stops being an error.
 */
import {
	Ch5Svelte,
	type AnalogSignal,
	type Ch5Contract,
	type DigitalSignal,
	type ReadonlyAnalogSignal,
	type ReadonlyDigitalSignal,
	type ReadonlySerialSignal,
	type SerialSignal
} from '../lib/index.js';

type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
declare function expectType<Expected>(): <Actual>(
	value: Actual,
	...same: Equal<Actual, Expected> extends true ? [] : [never]
) => void;

declare const anyName: string;

// Without a contract: everything 2.0 accepted still compiles, and every signal is writable.
export function untyped(ch5: Ch5Svelte) {
	expectType<DigitalSignal>()(ch5.useDigital('1'));
	expectType<DigitalSignal>()(ch5.useDigital(anyName));
	expectType<DigitalSignal>()(ch5.useDigital('Toggle.Out', 'Toggle.Toggle'));
	expectType<AnalogSignal>()(ch5.useAnalog('2'));
	expectType<SerialSignal>()(ch5.useSerial('3'));
	ch5.useDigital('1').pulse();
	ch5.useAnalog('2').value = 5;

	// A wrapper that forwards an optional set signal.
	const wrap = (fb: string, set?: string) => ch5.useDigital(fb, set);
	expectType<DigitalSignal>()(wrap('1'));

	ch5.pulseDigital(anyName);
	ch5.setDigital('1', true);
	ch5.setAnalog('2', 5);
	ch5.setSerial('3', 'text');
}

interface TestContract extends Ch5Contract {
	digital: {
		states: 'Mic.Mute' | 'Program.Mute' | 'Both';
		events: 'Mic.MutePress' | 'Program.MutePress' | 'Both';
	};
	analog: { states: 'Mic.Level' | 'Program.Level'; events: 'Mic.LevelSet' | 'Program.LevelSet' };
	serial: { states: 'Status.Text'; events: never };
}

export function typed(ch5: Ch5Svelte<TestContract>, instance: 'Mic' | 'Program') {
	// State and event: writable.
	expectType<DigitalSignal>()(ch5.useDigital('Mic.Mute', 'Mic.MutePress'));
	expectType<AnalogSignal>()(ch5.useAnalog('Mic.Level', 'Mic.LevelSet'));

	// State only: read-only.
	const mute = ch5.useDigital('Mic.Mute');
	expectType<ReadonlyDigitalSignal>()(mute);
	expectType<ReadonlyAnalogSignal>()(ch5.useAnalog('Mic.Level'));
	expectType<ReadonlySerialSignal>()(ch5.useSerial('Status.Text'));
	// @ts-expect-error read-only value
	mute.value = true;
	// @ts-expect-error no pulse on a read-only signal
	mute.pulse();

	// A name that is both a state and an event stays writable on its own.
	expectType<DigitalSignal>()(ch5.useDigital('Both'));

	// Names built from an instance name.
	expectType<AnalogSignal>()(ch5.useAnalog(`${instance}.Level`, `${instance}.LevelSet`));
	expectType<ReadonlyAnalogSignal>()(ch5.useAnalog(`${instance}.Level`));
	// @ts-expect-error not a contract name for any instance
	ch5.useAnalog(`${instance}.Lvl`);

	// @ts-expect-error typo in the state
	ch5.useDigital('Mic.Mutee');
	// @ts-expect-error typo in the event
	ch5.useDigital('Mic.Mute', 'Mic.MutePres');
	// @ts-expect-error state and event swapped
	ch5.useDigital('Mic.MutePress', 'Mic.Mute');
	// @ts-expect-error analog name on a digital
	ch5.useDigital('Mic.Level');
	// @ts-expect-error join numbers are not contract names
	ch5.useDigital('1');
	// @ts-expect-error arbitrary strings are not contract names
	ch5.useDigital(anyName);
	// @ts-expect-error the contract has no serial events
	ch5.useSerial('Status.Text', 'Status.Text');

	ch5.pulseDigital('Mic.MutePress');
	ch5.setDigital('Both', true);
	ch5.setAnalog(`${instance}.LevelSet`, 5);
	// @ts-expect-error a state is not an event
	ch5.pulseDigital('Mic.Mute');
	// @ts-expect-error a state is not an event
	ch5.setAnalog('Mic.Level', 5);
	// @ts-expect-error the contract has no serial events
	ch5.setSerial('Status.Text', 'text');
	// @ts-expect-error join numbers are not contract names
	ch5.setDigital('1', true);

	// The escape hatch is still there.
	ch5.comLib.publishEvent('b', '1', true);
}

// Arrays of instances: a contract type can describe every index with one `${number}` pattern, the
// form a generator emits for an instance with a count above 1.
interface ArrayContract extends Ch5Contract {
	digital: {
		states: `Lights[${number}].On` | `Presets.Preset[${number}].Scope[${number}].Included`;
		events: `Lights[${number}].Press` | `Presets.Preset[${number}].Scope[${number}].SetIncluded`;
	};
	analog: { states: 'Mic.Level' | `Zone[${0 | 1}].Level`; events: 'Mic.LevelSet' };
	serial: { states: `Lights[${number}].Name`; events: never };
}

export function arrays(
	ch5: Ch5Svelte<ArrayContract>,
	i: number,
	j: number,
	light: `Lights[${number}]`
) {
	// A numeric index, as in an {#each} loop.
	expectType<DigitalSignal>()(ch5.useDigital(`Lights[${i}].On`, `Lights[${i}].Press`));
	expectType<ReadonlyDigitalSignal>()(ch5.useDigital(`Lights[${i}].On`));
	expectType<ReadonlySerialSignal>()(ch5.useSerial(`Lights[${i}].Name`));
	ch5.pulseDigital(`Lights[${i}].Press`);

	// A literal index, and an instance name passed around as a value.
	expectType<DigitalSignal>()(ch5.useDigital('Lights[0].On', 'Lights[0].Press'));
	expectType<DigitalSignal>()(ch5.useDigital(`${light}.On`, `${light}.Press`));

	// Nested arrays.
	expectType<DigitalSignal>()(
		ch5.useDigital(
			`Presets.Preset[${i}].Scope[${j}].Included`,
			`Presets.Preset[${i}].Scope[${j}].SetIncluded`
		)
	);

	// @ts-expect-error typo in the signal name
	ch5.useDigital(`Lights[${i}].Onn`);
	// @ts-expect-error typo in the instance name
	ch5.useDigital(`Light[${i}].On`);
	// @ts-expect-error the index is missing
	ch5.useDigital('Lights.On');
	// @ts-expect-error the index is not a number
	ch5.useDigital('Lights[first].On');
	// @ts-expect-error one index short
	ch5.useDigital(`Presets.Preset[${i}].Scope.Included`);
	// @ts-expect-error state and event swapped
	ch5.useDigital(`Lights[${i}].Press`, `Lights[${i}].On`);
	// @ts-expect-error a state is not an event
	ch5.pulseDigital(`Lights[${i}].On`);
	// @ts-expect-error serial name on a digital
	ch5.useDigital(`Lights[${i}].Name`);

	// A `${number}` pattern does not check the range of the index.
	ch5.useDigital('Lights[999].On');

	// A union of indexes does, at the cost of rejecting a plain `number`.
	ch5.useAnalog('Zone[1].Level');
	// @ts-expect-error out of range
	ch5.useAnalog('Zone[2].Level');
	// @ts-expect-error a number is not 0 | 1
	ch5.useAnalog(`Zone[${i}].Level`);
}
