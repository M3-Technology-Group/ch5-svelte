---
title: Analog Signal Examples
group: Examples
category: Examples
---

# Analog Signal Examples

This is a collection of example uses of analog signals. Only basic HTML constructs are used, and no styling is provided. Pick your favorite CSS framework, and or Svelte component library and style it as you like.

> These examples assume you created and exported a `Ch5Svelte` instance as `ch5` (see the README, "Create your instance"). Adjust the import path to match your project.

## Progress Bar

```svelte
<script lang="ts">
	import { ch5 } from './ch5';

	const progress = ch5.useAnalog('ramp.levelF');
</script>

<progress value={progress.value} max="65535"></progress>
```

`useAnalog` provides an analog signal object that contains a single property `value`. `value` is a `$state<number>` rune that will automatically update in real time when used in a component.

Here we use the HTML Progress element and pass in `progress.value` and set the max to 65535 to display a dynamically updated progress bar that ranges from `0%` or `0d` to `100%` or `65535d`.

## Fader/Slider

```svelte
<script lang="ts">
	import { ch5 } from './ch5';

	const fader = ch5.useAnalog('ramp.levelF', 'ramp.level');
</script>

<input type="range" bind:value={fader.value} min="0" max="65535" />
```

`useAnalog` can optionally take two arguments. The first argument is the signal to read (Feedback from control system), and the second argument is the signal to write (event to control system). When the `value` property is read from, the value ui dynamically updated based on the real-time value of the feedback signal. when the `value` property is written to, the value is transmitted to the control system using the signal name specified in the second argument to `useAnalog`. If only one signal name is passed into `useAnalog` the same name or join is used for both read and write.

Because the `value` property on the returned signal implements both getters and setters, we can simply bind the `value` property of a HTML Input element of type `range` to the `value` property of the analog signal object. This gives us a two-way slider that responds to control system feedback in real time.

## Fader/Slider with Up and Down Buttons.

```svelte
<script lang="ts">
	import { ch5 } from './ch5';

	const fader = ch5.useAnalog('ramp.levelF', 'ramp.level');
	const up = ch5.useDigital('ramp.Up');
	const down = ch5.useDigital('ramp.Down');
</script>

<button
	onpointerdown={() => (down.value = true)}
	onpointerup={() => (down.value = false)}
	onpointerout={() => (down.value = false)}
	oncontextmenu={(e) => e.preventDefault()}
>
	Volume Down
</button>

<input type="range" bind:value={fader.value} min="0" max="65535" />

<button
	onpointerdown={() => (up.value = true)}
	onpointerup={() => (up.value = false)}
	onpointerout={() => (up.value = false)}
	oncontextmenu={(e) => e.preventDefault()}
>
	Volume UP
</button>
```

Because the fader already reactively responds to the control system's state, all you need to do is add a set of up and down buttons. See the Digital Examples section for an explication on how to implement a press-and-hold button.

## Numeric Input

```svelte
<script lang="ts">
	import { ch5 } from './ch5';

	const numericEntry = ch5.useAnalog('ramp.levelF', 'ramp.level');
</script>

<input type="number" bind:value={numericEntry.value} min="0" max="65535" />
```

This provides a simple input field that allows a user to enter a numeric value. `useAnalog` never rescales its value, so the input's `min`/`max` should match the signal's own range (0–65535 here, the same raw range as the Fader/Slider example above) rather than a converted unit like a percentage; see "Converting and Modifying Values" below for how to display a converted unit instead.

## Converting and Modifying Values

```svelte
<script lang="ts">
	import { ch5 } from './ch5';

	const analogSignal = ch5.useAnalog('ramp.levelF', 'ramp.level');

	let stringDisplay = $derived(`The Volume Level is ${Math.round(analogSignal.value / 655.35)}%`);
</script>

{stringDisplay}
```

The `$derived` rune allows you to modify a reactive value, while preserving its reactivity. Any time the signal is updated by the control system the `stringDisplay` value is also updated, to include any formatting. See the [official Svelte Docs](https://svelte.dev/docs/svelte/$derived) for more information.
