using System;
using System.Collections.Generic;
using System.Linq;
using Crestron.SimplSharpPro.DeviceSupport;
using Crestron.SimplSharpPro;

namespace testProjectContract
{
    /// <summary>
    /// Common Interface for Root Contracts.
    /// </summary>
    public interface IContract
    {
        object UserObject { get; set; }
        void AddDevice(BasicTriListWithSmartObject device);
        void RemoveDevice(BasicTriListWithSmartObject device);
    }

    public class Contract : IContract, IDisposable
    {
        #region Components

        private ComponentMediator ComponentMediator { get; set; }

        public testProjectContract.IText Text { get { return (testProjectContract.IText)InternalText; } }
        private testProjectContract.Text InternalText { get; set; }

        public testProjectContract.IToggle Toggle { get { return (testProjectContract.IToggle)InternalToggle; } }
        private testProjectContract.Toggle InternalToggle { get; set; }

        public testProjectContract.Iramp ramp { get { return (testProjectContract.Iramp)Internalramp; } }
        private testProjectContract.ramp Internalramp { get; set; }

        public testProjectContract.Icheckbox checkbox { get { return (testProjectContract.Icheckbox)Internalcheckbox; } }
        private testProjectContract.checkbox Internalcheckbox { get; set; }

        #endregion

        #region Construction and Initialization

        public Contract()
            : this(new List<BasicTriListWithSmartObject>().ToArray())
        {
        }

        public Contract(BasicTriListWithSmartObject device)
            : this(new [] { device })
        {
        }

        public Contract(BasicTriListWithSmartObject[] devices)
        {
            if (devices == null)
                throw new ArgumentNullException("Devices is null");

            ComponentMediator = new ComponentMediator();

            InternalText = new testProjectContract.Text(ComponentMediator, 1);
            InternalToggle = new testProjectContract.Toggle(ComponentMediator, 2);
            Internalramp = new testProjectContract.ramp(ComponentMediator, 3);
            Internalcheckbox = new testProjectContract.checkbox(ComponentMediator, 4);

            for (int index = 0; index < devices.Length; index++)
            {
                AddDevice(devices[index]);
            }
        }

        #endregion

        #region Standard Contract Members

        public object UserObject { get; set; }

        public void AddDevice(BasicTriListWithSmartObject device)
        {
            InternalText.AddDevice(device);
            InternalToggle.AddDevice(device);
            Internalramp.AddDevice(device);
            Internalcheckbox.AddDevice(device);
        }

        public void RemoveDevice(BasicTriListWithSmartObject device)
        {
            InternalText.RemoveDevice(device);
            InternalToggle.RemoveDevice(device);
            Internalramp.RemoveDevice(device);
            Internalcheckbox.RemoveDevice(device);
        }

        #endregion

        #region IDisposable

        public bool IsDisposed { get; set; }

        public void Dispose()
        {
            if (IsDisposed)
                return;

            IsDisposed = true;

            InternalText.Dispose();
            InternalToggle.Dispose();
            Internalramp.Dispose();
            Internalcheckbox.Dispose();
            ComponentMediator.Dispose(); 
        }

        #endregion

    }
}
