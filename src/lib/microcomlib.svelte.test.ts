import { flushSync } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { MicroComLib, type HostTransport, type SignalType, type SignalValue } from 'microcomlib';
import { Ch5Svelte } from './ch5-svelte.js';

class RecordingTransport implements HostTransport {
	readonly kind = 'test';
	readonly sent: { type: SignalType; name: string; value: SignalValue }[] = [];

	send(type: SignalType, name: string, value: SignalValue): void {
		this.sent.push({ type, name, value });
	}
}

describe('Ch5Svelte with MicroComLib', () => {
	afterEach(() => {
		MicroComLib.resetInstance();
	});

	it('defaults to the attached MicroComLib singleton', () => {
		const ch5 = new Ch5Svelte();
		expect(ch5.comLib).toBe(MicroComLib.getInstance());
		expect(MicroComLib.getInstance().attached).toBe(true);
	});

	it('receives feedback from the host and publishes through the transport', () => {
		const transport = new RecordingTransport();
		const lib = new MicroComLib({ transport, logger: false });
		const ch5 = new Ch5Svelte(lib);

		const cleanup = $effect.root(() => {
			const toggle = ch5.useDigital('Toggle.Out', 'Toggle.Toggle');
			const level = ch5.useAnalog('ramp.levelF', 'ramp.level');
			const text = ch5.useSerial('Text.TextF', 'Text.Text');
			flushSync();

			lib.bridgeReceiveBooleanFromNative('Toggle.Out', true);
			lib.bridgeReceiveIntegerFromNative('ramp.levelF', 32768);
			lib.bridgeReceiveStringFromNative('Text.TextF', 'Lobby');
			expect(toggle.value).toBe(true);
			expect(level.value).toBe(32768);
			expect(text.value).toBe('Lobby');

			toggle.pulse();
			level.value = 100;
			text.value = 'Boardroom';
		});
		cleanup();
		lib.dispose();

		expect(transport.sent).toEqual([
			{ type: 'boolean', name: 'Toggle.Toggle', value: true },
			{ type: 'boolean', name: 'Toggle.Toggle', value: false },
			{ type: 'number', name: 'ramp.level', value: 100 },
			{ type: 'string', name: 'Text.Text', value: 'Boardroom' }
		]);
	});

	it('sends a press-and-hold as a RepeatDigital object and releases it on destroy', () => {
		const transport = new RecordingTransport();
		const lib = new MicroComLib({ transport, logger: false });
		const ch5 = new Ch5Svelte(lib);

		const cleanup = $effect.root(() => {
			const up = ch5.useDigital('ramp.Up');
			flushSync();
			up.value = true;
		});
		cleanup();
		lib.dispose();

		expect(transport.sent).toEqual([
			{ type: 'object', name: 'ramp.Up', value: { repeatdigital: true } },
			{ type: 'object', name: 'ramp.Up', value: { repeatdigital: false } }
		]);
	});

	it('addresses join numbers on the feedback side for reads and verbatim for writes', () => {
		const transport = new RecordingTransport();
		const lib = new MicroComLib({ transport, logger: false });
		const ch5 = new Ch5Svelte(lib);

		const cleanup = $effect.root(() => {
			const join1 = ch5.useDigital('1');
			flushSync();
			lib.bridgeReceiveBooleanFromNative('1', true);
			expect(join1.value).toBe(true);
			join1.pulse();
		});
		cleanup();
		lib.dispose();

		expect(transport.sent).toEqual([
			{ type: 'boolean', name: '1', value: true },
			{ type: 'boolean', name: '1', value: false }
		]);
	});
});
