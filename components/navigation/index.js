// components/navigation/index.js
import {
  titleHeightPx,
  statusBarHeightPx
} from '../../common/const/systeminfo.js'

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    title: {
      type: String,
      value: '聚联云Meeter'
    },
    bgStyle: {
      type: String,
      value: '#fff'
    },
    showBack: {
      type: Boolean,
      value: false
    },
    // 可传入改变nav back页面数
    delta: {
      type: Number,
      value: 1
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
    statusBarHeight: statusBarHeightPx,
    navHeight: titleHeightPx,
    model: null
  },
  lifetimes: {
    attached () {
      var model = wx.getMenuButtonBoundingClientRect()
      this.setData ({
        model: model
      })
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onPressBack () {
      if (this.data.backfun) {
        this.triggerEvent('back', {})
        return
      }

      let pages = getCurrentPages()
      if (pages.length < 2) {
        this.goToHome()
      } else {
        wx.navigateBack({
          delta: this.data.delta
        })
      }
    },
    goToHome () {
      wx.reLaunch({
        url: '/pages/hall/index'
      })
    }
  }
})
