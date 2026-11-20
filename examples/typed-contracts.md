---
title: Typed Contract Examples
group: Examples
category: Examples
---

# Typed Contract Examples

A contract type lets `svelte-check` and your editor check every signal name against your Contract Editor contract: that the name exists, that it is the right signal type, and that it travels in the right direction. This page shows how to write the contract type and how to use it.

Typed contracts are optional. A plain `new Ch5Svelte()` accepts any signal name or join number, as in the other example pages.

## How Contract Editor Names Are Built

The Contract Editor builds each signal name from the instance it belongs to and the signal's own name, joined with a dot. These are the names in the `cse2j` file, and the names a contract type lists.

| In the Contract Editor                                      | Signal names                                      |
| ----------------------------------------------------------- | ------------------------------------------------- |
| Instance `Mic` with a signal `Level`                        | `Mic.Level`                                       |
| Instance `Lights` with a count of 3 and a signal `On`       | `Lights[0].On`, `Lights[1].On`, `Lights[2].On`    |
| Instance `Scope` (count 2) inside each `Lights` instance    | `Lights[0].Scope[0].On`, `Lights[0].Scope[1].On`… |
| Instance `My Room` with a signal `On` (a space in the name) | `My_Room.On`                                      |

- The `[index]` part is only added when the instance count is above 1. It starts at 0.
- Signals are split by direction. A _state_ travels from the control system to the panel (feedback to show). An _event_ travels from the panel to the control system (a user action).
- Signals are also split by type: digital (boolean), analog (numeric) and serial (string).

## Writing the Contract Type

A contract type extends `Ch5Contract` and lists the state names and event names of each signal type. Use `never` where the contract has none.

`src/ch5.ts`:

```typescript
import { Ch5Svelte, type Ch5Contract } from 'ch5-svelte';

export interface RoomContract extends Ch5Contract {
	digital: {
		states: 'Mic.Mute' | 'Program.Mute' | `Lights[${number}].On`;
		events: 'Mic.MutePress' | 'Program.MutePress' | `Lights[${number}].Press`;
	};
	analog: {
		states: 'Mic.Level' | 'Program.Level';
		events: 'Mic.LevelSet' | 'Program.LevelSet';
	};
	serial: {
		states: 'Status.Text' | `Lights[${number}].Name`;
		events: never;
	};
}

export const ch5 = new Ch5Svelte<RoomContract>();
```

An instance with a count of 1 is written as a plain name, such as `'Mic.Mute'`. An instance with a count above 1 is written once, with `${number}` in place of the index: `` `Lights[${number}].On` `` covers `Lights[0].On`, `Lights[1].On` and so on. Note the backticks, which make it a pattern rather than a fixed name.

The examples below all use this contract.

## What Gets Checked

```typescript
ch5.useDigital('Mic.Mute', 'Mic.MutePress'); // ok
ch5.useDigital('Mic.Mutee', 'Mic.MutePress'); // error: not a digital state
ch5.useDigital('Mic.MutePress', 'Mic.Mute'); // error: state and event swapped
ch5.useDigital('Mic.Level'); // error: an analog name on a digital
ch5.pulseDigital('Mic.Mute'); // error: a state, not an event
ch5.setSerial('Status.Text', 'Hello'); // error: the contract has no serial events
ch5.useDigital('1'); // error: join numbers are not contract names
```

The first argument of `useDigital`, `useAnalog` and `useSerial` must be a state, and the second an event. `pulseDigital`, `setDigital`, `setAnalog` and `setSerial` take events.

## Read-Only Signals

A `use*` call with a state and no event gives a read-only signal. Reading `value` works as usual; assigning to it, or calling `pulse()`, is a type error.

```svelte
<script lang="ts">
	import { ch5 } from './ch5';

	const status = ch5.useSerial('Status.Text');
</script>

<p>{status.value}</p>
```

```typescript
status.value = 'Hello'; // error: read-only
```

This is a type-level check only, and `svelte-check` does not apply it to `bind:value`. Do not bind to a signal created without an event.

## One Component for Several Instances

