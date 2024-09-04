import PlatformBridgeBase from './PlatformBridgeBase'
import {
    ACTION_NAME,
    BANNER_STATE,
    INTERSTITIAL_STATE,
    PLATFORM_ID,
    PLATFORM_MESSAGE,
    REWARDED_STATE,
    STORAGE_TYPE,
} from '../constants'
import { addJavaScript, waitFor } from '../common/utils'

const SDK_URL = 'https://storage.googleapis.com/cdn-wortal-ai/v2/wortal-core.js'

class WortalPlatformBridge extends PlatformBridgeBase {
    // platform
    get platformId() {
        return PLATFORM_ID.WORTAL
    }

    get platformLanguage() {
        if (this._platformSdk) {
            const value = this._platformSdk.session.getLocale()
            if (value) {
                return value.toLowerCase().slice(0, 2)
            }
        }

        return super.platformLanguage
    }

    // device
    get deviceType() {
        const value = this._platformSdk.session.getDevice()
        if (value) {
            return value.toLowerCase()
        }

        return super.deviceType
    }

    // social
    get isExternalLinksAllowed() {
        return false
    }

    #supportedApis

    initialize() {
        if (this._isInitialized) {
            return Promise.resolve()
        }

        let promiseDecorator = this._getPromiseDecorator(ACTION_NAME.INITIALIZE)
        if (!promiseDecorator) {
            promiseDecorator = this._createPromiseDecorator(ACTION_NAME.INITIALIZE)

            addJavaScript(SDK_URL)
                .then(() => {
                    waitFor('Wortal', 'initializeAsync')
                        .then(() => {
                            window.Wortal.initializeAsync()
                                .then(() => {
                                    this._platformSdk = window.Wortal
                                    this.#supportedApis = this._platformSdk.getSupportedAPIs()
                                    this._isBannerSupported = this.#supportedApis.includes('ads.showBanner')
                                    this._platformSdk.player.onLogin(this.#updatePlayerInfo)
                                    this._isInitialized = true
                                    this._resolvePromiseDecorator(ACTION_NAME.INITIALIZE)
                                })
                        })
                })
        }

        return promiseDecorator.promise
    }

    // platform
    sendMessage(message) {
        switch (message) {
            case PLATFORM_MESSAGE.GAMEPLAY_STARTED: {
                this._platformSdk.session.gameplayStart()
                return Promise.resolve()
            }
            case PLATFORM_MESSAGE.GAMEPLAY_STOPPED: {
                this._platformSdk.session.gameplayStop()
                return Promise.resolve()
            }
            case PLATFORM_MESSAGE.GAME_READY: {
                this._platformSdk.setLoadingProgress(100)
                this._platformSdk.startGameAsync()
                return Promise.resolve()
            }
            case PLATFORM_MESSAGE.PLAYER_GOT_ACHIEVEMENT: {
                this._platformSdk.session.happyTime()
                return Promise.resolve()
            }
            default: {
                return super.sendMessage(message)
            }
        }
    }

    // advertisement
    showBanner(options) {
        let position = 'bottom'
        if (options) {
            if (typeof options.position === 'string') {
                position = options.position
            }
        }

        this._platformSdk.ads.showBanner(true, position)
        this._setBannerState(BANNER_STATE.SHOWN)
    }

    hideBanner() {
        this._platformSdk.ads.showBanner(false)
        this._setBannerState(BANNER_STATE.HIDDEN)
    }

    showInterstitial(options) {
        let placement = 'next'
        let description = 'NextLevel'

        if (options) {
            if (options.placement) {
                placement = options.placement
            }

            if (options.description) {
                description = options.description
            }
        }

        this._platformSdk.ads.showInterstitial(
            placement,
            description,
            () => {
                this._setInterstitialState(INTERSTITIAL_STATE.OPENED)
            },
            () => {
                this._setInterstitialState(INTERSTITIAL_STATE.CLOSED)
            },
            () => {
                this._setInterstitialState(INTERSTITIAL_STATE.FAILED)
            },
        )
    }

    showRewarded(options) {
        let description = 'Bonus'

        if (options) {
            if (options.description) {
                description = options.description
            }
        }

        this._platformSdk.ads.showRewarded(
            description,
            () => {
                this._setRewardedState(REWARDED_STATE.OPENED)
            },
            () => {
                this._setRewardedState(REWARDED_STATE.CLOSED)
            },
            () => {
                this._setRewardedState(REWARDED_STATE.CLOSED)
            },
            () => {
                this._setRewardedState(REWARDED_STATE.REWARDED)
            },
            () => {
                this._setRewardedState(REWARDED_STATE.FAILED)
            },
        )
    }

    checkAdBlock() {
        return new Promise((resolve) => {
            resolve(this._platformSdk.ads.isAdBlocked())
        })
    }

    // storage
    isStorageSupported(storageType) {
        if (storageType === STORAGE_TYPE.PLATFORM_INTERNAL) {
            return this.#supportedApis.includes('player.setDataAsync')
        }

        return super.isStorageSupported(storageType)
    }

    isStorageAvailable(storageType) {
        if (storageType === STORAGE_TYPE.PLATFORM_INTERNAL) {
            return this.#supportedApis.includes('player.setDataAsync')
        }

        return super.isStorageAvailable(storageType)
    }

    getDataFromStorage(key, storageType, tryParseJson) {
        if (storageType === STORAGE_TYPE.PLATFORM_INTERNAL) {
            return new Promise((resolve, reject) => {
                const keys = Array.isArray(key) ? key : [key]
                this._platformSdk.player.getDataAsync(keys)
                    .then((data) => {
                        if (!this._platformStorageCachedData) {
                            this._platformStorageCachedData = {}
                        }

                        if (Array.isArray(key)) {
                            const values = []

                            for (let i = 0; i < key.length; i++) {
                                const value = typeof data[key[i]] === 'undefined'
                                    ? null
                                    : data[key[i]]

                                values.push(value)
                                this._platformStorageCachedData[key[i]] = value
                            }

                            resolve(values)
                            return
                        }

                        const value = typeof data[key] === 'undefined'
                            ? null
                            : data[key]

                        this._platformStorageCachedData[key] = value
                        resolve(value)
                    })
                    .catch((error) => reject(error))
            })
        }

        return super.getDataFromStorage(key, storageType, tryParseJson)
    }

    setDataToStorage(key, value, storageType) {
        if (storageType === STORAGE_TYPE.PLATFORM_INTERNAL) {
            return new Promise((resolve, reject) => {
                const data = this._platformStorageCachedData !== null
                    ? { ...this._platformStorageCachedData }
                    : {}

                if (Array.isArray(key)) {
                    for (let i = 0; i < key.length; i++) {
                        data[key[i]] = value[i]
                    }
                } else {
                    data[key] = value
                }

                this._platformSdk.player.setDataAsync(data)
                    .then(() => {
                        this._platformStorageCachedData = data
                        resolve()
                    })
                    .catch((error) => reject(error))
            })
        }

        return super.setDataToStorage(key, value, storageType)
    }

    deleteDataFromStorage(key, storageType) {
        if (storageType === STORAGE_TYPE.PLATFORM_INTERNAL) {
            return new Promise((resolve, reject) => {
                const data = this._platformStorageCachedData !== null
                    ? { ...this._platformStorageCachedData }
                    : {}

                if (Array.isArray(key)) {
                    for (let i = 0; i < key.length; i++) {
                        delete data[key[i]]
                    }
                } else {
                    delete data[key]
                }

                this._platformSdk.player.setDataAsync(data)
                    .then(() => {
                        this._platformStorageCachedData = data
                        resolve()
                    })
                    .catch((error) => reject(error))
            })
        }

        return super.deleteDataFromStorage(key, storageType)
    }

    #updatePlayerInfo() {
        this._playerId = this._platformSdk.player.getId()
        this._playerName = this._platformSdk.player.getName()
        this._playerPhotos = [this._platformSdk.player.getPhoto()]
    }
}

export default WortalPlatformBridge
