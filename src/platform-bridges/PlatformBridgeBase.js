import EventLite from 'event-lite'
import {
    PLATFORM_ID,
    EVENT_NAME,
    INTERSTITIAL_STATE,
    REWARDED_STATE,
    BANNER_STATE,
    STORAGE_TYPE,
    ERROR,
    VISIBILITY_STATE,
    DEVICE_TYPE,
} from '../constants'
import PromiseDecorator from '../common/PromiseDecorator'

class PlatformBridgeBase {
    // platform
    get platformId() {
        return PLATFORM_ID.MOCK
    }

    get platformSdk() {
        return this._platformSdk
    }

    get platformLanguage() {
        const value = navigator.language
        if (typeof value === 'string') {
            return value.substring(0, 2).toLowerCase()
        }

        return 'en'
    }

    get platformPayload() {
        const url = new URL(window.location.href)
        return url.searchParams.get('payload')
    }

    get platformTld() {
        return null
    }

    // game
    get visibilityState() {
        return this._visibilityState
    }

    // player
    get isPlayerAuthorizationSupported() {
        return false
    }

    get isPlayerAuthorized() {
        return this._isPlayerAuthorized
    }

    get playerId() {
        return this._playerId
    }

    get playerName() {
        return this._playerName
    }

    get playerPhotos() {
        return this._playerPhotos
    }

    // storage
    get defaultStorageType() {
        return this._defaultStorageType
    }

    // advertisement
    get isBannerSupported() {
        return this._isBannerSupported
    }

    get bannerState() {
        return this._bannerState
    }

    get interstitialState() {
        return this._interstitialState
    }

    get rewardedState() {
        return this._rewardedState
    }

    // social
    get isInviteFriendsSupported() {
        return false
    }

    get isJoinCommunitySupported() {
        return false
    }

    get isShareSupported() {
        return false
    }

    get isCreatePostSupported() {
        return false
    }

    get isAddToHomeScreenSupported() {
        return false
    }

    get isAddToFavoritesSupported() {
        return false
    }

    get isRateSupported() {
        return false
    }

    get isExternalLinksAllowed() {
        return false
    }

