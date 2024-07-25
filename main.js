import './style.css'
//import eruda from 'eruda'

import InstantGamesBridge from './src/InstantGamesBridge.js'

window.bridge = new InstantGamesBridge()
window.instantGamesBridge = window.bridge
//eruda.init()