using System;
using System.Collections.Generic;
using System.Linq;
using Crestron.SimplSharpPro.DeviceSupport;
using Crestron.SimplSharpPro;

namespace testProjectContract
{
    public interface IToggle
    {
        object UserObject { get; set; }

        event EventHandler<UIEventArgs> Set;
        event EventHandler<UIEventArgs> Reset;
        event EventHandler<UIEventArgs> Toggle;

        void Out(ToggleBoolInputSigDelegate callback);
        void Not_out(ToggleBoolInputSigDelegate callback);

    }

    public delegate void ToggleBoolInputSigDelegate(BoolInputSig boolInputSig, IToggle toggle);

    internal class Toggle : IToggle, IDisposable
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
                public const uint Set = 1;
                public const uint Reset = 2;
                public const uint Toggle = 3;

                public const uint Out = 1;
                public const uint Not_out = 2;
            }
        }

        #endregion

        #region Construction and Initialization

        internal Toggle(ComponentMediator componentMediator, uint controlJoinId)
        {
            ComponentMediator = componentMediator;
            Initialize(controlJoinId);
        }

        private void Initialize(uint controlJoinId)
        {
            ControlJoinId = controlJoinId; 
 
            _devices = new List<BasicTriListWithSmartObject>(); 
 
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.Set, onSet);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.Reset, onReset);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.Toggle, onToggle);

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

        public event EventHandler<UIEventArgs> Set;
        private void onSet(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = Set;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> Reset;
        private void onReset(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = Reset;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> Toggle;
        private void onToggle(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = Toggle;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }


        public void Out(ToggleBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.Out], this);
            }
        }

        public void Not_out(ToggleBoolInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].BooleanInput[Joins.Booleans.Not_out], this);
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
            return string.Format("Contract: {0} Component: {1} HashCode: {2} {3}", "Toggle", GetType().Name, GetHashCode(), UserObject != null ? "UserObject: " + UserObject : null);
        }

        #endregion

        #region IDisposable

        public bool IsDisposed { get; set; }

        public void Dispose()
        {
            if (IsDisposed)
                return;

            IsDisposed = true;

            Set = null;
            Reset = null;
            Toggle = null;
        }

        #endregion

    }
}
