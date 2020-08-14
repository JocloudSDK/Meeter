// components/chat-dialog/index.js
import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    receiver: {
      type: String,
      value: null
    }

  },

  /**
   * 组件的初始数据
   */
  data: {
    uid: null,
    message: null
  },

  observers: {
    receiver (receiver) {
      this.setData({
        uid: receiver
      })
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 取消
    onClose () {
      this.setData({ show: false })
      this.closeUid()
      this.closeMessage()
      this.triggerEvent('sendnullchatmessage', {}, {})
    },
    getUID (e) {
      this.setData({
        uid: e.detail.value
      })
    },
    closeUid () {
      this.setData({
        uid: null
      })
    },
    closeMessage () {
      this.setData({
        message: null
      })
    },
    getMessage (e) {
      this.setData({
        message: e.detail.value
      })
    },
    // 确定发送
    onConfirm () {
      // 1. 校验用户是否存在
      // 2. 校验内容是否为空
      // 3. 发送
      if (!this.data.uid) {
        Toast({
          message: 'UID请勿留空',
          zIndex: 9999
        })
        return
      }
      if (!this.data.message) {
        Toast({
          message: '消息不可为空',
          zIndex: 9999
        })
        return
      }
      
      console.log('send message:', {
        uid: this.data.uid,
        message: this.data.message
      })

      this.triggerEvent('sendchatmessage', {
        uid: this.data.uid,
        message: this.data.message
      }, {})
      this.onClose()
      this.closeMessage()
    }
  }
})
