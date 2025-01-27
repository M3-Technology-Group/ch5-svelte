using System;
using System.Collections.Generic;
using System.Linq;
using Crestron.SimplSharpPro.DeviceSupport;
using Crestron.SimplSharpPro;

namespace testProjectContract
{
    public interface IText
    {
        object UserObject { get; set; }

        event EventHandler<UIEventArgs> Option1;
        event EventHandler<UIEventArgs> Option2;
        event EventHandler<UIEventArgs> Option3;
        event EventHandler<UIEventArgs> Option4;
        event EventHandler<UIEventArgs> Text;

        void TextF(TextStringInputSigDelegate callback);

    }

    public delegate void TextBoolInputSigDelegate(BoolInputSig boolInputSig, IText text);
    public delegate void TextStringInputSigDelegate(StringInputSig stringInputSig, IText text);

    internal class Text : IText, IDisposable
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
                public const uint Option1 = 1;
                public const uint Option2 = 2;
                public const uint Option3 = 3;
                public const uint Option4 = 4;

            }
            internal static class Strings
            {
                public const uint Text = 1;

                public const uint TextF = 1;
            }
        }

        #endregion

        #region Construction and Initialization

        internal Text(ComponentMediator componentMediator, uint controlJoinId)
        {
            ComponentMediator = componentMediator;
            Initialize(controlJoinId);
        }

        private void Initialize(uint controlJoinId)
        {
            ControlJoinId = controlJoinId; 
 
            _devices = new List<BasicTriListWithSmartObject>(); 
 
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.Option1, onOption1);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.Option2, onOption2);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.Option3, onOption3);
            ComponentMediator.ConfigureBooleanEvent(controlJoinId, Joins.Booleans.Option4, onOption4);
            ComponentMediator.ConfigureStringEvent(controlJoinId, Joins.Strings.Text, onText);

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

        public event EventHandler<UIEventArgs> Option1;
        private void onOption1(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = Option1;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> Option2;
        private void onOption2(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = Option2;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> Option3;
        private void onOption3(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = Option3;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }

        public event EventHandler<UIEventArgs> Option4;
        private void onOption4(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = Option4;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }


        public event EventHandler<UIEventArgs> Text;
        private void onText(SmartObjectEventArgs eventArgs)
        {
            EventHandler<UIEventArgs> handler = Text;
            if (handler != null)
                handler(this, UIEventArgs.CreateEventArgs(eventArgs));
        }


        public void TextF(TextStringInputSigDelegate callback)
        {
            for (int index = 0; index < Devices.Count; index++)
            {
                callback(Devices[index].SmartObjects[ControlJoinId].StringInput[Joins.Strings.TextF], this);
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
            return string.Format("Contract: {0} Component: {1} HashCode: {2} {3}", "Text", GetType().Name, GetHashCode(), UserObject != null ? "UserObject: " + UserObject : null);
        }

        #endregion

        #region IDisposable

        public bool IsDisposed { get; set; }

        public void Dispose()
        {
            if (IsDisposed)
                return;

            IsDisposed = true;

            Option1 = null;
            Option2 = null;
            Option3 = null;
            Option4 = null;
            Text = null;
        }

        #endregion

    }
}
