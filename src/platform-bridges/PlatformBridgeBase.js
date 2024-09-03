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

/**
 * Base class for platform bridge implementations.
 * Provides a common interface and shared functionality for interacting with different platforms.
 */
class PlatformBridgeBase {

    // Initialization flags and platform-related properties
    _isInitialized = false;
    _platformSdk = null;
    _isPlayerAuthorized = false;
    _playerId = null;
    _playerName = null;
    _playerPhotos = [];
    _visibilityState = null;
    _localStorage = null;
    _defaultStorageType = STORAGE_TYPE.LOCAL_STORAGE;
    _platformStorageCachedData = null;
    _isBannerSupported = false;
    _interstitialState = null;
    _rewardedState = null;
    _bannerState = null;

    // Private dictionary for managing promise decorators
    #promiseDecorators = {};

    // Platform-related getters

    /**
     * Returns the platform identifier.
     * @returns {string} The platform ID.
     */
    get platformId() {
        return PLATFORM_ID.MOCK;
    }

    /**
     * Returns the platform SDK instance.
     * @returns {object|null} The platform SDK or null if not initialized.
     */
    get platformSdk() {
        return this._platformSdk;
    }

    /**
     * Returns the platform language.
     * Defaults to the browser's language or 'en' if unavailable.
     * @returns {string} The platform language code.
     */
    get platformLanguage() {
        const value = navigator.language;
        if (typeof value === 'string') {
            return value.substring(0, 2).toLowerCase();
        }

        return 'en';
    }

    /**
     * Returns the platform payload from the URL.
     * @returns {string|null} The payload parameter or null if not present.
     */
    get platformPayload() {
        const url = new URL(window.location.href);
        return url.searchParams.get('payload');
    }

    /**
     * Returns the top-level domain (TLD) for the platform.
     * This is platform-specific and may be overridden.
     * @returns {string|null} The platform TLD or null if not applicable.
     */
    get platformTld() {
        return null;
    }

    // Game state getters

    /**
     * Returns the current visibility state of the game.
     * @returns {string} The visibility state.
     */
    get visibilityState() {
        return this._visibilityState;
    }

    // Player-related getters

    /**
     * Indicates if player authorization is supported.
     * Override in subclass if supported.
     * @returns {boolean} False by default.
     */
    get isPlayerAuthorizationSupported() {
        return false;
    }

    /**
     * Indicates if the player is authorized.
     * @returns {boolean} The authorization status.
     */
    get isPlayerAuthorized() {
        return this._isPlayerAuthorized;
    }

    /**
     * Returns the player ID.
     * @returns {string|null} The player ID or null if not available.
     */
    get playerId() {
        return this._playerId;
    }

    /**
     * Returns the player's name.
     * @returns {string|null} The player name or null if not available.
     */
    get playerName() {
        return this._playerName;
    }

    /**
     * Returns an array of player photos.
     * @returns {Array} The player photos.
     */
    get playerPhotos() {
        return this._playerPhotos;
    }

    /**
     * Returns the default storage type.
     * @returns {string} The default storage type.
     */
    get defaultStorageType() {
        return this._defaultStorageType;
    }

    // Advertisement-related getters

    /**
     * Indicates if banner advertisements are supported.
     * @returns {boolean} The banner support status.
     */
    get isBannerSupported() {
        return this._isBannerSupported;
    }

    /**
     * Returns the current banner state.
     * @returns {string|null} The banner state.
     */
    get bannerState() {
        return this._bannerState;
    }

    /**
     * Returns the current interstitial advertisement state.
     * @returns {string|null} The interstitial state.
     */
    get interstitialState() {
        return this._interstitialState;
    }

    /**
     * Returns the current rewarded advertisement state.
     * @returns {string|null} The rewarded state.
     */
    get rewardedState() {
        return this._rewardedState;
    }

    // Social-related getters

    /**
     * Indicates if inviting friends is supported.
     * @returns {boolean} False by default.
     */
    get isInviteFriendsSupported() {
        return false;
    }

    /**
     * Indicates if joining a community is supported.
     * @returns {boolean} False by default.
     */
    get isJoinCommunitySupported() {
        return false;
    }

