import './style.css'
import './node_modules/bootstrap/dist/css/bootstrap.min.css'

import InstantGamesBridge from './src/InstantGamesBridge.js'

window.bridge = new InstantGamesBridge()
window.instantGamesBridge = window.bridge