`Mic` and `Program` are two instances of the same contract component, so one Svelte component can serve both. Type the prop as the instance names, and build the signal names from it.

`Volume.svelte`:

```svelte
<script lang="ts">
	import { ch5 } from './ch5';

	let { instance }: { instance: 'Mic' | 'Program' } = $props();

	// The signals are created once, for the instance this component is mounted with.
	// svelte-ignore state_referenced_locally
	const name = instance;

	const level = ch5.useAnalog(`${name}.Level`, `${name}.LevelSet`);
	const mute = ch5.useDigital(`${name}.Mute`, `${name}.MutePress`);
</script>

<input type="range" min="0" max="65535" bind:value={level.value} />
<button onclick={() => mute.pulse()}>{mute.value ? 'Unmute' : 'Mute'}</button>
```

```svelte
<Volume instance="Mic" />
<Volume instance="Program" />
```

Every name the template can produce is checked: `` `${name}.Mutee` `` is an error, and so is `<Volume instance="Aux" />`.

The `use*` methods subscribe once, when the component is created, so the component reads the prop a single time. Svelte warns about that by default, because a later change to the prop would not be followed. The `svelte-ignore` comment says it is intended.

## Arrays of Instances

For an instance with a count above 1, put the index into the signal name. Any `number` is accepted, so this works with a loop index.

`LightButton.svelte`:

```svelte
<script lang="ts">
	import { ch5 } from './ch5';

	let { index }: { index: number } = $props();

	// The signals are created once, for the index this component is mounted with.
	// svelte-ignore state_referenced_locally
	const light = `Lights[${index}]` as const;

	const on = ch5.useDigital(`${light}.On`, `${light}.Press`);
	const name = ch5.useSerial(`${light}.Name`);
</script>

<button style="background-color: {on.value ? 'green' : ''}" onclick={() => on.pulse()}>
	{name.value}
</button>
```

```svelte
<script lang="ts">
	import LightButton from './LightButton.svelte';
</script>

{#each { length: 3 }, index}
	<LightButton {index} />
{/each}
```

The `as const` keeps `light` typed as `` `Lights[${number}]` `` and not as a plain `string`, which the contract would reject. The same type works for passing an instance name around, for example as a prop: ``let { light }: { light: `Lights[${number}]` } = $props();``.

The `use*` calls are in the child component because they must run during component initialization. They cannot be called inside an `{#each}` block.

### Nested Arrays

An instance inside an array instance has one index per level. Each gets its own `${number}`:

```typescript
interface PresetContract extends Ch5Contract {
	digital: {
		states: `Presets.Preset[${number}].Scope[${number}].Included`;
		events: `Presets.Preset[${number}].Scope[${number}].SetIncluded`;
	};
	analog: { states: never; events: never };
	serial: { states: never; events: never };
}
```

```typescript
const included = ch5.useDigital(
	`Presets.Preset[${preset}].Scope[${scope}].Included`,
	`Presets.Preset[${preset}].Scope[${scope}].SetIncluded`
);
```

### The Index Is Not Range Checked

`${number}` accepts any number. With the contract above, `'Lights[999].On'` compiles even though the contract only has three lights. The instance name, the signal name, the signal type and the direction are still checked.

If you want the range checked, list the indexes in the pattern:

```typescript
states: `Lights[${0 | 1 | 2}].On`;
```

`'Lights[3].On'` is then an error. The cost is that a plain `number` is no longer accepted, so a loop index has to be typed as `0 | 1 | 2` as well.

## Signals Outside the Contract

A contract-typed instance does not accept join numbers or names that are not in the contract. For the rare signal that sits outside it, use the com lib directly:

```typescript
ch5.comLib.publishEvent('b', '1', true);
```

## Things to Know

- The contract type exists only at compile time. Nothing changes at runtime, and the panel still needs the `contract.cse2j` file (see the README, "Contract Setup").
- The contract type is not read from the `cse2j` file. If the contract changes in the Contract Editor, update the type to match.
- A name built from a plain `string` is rejected. Type the parts you build names from, as the examples above do.
