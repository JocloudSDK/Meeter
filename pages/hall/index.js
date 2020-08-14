// pages/hall/index.js
import {
  Log,
  RANDOM_ROOMID
} from '../../common/utils/util'

import {
  footHeight
} from '../../common/const/systeminfo'

import {
  TABBAR
} from './../../common/const/enum'

import {
  getRoomAttributes,
  createRoom,
  setUserAttributes
} from '../../common/business/hummer'

import {
  ROOM_ID,
  CREATE_MEETER_ROMM,
  JOIN_MEETER_ROOM,
  EXIT_MEETER_ROOM,
  MEETER_ROOM_COUNT_CHANGE,
  MEETER_ROOM_MESSAGE,
  ROOM_MEMBER_OFFLINE
} from '../../common/event/name'

import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'

const global = getApp().globalData
const app = getApp()
const TAG = 'hall'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    uid: null,
    title: `聚联云Meeter`,
    roomId: null,
    hallRoomId: null,
    disabled: false,
    momentDialog: false,
    tabbars: [],
    createDisabled: false,
    footHeight
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      hallRoomId: global.hallRoomId
    })

    this.initTabbar()

    getApp().event.on(ROOM_ID, (data) => {
      this.setData({
        roomId: data
      })
    })

    getApp().event.on(CREATE_MEETER_ROMM, () => {
      this.setData({
        createDisabled: false
      })
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
    console.log('hall global', global)
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
    getApp().event.off(ROOM_ID)
    getApp().event.off(CREATE_MEETER_ROMM)
  },

  onChange (e) {
    // 输入最多8位数字房间ID，首位输入0的，不显示，加入房间按钮显示不可用
    let firstString = e.detail.slice(0, 1)
    if (firstString === '0') {
      this.setData({
        disabled: true,
        roomId: null
      })
    } else {
      this.setData({
        disabled: false,
        roomId: e.detail
      })
    }
  },

  initRoomInstance (roomInstance, roomLists, roomTag) {
    roomInstance = global.client.createRoom({
      region: global.area,
      roomId: this.data.roomId
    })
    roomInstance.roomTag = roomTag
    roomLists.push(roomTag)
    global.meetRoom = roomInstance
    global.roomClientCache.set(roomTag, roomInstance)
    roomInstance.on('MemberJoined', data => {
      console.log('登录-加入开课房间：', data)
      Log(TAG, `加入开课房间： ${JSON.stringify(data)}`)
      app.event.emit(JOIN_MEETER_ROOM, data)
    })
    roomInstance.on('MemberLeft', data => {
      console.log('登录-退出房间：', data)
      Log(TAG, `退出房间： ${JSON.stringify(data)}`)
      app.event.emit(EXIT_MEETER_ROOM, data)
    })
    roomInstance.on('MemberCountUpdated', data => {
      console.log('登录-房间人数变更：', data)
      Log(TAG, `房间人数变更： ${JSON.stringify(data)}`)
      app.event.emit(MEETER_ROOM_COUNT_CHANGE, data)
    })
    roomInstance.on('RoomMessage', data => {
      console.log('登录-房间人收到房间消息：', data)
      Log(TAG, `房间人收到房间消息变更： ${JSON.stringify(data)}`)
      app.event.emit(MEETER_ROOM_MESSAGE, data)
    })
    roomInstance.on('RoomMemberOffline', data => {
      console.log('登录-房间当前用户断线超时离开房间回调：', data)
      Log(TAG, `登录-房间当前用户断线超时离开房间回调： ${JSON.stringify(data)}`)
      app.event.emit(ROOM_MEMBER_OFFLINE)
    })
  },

  /**
   * 加入房间
   */
  joinRoom () {
    console.log('全局global：', global)
    if (!global.network) {
      Toast('网络异常')
      return
    }
    if (!this.data.roomId || this.data.disabled) {
      return
    }
    this.setData({
      disabled: true
    })
    
    // 如果房间实例还未创建，提示房间还未创建
    if (!global.roomClientCache) {
      global.roomClientCache = new Map()
    }

    let roomInstance = null
    let roomLists = global.roomLists
    let roomTag = `${global.area}:${this.data.roomId}`

    console.log('meet-roomClientCache-roomTag', roomTag, global.roomClientCache.get(roomTag), global.meetRoom, roomInstance == global.meetRoom)
    if (global.roomClientCache.get(roomTag)) {
      roomInstance = global.roomClientCache.get(roomTag)
      global.meetRoom = roomInstance
      if (roomInstance == global.meetRoom) {
        Log(TAG, `已经是开课房间, area = ${global.area}, roomId = ${this.data.roomId}`)
        global.roomId = this.data.roomId
        app.event.emit(ROOM_ID, this.data.roomId)
      }
    } else {
      this.initRoomInstance(roomInstance, roomLists, roomTag)
    }

    // 加入前查询“房间属性”是否包括所有者字段，有->加入成功；没有->房间还未创建
    getRoomAttributes(this.data.roomId).then(res => {
      console.log('加入房间，获取房间参数:', res)
      if (res.attributes && res.attributes.owner && res.roomId === this.data.roomId) {
        global.ownerUID = res.attributes.owner
        let extra = {
          nickname: '', // global.userInfo && global.userInfo.nickName,
          avator: '', // global.userInfo && global.userInfo.avatarUrl,
          useruid: global.owner.uid
        }
        Log(TAG, `设置加入指定房间属性参数：${JSON.stringify(extra)}`)

        global.meetRoom.join(extra).then(res => {
          Log(TAG, `加入会议房间成功：${JSON.stringify(res)}`)
          this.setData({
            disabled: false
          })
          wx.redirectTo({
            url: `/pages/hall/room/index?roomId=${this.data.roomId}`,
          })
          // 设置用户属性
          // ...
        }).catch(err => {
          Log(TAG, `加入会议房间成功失败：${JSON.stringify(err)}`)
        })
      } else {
        Log(TAG, `房间还未创建：${JSON.stringify(res)}`)
        Toast('房间还未创建')
        this.setData({
          disabled: false
        })
      }
    }).catch(err => {
      console.log('加入房间，获取属性失败', err)
    })
  },

  /**
   * 创建房间
   */
  createRoom () {
    console.log('全局global：', global)
    if (!global.network) {
      Toast('网络异常')
      return
    }
    if (this.data.createDisabled) return
    this.setData({
      createDisabled: true
    })
    let roomId = RANDOM_ROOMID()
    createRoom(roomId)
  },

  logout () {
    
  },
  /**
   * 弹出反馈弹窗
   */
  showMoment () {
    this.setData({
      momentDialog: true
    })
  },

  initTabbar () {
    let { tabbars } = this.data
    Object.keys(TABBAR).map(key => {
      tabbars.push({
        key: key,
        value: TABBAR[key]
      })
    })
  },
  feedback () {
    wx.redirectTo({
      url: '/pages/feedback/index'
    })
  }
})