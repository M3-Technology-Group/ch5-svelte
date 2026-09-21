import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Ch5Svelte } from './ch5-svelte.js';
import { REPEAT_DIGITAL_INTERVAL_MS } from './digital-hold.js';
import { FakeComLib } from '../test/fake-com-lib.js';

const HELD = { type: 'o', value: { repeatdigital: true } };
const RELEASED = { type: 'o', value: { repeatdigital: false } };

describe('Ch5Svelte', () => {
	let comLib: FakeComLib;
	let ch5: Ch5Svelte;

	beforeEach(() => {
		vi.useFakeTimers();
		comLib = new FakeComLib();
		ch5 = new Ch5Svelte(comLib);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('constructor', () => {
		it('exposes the com lib it was given', () => {
			expect(ch5.comLib).toBe(comLib);
		});

		it('rejects a value that is not a com lib', () => {
			expect(() => new Ch5Svelte({} as never)).toThrow(TypeError);
			expect(() => new Ch5Svelte(null as never)).toThrow(TypeError);
		});
	});

	describe('useDigital', () => {
		it('starts with the current feedback value and follows updates', () => {
			comLib.receive('b', 'Toggle.Out', true);
			const cleanup = $effect.root(() => {
				const toggle = ch5.useDigital('Toggle.Out', 'Toggle.Toggle');
				expect(toggle.value).toBe(true);
				flushSync();

				comLib.receive('b', 'Toggle.Out', false);
				expect(toggle.value).toBe(false);

				comLib.receive('b', 'Toggle.Out', true);
				expect(toggle.value).toBe(true);
			});
			cleanup();
		});

		it('defaults to false when the signal has never been written', () => {
			const cleanup = $effect.root(() => {
				const toggle = ch5.useDigital('Toggle.Out');
				expect(toggle.value).toBe(false);
			});
			cleanup();
		});

		it('pulses the set signal, not the feedback signal', () => {
			const cleanup = $effect.root(() => {
				const toggle = ch5.useDigital('Toggle.Out', 'Toggle.Toggle');
				flushSync();
				toggle.pulse();
			});
			cleanup();
			expect(comLib.publishedTo('Toggle.Out')).toEqual([]);
			expect(comLib.publishedTo('Toggle.Toggle')).toEqual([
				{ type: 'b', name: 'Toggle.Toggle', value: true },
				{ type: 'b', name: 'Toggle.Toggle', value: false }
			]);
		});

		it('holds the set signal as a RepeatDigital while value is true and releases on false', () => {
			const cleanup = $effect.root(() => {
				const up = ch5.useDigital('ramp.UpF', 'ramp.Up');
				flushSync();

				up.value = true;
				expect(comLib.publishedTo('ramp.Up')).toMatchObject([HELD]);

				vi.advanceTimersByTime(REPEAT_DIGITAL_INTERVAL_MS * 2);
				expect(comLib.publishedTo('ramp.Up')).toMatchObject([HELD, HELD, HELD]);

				up.value = false;
				expect(comLib.publishedTo('ramp.Up')).toMatchObject([HELD, HELD, HELD, RELEASED]);

				vi.advanceTimersByTime(REPEAT_DIGITAL_INTERVAL_MS * 4);
				expect(comLib.publishedTo('ramp.Up')).toHaveLength(4);
			});
			cleanup();
		});

		it('does not echo the hold into the feedback value', () => {
			const cleanup = $effect.root(() => {
				const up = ch5.useDigital('ramp.Up');
				flushSync();
				up.value = true;
				expect(up.value).toBe(false);
				up.value = false;
			});
			cleanup();
		});

		it('releases a held signal and unsubscribes when the component is destroyed', () => {
			const cleanup = $effect.root(() => {
				const up = ch5.useDigital('ramp.Up');
				flushSync();
				up.value = true;
			});
			expect(comLib.subscriberCount('b', 'ramp.Up')).toBe(1);

			cleanup();

			expect(comLib.subscriberCount('b', 'ramp.Up')).toBe(0);
			expect(comLib.publishedTo('ramp.Up')).toMatchObject([HELD, RELEASED]);
			vi.advanceTimersByTime(REPEAT_DIGITAL_INTERVAL_MS * 4);
			expect(comLib.publishedTo('ramp.Up')).toHaveLength(2);
		});

		it('does not publish a release on destroy when nothing is held', () => {
			const cleanup = $effect.root(() => {
				ch5.useDigital('Toggle.Out', 'Toggle.Toggle');
				flushSync();
			});
			cleanup();
			expect(comLib.published).toEqual([]);
		});
	});

	describe('setDigital and pulseDigital', () => {
		it('is idempotent for repeated holds and releases', () => {
			ch5.setDigital('ramp.Up', true);
			ch5.setDigital('ramp.Up', true);
			expect(comLib.publishedTo('ramp.Up')).toMatchObject([HELD]);

			ch5.setDigital('ramp.Up', false);
			ch5.setDigital('ramp.Up', false);
			expect(comLib.publishedTo('ramp.Up')).toMatchObject([HELD, RELEASED]);

			ch5.setDigital('ramp.Down', false);
			expect(comLib.publishedTo('ramp.Down')).toEqual([]);
		});

		it('keeps hold state per instance', () => {
			const other = new Ch5Svelte(comLib);
			ch5.setDigital('ramp.Up', true);

			other.setDigital('ramp.Up', false);
			expect(comLib.publishedTo('ramp.Up')).toMatchObject([HELD]);

			vi.advanceTimersByTime(REPEAT_DIGITAL_INTERVAL_MS);
			expect(comLib.publishedTo('ramp.Up')).toMatchObject([HELD, HELD]);

			ch5.setDigital('ramp.Up', false);
			expect(comLib.publishedTo('ramp.Up')).toMatchObject([HELD, HELD, RELEASED]);
		});

		it('pulses with a rising then falling edge', () => {
			ch5.pulseDigital('Toggle.Toggle');
			expect(comLib.publishedTo('Toggle.Toggle')).toEqual([
				{ type: 'b', name: 'Toggle.Toggle', value: true },
				{ type: 'b', name: 'Toggle.Toggle', value: false }
			]);
		});

		it('releaseAll releases every held signal', () => {
			ch5.setDigital('ramp.Up', true);
			ch5.setDigital('ramp.Down', true);
			ch5.releaseAll();
			expect(comLib.publishedTo('ramp.Up')).toMatchObject([HELD, RELEASED]);
			expect(comLib.publishedTo('ramp.Down')).toMatchObject([HELD, RELEASED]);
			vi.advanceTimersByTime(REPEAT_DIGITAL_INTERVAL_MS * 4);
			expect(comLib.published).toHaveLength(4);
		});
	});

	describe('useAnalog', () => {
		it('starts with the current feedback value and follows updates', () => {
			comLib.receive('n', 'ramp.levelF', 1000);
			const cleanup = $effect.root(() => {
				const level = ch5.useAnalog('ramp.levelF', 'ramp.level');
				expect(level.value).toBe(1000);
				flushSync();
				comLib.receive('n', 'ramp.levelF', 65535);
				expect(level.value).toBe(65535);
			});
			cleanup();
		});

		it('defaults to 0 and writes to the set signal', () => {
			const cleanup = $effect.root(() => {
				const level = ch5.useAnalog('ramp.levelF', 'ramp.level');
				expect(level.value).toBe(0);
				flushSync();
				level.value = 32768;
			});
			cleanup();
			expect(comLib.published).toEqual([{ type: 'n', name: 'ramp.level', value: 32768 }]);
			expect(comLib.subscriberCount('n', 'ramp.levelF')).toBe(0);
		});

		it('uses the feedback signal for writes when no set signal is given', () => {
			const cleanup = $effect.root(() => {
				const level = ch5.useAnalog('ramp.level');
				flushSync();
				level.value = 5;
				expect(level.value).toBe(5);
			});
			cleanup();
			expect(comLib.published).toEqual([{ type: 'n', name: 'ramp.level', value: 5 }]);
		});
	});

	describe('useSerial', () => {
		it('starts with the current feedback value and follows updates', () => {
			comLib.receive('s', 'Text.TextF', 'hello');
			const cleanup = $effect.root(() => {
				const text = ch5.useSerial('Text.TextF', 'Text.Text');
				expect(text.value).toBe('hello');
				flushSync();
				comLib.receive('s', 'Text.TextF', 'world');
				expect(text.value).toBe('world');
			});
			cleanup();
		});

		it('defaults to an empty string and writes to the set signal', () => {
			const cleanup = $effect.root(() => {
				const text = ch5.useSerial('Text.TextF', 'Text.Text');
				expect(text.value).toBe('');
				flushSync();
				text.value = 'Lobby';
			});
			cleanup();
			expect(comLib.published).toEqual([{ type: 's', name: 'Text.Text', value: 'Lobby' }]);
			expect(comLib.subscriberCount('s', 'Text.TextF')).toBe(0);
		});
	});

	describe('setAnalog and setSerial', () => {
		it('publish directly', () => {
			ch5.setAnalog('ramp.level', 123);
			ch5.setSerial('Text.Text', 'abc');
			expect(comLib.published).toEqual([
				{ type: 'n', name: 'ramp.level', value: 123 },
				{ type: 's', name: 'Text.Text', value: 'abc' }
			]);
		});
	});
});
