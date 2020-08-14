// pages/login/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    uid: null,
    disabled: false,
    isUID: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 小程序默认进入页面为login
    // 当有uid存在时，进入大厅页面
    if (this.data.isUID) {
      this.login()
      return
    }
  },

  getLocalStorageUID () {
    let _this = this
    wx.getStorage({
      key: 'uid',
      success (res) {
        if (res && res.data) {
          this.setData({
            isUID: true
          })
        }
      }
    })
  },

  initbtnstate () {
    if (!this.data.uid) {
      this.setData({
        disabled: true
      })
      return
    }
    this.setData({
      disabled: false
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  onChange (e) {
    this.setData({
      uid: e.detail
    })

    wx.setStorage({
      key: 'uid',
      data: e.detail
    })

  },

  /**
   * 登录后进入大厅
   */
  login () {
    // TODO
    wx.navigateTo({
      url: '/pages/hall/index',
    })
  }
})