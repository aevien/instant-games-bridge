import { PLATFORM_ID } from "../constants";
import PlatformBridgeBase from "./PlatformBridgeBase";

class PlayWeb3 extends PlatformBridgeBase {
    get platformId() {
        return PLATFORM_ID.PLAY_W3
    }

    // social
    get isExternalLinksAllowed() {
        return false
    }
}

export default PlayWeb3