---
title: Serial Signal Examples
group: Examples
category: Examples
---

# Serial Signal Examples

This is a collection of example uses of serial signals. Only basic HTML constructs are used, and no styling is provided. Pick your favorite CSS framework, and or Svelte component library and style it as you like.

## Displaying Text from a Serial Signal

```svelte
<script lang="ts">
  import { useSerial } from 'ch5-svelte';

  const serialSignal = useSerial("Text.TextF")
</script>

<p>{serialSignal.value}</p>
```

The [Svelte Text Expression](https://svelte.dev/docs/svelte/basic-markup) syntax can be used to display text anywhere in a UI. `useSerial` subscribes to the provided signal and provides an object with a single property of `value`. `value` is reactive and provides the real-time state of the subscribed serial signal and provides it with the `$state<string>` rune. 

## Settable Text Field

```svelte
<script lang="ts">
  import { useSerial } from 'ch5-svelte';

  const serialSignal = useSerial("Text.TextF","Text.Text")
</script>

<input type="text" bind:value={serialSignal.value} />
```

`useSerial` can optionally take two arguments. The first argument is the signal to read (Feedback from control system), and the second argument is the signal to write (event to control system). When the `value` property is read from, the value ui dynamically updated based on the real-time value of the feedback signal. when the `value` property is written to, the value is transmitted to the control system using the signal name specified in the second argument to `useSerial`. If only one signal name is passed into `useSerial` the same name or join is use for both read and write.

Because the `value` property on the returned signal implements both getters and setters, we can simply bind the `value` property of a HTML Input element of type `text` to the `value` property of the serial signal object. This gives us a two-way text box that will react to updated form the controls system as well as set the value on the control system.

## Settable Text FIled with Submit and Cancel Buttons

```svelte
<script lang="ts">
  import { useSerial } from 'ch5-svelte';

  const serialSignal = useSerial("Text.TextF","Text.Text")
  
  let textBoxText = $state(serialSignal.value);

$effect(() => {
  textBoxText = serialSignal.value;
});

</script>

<input type="text" bind:value={textBoxText}/>

<!--The Submit button takes what the user entered and sends it to the Control System-->
<button 
  disabled={textBoxText === serialSignal.value} 
  onclick={() => serialSignal.value = textBoxText}
  >Submit
</button>

<!--The Cancel Button takes the last state from the COntrol System and overwrites any user changes-->
<button
  disabled={textBoxText === serialSignal.value} 
  onclick={() => textBoxText = serialSignal.value}
  >Cancel
</button>
```

If you simply bind the `value` rune provided by the signal to an input field, the value will be sent to the Control System continuously while the input field is being edited. 

This example shows how to create a submit and cancel button to control when the value is sent to the Control System. The cancel button will revert the input field to the last value sent by the Control System. The submit button will send the value to the Control System. The buttons are disabled when the input field matches the value on the Control System. The Effect function is used to allow one-way updates from the Control System to update the input field.

For more information on the Effect function, see the [Svelte documentation](https://svelte.dev/docs/svelte/$effect).