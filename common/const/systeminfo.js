const {
  screenWidth,
  platform,
  model,
  windowWidth,
  windowHeight,
  screenHeight: screenHeightPx,
  statusBarHeight: statusBarHeightPx,
} = wx.getSystemInfoSync()

/**
 * 小程序顶部导航的相关设置
 */
const config = {
  tabBarHeight: 98,
  iphoneXSafeHeight: 66,
  titleHeight: 44 + statusBarHeightPx,
  prefix: 24 // iphone X + 24
}

const isX = model.includes('iPhone X') || model.includes('iPhone 11')
const isMI8 = model.includes('MI 8')
const isAndroid = platform == 'android'

function px2rpx (px) {
  return px * 750 / windowWidth
}

function rpx2px(rpx){
  return windowWidth / 750 * rpx
}

// 顶部导航高度，单位为rpx
function getTitleHeight (unitPx=false) {
  let titleHeightPx = config.titleHeight
  // if (isX || isMI8) {
  //   titleHeightPx = config.titleHeight
  // } else if (isAndroid) {
  //   titleHeightPx = config.titleHeight + 6
  // }
  if(unitPx){
    return titleHeightPx
  }
  return px2rpx(titleHeightPx)
}

// 底部高度，单位为rpx
function getFooterHeight () {
  return config.tabBarHeight + (isX ? config.iphoneXSafeHeight : 0)
}

const titleHeight = getTitleHeight()

const titleHeightPx = getTitleHeight(true)

const footHeight = getFooterHeight()

const footHeightPx = rpx2px(footHeight)

const screenHeight = px2rpx(screenHeightPx)

//单位rpx
const statusBarHeight = px2rpx(statusBarHeightPx)

const windowHeightPX = rpx2px(windowHeight)

//获取内容区域高度 单位rpx 默认页面有NavBar 没有TabBar
function getContentHeight(hasNavBar=true, hasTabBar=false){
  let contentHeight = hasNavBar ? screenHeight - titleHeight : screenHeight
  contentHeight = hasTabBar ? contentHeight - footHeight : contentHeight
  return contentHeight
}

function getContentHeightPx(hasNavBar=true, hasTabBar=false){
  let contentHeightPx = hasNavBar ? screenHeightPx - titleHeightPx : screenHeightPx
  contentHeightPx = hasTabBar ? contentHeightPx - footHeightPx : contentHeightPx
  return contentHeightPx
}

export {
  platform,
  model,
  isMI8,
  isX,
  isAndroid,
  titleHeight,
  titleHeightPx,
  footHeight,
  footHeightPx,
  screenHeight,
  screenHeightPx,
  statusBarHeight,
  statusBarHeightPx,
  getContentHeight,
  getContentHeightPx,
  screenWidth,
  windowHeightPX
}