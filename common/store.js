

const Store = require('../lib/store.js')
const eventName = require('./event/name.js')
import {
  theme
} from './const/global'

let store = new Store({
  state: {
    //以下为自定义的全局状态，用法和页面中的data: {...} 一致。
    user: undefined,
    //是否展示授权弹窗
    showAuthorizationWindow: false,
    theme
  },
  methods: {
    //全局方法。 page中调用 this.xxx() wxml中bindtap="xxx" 非页面js文件getCurrentPages().pop().xxx()
    goAnyWhere(e) {
      wx.navigateTo({
        url: e.currentTarget.dataset.url
      })
    },
    getUser() {
      let user = getApp().store.$state.user
      //当前全局中不存在 分别从storage中取
      if (!user) {
        user = userStorage.getUser()
        user && store.setState({
          user
        })
      }
      return user
    }
  },
  pageLisener: {
    onLoad(options) {
      console.log('我在' + this.route, '参数为', options);
      
      if (store.showAuthorizationWindow) {
        store.setState({
          showAuthorizationWindow: false
        })
      }
    }
  }
})
module.exports = store
