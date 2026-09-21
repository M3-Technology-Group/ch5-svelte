<script lang="ts">
	import { ch5 } from './ch5.js';

	const toggle = ch5.useDigital('Toggle.Out', 'Toggle.Toggle');
	const level = ch5.useAnalog('ramp.levelF', 'ramp.level');
	const up = ch5.useDigital('ramp.Up');
	const down = ch5.useDigital('ramp.Down');
	const text = ch5.useSerial('Text.TextF', 'Text.Text');

	const percent = $derived(Math.round(level.value / 655.35));
</script>

<main>
	<h1>ch5-svelte demo</h1>

	<section>
		<h2>Digital</h2>
		<button class:active={toggle.value} onclick={() => toggle.pulse()}>
			Toggle is {toggle.value ? 'on' : 'off'}
		</button>
		<label>
			<input type="checkbox" checked={toggle.value} onclick={() => toggle.pulse()} />
			Toggle.Out
		</label>
	</section>

	<section>
		<h2>Analog</h2>
		<div class="row">
			<button
				onpointerdown={() => (down.value = true)}
				onpointerup={() => (down.value = false)}
				onpointerout={() => (down.value = false)}
				oncontextmenu={(e) => e.preventDefault()}
			>
				−
			</button>
			<input type="range" min="0" max="65535" bind:value={level.value} />
			<button
				onpointerdown={() => (up.value = true)}
				onpointerup={() => (up.value = false)}
				onpointerout={() => (up.value = false)}
				oncontextmenu={(e) => e.preventDefault()}
			>
				+
			</button>
		</div>
		<progress value={level.value} max="65535"></progress>
		<p>{percent}% ({level.value})</p>
	</section>

	<section>
		<h2>Serial</h2>
		<input type="text" bind:value={text.value} placeholder="Text.Text" />
		<p>Text.TextF: {text.value}</p>
	</section>
</main>

<style>
	main {
		max-width: 40rem;
		margin: 2rem auto;
		padding: 0 1rem;
		font-family: system-ui, sans-serif;
	}
	section {
		margin-block: 1.5rem;
	}
	.row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.row input[type='range'] {
		flex: 1;
	}
	button {
		padding: 0.5rem 1rem;
		font-size: 1rem;
		touch-action: none;
	}
	button.active {
		background: green;
		color: white;
	}
	progress {
		width: 100%;
	}
</style>
