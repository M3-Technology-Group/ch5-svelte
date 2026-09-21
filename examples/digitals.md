---
title: Digital Signal Examples
group: Examples
category: Examples
---

# Digital Signal Examples

This is a collection of example uses of digital signals. Only basic HTML constructs are used, and no styling is provided. Pick your favorite CSS framework, and or Svelte component library and style it as you like.

> These examples assume you created and exported a `Ch5Svelte` instance as `ch5` (see the README, "Create your instance"). Adjust the import path to match your project.

## Simple Trigger Button (No Feedback)

```svelte
<script lang="ts">
	import { ch5 } from './ch5';
</script>

<button onclick={() => ch5.pulseDigital('Toggle.Toggle')}>Push It!</button>
```

Pulse Digital sends a rising edge and then a falling edge to the specified signal.

## Toggle Button (With Feedback)

```svelte
<script lang="ts">
	import { ch5 } from './ch5';

	const toggleButton = ch5.useDigital('Toggle.Out', 'Toggle.Toggle');
</script>

<button
	style="background-color: {toggleButton.value ? 'green' : ''}"
	onclick={() => toggleButton.pulse()}>Toggle!</button
>
```

Use Digital creates a digital signal object that can be used to read and write to the signal. The first argument is the signal to read (Feedback from control system), and the second argument is the signal to write (event to control system). The pulse method sends a rising edge and then a falling edge to the specified signal.

We can use the value property to read the current value of the signal. In this case, we use it to change the background color of the button. Since the value property uses a $state rune under the hood, the button will update automatically when the value changes.

## HTML Input Element (Checkbox with Feedback)

```svelte
<script lang="ts">
	import { ch5 } from './ch5';

	const toggleButton = ch5.useDigital('Toggle.Out', 'Toggle.Toggle');
</script>

<input type="checkbox" checked={toggleButton.value} onclick={() => toggleButton.pulse()} />
```

It may seem tempting to simply bind `toggleButton.value` to the `checked` attribute of the input element, but this will not work as expected. The checkbox would handle the toggle internally as a held state rather than a pulse, and `value`'s getter only ever reflects the feedback signal, never the held/set side — so the checkbox would appear to lag or disagree with anything else on screen listening to the same signal until the control system echoes it back. Worse, if the component the checkbox is in is destroyed while held, the output signal is driven to false regardless of the intended state.

This is why we use the `onclick` event to send a pulse to the signal, which will toggle the signal in the control system. The `Toggle.Toggle` signal is connected to the `clock` input of a `toggle` symbol, and `Toggle.out` is connected to the `out` of that same `toggle` symbol. This allows the state to be handled by the control system and ensures that the expected state of the toggle persists in the control system and is reflected in any other components (or UIs) that may be listening to the signal.

## Ramp Up/Down Button

```svelte
<script lang="ts">
	import { ch5 } from './ch5';

	const level = ch5.useAnalog('ramp.levelF');
	const up = ch5.useDigital('ramp.Up');
	const down = ch5.useDigital('ramp.Down');
</script>

<button
	onpointerdown={() => (up.value = true)}
	onpointerup={() => (up.value = false)}
	onpointerout={() => (up.value = false)}
	oncontextmenu={(e) => e.preventDefault()}
>
	Volume UP
</button>

<p>Volume: {Math.round(level.value / 655.35)}%</p>

<button
	onpointerdown={() => (down.value = true)}
	onpointerup={() => (down.value = false)}
	onpointerout={() => (down.value = false)}
	oncontextmenu={(e) => e.preventDefault()}
>
	Volume Down
</button>
```

`useDigital` and `setDigital` both hold through the same RepeatDigital mechanism, re-publishing the hold periodically so the control system can drop the press if the UI is disconnected. Only `useDigital`'s automatic release is tied to the component: because its `value` setter is wired to the component's `$effect` cleanup, a hold started that way is always released when the component is destroyed. A hold started with `setDigital`, as in the example below, is not tied to any component — if the button might unmount while held, release it explicitly (`ch5.setDigital('ramp.Up', false)` or `ch5.releaseAll()`, for example in a `beforeunload` handler) rather than relying on destruction to clean it up. See the [Crestron Docs](https://sdkcon78221.crestron.com/sdk/Crestron_HTML5UI/Content/Topics/Advanced/Events-Joins-CS.htm) for more information on repeatDigital.

useDigital (or any other use functions), when provided with a single argument will use the same join for both feedback and control. In this case since we are only setting the value, we can pass the single set join and ignore the feedback portion of the signal.

Optionally you could also use the `setDigital` function to set the value of the signal. But it's slightly less concise than `useDigital` and setting the value directly, and, as noted above, its hold is not released automatically on destroy.

```svelte
<button
	onpointerdown={() => ch5.setDigital('ramp.Up', true)}
	onpointerup={() => ch5.setDigital('ramp.Up', false)}
	onpointerout={() => ch5.setDigital('ramp.Up', false)}
	oncontextmenu={(e) => e.preventDefault()}
>
	Volume UP
</button>
```

It is important to listen to both the `pointerup` and `pointerout` events to ensure that the button is released when the pointer leaves the button. The `oncontextmenu` event is used to prevent the context menu from appearing when the button is held down on some touch devices.

## Using Digital Signals to Show/Hide Elements

```svelte
<script lang="ts">
	import { ch5 } from './ch5';

	const ShowPage = ch5.useDigital('Toggle.Out');
</script>

{#if ShowPage.value}
	<h1>Page is shown</h1>
{:else}
	<h1>Page is hidden</h1>
{/if}
```

Digital signals can be used to show and hide elements in the UI. Using the `#if` block, we can conditionally render elements based on the value of the digital signal. In this case, the page will be shown if the signal is true, and hidden if the signal is false.
