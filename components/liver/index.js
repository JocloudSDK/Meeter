// components/liver/index.js
const THUNDERBLOT_SDK = require('../../lib/thunderblot_wechat_sdk.min.js')

import {
  titleHeightPx
} from '../../common/const/systeminfo'

import {
  SWITCH_CAMERA,
  SWITCH_MUTE,
  LEAVE_ROOM,
  OWNER_LEAVE_ROOM,
  ROOM_MEMBER_OFFLINE
} from '../../common/event/name.js'
import toast from '../../miniprogram_npm/@vant/weapp/toast/toast'

const app = getApp()
const global = app.globalData

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    roomId: {
      type: String,
      value: null
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    ownerUID: null,
    myuid: null,
    thunderToken: null,
    frontCamera: true,
    enable_camera: true,
    muted: false,
    beauty: '0.0',
    canvas: [],
    clientSdk: null,
    mask: {
      height: 0,
      width: 0
    }
  },
  pageLifetimes: {
    show () {}
  },

  ready () {
    console.log('ready')
    console.log('当前client实例', this.data.clientSdk)
    this.setData({
      ownerUID: getApp().globalData.ownerUID,
      myuid: global.owner.uid
    })
    this.initCanvas()
    this.initSdk()

    this.listeners()
    wx.onSocketError(res => {
      console.log('websocked error', res)
    })
  },

  attached () {
    this.adjustVideoCanvasPos()
  },

  detached () {
    console.log('clientSdk destroy', this.data.clientSdk)
    app.event.off(LEAVE_ROOM, this.leaveRoom)
    app.event.off(ROOM_MEMBER_OFFLINE, this.leaveRoom)
    app.event.off(SWITCH_MUTE, this.switchMute)
    app.event.off(SWITCH_CAMERA, this.switchCamera)
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 初始化thunder
     */
    initSdk () {
      let self = this
      console.log('initsdk', this.data.clientSdk)
      if (!this.data.clientSdk) {
        let clientSdk = new THUNDERBLOT_SDK.ClientSdk()
      
        clientSdk.init(global.appId)
        console.log('clientSdk', clientSdk)
        this.setData({
          clientSdk
        })

        this.joinChannelRoom()
      }
      
      // 监听
      this.JoinRoomSucc = () => {
        this.onJoinRoomSucc()
      },
      this.JoinRoomFail = () => {
        this.onJoinRoomFail()
      }
      this.RemoteStreamAdd = (data) => {
        this.onRemoteStreamAdd(data)
      }
      this.RemoteStreamRemove = (data) => {
        this.onRemoteStreamRemove(data)
      }
      this.RemoteStreamSubscribed = (data) => {
        this.onRemoteStreamSubscribed(data)
      }
      this.UpdatePublishUrl = (data) => {
        this.onUpdatePublishUrl(data)
      }
      this.data.clientSdk.on('join_room_succ', this.JoinRoomSucc)
      this.data.clientSdk.on('join_room_fail', self.JoinRoomFail)
      this.data.clientSdk.on('remote_stream_add', self.RemoteStreamAdd)
      this.data.clientSdk.on('remote_stream_remove', self.RemoteStreamRemove)
      this.data.clientSdk.on('remote_stream_subscribed', self.RemoteStreamSubscribed)
      this.data.clientSdk.on('update_publish_url', self.UpdatePublishUrl)
    },
    listeners () {
      this.switchCamera = () => {
        console.log('进入切换摄像头')
        let cameraCtx = wx.createLivePusherContext('pusher')
        if (cameraCtx) {
          cameraCtx.switchCamera()
          this.data.frontCamera = !this.data.frontCamera
        }
      }
      app.event.on(SWITCH_CAMERA, this.switchCamera)
  
      this.switchMute = (data) => {
        this.setData({
          muted: data
        })
      }
      app.event.on(SWITCH_MUTE, this.switchMute)
  
      this.leaveRoom = () => {
        console.log('离开thunderblot房间', 'leaveroom')
        this.leaveChannelRoom()
      }
      app.event.on(LEAVE_ROOM, this.leaveRoom)
      app.event.on(ROOM_MEMBER_OFFLINE, this.leaveRoom)
  
      this.ownerLeave = () => {
        if (this.data.clientSdk) {
          this.data.clientSdk.destroy()
        }
      }
      app.event.on(OWNER_LEAVE_ROOM, this.ownerLeave)
    },
    /**
     * 加入频道成功后
     */
    onJoinRoomSucc () {
      console.log('加入频道成功后')
      let hummerState = global.hummer.getState()
      console.log('登录成功后的hummer状态:', hummerState)
      // 主播发布音视频流，用户订阅音视频流
      if (global.owner.uid === this.data.ownerUID) {
        console.log('主播加入频道成功')
        let params = {
          audio: true,
          video: true
        }
        this.data.clientSdk.publishMedia(params)
      } else {
        console.log('用户加入频道成功')
      }
    },

    /**
     * 加入频道失败
     */
    onJoinRoomFail (reason) {
      console.log('加入频道失败', reason)
      toast(reason)
      wx.navigateTo({
        url: '/pages/hall/index'
      })
    },

    /**
     * 远端用户开播后流通知
     */
    onRemoteStreamAdd (data) {
      console.log('远端用户开播后流通知', data)
      this.subscribeMedia(data.uid)
    },

    /**
     * 远端媒体流断流或者停播触发。
     */
    onRemoteStreamRemove (data) {
      console.log('远端媒体流断流或者停播触发。', data)
    },

    /**
     * 远端视媒体流订阅成功后触发，返回远端用户拉流url
     */
    onRemoteStreamSubscribed (data) {
      this.data.canvas[0].url = data.url
      this.adjustVideoCanvasPos()
      console.log('远端视媒体流订阅成功后触发，返回远端用户拉流url', data)
    },

    /**
     * publish之后返回推流url
     */
    onUpdatePublishUrl (data) {
      this.data.canvas[0].url = data.url
      console.log('publish之后返回推流url', data)
      this.adjustVideoCanvasPos()
      this.setData({
        canvas: this.data.canvas,
        frontCamera: this.data.frontCamera,
        enable_camera: this.data.enable_camera
      })
    },
    /**
     * 订阅媒体流
     * @param {远端用户uid} uid 
     */
    subscribeMedia (uid) {
      let subinfo = {}
      subinfo.uid = uid
      subinfo.video = true
      subinfo.audio = true
      this.data.clientSdk.subscribeMedia(subinfo)
    },

    refreshVideoCanvas () {
      this.adjustVideoCanvasPos()
      this.setData({
        canvas: this.data.canvas,
        frontCamera: this.data.frontCamera,
        enable_camera: this.data.enable_camera
      })
    },

    /**
     * 加入频道
     * 老师加入频道
     */
    joinChannelRoom () {
      this.data.clientSdk.joinRoom({
        uid: parseInt(global.owner.uid),
        roomId: this.data.roomId,
        token: ''
      })
      // getTHunderToken(global.hallRoomId, global.owner.uid, this.data.roomId).then(res => {
      //   if (res.success) {
      //     this.setData({
      //       thunderToken: res.object
      //     })
      //     this.data.clientSdk.joinRoom({
      //       uid: parseInt(global.owner.uid),
      //       roomId: this.data.roomId,
      //       token: res.object
      //     })
      //   }
      // })
    },
    adjustVideoCanvasPos () {
      let w = parseInt(wx.getSystemInfoSync().windowWidth)
      let h = parseInt(wx.getSystemInfoSync().windowHeight) - titleHeightPx 
      let { canvas } = this.data
      for (let i = 0; i < canvas.length; i++) {
        // 用户
        if (canvas[i].uid != this.data.ownerUID) {
          // TODO
        } else { // 主播
          // TODO
        }
        canvas[i].muted = false
        canvas[i].show = true
        canvas[i].left = 0
        canvas[i].top = 0
        canvas[i].width = w
        canvas[i].height = h - 40
        canvas[i].z_index = 1
      }
      let {mask} = this.data
      mask.height = h - 40
      mask.width = w
      this.setData({
        canvas,
        mask
      })
    },
    initCanvas () {
      const { canvas } = this.data
      canvas.push({
        index: 0,
        uid: global.owner.uid,
        show: true,
        bigCanvas: true,
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        url: '',
        z_index: 1,
        muted: false
      })
      this.setData({
        canvas
      })
    },
    /**
     * 退出频道
     */
    leaveChannelRoom () {
      this.data.clientSdk.leaveRoom()
      console.log('clientSdk.leaveRoom()')
    },
    statechange(e) {
      console.log('live-player code:', e.detail.code)
    },
    error(e) {
      console.error('live-player error:', e.detail.errMsg)
    }
  }
})
