// pages/chat/index.js
import {
  GET_USER_MESSAGE,
  LOADING_CHANGE
} from '../../common/event/name'

import {
  formatMoonthTime
} from '../../common/utils/util'

import {
  isX
} from '../../common/const/systeminfo'

const globalData = getApp().globalData
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    show: false,
    ownerUid: null,
    receiver: null,
    fromToMembers: false,
    chatList: [],
    isX
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    // getApp().globalData.loading = true
    // getApp().event.emit(LOADING_CHANGE, true)

    this.initMessage()
    this.setData({
      receiver: options.uid || null,
      fromToMembers: options.uid ? true : false,
      ownerUid: globalData.owner.uid
    })

    let that = this
    this.getMessage = (data) => {
      console.log('监听到接收的消息：', data)
      let { chatList } = that.data
      chatList.unshift(data)
      that.setData({
        chatList
      })
    }
    getApp().event.on(GET_USER_MESSAGE, this.getMessage)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () { },

  initMessage () {
    let { chatList } = this.data
    let _self = this
    wx.getStorage({
      key: 'chatLists',
      success (res) {
        chatList = res.data
        // 按照时间倒序
        let _tmplist = chatList.sort((a, b) => b.getTime - a.getTime)
        _self.setData({
          chatList: _tmplist
        })

        console.log('获取消息体：', chatList)
        // globalData.loading = false
        // getApp().event.emit(LOADING_CHANGE, false)
      },
      fail (err) {
        console.log('获取消息失败', err)
        // localstorage中没有
        _self.setData({
          chatList: []
        })
      }
    })
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

  tochat (e) {
    let { item } = e.currentTarget.dataset
    let {receiver} = this.data
    this.setData({
      show: true,
      receiver: item && item.fromUid ? item.fromUid : receiver
    })
  },
  clearMessage () {
    this.setData({
      receiver: null
    })
  },
  sendMessage (e) {
    let params = {
      receiver: e.detail.uid,
      type: '100',
      content: globalData.HummerSDK.Utify.encodeStringToUtf8Bytes(e.detail.message),
      appExtras: null
    }
    // 发送信息
    globalData.client.sendMessageToUser(params).then(res => {
      console.log('send message success:', res)
      let {chatList} = this.data
      let fromUid = e.detail.uid // globalData.owner.uid
      let content = e.detail.message
      let time = formatMoonthTime(new Date())
      let getTime = new Date().getTime()
      chatList.unshift({
        tag: 'To',
        fromUid,
        content,
        time,
        getTime
      })
      this.setData({
        chatList
      })
      wx.setStorage({
        key: 'chatLists',
        data: chatList,
        time,
        getTime
      })
    }).catch(err => {
      console.log('send message failed:', err)
    })
  }
})