// pages/feedback/index.js
import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    feedbackText: null,
    tel: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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
  onInputFeedback (e) {
    this.setData({
      feedbackText: e.detail.value
    })
  },
  onInputTel (e) {
    this.setData({
      tel: e.detail.value
    })
  },
  onFeedback () {
    if (!this.data.feedbackText) {
      Toast('请填写反馈内容')
      return
    }
    // TODO 确定提交方式
    wx.reLaunch({
      url: '/pages/index/index'
    })
  }
})