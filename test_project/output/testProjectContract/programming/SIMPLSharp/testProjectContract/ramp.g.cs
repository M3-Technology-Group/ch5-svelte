using System;
using System.Collections.Generic;
using System.Linq;
using Crestron.SimplSharpPro.DeviceSupport;
using Crestron.SimplSharpPro;

namespace testProjectContract
{
    public interface Iramp
    {
        object UserObject { get; set; }

        event EventHandler<UIEventArgs> Up;
        event EventHandler<UIEventArgs> Down;
        event EventHandler<UIEventArgs> level;

        void levelF(rampUShortInputSigDelegate callback);

    }

    public delegate void rampBoolInputSigDelegate(BoolInputSig boolInputSig, Iramp ramp);
    public delegate void rampUShortInputSigDelegate(UShortInputSig uShortInputSig, Iramp ramp);

    internal class ramp : Iramp, IDisposable
    {
        #region Standard CH5 Component members

        private ComponentMediator ComponentMediator { get; set; }

        public object UserObject { get; set; }

        public uint ControlJoinId { get; private set; }

        private IList<BasicTriListWithSmartObject> _devices;
        public IList<BasicTriListWithSmartObject> Devices { get { return _devices; } }

        #endregion

        #region Joins

        private static class Joins
        {
            internal static class Booleans
            {
                public const uint Up = 1;
                public const uint Down = 2;

            }
            internal static class Numerics
            {
                public const uint level = 1;

                public const uint levelF = 1;
            }
        }

        #endregion

        #region Construction and Initialization

        internal ramp(ComponentMediator componentMediator, uint controlJoinId)
        {
            ComponentMediator = componentMediator;
            Initialize(controlJoinId);
        }

        private void Initialize(uint controlJoinId)
        {
            ControlJoinId = controlJoinId; 
 
            _devices = new List<BasicTriListWithSmartObject>(); 
 
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.Up, onUp);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.Down, onDown);
            ComponentMediator.ConfigureNumericEvent(controlJoinId, Joins.Numerics.level, onlevel);

        }

        public void AddDevice(BasicTriListWithSmartObject device)
        {
            Devices.Add(device);
            ComponentMediator.HookSmartObjectEvents(device.SmartObjects[ControlJoinId]);
        }

        public void RemoveDevice(BasicTriListWithSmartObject device)
        {
            Devices.Remove(device);
            ComponentMediator.UnHookSmartObjectEvents(device.SmartObjects[ControlJoinId]);
        }

        #endregion

        #region CH5 Contract

        public event EventHandler<UIEventArgs> Up;
        private void onUp(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = Up;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> Down;
        private void onDown(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = Down;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }


        public event EventHandler<UIEventArgs> level;
        private void onlevel(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = level;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }


        public void levelF(rampUShortInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].UShortInput[Joins.Numerics.levelF], this);
            }
        }

        #endregion

        #region Overrides

        public override int GetHashCode()
        {
            return (int)ControlJoinId;
        }

        public override string ToString()
        {
            return string.Format("Contract: {0} Component: {1} HashCode: {2} {3}", "ramp", GetType().Name, GetHashCode(), UserObject != null ? "UserObject: " + UserObject : null);
        }

        #endregion

        #region IDisposable

        public bool IsDisposed { get; set; }

        public void Dispose()
        {
            if (IsDisposed)
                return;

            IsDisposed = true;

            Up = null;
            Down = null;
            level = null;
        }

        #endregion

    }
}
