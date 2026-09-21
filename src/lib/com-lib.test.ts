import { afterEach, describe, expect, expectTypeOf, it } from 'vitest';
import type { MicroComLib } from 'microcomlib';
import type * as CrComLib from '@crestron/ch5-crcomlib';
import { crComLibFromWindow, isComLib, type ComLib } from './com-lib.js';
import { FakeComLib } from '../test/fake-com-lib.js';

// These two are type-level assertions, verified by `pnpm check`. They are no-ops at runtime.
describe('ComLib compatibility', () => {
	it('is satisfied by a MicroComLib instance', () => {
		expectTypeOf<MicroComLib>().toMatchTypeOf<ComLib>();
	});

	it('is satisfied by the @crestron/ch5-crcomlib module (window.CrComLib)', () => {
		expectTypeOf<typeof CrComLib>().toMatchTypeOf<ComLib>();
	});
});

describe('isComLib', () => {
	it('accepts an object with the four signal functions', () => {
		expect(isComLib(new FakeComLib())).toBe(true);
	});

	it('rejects primitives, null and partial objects', () => {
		expect(isComLib(undefined)).toBe(false);
		expect(isComLib(null)).toBe(false);
		expect(isComLib('CrComLib')).toBe(false);
		expect(isComLib({})).toBe(false);
		expect(isComLib({ getState() {}, subscribeState() {}, unsubscribeState() {} })).toBe(false);
	});
});

describe('crComLibFromWindow', () => {
	const scope = globalThis as { CrComLib?: unknown };

	afterEach(() => {
		delete scope.CrComLib;
	});

	it('throws a helpful error when window.CrComLib is missing', () => {
		expect(() => crComLibFromWindow()).toThrow(/cr-com-lib\.js/);
	});

	it("throws when window.CrComLib is MicroComLib's receive-only shim", () => {
		scope.CrComLib = {
			bridgeReceiveBooleanFromNative() {},
			bridgeReceiveIntegerFromNative() {},
			bridgeReceiveStringFromNative() {},
			bridgeReceiveObjectFromNative() {}
		};
		expect(() => crComLibFromWindow()).toThrow(/MicroComLib/);
	});

	it('returns window.CrComLib when it is a full com lib', () => {
		const lib = new FakeComLib();
		scope.CrComLib = lib;
		expect(crComLibFromWindow()).toBe(lib);
	});
});
