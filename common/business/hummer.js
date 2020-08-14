import HummerSDK from '../../lib/hummer-rts-wx-sdk'
import {
  Log,
  GET_TOKEN
} from '../utils/util'
import {
  appIdList,
  ERAES
} from '../const/enum'

import {
  ROOM_ID,
  ROOM_ATTRIBUTES,
  JOIN_MEETER_ROOM,
  EXIT_MEETER_ROOM,
  MEETER_ROOM_COUNT,
  MEETER_ROOM_MESSAGE,
  MEETER_ROOM_COUNT_CHANGE,
  CREATE_MEETER_ROMM,
  MEETER_OWNER_USER_OFFLINE
} from '../event/name'

import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'

const app = getApp()
const {
  globalData
} = app

const TAG = 'business hummer'

const createHummer = () => {
  if (globalData.hummerSDKInstance) {
    return
  }
  let appId =  globalData.appId
  Log(TAG, `初始化hummerSDK, appId = ${appId}`)

  let hummer = HummerSDK.createHummer({
    appid: Number(appId)
  })
  globalData.hummer = hummer

  let version = HummerSDK.VERSION
  globalData.version = version

  console.log('创建hummer：', hummer)
  Log(TAG, `humnmer: ${hummer};version: ${version}`)

  // 监听
  hummer.on('ConnectionStateChanged', data => {
    let res = JSON.stringify(data)
    Log(TAG, `ConnectionStateChanged res:, ${res}`)
  })

  hummer.on('TokenExpired', () => {
    Log("TokenExpired")
  })

  let logLevel = globalData.logLevel
  Log(TAG, `loglevel: ${logLevel}`)
  hummer.setLogLevel(logLevel)
}
const initClient = () => {
  if (globalData.client) {
    Log(TAG, "已经初始化Rts实例")
    return
  }
  Log(TAG, "初始化，创建Rts实例")
  globalData.client = globalData.hummer.createRTSInstance()
}
const getToken = () => {
  let appId = appIdList[0]
  let uid = globalData.halluid
  Log(TAG, `获取token, uid = ${uid}, appId = ${appId}`)
  GET_TOKEN(appId, uid).then(data => {
    if (data.code === 200) {
      Log(TAG, `token的值:${data.token}`)
      globalData.token = data.token

      createHummer()
      initClient()
      login()
    }
  })
}
  // 获取HummerSDK 当前所处的状态
const getHummerSDKState = () => {
  let state = globalData.hummer.getState()
  globalData.hummerState = state
  Log(TAG, `当前hummer的状态:${state}`)
}
const login = () => {
  let region = globalData.area
  let uid = globalData.halluid
  let token = globalData.token
  Log(TAG, `login params: area=${region}, uid=${uid}, token=${token}`)
  globalData.hummer.login({
    region,
    uid,
    token
  }).then(res => {
    console.log('登录成功：', res)
    Log(TAG, `login success: ${JSON.stringify(res)} && area: ${region}`)
  }).catch(err => {
    console.log('登录失败：', err)
    Log(TAG, `login error: ${err}`)
  })
}
  /**
   * 查询房间属性
   */
function getRoomAttributes (roomId) {
  let params = {
    regin: ERAES[0],
    roomId
  }

  console.log('房间属性参数：', params)
  
  return new Promise((resolve, reject) => {
    globalData.meetRoom.getRoomAttributes(params).then(res => {
      Log('business hummer', `获取房间属性成功： ${JSON.stringify(res)}`)
      app.event.emit(ROOM_ATTRIBUTES, res)
      resolve(res)
    }).catch(err => {
      reject(err)
      Log('business hummer', `获取房间属性失败： ${JSON.stringify(err)}`)
    })
  })
}

/**
 * 
 * 获取用户属性
 */
function getUserAttributes (uid) {
  if (!globalData.room) {
    Log(TAG, '还未创建房间')
    return
  }
  return new Promise((resolve, reject) => {
    globalData.meetRoom.getUserAttributes({
      uid
    }).then(res => {
      resolve(res)
    }).catch(err => {
      reject(err)
    })
  })
}

/**
 * 设置用户属性
 * @param  attrs 
 */
function setUserAttributes (attrs) {
  return new Promise((resolve, reject) => {
    globalData.meetRoom.setUserAttributes({attributes: attrs}).then(res => {
      resolve(res)
    }).catch(err => {
      reject(err)
    })
  })
}

/**
 * 设置房间属性
 */
function setRoomAttributes (attrs) {
  return new Promise((resolve, reject) => {
    app.globalData.meetRoom.setRoomAttributes({
      attributes: attrs
    }).then(res => {
      console.log('setRoomAttributes res:', res)
      resolve(res)
    }).catch(err => {
      console.log(err)
      reject(err)
    })
  })
  
}

/**
 * createRoom 创建房间
 * roomId: 房间id
 * type：进入方式， create：创建； join：加入房间
 * memo：创建房间的时候，如果房间存在，提示直接加入房间，否则创建房间，设置房间属性，owner为自己uid, 设置自己的属性
 * 监听
 */
