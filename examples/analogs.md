---
title: Analog Signal Examples
group: Examples
category: Examples
---

# Analog Signal Examples

This is a collection of example uses of analog signals. Only basic HTML constructs are used, and no styling is provided. Pick your favorite CSS framework, and or Svelte component library and style it as you like.

## Progress Bar

```svelte
<script lang="ts">
  import { useAnalog } from 'ch5-svelte';

  const progress = useAnalog("ramp.levelF")
</script>

<progress value={progress.value} max="65535"></progress>
```

`useAnalog` provides an analog signal object that contains a single property `value`. `value` is a `$state<number>` rune that will automatically update in real time when used in a component.

Here we use the HTML Progress element and pass in `progress.value` and set the max to 65535 to display a dynamically updated progress bar that ranges form `0%` ot `0d` to `100%` or `65535d`.


## Fader/Slider

```svelte
<script lang="ts">
  import { useAnalog } from 'ch5-svelte';

  const fader = useAnalog("ramp.levelF","ramp.level")
</script>

<input type="range" bind:value={fader.value} min="0" max="65535"/>
```

`useAnalog` can optionally take two arguments. The first argument is the signal to read (Feedback from control system), and the second argument is the signal to write (event to control system). When the `value` property is read from, the value ui dynamically updated based on the real-time value of the feedback signal. when the `value` property is written to, the value is transmitted to the control system using the signal name specified in the second argument to `useAnalog`. If only one signal name is passed into `useAnalog` the same name or join is use for both read and write.

Because the `value` property on the returned signal implements both getters and setters, we can simply bind the `value` property of a HTML Input element of type `range` to the `value` property of the analog signal object. This gives us a two-way slider that responds to control system feedback in real time.

## Fader/Slider with Up and Down Buttons.

```svelte
<script lang="ts">
  import { useAnalog, useDigital } from 'ch5-svelte';

  const fader = useAnalog("ramp.levelF","ramp.level")
  const up = useDigital("ramp.Up")
  const down = useDigital("ramp.Down")
</script>

<button 
  onpointerdown={() => down.value = true}
  onpointerup={() => down.value = false}
  onpointerout={() => down.value = false}
  oncontextmenu={(e) => e.preventDefault()}
  > Volume Down </button>

<input type="range" bind:value={fader.value} min="0" max="65535"/>

<button 
  onpointerdown={() => up.value = true}
  onpointerup={() => up.value = false}
  onpointerout={() => up.value = false}
  oncontextmenu={(e) => e.preventDefault()}
  > Volume UP </button>
```

Because the fader already reactively responds to the control system's state, all you need to do is add a set of up and down buttons. See the Digital Examples section for an explication on how to implement a press-and-hold button.

## Numeric Input

```svelte
<script lang="ts">
  import { useAnalog } from 'ch5-svelte';

  const numericEntry = useAnalog("ramp.levelF","ramp.level")
</script>

<input type="number" bind:value={numericEntry.value} min="0" max="100"/>
```

This provides a simple input field that allows a user to enter a numeric value. 


## Converting and Modifying Values

```svelte
<script lang="ts">
  import { useAnalog } from 'ch5-svelte';

  const analogSignal = useAnalog("ramp.levelF","ramp.level")

  let stringDisplay = $derived(`The Volume Level is ${Math.round(analogSignal.value/655.35)}%`)
</script>

{stringDisplay}
```

The `$derived` rune allows you to modify a reactive value, while preserving its reactivity. Any time the signal is updated by the control system the `stringDisplay` value is also updated, to include any formatting. See the [official Svelte Docs](https://svelte.dev/docs/svelte/$derived) for more information.