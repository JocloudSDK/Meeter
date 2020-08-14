// components/yy-layout/index.js
const global = getApp()
import {
  Log
} from '../../common/utils/util'

import {
  titleHeight,
  footHeight,
  getContentHeightPx
} from '../../common/const/systeminfo.js'

import {
  USER_AUTH_SUCCESS,
  LOADING_CHANGE,
  RELOGIN
} from '../../common/event/name'

const TAG = 'layout'
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    title: {
      type: String
    },
    loading: {
      type: Boolean,
      value: true
    },
    frontColor: {
      type: String,
      value: '#fff'
    },
    backgroundColor: {
      type: String,
      value: '#000'
    },
    scrollEnable: {
      type: Boolean,
      value: true
    },
    activeBar: {
      type: String
    },
    showTabbar: {
      type: Boolean,
      value: true
    },
    showBack: {
      type: Boolean,
      value: false
    },
    delta: {
      type: Number,
      value: 1
    },
    scrollAnimation: {
      type: Boolean,
      value: true
    },
    scrollTop: {
      type: [Number, String]
    },
    backfun: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    titleHeight,
    footHeight,
    tabbars: [],
    showAuth: false,
    loading: false,
    showRelogin: false,
    disabled: false
  },

  ready () {
    let contentHeight = getContentHeightPx(true, this.data.showTabbar)
    this.setData({
      contentHeight,
      showAuth: global.store.$state.showAuthorizationWindow,
      loading: global.globalData.loading,
      showRelogin: global.globalData.showRelogin
    })

    let that = this
    this.changeLoading = data => {
      that.setData({
        loading: data
      })
    }
    getApp().event.on(LOADING_CHANGE, this.changeLoading)
  },
  pageLifetimes: {
    show () {}
  },

  lifetimes: {
    attached () { }
  },

  detached () {
    getApp().event.off(LOADING_CHANGE, this.changeLoading)
  },

  /**
   * 组件的方法列表
   */
  methods: {
    getUserInfo (e) {
      if (e.type === 'getuserinfo' && e.detail.errMsg === 'getUserInfo:ok') {
        global.store.setState({
          showAuthorizationWindow: false
        })
        this.setData({
          showAuth: false
        })
        // 通知
        global.event.emit(USER_AUTH_SUCCESS)
      } else {
        // TODO 拒绝之后有待商榷 
        // 目前强制同意授权
        // 通知
        // this.setData({
        //   showAuth: false
        // })
        // global.event.emit(USER_AUTH_REFUSED)
      }
    },
    cancle () {
      Log(TAG, '取消授权')
      this.setData({
        showAuth: false
      })
    },
    login () {
      console.log('再次登录～')
      this.setData({
        disabled: true
      })
      global.login()
    },
    back () {
      console.log('进入layout')
      this.triggerEvent('navback', {})
    }
  }
})
