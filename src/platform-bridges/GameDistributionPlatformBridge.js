import PlatformBridgeBase from './PlatformBridgeBase'
import { addJavaScript } from '../common/utils'
import {
    PLATFORM_ID,
    ACTION_NAME,
    BANNER_STATE,
    INTERSTITIAL_STATE,
    REWARDED_STATE,
    STORAGE_TYPE, ERROR,
} from '../constants'

const SDK_URL = 'https://html5.api.gamedistribution.com/main.min.js'

class GameDistributionPlatformBridge extends PlatformBridgeBase {
    // platform
    get platformId() {
        return PLATFORM_ID.GAME_DISTRIBUTION
    }

    // social
    get isExternalLinksAllowed() {
        return false
    }

    #currentAdvertisementIsRewarded = false

    initialize() {
        if (this._isInitialized) {
            return Promise.resolve()
        }

        let promiseDecorator = this._getPromiseDecorator(ACTION_NAME.INITIALIZE)
        if (!promiseDecorator) {
            promiseDecorator = this._createPromiseDecorator(ACTION_NAME.INITIALIZE)

            if (!this._options || typeof this._options.gameId !== 'string') {
                this._rejectPromiseDecorator(ACTION_NAME.INITIALIZE, ERROR.GAME_DISTRIBUTION_GAME_ID_IS_UNDEFINED)
            } else {
                const self = this
                window.GD_OPTIONS = {
                    gameId: this._options.gameId,
                    onEvent(event) {
                        switch (event.name) {
                            case 'SDK_READY':
                                self._platformSdk = window.gdsdk
                                self._platformSdk.preloadAd('rewarded')
                                self._isInitialized = true
                                self._resolvePromiseDecorator(ACTION_NAME.INITIALIZE)
                                break
                            case 'SDK_GAME_START':
                                if (self.#currentAdvertisementIsRewarded) {
                                    self._setRewardedState(REWARDED_STATE.CLOSED)
                                } else {
                                    self._setInterstitialState(INTERSTITIAL_STATE.CLOSED)
                                }
                                break
                            case 'SDK_GAME_PAUSE':
                                if (self.#currentAdvertisementIsRewarded) {
                                    self._setRewardedState(REWARDED_STATE.OPENED)
                                } else {
                                    self._setInterstitialState(INTERSTITIAL_STATE.OPENED)
                                }
                                break
                            case 'SDK_REWARDED_WATCH_COMPLETE':
                                self._setRewardedState(REWARDED_STATE.REWARDED)
                                break
                            case 'SDK_GDPR_TRACKING':
                            case 'SDK_GDPR_TARGETING':
                            default:
                                break
                        }
                    },
                }

                this._defaultStorageType = STORAGE_TYPE.LOCAL_STORAGE
                this._isBannerSupported = true
                addJavaScript(SDK_URL)
            }
        }

        return promiseDecorator.promise
    }

    // advertisement
    showBanner(options) {
        if (options && options.containerId && typeof options.containerId === 'string') {
            this._platformSdk.showAd('display', { containerId: options.containerId })
                .then(() => {
                    this._setBannerState(BANNER_STATE.SHOWN)
                })
                .catch(() => {
                    this._setBannerState(BANNER_STATE.FAILED)
                })
        } else {
            this._setBannerState(BANNER_STATE.FAILED)
        }
    }

    hideBanner() {
        this._setBannerState(BANNER_STATE.HIDDEN)
    }

    showInterstitial() {
        this.#currentAdvertisementIsRewarded = false

        if (this._platformSdk) {
            this._platformSdk
                .showAd()
                .catch(() => {
                    this._setInterstitialState(INTERSTITIAL_STATE.FAILED)
                })
        } else {
            this._setInterstitialState(INTERSTITIAL_STATE.FAILED)
        }
    }

    showRewarded() {
        this.#currentAdvertisementIsRewarded = true

        if (this._platformSdk) {
            this._platformSdk
                .showAd('rewarded')
                .catch(() => {
                    this._setRewardedState(REWARDED_STATE.FAILED)
                })
        } else {
            this._setRewardedState(REWARDED_STATE.FAILED)
        }
    }
}

export default GameDistributionPlatformBridge
