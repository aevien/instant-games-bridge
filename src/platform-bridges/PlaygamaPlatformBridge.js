import PlatformBridgeBase from './PlatformBridgeBase'
import { addJavaScript, waitFor } from '../common/utils'
import {
    PLATFORM_ID,
    ACTION_NAME,
    INTERSTITIAL_STATE,
    REWARDED_STATE,
} from '../constants'

const SDK_URL = 'https://developer.playgama.com/sdk/v1.js'

class PlaygamaPlatformBridge extends PlatformBridgeBase {
    // platform
    get platformId() {
        return PLATFORM_ID.PLAYGAMA
    }

    // social
    get isExternalLinksAllowed() {
        return false
    }

    initialize() {
        if (this._isInitialized) {
            return Promise.resolve()
        }
        let promiseDecorator = this._getPromiseDecorator(ACTION_NAME.INITIALIZE)
        if (!promiseDecorator) {
            promiseDecorator = this._createPromiseDecorator(ACTION_NAME.INITIALIZE)

            addJavaScript(SDK_URL).then(() => {
                waitFor('PLAYGAMA_SDK').then(() => {
                    this._platformSdk = window.PLAYGAMA_SDK
                    this._isInitialized = true
                    this._resolvePromiseDecorator(ACTION_NAME.INITIALIZE)
                })
            })
        }

        return promiseDecorator.promise
    }

    showInterstitial() {
        this._platformSdk.advService.showInterstitial({
            onOpen: () => {
                this._setInterstitialState(INTERSTITIAL_STATE.OPENED)
            },
            onEmpty: () => {
                this._setInterstitialState(INTERSTITIAL_STATE.FAILED)
            },
            onClose: () => {
                this._setInterstitialState(INTERSTITIAL_STATE.CLOSED)
            },
            onError: () => {
                this._setInterstitialState(INTERSTITIAL_STATE.FAILED)
            },
        })
    }

    showRewarded() {
        this._platformSdk.advService.showRewarded({
            onOpen: () => {
                this._setRewardedState(REWARDED_STATE.OPENED)
            },
            onRewarded: () => {
                this._setRewardedState(REWARDED_STATE.REWARDED)
            },
            onEmpty: () => {
                this._setRewardedState(REWARDED_STATE.FAILED)
            },
            onClose: () => {
                this._setRewardedState(REWARDED_STATE.CLOSED)
            },
            onError: () => {
                this._setRewardedState(REWARDED_STATE.FAILED)
            },
        })
    }
}

export default PlaygamaPlatformBridge
