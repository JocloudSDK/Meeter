// pages/members/index.js
import {
  Log
} from '../../common/utils/util'

import {
  LOADING_CHANGE,
  HALL_ROOM_MEMBER_COUNT
} from '../../common/event/name'
const globalData = getApp().globalData
const TAG = 'MEMBERS'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    totalOnlineMembers: 0,
    count: 0,
    _tmpList: [],
    memberLists: [],
    rendermemberlists: [],
    loading: false,
    changeCount: false,
    isShow: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    this.getRoomTotalMembers()
    this.getRoomUserLists()

    getApp().globalData.loading = true
    getApp().event.emit(LOADING_CHANGE, true)

    // 可以在当前页面只监听人数数量变化的回调，因为加入大厅和退出大厅，都会出发数量变化的回调

    this.hallMemberCount = (data) => {
      console.log('监听到的大厅人数：', data)
      Log(TAG, `监听到的大厅人数：${JSON.stringify(data)}`)
      this.setData({
        totalOnlineMembers: data.count,
        changeCount: true
      })
      this.setData({
        _tmpList: [],
        memberLists: []
      })
      let timer = setTimeout(() => {
        this.getRoomUserLists()
        clearTimeout(timer)
      }, 500)
    }
    getApp().event.on(HALL_ROOM_MEMBER_COUNT, this.hallMemberCount)

  },

  // 获取房间用户列表
  getRoomUserLists () {
    console.log('globalData', globalData)
    globalData.room.getMembers().then(res => {
      console.log('getMembers success', res)
      Log(TAG, `getMembers success：${JSON.stringify(res)}`)
      let uids = res.uids
      // 不存在在线用户，说明自己掉线
      if (!uids.length) {
        getApp().getUserInfo()
        return
      }
      if (this.data.totalOnlineMembers !== uids.length) {
        this.setData({
          totalOnlineMembers: uids.length
        })
      }

      this.buildMember(uids)
      
      // let promise = uids.map(id => this.getUserAttribute(id, {}))

      // Promise.all(promise).then(res => {
      //   this.buildMember(res)
      // }).catch(err => {
      //   this.getRoomUserLists()
      // })

    }).catch(err => {
      console.log('getMembers falied：', err)
      Log(TAG, `getMembers falied：${err}`)
    })
  },

  // 获取用户属性
  getUserAttribute ( uid, obj)  {
    return new Promise((resolve, reject) => {
      globalData.room.getUserAttributes({
        uid
      }).then(res => {
        console.log('获取用户属性成功：', res)
        obj.nickname = res.attributes && res.attributes.nickname
        obj.avator = res.attributes && res.attributes.avator
        obj.uid = res.attributes && res.attributes.useruid || res.uid
        let memberLists = this.data.memberLists
        let _return = memberLists.filter(item => item.uid === res.uid)
        if (!_return.length) {
          memberLists.push(obj)
        }
        console.log('获取用户属之后的_return', _return, obj, memberLists, this.data.memberLists)
        resolve(obj)
      }).catch(err => {
        console.log('获取用户属性成失败：', err)
      })
    })
  },
  /**
   * 处理在线人员显示
   */
  buildMember (list) {
    let _tmpList = list
    let _list = []
    console.log('owner uid:', _tmpList, this.data._tmpList, this.data.memberLists, globalData.owner.uid, typeof globalData.owner.uid)
    let _tmp = []
    let _index = null
    _tmpList.forEach((e, i) => {
      // 如果是我自己
      let obj = {}
      if (e === globalData.owner.uid) {
        obj.isOwner = true
        _index = i
      }
      obj.uid = e
      _list.push(obj)
    })
    _tmp = _list.splice(_index, 1)
    _tmp = _tmp.concat(_list)
    console.log('处理之后的list', _tmp)
    this.setData({
      memberLists: _tmp,
      rendermemberlists: _tmp
    })

    getApp().globalData.loading = false
    getApp().event.emit(LOADING_CHANGE, false)
  },
  /**
   * 查询房间总人数
   */
  getRoomTotalMembers () {
    globalData.client.getRoomMemberCount({
      roomIds: [globalData.hallRoomId]
    }).then(res => {
      Log(TAG, `getRoomTotalMembers res：${JSON.stringify(res)}`)
      this.setData({
        totalOnlineMembers: res.userCount[globalData.hallRoomId]
      })
    }).catch(err => {
      Log(TAG, `getRoomTotalMembers falied：${err}`)
      console.log('getRoomTotalMembers falied：', err)
      this.setData({
        totalOnlineMembers: this.data.memberLists.length
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
  onShow (options) {
    console.log('globalData onshow', globalData, options)
    globalData.client.queryUsersOnlineStatus({
      uids: [globalData.owner.uid]
    }).then(res => {
      console.log('查询当前用户是否在线', res)
      if (res.onlineStatus && res.onlineStatus[globalData.owner.uid]) {
        console.log('当前用户在线')
      } else {
        console.log('当前用户不在线')
      }
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.setData({
      changeCount: false
    })
    clearTimeout(this.timer)
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    getApp().event.off(HALL_ROOM_MEMBER_COUNT, this.hallMemberCount)
  },

  goPrivate (e) {
    let { uid } = e.currentTarget.dataset
    if (uid === globalData.owner.uid) return
    wx.reLaunch({
      url: `/pages/chat/index?uid=${uid}`,
    })
  }
})