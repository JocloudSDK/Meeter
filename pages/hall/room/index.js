// pages/room/index.js
/**
 * 1. 进入房间查询房间属性，找到房间所属者
 * 2. 获取消息
 * 3. 获取房间在线人数，实时更新
 */
import {
  titleHeight
} from '../../../common/const/systeminfo.js'
import {
  Log,
  queryNodes
} from '../../../common/utils/util'

import Dialog from '../../../miniprogram_npm/@vant/weapp/dialog/dialog'
import Toast from '../../../miniprogram_npm/@vant/weapp/toast/toast'

import {
  getRoomMemberCount,
  getMembers,
  sendMessage,
  logoutRoom
} from '../../../common/business/hummer'

import {
  MEETER_ROOM_COUNT,
  MEETER_ROOM_COUNT_CHANGE,
  ROOM_ATTRIBUTES,
  MEETER_ROOM_MESSAGE,
  JOIN_MEETER_ROOM,
  EXIT_MEETER_ROOM,
  SWITCH_CAMERA,
  SWITCH_MUTE,
  LEAVE_ROOM,
  OWNER_LEAVE_ROOM,
  MEETER_OWNER_USER_OFFLINE,
  ROOM_MEMBER_OFFLINE
} from '../../../common/event/name'
import toast from '../../../miniprogram_npm/@vant/weapp/toast/toast'

const TAG = 'room'
const app = getApp()
const global = getApp().globalData

