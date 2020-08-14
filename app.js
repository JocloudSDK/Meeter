//app.js

import HummerSDK from './lib/hummer-rts-wx-sdk'
import storage from './common/utils/storage'
import {
  STORAGE_GLOBAL_OWNER_UID
} from './common/const/global'
import {
  Log,
  RANDOM_UID,
  formatMoonthTime,
  throttle
} from './common/utils/util'
import {
  ERAES,
  appIdList
} from './common/const/enum'
import store from './common/store'
import Event from './common/event/index'
import {
  USER_AUTH_SUCCESS,
  USER_AUTH_REFUSED,
  GET_USER_MESSAGE,
  JOIN_HALL_ROOM,
  EXIT_HALL_ROOM,
  RELOGIN,
  MEETER_ROOM_MESSAGE,
  HALL_ROOM_MEMBER_COUNT
} from './common/event/name'
import Toast from './miniprogram_npm/@vant/weapp/toast/toast'

const event = new Event()
const formIds = []
const TAG = 'APP'

App({
  event,
  formIds,
  store,
  onLaunch: function () {
    let that = this
    console.log('进入小程序～')
    Log(TAG, '进入小程序～')
    this.updateApp()
    this.onNetworkStatusChange()
    wx.setKeepScreenOn({
      keepScreenOn: true
    })

    this.createHummer()
    // this.getUserInfo()
    this.onError()

    // this.onListenerAuth = () => {
    //   that.getUserInfo()
    // }
    // this.event.on(USER_AUTH_SUCCESS, this.onListenerAuth)

    // this.onListenerUnAuth = () => {
    //   this.createHummer()

    // }
    // this.event.on(USER_AUTH_REFUSED, this.onListenerUnAuth)

  },

  onHide () {
    console.log('onhide')
    Log(TAG, 'onhide')
  },
  onShow (options) {
    console.log('onshow', options, 'global', this.globalData)
    // 查询用户是否在线
    if (!this.globalData.client) return
    let owner_uid = this.globalData.owner.uid
    this.globalData.client.queryUsersOnlineStatus({
      uids: [owner_uid]
    }).then(res => {
      console.log('查询当前用户是否在线', res)
      Log(TAG, `查询当前用户是否在线: ${JSON.stringify(res)}`)
      if (res.onlineStatus && res.onlineStatus[owner_uid]) {
        console.log('当前用户在线')
        Log(TAG, `当前用户在线`)
        this.globalData.halUserOnline = true
      } else {
        console.log('当前用户不在线')
        Log(TAG, `当前用户不在线`)
        this.globalData.halUserOnline = false
        if (this.globalData.room) {
          this.login()
        } else {
          this.createHummer()
        }
      }
    })
  },
  // createHummer
  createHummer () {
    let self = this
    let appId =  this.globalData.appId
    Log(TAG, `初始化hummerSDK, appId = ${appId}`)
    let hummer = HummerSDK.createHummer({
      appid: Number(appId)
    })
    this.globalData.hummer = hummer

    this.getToken()

    let version = HummerSDK.VERSION
    this.globalData.version = version

    console.log('创建hummer：', hummer)
    Log(TAG, `humnmer: ${hummer};version: ${version}`)

    // 监听
    hummer.on('ConnectionStateChanged', data => {
      let res = JSON.stringify(data)
      console.log('当前hummer连接状态:', data)
      Log(TAG, `ConnectionStateChanged res:, ${res}`)
      if (!this.globalData.network) {
        if (data.state === 'CONNECTED' || data.state === 'RECONNECTED') {
          this.globalData.network = true
        } else {
          // todo
        }
      }
    })

    hummer.on('TokenExpired', () => {
      Log("TokenExpired")
    })

    let logLevel = this.globalData.logLevel
    Log(TAG, `loglevel: ${logLevel}`)
    hummer.setLogLevel(logLevel)
  },

  initClient () {
    if (this.globalData.client) {
      Log(TAG, "已经初始化Rts实例")
      this.globalData.loading = false
      this.event.emit('LOADING_CHANGE', false)
      return
    }
    Log(TAG, "初始化，创建Rts实例")

    let client = this.globalData.hummer.createRTSInstance()
    this.globalData.client = client

    console.log('client: ', this.globalData.client)
    Log(TAG, `client: ${this.globalData.client}`)

    client.on('MessageFromUser', res => {
      console.log('监听到发送信息：', res)
      Log(TAG, `监听到发送信息：: ${JSON.stringify(res)}`)
      let fromUid = res.fromUid
      let content = this.globalData.HummerSDK.Utify.decodeUtf8BytesToString(res.message.data)
      let time = formatMoonthTime(new Date())
      let nickname = null
      let avator = null
      // nickname 和 avator 可根据实际场景进行获取
      let getTime = new Date().getTime()
      let chatLists = []

      let value = wx.getStorageSync('chatLists')
      if (value) {
        chatLists = value
      } else {
        chatLists = []
      }
      chatLists.unshift({
        tag: 'From',
        fromUid,
        content,
        time,
        nickname,
        avator,
        getTime
      })
      wx.setStorage({
        key: 'chatLists',
        data: chatLists,
        time,
        nickname,
        avator,
        getTime
      })

      this.event.emit(GET_USER_MESSAGE, {
        tag: 'From',
        fromUid,
        content,
        time,
        nickname,
        avator,
        getTime
      })
    })
    this.createRoom()
  },

  // 获取token
  getToken: function () {
    let that = this
    let appId = appIdList[0]
    // 先看缓存中有没有已经登录
    let uid = null
    let owner_uid = storage.getStorage(STORAGE_GLOBAL_OWNER_UID) || null
    if (!owner_uid) {
      uid = RANDOM_UID()
    } else {
      uid = owner_uid
    }
    storage.setStorage(STORAGE_GLOBAL_OWNER_UID, uid)
    this.globalData.owner.uid = uid
    Log(TAG, `获取token, uid = ${uid}, appId = ${appId}`)
    let timer = setTimeout(() => {
      that.login()
      clearTimeout(timer)
    }, 1000)
    // GET_TOKEN(appId, uid).then(data => {
    //   if (data.code === 200) {
    //     Log(TAG, `token的值:${data.token}`)
    //     that.globalData.token = data.token

    //     let timer = setTimeout(() => {
    //       that.login()
    //       clearTimeout(timer)
    //     }, 1000)
    //   }
    // })
  },
  createRoom () {
    if (!this.globalData.hallRoomClientCache) {
      this.globalData.hallRoomClientCache = new Map()
    }

    let roomLists = this.globalData.roomLists
    let roomTag = `${this.globalData.area}:${this.globalData.hallRoomId}`
    let roomInstance = null

    // 看缓存，如果已经创建且存在hallroom
    if (this.globalData.hallRoomClientCache.get(roomTag)) {
      roomInstance = this.globalData.hallRoomClientCache.get(roomTag)
      if (roomInstance == this.globalData.hallRoomId) {
        Log(TAG, `已经是大厅房间, area = ${region}, roomId = ${hallRoomId}`)
        return
      }
      this.globalData.room = roomInstance
    } else {
      roomInstance = this.globalData.client.createRoom({
        region: this.globalData.area,
        roomId: this.globalData.hallRoomId
      })
      roomInstance.roomTag = roomTag
      roomLists.push(roomTag)
      this.globalData.hallRoomClientCache.set(roomTag, roomInstance)
      Log(TAG, `创建大厅房间, roomTag = ${roomTag}, roomInstance = ${roomInstance}，roomLists=${JSON.stringify(roomLists)}`)
      console.log('roomInstance:', roomInstance)

      this.globalData.room = roomInstance

      // 监听大厅房间属性
      // 1. 加入房间
      roomInstance.on('MemberJoined', data => {
        console.log('加入大厅房间：', data)
        Log(TAG, `加入大厅房间： ${JSON.stringify(data)}`)
        this.event.emit(JOIN_HALL_ROOM, data)
      })
      roomInstance.on('MemberLeft', data => {
        console.log('退出大厅房间：', data)
        Log(TAG, `退出大厅房间： ${JSON.stringify(data)}`)
        let isMeLeft = data.uids.filter(item => item === this.globalData.owner.uid)
        if (this.globalData.halUserOnline) {
          if (isMeLeft.length) {
            throttle(this.joinRoom(), 500)
            // this.leaveRoom().then(res => {
            //   console.log('监听到退出大厅房间之后，主动退出', res)
            //   this.joinRoom()
            // })
          }
        } else {
          if (isMeLeft.length) {
            this.createHummer()
            // this.leaveRoom().then(res => {
            //   this.createHummer()
            // })
          }
        }
        this.event.emit(EXIT_HALL_ROOM, data)
      })
      roomInstance.on('MemberCountUpdated', data => {
        console.log('大厅房间人数改变：', data)
        Log(TAG, `大厅房间人数改变： ${JSON.stringify(data)}`)
        throttle(this.event.emit(HALL_ROOM_MEMBER_COUNT, data), 600)
      })
      roomInstance.on('RoomMessage', data => {
        console.log('房间人收到房间消息：', data)
        Log(TAG, `房间人收到房间消息变更： ${JSON.stringify(data)}`)
        this.event.emit(MEETER_ROOM_MESSAGE, data)
      })
      roomInstance.on('RoomMemberOffline', data => {
        console.log('大厅当前用户断线超时离开房间回调')
        Log(TAG, `大厅当前用户断线超时离开房间回调, ${JSON.stringify(data)}`)
        if (this.globalData.halUserOnline) {
          this.joinRoom()
        } else {
          this.createHummer()
        }
      })
    }

    // 获取房间属性，如果大厅房间已经创建，直接登录进入房间，不需要设置房间属性
    this.getRoomAttributes().then(res => {
      console.log('获取到的大厅房间的属性', res)
      Log(TAG, `获取到的大厅房间的属性, ${JSON.stringify(res)}`)
      if (res.attributes && res.attributes.owner) {
        this.joinRoom()
      } else {
        // 创建房间之后，设置房间的属性，owner为appid
        this.setRoomAttributes()
      }
    })
  },
  // 获取大厅房间属性
  getRoomAttributes () {
    return new Promise((resolve, reject) => {
      this.globalData.room.getRoomAttributes().then(res => {
        resolve(res)
      }).catch(err => {
        reject(err)
      })
    })
  },

  // 设置大厅房间属性
  setRoomAttributes () {
    let attr = {
      region: this.globalData.area,
      owner: `${this.globalData.appId}`
    }
    this.globalData.room.setRoomAttributes({
      attributes: attr
    }).then(res => {
      this.joinRoom()
      console.log('setRoomAttributes res:', res)
      Log(TAG, `setRoomAttributes res: ${JSON.stringify(res)}`)
    }).catch(err => {
      console.log('setRoomAttributes error:', err)
      Log(TAG, `setRoomAttributes error: ${JSON.stringify(err)}`)

      // this.globalData.showRelogin = true
      // this.event.emit(RELOGIN, true)
      this.login()
      this.globalData.loading = true
+     this.event.emit('LOADING_CHANGE', true)
    })
  },

  // 加入房间
  joinRoom () {
    let that = this
    console.log('joinroom global:', this.globalData)
    if (!this.globalData.room) {
      Log(TAG, `还没有创建房间`)
      this.createRoom()
      return
    }
    this.globalData.loading = true
    this.event.emit('LOADING_CHANGE', true)

    let extra = {
      nickname: '', // this.globalData.userInfo && this.globalData.userInfo.nickName,
      avator: '', // this.globalData.userInfo && this.globalData.userInfo.avatarUrl,
      useruid: this.globalData.owner.uid
    }
    Log(TAG, `设置加入房间属性参数：${JSON.stringify(extra)}`)
    this.globalData.room.join().then(res => {
      this.globalData.loading = false
      this.event.emit('LOADING_CHANGE', false)

      Log(TAG, `join room success：${JSON.stringify(res)}`)
      that.setUserAttributes()
    }).catch(err => {
      Log(TAG, `join room failed：${JSON.stringify(err)}`)
      // this.globalData.showRelogin = true
      // this.event.emit(RELOGIN, true)

      this.login()
      this.globalData.loading = true
      this.event.emit('LOADING_CHANGE', true)
    })
  },

  // 设置用户属性
  setUserAttributes () {
    let extra = null
    // 未授权
    if (!this.store.$state.showAuthorizationWindow) {
      extra = {
        nickname: '', // this.globalData.userInfo && this.globalData.userInfo.nickName,
        avator: '', // this.globalData.userInfo && this.globalData.userInfo.avatarUrl,
        useruid: this.globalData.owner.uid // RANDOM_UID()
      }
    } else {
      extra = {
        useruid: this.globalData.owner.uid
      }
    }
    Log(TAG, `设置房间用户属性参数：${JSON.stringify(extra)}`)
    this.globalData.room.setUserAttributes({
      attributes: extra
    }).then(res => {
      Log(TAG, `设置房间用户属性成功：${JSON.stringify(res)}`)
    }).catch(err => {
      Log(TAG, `设置房间用户属性失败：${JSON.stringify(err)}`)
    })
  },

  // 退出房间
  leaveRoom () {
    if (!this.globalData.room) return
    return new Promise((resolve, reject) => {
      this.globalData.room.leave().then(res => {
        Log(TAG, `主动退出大厅房间成功：${JSON.stringify(res)}`)
        resolve(res)
      }).catch(err => {
        Log(TAG, `主动退出大厅房间失败：${JSON.stringify(err)}`)
        reject(err)
      })
    })
  },

  // 获取HummerSDK 当前所处的状态
  getHummerSDKState () {
    let state = this.globalData.hummer.getState()
    this.globalData.hummerState = state
    Log(TAG, `当前hummer的状态:${state}`)
  },

  // login
  login () {
    this.globalData.loading = true
    this.event.emit('LOADING_CHANGE', true)
    // 如果当前用户在线，直接调用加入房间
    if (this.globalData.halUserOnline) {
      this.joinRoom()
      return
    }
    let that = this
    let region = this.globalData.area
    let uid = this.globalData.owner.uid
    let token = this.globalData.token
    Log(TAG, `login params: area=${region}, uid=${uid}, token=${token}`)
    this.globalData.hummer.login({
      region,
      uid
    }).then(res => {
      console.log('登录成功：', res)
      Log(TAG, `login success: ${JSON.stringify(res)} && area: ${region}`)
      that.initClient()

      this.globalData.showRelogin = false
      this.globalData.halUserOnline = true
      this.event.emit(RELOGIN, false)
    }).catch(err => {
      console.log('登录失败：', err)
      Log(TAG, `login error: ${err}`)
      // 弹出登录弹窗提示，重新登录
      this.globalData.loading = true
      this.event.emit('LOADING_CHANGE', true)
      this.login()
      // this.globalData.showRelogin = true
      // this.event.emit(RELOGIN, true)
    })
  },
  
  // 登录
  goLogin () {
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },

  // 获取系统信息
  getSysInfo () {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    // 胶囊按钮位置信息
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect()

    this.globalData.navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height + systemInfo.statusBarHeight
    this.globalData.menuRight = systemInfo.screenWidth - menuButtonInfo.right
    this.globalData.menuBotton = menuButtonInfo.top - systemInfo.statusBarHeight
    this.globalData.menuHeight = menuButtonInfo.height
  },

  // 获取用户信息
  getUserInfo () {
    // 获取用户信息
    console.log('获取用户信息')
    Log(TAG, `获取用户信息`)
    // 查看是否授权
    wx.getSetting({
      success: res => {
        console.log('是否授权', res)
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          this.globalData.showAuth = false
          this.store.setState({
            showAuthorizationWindow: false
          })
          wx.getUserInfo({
            success: res => {
              console.log('获取用户信息成功：', res)
              Log(TAG, `获取用户信息成功: ${JSON.stringify(res)}`)
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo
              this.store.setState({
                user: res.userInfo
              })
              // this.globalData.owner = res.userInfo
              // this.createHummer()
              
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            },
            fail: err => {
              console.log('获取用户信息失败：', err)
              Log(TAG, `获取用户信息失败: ${JSON.stringify(err)}`)
            }
          })
        } else {
          // 未授权，掉起授权
          this.globalData.showAuth = true
          this.store.setState({
            showAuthorizationWindow: true
          })
          console.log('未授权', this.globalData.showAuth)
          Log(TAG, `未授权: ${this.globalData.showAuth}`)
          wx.authorize({
            scope: 'scope.userInfo',
            success () {
              wx.getUserInfo({
                success: res => {
                  console.log('获取用户信息成功：', res)
                  Log(TAG, `获取用户信息成功: ${JSON.stringify(res)}`)
                  // 可以将 res 发送给后台解码出 unionId
                  this.globalData.userInfo = res.userInfo
                  this.createHummer()
                  
                  // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
                  // 所以此处加入 callback 以防止这种情况
                  if (this.userInfoReadyCallback) {
                    this.userInfoReadyCallback(res)
                  }
                }
              })
            }
          })
        }
      },
      fail (err) {
      }
    })
  },

  updateApp: function () {
    // 版本更新
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      updateManager.onCheckForUpdate(function(res) {
        if (res.hasUpdate) {
          // 请求完新版本信息的回调
          updateManager.onUpdateReady(function() {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: function(res) {
                if (res.confirm) {
                  // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                  updateManager.applyUpdate()
                }
              }
            })
          })
          updateManager.onUpdateFailed(function() {
            wx.showModal({
              // 新的版本下载失败
              title: '已经有新版本了哟~',
              content: '新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~'
            })
          })
        }
      })
    } else {
      wx.showModal({
        title: '提示',
        content:
          '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
      })
    }
  },
  /**
   * 网络变化
   */
  onNetworkStatusChange () {
    let self = this
    wx.onNetworkStatusChange(function (res) {
      console.log('网络连接状况', res)
      Log(TAG, `网络连接状况: ${JSON.stringify(res)}`)
      self.globalData.loading = false
      self.event.emit('LOADING_CHANGE', false)
      if (res.networkType === '2g' || res.networkType === '3g') {
        Toast('网络状况不佳')
        self.globalData.network = true
      }
       if (res.networkType === 'unknown' || res.networkType === 'none') {
        Toast('网络异常')
        self.globalData.network = false
      } else {
        self.globalData.network = true
      }
    })
  },
  
  onError () {
    wx.onError(res => {
      console.log('小程序错误事件回调', res)
      Log(TAG, `小程序错误事件回调: ${JSON.stringify(res)}`)
    })
  },

  globalData: {
    halUserOnline: false,
    loading: true,
    userInfo: null,
    navBarHeight: 0,
    menuRight: 0, // 胶囊距右方间距（方保持左、右间距一致）
    menuBotton: 0, // 胶囊距底部间距（保持底部间距一致）
    menuHeight: 0,
    hallRoomId: appIdList && appIdList[0],
    room: null,
    roomId: null,
    tabbarActive: null,
    client: null,
    hummer: null,
    area: ERAES[0],
    appId: appIdList && appIdList[0],
    token: null,
    version: null,
    hummerState: null,
    logLevel: -1,
    roomLists: [],
    hallRoomClientCache: null,
    owner: {},
    HummerSDK: HummerSDK,
    showAuth: false,
    showRelogin: false,
    roomClientCache: null,
    meetRoom: null,
    network: true,
    ownerUID: null // 主播uid
  }
})