    // device
    get deviceType() {
        if (navigator && navigator.userAgent) {
            const userAgent = navigator.userAgent.toLowerCase()
            if (/android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
                return DEVICE_TYPE.MOBILE
            }

            if (/ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP)))/.test(userAgent)) {
                return DEVICE_TYPE.TABLET
            }
        }

        return DEVICE_TYPE.DESKTOP
    }

    // leaderboard
    get isLeaderboardSupported() {
        return false
    }

    get isLeaderboardNativePopupSupported() {
        return false
    }

    get isLeaderboardMultipleBoardsSupported() {
        return false
    }

    get isLeaderboardSetScoreSupported() {
        return false
    }

    get isLeaderboardGetScoreSupported() {
        return false
    }

    get isLeaderboardGetEntriesSupported() {
        return false
    }

    // payments
    get isPaymentsSupported() {
        return false
    }

    // config
    get isRemoteConfigSupported() {
        return false
    }

    // clipboard
    get isClipboardSupported() {
        return true
    }

    _isInitialized = false
    _platformSdk = null
    _isPlayerAuthorized = false
    _playerId = null
    _playerName = null
    _playerPhotos = []
    _visibilityState = null
    _localStorage = null
    _defaultStorageType = STORAGE_TYPE.LOCAL_STORAGE
    _platformStorageCachedData = null
    _isBannerSupported = false
    _interstitialState = null
    _rewardedState = null
    _bannerState = null

    #promiseDecorators = { }

    constructor(options) {
        try { this._localStorage = window.localStorage } catch (e) {
            // Nothing we can do with it
        }

        this._visibilityState = document.visibilityState === 'visible' ? VISIBILITY_STATE.VISIBLE : VISIBILITY_STATE.HIDDEN

        document.addEventListener('visibilitychange', () => {
            this._visibilityState = document.visibilityState === 'visible' ? VISIBILITY_STATE.VISIBLE : VISIBILITY_STATE.HIDDEN
            this.emit(EVENT_NAME.VISIBILITY_STATE_CHANGED, this._visibilityState)
        })

        if (options) {
            this._options = { ...options }
        }
    }

    initialize() {
        return Promise.resolve()
    }

    // platform
    sendMessage() {
        return Promise.resolve()
    }

    // player
    authorizePlayer() {
        return Promise.reject()
    }

    // storage
    isStorageSupported(storageType) {
        switch (storageType) {
            case STORAGE_TYPE.LOCAL_STORAGE: {
                return this._localStorage !== null
            }
            case STORAGE_TYPE.PLATFORM_INTERNAL: {
                return false
            }
            default: {
                return false
            }
        }
    }

    isStorageAvailable(storageType) {
        switch (storageType) {
            case STORAGE_TYPE.LOCAL_STORAGE: {
                return this._localStorage !== null
            }
            case STORAGE_TYPE.PLATFORM_INTERNAL: {
                return false
            }
            default: {
                return false
            }
        }
    }

    getDataFromStorage(key, storageType) {
        switch (storageType) {
            case STORAGE_TYPE.LOCAL_STORAGE: {
                if (this._localStorage) {
                    if (Array.isArray(key)) {
                        const values = []

                        for (let i = 0; i < key.length; i++) {
                            values.push(this._getDataFromLocalStorage(key[i]))
                        }

                        return Promise.resolve(values)
                    }

                    const value = this._getDataFromLocalStorage(key)
                    return Promise.resolve(value)
                }
                return Promise.reject(ERROR.STORAGE_NOT_SUPPORTED)
            }
            default: {
                return Promise.reject(ERROR.STORAGE_NOT_SUPPORTED)
            }
        }
    }

    setDataToStorage(key, value, storageType) {
        switch (storageType) {
            case STORAGE_TYPE.LOCAL_STORAGE: {
                if (this._localStorage) {
                    if (Array.isArray(key)) {
                        for (let i = 0; i < key.length; i++) {
                            this._setDataToLocalStorage(key[i], value[i])
                        }
                        return Promise.resolve()
                    }

                    this._setDataToLocalStorage(key, value)
                    return Promise.resolve()
                }
                return Promise.reject(ERROR.STORAGE_NOT_SUPPORTED)
            }
            default: {
                return Promise.reject(ERROR.STORAGE_NOT_SUPPORTED)
            }
        }
    }

    deleteDataFromStorage(key, storageType) {
        switch (storageType) {
            case STORAGE_TYPE.LOCAL_STORAGE: {
                if (this._localStorage) {
                    if (Array.isArray(key)) {
                        for (let i = 0; i < key.length; i++) {
                            this._deleteDataFromLocalStorage(key[i])
                        }
                        return Promise.resolve()
                    }

                    this._deleteDataFromLocalStorage(key)
                    return Promise.resolve()
                }
                return Promise.reject(ERROR.STORAGE_NOT_SUPPORTED)
            }
            default: {
                return Promise.reject(ERROR.STORAGE_NOT_SUPPORTED)
            }
        }
    }

    // advertisement
    showBanner() {
        this._setBannerState(BANNER_STATE.FAILED)
    }

    hideBanner() {
        this._setBannerState(BANNER_STATE.HIDDEN)
    }

    showInterstitial() {
        this._setInterstitialState(INTERSTITIAL_STATE.FAILED)
    }

    showRewarded() {
        this._setRewardedState(REWARDED_STATE.FAILED)
    }

    // social
    inviteFriends() {
        return Promise.reject()
    }

    joinCommunity() {
        return Promise.reject()
    }

    share() {
        return Promise.reject()
    }

    createPost() {
        return Promise.reject()
    }

    addToHomeScreen() {
        return Promise.reject()
    }

    addToFavorites() {
        return Promise.reject()
    }

    rate() {
        return Promise.reject()
    }

    // leaderboard
    setLeaderboardScore() {
        return Promise.reject()
    }

    getLeaderboardScore() {
        return Promise.reject()
    }

    getLeaderboardEntries() {
        return Promise.reject()
    }

    showLeaderboardNativePopup() {
        return Promise.reject()
    }

    // payments
    purchase() {
        return Promise.reject()
    }

    getPaymentsPurchases() {
        return Promise.reject()
    }

    getPaymentsCatalog() {
        return Promise.reject()
    }

    consumePurchase() {
        return Promise.reject()
    }

    // config
    getRemoteConfig() {
        return Promise.reject()
    }

    // clipboard
    clipboardRead() {
        if (window.navigator && window.navigator.clipboard) {
            return window.navigator.clipboard.readText()
        }

        return Promise.reject()
    }

    clipboardWrite(text) {
        if (window.navigator && window.navigator.clipboard) {
            return window.navigator.clipboard.writeText(text)
        }

        return Promise.reject()
    }

    _getDataFromLocalStorage(key) {
        let value = this._localStorage.getItem(key)

        if (typeof value === 'string') {
            try {
                value = JSON.parse(value)
            } catch (e) {
                // Nothing we can do with it
            }
        }

        return value
    }

    _setDataToLocalStorage(key, value) {
        this._localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value)
    }

    _deleteDataFromLocalStorage(key) {
        this._localStorage.removeItem(key)
    }

    _setInterstitialState(state) {
        if (this._interstitialState === state && state !== INTERSTITIAL_STATE.FAILED) {
            return
        }

        this._interstitialState = state
        this.emit(EVENT_NAME.INTERSTITIAL_STATE_CHANGED, this._interstitialState)
    }

    _setRewardedState(state) {
        if (this._rewardedState === state && state !== REWARDED_STATE.FAILED) {
            return
        }

        this._rewardedState = state
        this.emit(EVENT_NAME.REWARDED_STATE_CHANGED, this._rewardedState)
    }

    _setBannerState(state) {
        if (this._bannerState === state && state !== BANNER_STATE.FAILED) {
            return
        }

        this._bannerState = state
        this.emit(EVENT_NAME.BANNER_STATE_CHANGED, this._bannerState)
    }

    _createPromiseDecorator(actionName) {
        const promiseDecorator = new PromiseDecorator()
        this.#promiseDecorators[actionName] = promiseDecorator
        return promiseDecorator
    }

    _getPromiseDecorator(actionName) {
        return this.#promiseDecorators[actionName]
    }

    _resolvePromiseDecorator(id, data) {
        if (this.#promiseDecorators[id]) {
            this.#promiseDecorators[id].resolve(data)
            delete this.#promiseDecorators[id]
        }
    }

    _rejectPromiseDecorator(id, error) {
        if (this.#promiseDecorators[id]) {
            this.#promiseDecorators[id].reject(error)
            delete this.#promiseDecorators[id]
        }
    }
}

EventLite.mixin(PlatformBridgeBase.prototype)
export default PlatformBridgeBase
