// components/tabbar/index.js
import {
  TABBAR
} from './../../common/const/enum'

const global = getApp().globalData

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    activeBar: String
  },

  /**
   * 组件的初始数据
   */
  data: {
    active: null,
    tabbars: []
  },

  pageLifetimes: {
    show () {
      this.initTabbar()
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    initTabbar () {
      let { active } = this.data
      let tabbars = []
      active = this.data.activeBar
      Object.keys(TABBAR).map(key => {
        tabbars.push({
          key: key,
          value: TABBAR[key]
        })
      })
      tabbars.forEach(item => {
        switch (item.key) {
          case 'MEETING':
            item.icon = 'phone-circle-o'
            break
          case 'ONLINE_MEMBERS':
            item.icon = 'friends-o'
            break
          case 'PRIVATE_CHAT':
            item.icon = 'chat-o'
            break
          default: ''
        }
      })
      this.setData({
        tabbars,
        active
      })
    },
    onChange (e) {
      let active = e.detail
      this.setData({
        active
      })
      // 跳转到不同的页面
      switch (this.data.active) {
        case 'MEETING':
          wx.redirectTo({
            url: '/pages/hall/index'
          })
          break
        case 'ONLINE_MEMBERS':
          wx.redirectTo({
            url: '/pages/members/index'
          })
          break
        case 'PRIVATE_CHAT':
          wx.redirectTo({
            url: '/pages/chat/index'
          })
          break
        default: ''
      }
    }
  }
})
