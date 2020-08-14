const SDK = require('../../lib/thunderblot_wechat_sdk.min.js')
const client = new SDK.ClientSdk()

const app = getApp()
const global = app.globalData
/**
 * 创建ClientSdk对象
 */
function clientThunder () {
  global.thunderClient = client
}

/**
 * 初始化
 */
function initThunder (appId) {
  global.thunderClient.init(appId)
}

/**
 * 加入频道
 */
function joinChannelRoom () {
  global.thunderClient.joinRoom({})
}

module.exports = {
  clientThunder,
  initThunder,
  joinChannelRoom
}