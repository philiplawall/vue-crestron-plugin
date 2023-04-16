import { App, Plugin } from 'vue'
import { CrestronOptions } from './types/CrestronOptions'
import * as CrComLib from 'ch5-crcomlib-lite'
import * as WebXPanel from '@crestron/ch5-webxpanel'

declare module 'vue' {
  interface ComponentCustomProperties {
    $crestron: {
      CrComLib: {
        isCrestronTouchscreen: Function
        bridgeReceiveIntegerFromNative: typeof CrComLib.bridgeReceiveIntegerFromNative
        bridgeReceiveBooleanFromNative: typeof CrComLib.bridgeReceiveBooleanFromNative
        bridgeReceiveStringFromNative: typeof CrComLib.bridgeReceiveStringFromNative
        bridgeReceiveObjectFromNative: typeof CrComLib.bridgeReceiveObjectFromNative
        unsubscribeState: typeof CrComLib.unsubscribeState
        subscribeState: typeof CrComLib.subscribeState
        publishEvent: typeof CrComLib.publishEvent
      }
    }
  }
}

declare global {
  interface Window {
    CrComLib: any
    bridgeReceiveIntegerFromNative: Function
    bridgeReceiveBooleanFromNative: Function
    bridgeReceiveStringFromNative: Function
    bridgeReceiveObjectFromNative: Function
  }
}

function updateDialogLicenseInfo(detail: any) {
  const controlSystemSupportsLicense = detail.controlSystemSupportsLicense
  const licenseApplied = detail.licenseApplied
  const licenseDaysRemaining = detail.licenseDaysRemaining
  const licenseHasExpiry = detail.licenseHasExpiry
  const trialPeriod = detail.trialPeriod
  const trialPeriodDaysRemaining = detail.trialPeriodDaysRemaining
  const resourceAvailable = detail.resourceAvailable

  if (!controlSystemSupportsLicense) {
    console.log('Control system does not support Mobility license')
  } else if (!resourceAvailable) {
    console.log('Mobility license is required (expired or never applied)')
  } else if (licenseApplied) {
    if (!licenseHasExpiry) {
      console.log('Mobility license is valid')
    } else {
      console.log(`Mobility license expires in ${licenseDaysRemaining} day(s)`)
    }
  } else if (trialPeriod) {
    console.log(` Trial period expires in ${trialPeriodDaysRemaining} day(s)`)
  }
}

// The Install function used by Vue to register the plugin
export const CrestronPlugin: Plugin = {
  install(app: App, options: CrestronOptions) {
    app.config.globalProperties.$crestron = {
      CrComLib: {
        isCrestronTouchscreen: CrComLib.isCrestronTouchscreen,
        bridgeReceiveIntegerFromNative: CrComLib.bridgeReceiveIntegerFromNative,
        bridgeReceiveBooleanFromNative: CrComLib.bridgeReceiveBooleanFromNative,
        bridgeReceiveStringFromNative: CrComLib.bridgeReceiveStringFromNative,
        bridgeReceiveObjectFromNative: CrComLib.bridgeReceiveObjectFromNative,
        unsubscribeState: CrComLib.unsubscribeState,
        subscribeState: CrComLib.subscribeState,
        publishEvent: CrComLib.publishEvent
      }
    }
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return
    }
    console.log(document)
    const script = document.createElement('script')
    script.text = `window["bridgeReceiveIntegerFromNative"] = function () {};
    window["bridgeReceiveBooleanFromNative"] = function (joinName, value) {};
    window["bridgeReceiveStringFromNative"] = function (joinName, value) {};
    window["bridgeReceiveObjectFromNative"] = function () {};`
    document.body.appendChild(script)

    window.CrComLib = CrComLib
    window.bridgeReceiveIntegerFromNative = CrComLib.bridgeReceiveIntegerFromNative
    window.bridgeReceiveBooleanFromNative = CrComLib.bridgeReceiveBooleanFromNative
    window.bridgeReceiveStringFromNative = CrComLib.bridgeReceiveStringFromNative
    window.bridgeReceiveObjectFromNative = CrComLib.bridgeReceiveObjectFromNative

    if (!CrComLib.isCrestronTouchscreen()) {
      console.log(`WebXPanel version: ${WebXPanel.getVersion()}`)
      console.log(`WebXPanel build date: ${WebXPanel.getBuildDate()}`)
      console.log(options)

      WebXPanel.default.addEventListener(WebXPanel.WebXPanelEvents.CONNECT_WS, () => {
        console.log(`Connected to Websocket`)
      })

      WebXPanel.default.addEventListener(WebXPanel.WebXPanelEvents.DISCONNECT_WS, () => {
        console.log(`Disconnected from Websocket`)
      })

      WebXPanel.default.addEventListener(
        WebXPanel.WebXPanelEvents.ERROR_WS,
        ({ detail }: { detail: any }) => {
          console.log(`Error on websocket, detail: ${detail}`)
        }
      )

      WebXPanel.default.addEventListener(
        WebXPanel.WebXPanelEvents.CONNECT_CIP,
        ({ detail }: { detail: any }) => {
          const { url, ipId, roomId } = detail
          console.log(`Connected to ${url}, 0x${ipId.toString(16)}, ${roomId}`)
        }
      )

      WebXPanel.default.addEventListener(
        WebXPanel.WebXPanelEvents.DISCONNECT_CIP,
        ({ detail }: { detail: any }) => {
          const { reason } = detail
          console.log(`Disconnected from CIP. Reason: ${reason}`)
        }
      )

      WebXPanel.default.addEventListener(
        WebXPanel.WebXPanelEvents.LICENSE_WS,
        ({ detail }: { detail: any }) => {
          updateDialogLicenseInfo(detail)
        }
      )

      if (WebXPanel.isActive) {
        WebXPanel.default.initialize({
          host: options.host,
          ipId: options.ipId.toString(),
          roomId: options.room
        })
      }
    }

    console.log(`CrComLib.IsCrestronTouchscreen(): ${CrComLib.isCrestronTouchscreen()}`)
  }
}
