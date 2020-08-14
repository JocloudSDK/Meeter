export default class storage {
  static setStorage(key, value) {
    try {
      wx.setStorageSync(key, value)
    } catch (e) {}
  }

  static getStorage(key) {
    try {
      const value = wx.getStorageSync(key)
      return value
    } catch (e) {
      return null
    }
  }

  static removeStorage(key) {
    try {
      wx.removeStorageSync(key)
    } catch (e) {}
  }
  /*
    检查是否过期
  */

  static aging() {
    // const arrStorageName = ['storage_data_expiration','setStorage_advisorPage', 'setStorage_servicePage', 'setStorage_websitePage', 'setStorage_learnPage']
    this.expiration = wx.getStorageSync('storage_data_expiration') // 缓存时间
    this.timestamp = Date.parse(new Date()) / 1000 // 当前时间
    // console.log(this.expiration, this.timestamp,'--url--')

    if (this.expiration) {
      if (this.expiration <= this.timestamp) {
        // console.log('开始更新缓存')
        // 缓存已过期，重新添加数据
        return true
      } else {
        // 未过期，保留缓存数据
        return false   
      }
    } else {
      // 过期时间为空，重新缓存数据
      return true
    }
  }
}