function createRoom (roomId) {
  if (!globalData.roomClientCache) {
    globalData.roomClientCache = new Map()
  }
  let roomLists = globalData.roomLists
  let roomTag = `${globalData.area}:${roomId}`
  let roomInstance = null

  // 看缓存，如果已经创建且存在room
  if (globalData.roomClientCache.get(roomTag)) {
    roomInstance = globalData.roomClientCache.get(roomTag)
    if (roomInstance == globalData.meetRoom) {
      Log(TAG, `已经是开课房间, area = ${globalData.area}, roomId = ${roomId}`)
      Toast('房间已存在，请直接加入')
      globalData.roomId = roomId
      app.event.emit(ROOM_ID, roomId)
    }
    return
  } else {
    roomInstance = globalData.client.createRoom({
      region: globalData.area,
      roomId: roomId
    })
    console.log('创建房间的参数:', globalData.area, roomId)
    roomInstance.roomTag = roomTag
    roomLists.push(roomTag)
    globalData.roomClientCache.set(roomTag, roomInstance)
    Log(TAG, `创建开课房间, roomTag = ${roomTag}, roomInstance = ${roomInstance}，roomLists=${JSON.stringify(roomLists)}`)
    console.log('roomInstance:', roomInstance)

    globalData.meetRoom = roomInstance

    // 监听开课房间属性
    roomInstance.on('MemberJoined', data => {
      console.log('加入开课房间：', data)
      Log(TAG, `加入开课房间： ${JSON.stringify(data)}`)
      app.event.emit(JOIN_MEETER_ROOM, data)
    })
    roomInstance.on('MemberLeft', data => {
      console.log('退出房间：', data)
      Log(TAG, `退出房间： ${JSON.stringify(data)}`)
      app.event.emit(EXIT_MEETER_ROOM, data)
    })
    roomInstance.on('MemberCountUpdated', data => {
      console.log('房间人数变更：', data)
      Log(TAG, `房间人数变更： ${JSON.stringify(data)}`)
      app.event.emit(MEETER_ROOM_COUNT_CHANGE, data)
    })
    roomInstance.on('RoomMessage', data => {
      console.log('房间人收到房间消息：', data)
      Log(TAG, `房间人收到房间消息变更： ${JSON.stringify(data)}`)
      app.event.emit(MEETER_ROOM_MESSAGE, data)
    })
    // 当前用户断线超时离开房间回调
    roomInstance.on('RoomMemberOffline', data => {
      console.log('创建-房间当前用户断线超时离开房间回调：', data)
      Log(TAG, `创建-房间当前用户断线超时离开房间回调： ${JSON.stringify(data)}`)
      app.event.emit(MEETER_OWNER_USER_OFFLINE)
    })
  }
  globalData.meetRoom = roomInstance
  
  // 设置房间属性
  let attr = {
    owner: globalData.owner.uid
  }
  console.log('设置房间属性参数:', attr, globalData)
  setRoomAttributes(attr).then(res => {
    console.log('设置房间属性成功:', res)
    // 隐式登录房间
    loginRoom().then(res => {
      console.log('创建房间后登录成功', res)
      globalData.ownerUID = globalData.owner.uid
      // 如果用户属性没有设置成功，重新设置
      app.event.emit(CREATE_MEETER_ROMM, true)
      // 跳转到room
      wx.redirectTo({
        url: `/pages/hall/room/index?roomId=${roomId}`,
      })
      // 设置用户属性
      // ...
    })
  })
}

/**
 * 登录房间
 */
function loginRoom () {
  let extra = {
    nickname: '', // globalData.userInfo && globalData.userInfo.nickName,
    avator: '', // globalData.userInfo && globalData.userInfo.avatarUrl,
    useruid: globalData.owner.uid
  }
  return new Promise((resolve, reject) => {
    globalData.meetRoom.join(extra).then(res => {
      console.log('登录房间成功', res)
      resolve(res)
    }).catch(err => {
      console.log('登录房间失败', err)
      reject(err)
    })
  })
}

/**
 * 
 * 退出房间
 */
function logoutRoom (pa) {
  return new Promise((resolve, reject) => {
    globalData.meetRoom.leave().then(res => {
      console.log('退出房间成功:', res)

      resolve(res)
    }).catch(err => {
      reject(err)
    })
  })
}

/**
 * 查询房间人数
 */
function getRoomMemberCount (region, roomIds) {
  return new Promise((resolve, reject) => {
    globalData.client.getRoomMemberCount({
      region,
      roomIds
    }).then(res => {
      console.log('房间总人数：', res)
      resolve(res)
    }).catch(err => {
      console.log('查询房间总人数出错', err)
      reject(err)
    })
  })
}

/**
 * 查询房间所有成员
 */
function getMembers () {
  if (!globalData.meetRoom) return

  return new Promise((resolve, reject) => {
    globalData.meetRoom.getMembers().then(res => {
      resolve(res)
    }).catch(err => {
      reject(err)
    })
  })
}

/**
 * 发送房间消息
 */
function sendMessage(attrs) {
  if (!globalData.meetRoom) return

  return new Promise((resolve, reject) => {
    globalData.meetRoom.sendMessage(attrs).then(res => {
      resolve(res)
    }).catch(err => {
      reject(err)
    })
  })
}

module.exports = {
  createHummer,
  getRoomAttributes,
  setRoomAttributes,
  createRoom,
  getRoomMemberCount,
  getUserAttributes,
  setUserAttributes,
  getMembers,
  sendMessage,
  logoutRoom
}