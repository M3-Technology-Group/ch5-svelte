
/**
 * Active Serial Signal subscription
 */
export interface SerialSignal {
    /**
     * $state of current value of the signal. Set to write value to control system.
     */
    value: string;
}

/**
 * Subscribe to a Serial signal provided by the CrComLib.
 * The signal is provided as an object with a value property that is a $state<string> rune.
 * An optional set property is provided to set the value of the signal. When specified, setting the value rune will write
 * to the control system. This is useful when biding the signal to a field or component.
 * 
 * @param fbSignal Signal name in contract file, or join number as a string to receive feedback from.
 * @param setSignal Signal name in contract file, or join number as a string to send a value to. If not provided, the feedback signal will be used.
 * @returns 
 */
export function useSerial(fbSignal: string, setSignal?: string) {
    if(!window.CrComLib)
        throw new Error('CrComLib is not available. Make sure to include the CrComLib script in your project. (see the README.md for more information)');

    let value = $state(window.CrComLib.getState('s', fbSignal, '')) as string;

    $effect(() => {
        const sub = window.CrComLib.subscribeState('s', fbSignal, (v) => {
            value = v;
        });
        return () => {
            window.CrComLib.unsubscribeState('s', fbSignal, sub);
        }
    });

    const set = (v: string) => {
        setSerial(setSignal ?? fbSignal, v);
    }

    return {
        get value() {
            return value;
        },
        set value(v) {
            set(v);
        }
    }
}

/**
 * Set the value of a serial signal.
 * This does not subscribe to the signal or provide feedback.
 * 
 * @param signal Signal name in contract file, or join number as a string.
 * @param value String value to set the signal to.
 */
export function setSerial(signal: string, value: string) {
    if(!window.CrComLib)
        throw new Error('CrComLib is not available. Make sure to include the CrComLib script in your project. (see the README.md for more information)');
    window.CrComLib.publishEvent('s', signal, value);
}