    /**
     * Indicates if sharing is supported.
     * @returns {boolean} False by default.
     */
    get isShareSupported() {
        return false;
    }

    /**
     * Indicates if creating a post is supported.
     * @returns {boolean} False by default.
     */
    get isCreatePostSupported() {
        return false;
    }

    /**
     * Indicates if adding to home screen is supported.
     * @returns {boolean} False by default.
     */
    get isAddToHomeScreenSupported() {
        return false;
    }

    /**
     * Indicates if adding to favorites is supported.
     * @returns {boolean} False by default.
     */
    get isAddToFavoritesSupported() {
        return false;
    }

    /**
     * Indicates if rating is supported.
     * @returns {boolean} False by default.
     */
    get isRateSupported() {
        return false;
    }

    /**
     * Indicates if external links are allowed.
     * @returns {boolean} True by default.
     */
    get isExternalLinksAllowed() {
        return true;
    }

    // Device-related getters

    /**
     * Returns the device type based on the user agent.
     * @returns {string} The device type (MOBILE, TABLET, or DESKTOP).
     */
    get deviceType() {
        if (navigator && navigator.userAgent) {
            const userAgent = navigator.userAgent.toLowerCase();
            if (/android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
                return DEVICE_TYPE.MOBILE;
            }

            if (/ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP)))/.test(userAgent)) {
                return DEVICE_TYPE.TABLET;
            }
        }

        return DEVICE_TYPE.DESKTOP;
    }

    // Leaderboard-related getters

    /**
     * Indicates if leaderboard functionality is supported.
     * Override in subclass if supported.
     * @returns {boolean} False by default.
     */
    get isLeaderboardSupported() {
        return false;
    }

    /**
     * Indicates if native leaderboard popup is supported.
     * @returns {boolean} False by default.
     */
    get isLeaderboardNativePopupSupported() {
        return false;
    }

    /**
     * Indicates if multiple leaderboard boards are supported.
     * @returns {boolean} False by default.
     */
    get isLeaderboardMultipleBoardsSupported() {
        return false;
    }

    /**
     * Indicates if setting leaderboard scores is supported.
     * @returns {boolean} False by default.
     */
    get isLeaderboardSetScoreSupported() {
        return false;
    }

    /**
     * Indicates if retrieving leaderboard scores is supported.
     * @returns {boolean} False by default.
     */
    get isLeaderboardGetScoreSupported() {
        return false;
    }

    /**
     * Indicates if retrieving leaderboard entries is supported.
     * @returns {boolean} False by default.
     */
    get isLeaderboardGetEntriesSupported() {
        return false;
    }

    // Payments-related getters

    /**
     * Indicates if payments functionality is supported.
     * @returns {boolean} False by default.
     */
    get isPaymentsSupported() {
        return false;
    }

    // Configuration-related getters

    /**
     * Indicates if remote configuration functionality is supported.
     * @returns {boolean} False by default.
     */
    get isRemoteConfigSupported() {
        return false;
    }

    // Clipboard-related getters

    /**
     * Indicates if clipboard functionality is supported.
     * @returns {boolean} True by default.
     */
    get isClipboardSupported() {
        return true;
    }

    // Constructor

    /**
     * Initializes the platform bridge with optional settings.
     * Sets up the initial visibility state and adds event listeners.
     * @param {object} [options] Optional settings for the platform bridge.
     */
    constructor(options) {
        try {
            this._localStorage = window.localStorage;
        } catch (e) {
            // Nothing we can do with it
        }

        this._visibilityState = document.visibilityState === 'visible' ? VISIBILITY_STATE.VISIBLE : VISIBILITY_STATE.HIDDEN;

        document.addEventListener('visibilitychange', () => {
            this._visibilityState = document.visibilityState === 'visible' ? VISIBILITY_STATE.VISIBLE : VISIBILITY_STATE.HIDDEN;
            this.emit(EVENT_NAME.VISIBILITY_STATE_CHANGED, this._visibilityState);
        });

        if (options) {
            this._options = { ...options };
        }
    }

    /**
     * Initializes the platform bridge.
     * Can be overridden by subclasses.
     * @returns {Promise} A promise that resolves when initialization is complete.
     */
    initialize() {
        return Promise.resolve();
    }

    // Platform-related methods

    /**
     * Sends a message to the platform.
     * Override in subclass for platform-specific implementation.
     * @returns {Promise} A promise that resolves when the message is sent.
     */
    sendMessage() {
        return Promise.resolve();
    }

    // Player-related methods

    /**
     * Authorizes the player.
     * Override in subclass for platform-specific implementation.
     * @returns {Promise} A promise that rejects by default.
     */
    authorizePlayer() {
        return Promise.reject();
    }

    // Storage-related methods

    /**
     * Checks if a specific storage type is supported.
     * @param {string} storageType The storage type to check.
     * @returns {boolean} True if supported, false otherwise.
     */
    isStorageSupported(storageType) {
        switch (storageType) {
            case STORAGE_TYPE.LOCAL_STORAGE: {
                return this._localStorage !== null;
            }
            case STORAGE_TYPE.PLATFORM_INTERNAL: {
                return false;
            }
            default: {
                return false;
            }
        }
    }

    /**
     * Checks if a specific storage type is available.
     * @param {string} storageType The storage type to check.
     * @returns {boolean} True if available, false otherwise.
     */
    isStorageAvailable(storageType) {
        return this.isStorageSupported(storageType);
    }

    /**
     * Retrieves data from the specified storage.
     * @param {string|Array} key The key(s) to retrieve.
     * @param {string} storageType The storage type to use.
     * @returns {Promise} A promise that resolves with the retrieved data.
     */
    getDataFromStorage(key, storageType) {
        switch (storageType) {
            case STORAGE_TYPE.LOCAL_STORAGE: {
                if (this._localStorage) {
                    if (Array.isArray(key)) {
                        const values = key.map(k => this._getDataFromLocalStorage(k));
                        return Promise.resolve(values);
                    }
                    const value = this._getDataFromLocalStorage(key);
                    return Promise.resolve(value);
                }
                return Promise.reject(ERROR.STORAGE_NOT_SUPPORTED);
            }
            default: {
                return Promise.reject(ERROR.STORAGE_NOT_SUPPORTED);
            }
        }
    }

    /**
     * Stores data in the specified storage.
     * @param {string|Array} key The key(s) to store.
     * @param {any|Array} value The value(s) to store.
     * @param {string} storageType The storage type to use.
     * @returns {Promise} A promise that resolves when the data is stored.
     */
    setDataToStorage(key, value, storageType) {
        switch (storageType) {
            case STORAGE_TYPE.LOCAL_STORAGE: {
                if (this._localStorage) {
                    if (Array.isArray(key)) {
                        key.forEach((k, i) => this._setDataToLocalStorage(k, value[i]));
                        return Promise.resolve();
                    }
                    this._setDataToLocalStorage(key, value);
                    return Promise.resolve();
                }
                return Promise.reject(ERROR.STORAGE_NOT_SUPPORTED);
            }
            default: {
                return Promise.reject(ERROR.STORAGE_NOT_SUPPORTED);
            }
        }
    }

    /**
     * Deletes data from the specified storage.
     * @param {string|Array} key The key(s) to delete.
     * @param {string} storageType The storage type to use.
     * @returns {Promise} A promise that resolves when the data is deleted.
     */
    deleteDataFromStorage(key, storageType) {
        switch (storageType) {
            case STORAGE_TYPE.LOCAL_STORAGE: {
                if (this._localStorage) {
                    if (Array.isArray(key)) {
                        key.forEach(k => this._deleteDataFromLocalStorage(k));
                        return Promise.resolve();
                    }
                    this._deleteDataFromLocalStorage(key);
                    return Promise.resolve();
                }
                return Promise.reject(ERROR.STORAGE_NOT_SUPPORTED);
            }
            default: {
                return Promise.reject(ERROR.STORAGE_NOT_SUPPORTED);
            }
        }
    }

    // Advertisement-related methods

    /**
     * Displays a banner advertisement.
     * Override in subclass for platform-specific implementation.
     */
    showBanner() {
        this._setBannerState(BANNER_STATE.FAILED);
    }

    /**
     * Hides the banner advertisement.
     * Override in subclass for platform-specific implementation.
     */
    hideBanner() {
        this._setBannerState(BANNER_STATE.HIDDEN);
    }

    /**
     * Displays an interstitial advertisement.
     * Override in subclass for platform-specific implementation.
     */
    showInterstitial() {
        this._setInterstitialState(INTERSTITIAL_STATE.FAILED);
    }

    /**
     * Displays a rewarded advertisement.
     * Override in subclass for platform-specific implementation.
     */
    showRewarded() {
        this._setRewardedState(REWARDED_STATE.FAILED);
    }

    // Social-related methods

    /**
     * Invites friends through the platform.
     * Override in subclass for platform-specific implementation.
     * @returns {Promise} A promise that rejects by default.
     */
    inviteFriends() {
        return Promise.reject();
    }

    /**
     * Joins a community through the platform.
     * Override in subclass for platform-specific implementation.
     * @returns {Promise} A promise that rejects by default.
     */
    joinCommunity() {
        return Promise.reject();
    }

    /**
     * Shares content through the platform.
     * Override in subclass for platform-specific implementation.
     * @returns {Promise} A promise that rejects by default.
     */
    share() {
        return Promise.reject();
    }

    /**
     * Creates a post through the platform.
     * Override in subclass for platform-specific implementation.
     * @returns {Promise} A promise that rejects by default.
     */
    createPost() {
        return Promise.reject();
    }

    /**
     * Adds the application to the home screen.
     * Override in subclass for platform-specific implementation.
     * @returns {Promise} A promise that rejects by default.
     */
    addToHomeScreen() {
        return Promise.reject();
    }

    /**
     * Adds the application to favorites.
     * Override in subclass for platform-specific implementation.
     * @returns {Promise} A promise that rejects by default.
     */
    addToFavorites() {
        return Promise.reject();
    }

    /**
     * Rates the application.
     * Override in subclass for platform-specific implementation.
     * @returns {Promise} A promise that rejects by default.
     */
    rate() {
        return Promise.reject();
    }

    // Leaderboard-related methods

    /**
     * Sets the player's score on the leaderboard.
     * Override in subclass for platform-specific implementation.
     * @returns {Promise} A promise that rejects by default.
     */
    setLeaderboardScore() {
        return Promise.reject();
    }

    /**
     * Retrieves the player's score from the leaderboard.
     * Override in subclass for platform-specific implementation.
     * @returns {Promise} A promise that rejects by default.
     */
    getLeaderboardScore() {
        return Promise.reject();
    }

    /**
     * Retrieves leaderboard entries.
     * Override in subclass for platform-specific implementation.
     * @returns {Promise} A promise that rejects by default.
     */
    getLeaderboardEntries() {
        return Promise.reject();
    }

    /**
     * Displays the native leaderboard popup.
     * Override in subclass for platform-specific implementation.
     * @returns {Promise} A promise that rejects by default.
     */
    showLeaderboardNativePopup() {
        return Promise.reject();
    }

    // Payments-related methods

    /**
     * Initiates a purchase.
     * Override in subclass for platform-specific implementation.
     * @returns {Promise} A promise that rejects by default.
     */
    purchase() {
        return Promise.reject();
    }

    /**
     * Retrieves past purchases.
     * Override in subclass for platform-specific implementation.
     * @returns {Promise} A promise that rejects by default.
     */
    getPaymentsPurchases() {
        return Promise.reject();
    }

    /**
     * Retrieves the payments catalog.
     * Override in subclass for platform-specific implementation.
     * @returns {Promise} A promise that rejects by default.
     */
    getPaymentsCatalog() {
        return Promise.reject();
    }

    /**
     * Consumes a purchase.
     * Override in subclass for platform-specific implementation.
     * @returns {Promise} A promise that rejects by default.
     */
    consumePurchase() {
        return Promise.reject();
    }

    // Configuration-related methods

    /**
     * Retrieves the remote configuration.
     * Override in subclass for platform-specific implementation.
     * @returns {Promise} A promise that rejects by default.
     */
    getRemoteConfig() {
        return Promise.reject();
    }

    // Clipboard-related methods

    /**
     * Reads text from the clipboard.
     * @returns {Promise} A promise that resolves with the clipboard text or rejects if unsupported.
     */
    clipboardRead() {
        if (window.navigator && window.navigator.clipboard) {
            return window.navigator.clipboard.readText();
        }

        return Promise.reject();
    }

    /**
     * Writes text to the clipboard.
     * @param {string} text The text to write to the clipboard.
     * @returns {Promise} A promise that resolves when the text is written or rejects if unsupported.
     */
    clipboardWrite(text) {
        if (window.navigator && window.navigator.clipboard) {
            return window.navigator.clipboard.writeText(text);
        }

        return Promise.reject();
    }

    // Private storage-related methods

    /**
     * Retrieves data from local storage.
     * @param {string} key The key to retrieve.
     * @returns {any} The retrieved data.
     * @private
     */
    _getDataFromLocalStorage(key) {
        let value = this._localStorage.getItem(key);

        if (typeof value === 'string') {
            try {
                value = JSON.parse(value);
            } catch (e) {
                // Parsing failed, return the original value
            }
        }

        return value;
    }

    /**
     * Stores data in local storage.
     * @param {string} key The key to store.
     * @param {any} value The value to store.
     * @private
     */
    _setDataToLocalStorage(key, value) {
        this._localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
    }

    /**
     * Deletes data from local storage.
     * @param {string} key The key to delete.
     * @private
     */
    _deleteDataFromLocalStorage(key) {
        this._localStorage.removeItem(key);
    }

    // Private advertisement state management methods

    /**
     * Sets the interstitial advertisement state.
     * @param {string} state The new state.
     * @private
     */
    _setInterstitialState(state) {
        if (this._interstitialState === state && state !== INTERSTITIAL_STATE.FAILED) {
            return;
        }

        this._interstitialState = state;
        this.emit(EVENT_NAME.INTERSTITIAL_STATE_CHANGED, this._interstitialState);
    }

    /**
     * Sets the rewarded advertisement state.
     * @param {string} state The new state.
     * @private
     */
    _setRewardedState(state) {
        if (this._rewardedState === state && state !== REWARDED_STATE.FAILED) {
            return;
        }

        this._rewardedState = state;
        this.emit(EVENT_NAME.REWARDED_STATE_CHANGED, this._rewardedState);
    }

    /**
     * Sets the banner advertisement state.
     * @param {string} state The new state.
     * @private
     */
    _setBannerState(state) {
        if (this._bannerState === state && state !== BANNER_STATE.FAILED) {
            return;
        }

        this._bannerState = state;
        this.emit(EVENT_NAME.BANNER_STATE_CHANGED, this._bannerState);
    }

    // Private promise decorator management methods

    /**
     * Creates a promise decorator for the specified action.
     * @param {string} actionName The action name.
     * @returns {PromiseDecorator} The created promise decorator.
     * @private
     */
    _createPromiseDecorator(actionName) {
        const promiseDecorator = new PromiseDecorator();
        this.#promiseDecorators[actionName] = promiseDecorator;
        return promiseDecorator;
    }

    /**
     * Retrieves a promise decorator by action name.
     * @param {string} actionName The action name.
     * @returns {PromiseDecorator} The promise decorator or undefined if not found.
     * @private
     */
    _getPromiseDecorator(actionName) {
        return this.#promiseDecorators[actionName];
    }

    /**
     * Resolves the promise decorator with the specified data.
     * @param {string} id The decorator ID.
     * @param {any} data The data to resolve with.
     * @private
     */
    _resolvePromiseDecorator(id, data) {
        if (this.#promiseDecorators[id]) {
            this.#promiseDecorators[id].resolve(data);
            delete this.#promiseDecorators[id];
        }
    }

    /**
     * Rejects the promise decorator with the specified error.
     * @param {string} id The decorator ID.
     * @param {Error} error The error to reject with.
     * @private
     */
    _rejectPromiseDecorator(id, error) {
        if (this.#promiseDecorators[id]) {
            this.#promiseDecorators[id].reject(error);
            delete this.#promiseDecorators[id];
        }
    }

}

EventLite.mixin(PlatformBridgeBase.prototype)
export default PlatformBridgeBase