Page({
  /**
   * 页面的初始数据
   */
  data: {
    scrollTop: 0,
    mute: false,
    camerafront: true,
    titleHeight,
    roomId: null,
    onlineNumbers: 0,
    ownerUID: null,
    myuid: null,
    focus: false,
    show: false,
    onlineMembers: [],
    canvas: [],
    showSendMessage: false,
    message: null,
    messageTop: 0,
    toView: 'msg-0',
    bottom: 130,
    messageLists: [
      {
        nickname: '官方友情提示',
        uid: global.appId,
        message: '欢迎进入，请文明发言！',
        avator: '/images/avator.jpg',
        type: 'official'
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      roomId: options.roomId,
      myuid: global.owner.uid
    })

    this.getRoomAttributes()
    this.getRoomMemberCount()

    this.listeners()
  },

  listeners () {
    let self = this
    //房间在线人数
    this.getMember = (data) => {
      if (data.success) {
        this.setData({
          onlineNumbers: data[this.data.roomId]
        })
      }
    }
    app.event.on(MEETER_ROOM_COUNT, this.getMember)

    // 房间属性
    this.getAttribute = data => {
      console.log('事件通知', data)
      Log(TAG, `监听到房间属性: ${JSON.stringify(data)}`)
      this.setData({
        ownerUID: data.attributes.owner
      })
      global.ownerUID = data.attributes.owner
      console.log(ownerUID, this.data.ownerUID, global)
    }
    app.event.on(ROOM_ATTRIBUTES, this.getAttribute)

    // 房间消息
    this.roomMessage = data => {
      console.log('监听到房间消息:', data)
      Log(TAG, `监听到房间消息: ${JSON.stringify(data)}`)
      let type = 'info'
      if (data.fromUid === global.owner.uid) {
        type = 'me'
      }
      this.updateMessage(data, type)
    }
    app.event.on(MEETER_ROOM_MESSAGE, this.roomMessage)

    // 房间人数变化
    this.roomMembersChange = data => {
      this.setData({
        onlineNumbers: data.count
      })
      this.getMembers()
      this.initMembers()
    }
    app.event.on(MEETER_ROOM_COUNT_CHANGE, this.roomMembersChange)

    this.memberJoin = data => {
      let uids = data.uids
      uids.forEach(item => {
        this.updateMessage({fromUid: item}, 'join')
      })
    }
    app.event.on(JOIN_MEETER_ROOM, this.memberJoin)

    this.memberLeave = data => {
      let uids = data.uids
      uids.forEach(item => {
        // 如果是主播，用户退出消息房间，退出视频房间
        console.log('退出房间的用户', item, '主播', global, global.ownerUID)
        if (item === global.ownerUID) {
          Toast('主播已退出')
          logoutRoom()
          app.event.emit(LEAVE_ROOM)
          let roomTag = `${global.area}:${this.data.roomId}`
          if (global.roomClientCache.get(roomTag)) {
            global.roomClientCache.delete(roomTag)
          }
          // 跳转到首页
          self.goToHome()
          return
        }
        self.updateMessage({fromUid: item}, 'leave')
      })
    }
    app.event.on(EXIT_MEETER_ROOM, this.memberLeave)

    // 主播因为断网退出房间，（用户全部退出房间）
    this.offlineLeave = () => {
      logoutRoom()
      app.event.emit(LEAVE_ROOM)
      self.goToHome()
    }
    app.event.on(MEETER_OWNER_USER_OFFLINE, this.offlineLeave)

    // 用户断网
    this.longtimeExit = () => {
      global.network = false
      logoutRoom()
      self.goToHome()
    }
    app.event.on(ROOM_MEMBER_OFFLINE, this.longtimeExit)
  },

  /**
   * 更新消息
   * @param {*} data 
   * @param {*} type 消息类型 info、join、leave
   */
  updateMessage (data, type = 'info') {
    let message = null
    let fromUid = data.fromUid
    let types = type
    
    let { messageLists } = this.data
    if (types === 'info') {
      message = global.HummerSDK.Utify.decodeUtf8BytesToString(data.message.data)
    } else if (types === 'join') {
      message = `${fromUid} 加入会议`
    } else if (types === 'leave') {
      message = `${fromUid} 退出会议`
    } else if (fromUid === global.owner.uid) { // 我
      types = 'me'
      message = global.HummerSDK.Utify.decodeUtf8BytesToString(data.message.data)
    }
    messageLists.push({
      uid: fromUid,
      message,
      type: types
    })
    this.setData({
      messageLists
    })
    this.setData({
      toView: `msg-${messageLists.length - 1}`
    })
  },

  /**
   * 查询指定房间总人数
   */
  getRoomMemberCount () {
    let region = global.area
    let roomIds = this.data.roomId
    console.log('查询房间总人数参数：', global, global.roomLists, {region, roomIds})
    getRoomMemberCount(region, [roomIds]).then(res => {
      this.setData({
        onlineNumbers: res.userCount[this.data.roomId]
      })
    })
  },

  /**
   * 查询房间属性
   */
  getRoomAttributes () {
    let params = {
      regin: global.area,
      roomId: this.data.roomId
    }
  
    console.log('房间属性参数：', params)
    global.meetRoom.getRoomAttributes(params).then(res => {
      Log(TAG, `获取房间属性成功： ${JSON.stringify(res)}`)
      this.setData({
        ownerUID: res.attributes.owner
      })
      global.ownerUID = res.attributes.owner

      let timer = setTimeout(() => {
        this.getMembers()
        clearTimeout(timer)
      }, 1200)
    }).catch(err => {
      Log(TAG, `获取房间属性失败： ${JSON.stringify(err)}`)
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
    app.event.off(MEETER_ROOM_COUNT, this.getMember)
    app.event.off(JOIN_MEETER_ROOM, this.memberJoin)
    app.event.off(ROOM_ATTRIBUTES, this.getAttribute)
    app.event.off(MEETER_ROOM_MESSAGE, this.roomMessage)
    app.event.off(MEETER_ROOM_COUNT_CHANGE, this.roomMembersChange)
    app.event.off(JOIN_MEETER_ROOM, this.memberJoin)
    app.event.off(EXIT_MEETER_ROOM, this.memberLeave)
    app.event.off(MEETER_OWNER_USER_OFFLINE, this.offlineLeave)
    app.event.off(ROOM_MEMBER_OFFLINE, this.longtimeExit)
  },

  focus () {
    this.setData({
      focus: true
    })
  },
  getMembers () {
    let self = this
    getMembers().then(res => {
      console.log('获取房间在线人员列表成功', res)
      let members = []
      let { uids } = res
      if (res.roomId === self.data.roomId) {
        uids.forEach(item => {
          let obj = {}
          obj.uid = item
          // 是主播非我
          if (item === global.ownerUID &&global.ownerUID !== global.owner.uid) {
            obj.type = 'owner'
            obj.info = `${item} 主播`
          }
          // 是主播是我
          else if (item === global.ownerUID && global.ownerUID === global.owner.uid) {
            obj.type = 'owner'
            obj.info = `${item} 主播 (我)`
          }
          // 是我非主播
          else if (item === global.owner.uid && global.ownerUID !== item) {
            obj.type = 'me'
            obj.info = `${item} (我)`
          }
          // 非我非主播
          else {
            obj.type = 'other'
            obj.info = `${item}`
          }
          members.push(obj)

          this.setData({
            onlineMembers: members
          })
          if (this.data.onlineNumbers !== this.data.onlineMembers.length) {
            this.setData({
              onlineNumbers: this.data.onlineMembers.length
            })
          }
        })
      }
    })
  },
  showMembers () {
    this.initMembers()
    this.setData({
      show: true
    })
  },
  initMembers () {
    if (!this.data.onlineMembers || !this.data.onlineMembers.length) {
      this.getMembers()
      this.getRoomMemberCount()
    }
    // 排序 => 主播-我-其他
    let members = this.data.onlineMembers
    let temp = []
    let others = members.filter(item => item.uid !== global.ownerUID && item.uid !== this.data.myuid) // 其他
    let player = members.filter(item => item.uid === global.ownerUID) // 主播
    let owner = members.filter(item => item.uid === this.data.myuid) // 我

    temp = others
    if (player && player.length) { // 主播
      if (owner && owner.length) { // 我
        if (player[0].uid === owner[0].uid) { // 我是主播
          temp.unshift(player[0])
        } else { // 我不是主播
          temp.unshift(owner[0])
          temp.unshift(player[0])
        }
      } else { // 没有我
        temp.unshift(player[0])
      }
    } else { // 没有主播
      if (owner && owner.length) { // 我
        temp.unshift(owner[0])
      }
    }
    this.setData({
      onlineMembers: temp
    })
  },
  onClose () {
    this.setData({
      show: false
    })
  },
  bindinput (e) {
    this.setData({
      message: e.detail.value
    })
  },
  showSendMessageBox () {
    this.setData({
      showSendMessage: true
    })
  },
  sendMessageBlur () {
    this.setData({
      bottom: 130,
      message: null,
      showSendMessage: false
    })
  },
  /**
   * 聚焦，弹起键盘
   */
  sendMessageFocus (e) {
    const systemInfo = wx.getSystemInfoSync()
    let {windowHeight} = systemInfo
    let keyboard_height = e.detail.height
    let messageTop = windowHeight - keyboard_height
    queryNodes('#sendMessage', 'height').then(res => {
      messageTop -= res
      this.setData({
        messageTop,
        bottom: keyboard_height + res + 60,
        showSendMessage: true
      })
    })
  },
  /**
   * 发送房间消息
   */
  sendMessageToUser () {
    if (!this.data.message) return
    let attrs = { 
      type: '100',
      content: global.HummerSDK.Utify.encodeStringToUtf8Bytes(this.data.message)
    }
    sendMessage(attrs).then(res => {
      console.log('发消息后的回调', res)
      if (!res.rescode) {
        this.setData({
          message: null
        })
      } else {
        toast(`发送消息失败, 请重试`)
      }
    }).catch(err => {
      toast(`发送消息失败, 请重试`)
      console.log('消息发送失败', err)
    })
  },
  navback () {
    console.log('进入room')
    let _self = this
    
    Dialog.confirm({
      title: '提示',
      message: _self.data.myuid === global.ownerUID ? '结束当前会议？' : '退出当前会议？',
    }).then(() => {
      console.log('回调确定', global)
      if (_self.data.myuid === global.ownerUID) { // 主播退出
        app.event.emit(OWNER_LEAVE_ROOM)
      }
      console.log('清除后的globalData', global)
      app.event.emit(LEAVE_ROOM)
      logoutRoom()
      _self.goToHome()
    }).catch((err) => {
      console.log('失败', err)
    })
  },
  goToHome () {
    console.log('gohome:url: ', '/pages/hall/index')
    let timer = setTimeout(() => {
      wx.redirectTo({
        url: '/pages/hall/index'
      })
      clearTimeout(timer)
    }, 100)
  },
  /**
   * 切换摄像头
   */
  switchCamera () {
    this.data.camerafront = !this.data.camerafront
    this.setData({
      camerafront: this.data.camerafront
    })
    app.event.emit(SWITCH_CAMERA)
  },

  /**
   * 切换静音
   */
  switchMute () {
    this.data.mute = !this.data.mute
    this.setData({
      mute: this.data.mute
    })
    app.event.emit(SWITCH_MUTE, this.data.mute)
  }
})