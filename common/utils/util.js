const autherServer = ''
const autherPath = ''
const thunderAUTHserver = ''

const TAG = 'auth'

const formatTime = date => {
  const year = date.getFullYear()
  
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatMoonthTime = date => {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()

  return [month, day].map(formatNumber).join('-') + ' ' + [hour, minute].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const Log = (subTag, info) => {
  let date = new Date()
  let timestamp = date.toLocaleTimeString('en-US', { hour12: false}) + '.' + padMs(date.getMilliseconds())
  console.log('rtslog', `${subTag} ${timestamp}:`, info)
}

const padMs = (ms) => {
	let len = ms.toString().length
	let ret
	switch (len) {
		case 1:
			ret = '00' + ms
			break
		case 2:
			ret = '0' + ms
			break
		default:
			ret = ms
			break
	}

	return ret
}

const GET_TOKEN = (appId, uid) => new Promise((resolve, reject) => {
  let requestUrl = `${autherServer}${autherPath}?uid=${uid}&appid=${appId}`
  Log(TAG, `token server url = ${requestUrl}`)
  wx.request({
    url: requestUrl,
    header: {
      'content-type': 'application/json;charset=utf-8'
    },
    method: 'GET',
    success({ data, statusCode }) {
      Log(TAG, `获取token的返回, data = ${data}, statusCode = ${statusCode}`)
      if (statusCode === 200) {
        resolve(data)
      } else {
        reject(data)
      }
    },
    fail(error) {
      Log(`${TAG}, 获取token失败, error`, error)
      reject(error)
    }
  })
})

const RANDOM_UID = () => {
  return String(parseInt(Math.random() * (900000000) + 1000000000, 10))
}

const RANDOM_ROOMID = () => {
  return String(parseInt(Math.random() * (9000000) + 10000000, 10))
}

function queryNodes (id, attr) {
  return new Promise((resolve, reject) => {
    let query = wx.createSelectorQuery()
    query.select(id).boundingClientRect()
    query.exec((res) => {
      resolve(res[0][attr])
    })
  })
}

const getTHunderToken = (appId, uid, roomId) => new Promise((resolve, reject) => {
  let data = {
    appId: parseInt(appId),
    uid: parseInt(uid),
    channelName: roomId,
    validTime: '1000'
  }
  wx.request({
    url: thunderAUTHserver,
    data,
    method: 'POST',
    success(res) {
      Log(TAG, `获取thu-token的返回, ${JSON.stringify(res)}`)
      console.log('获取thu-token的返回:', res)
      if (res.data.success) {
        resolve(res.data)
      } else {
        reject(res.data)
      }
    },
    fail(error) {
      Log(`${TAG}, 获取thu-token失败, error`, error)
      reject(error)
    }
  })
})

const throttle = (fn, wait) => {
  let prev = new Date().getTime()
  return function(...args) {
    let now = new Date().getTime()
    if (now - prev >= wait) {
      fn()
      prev = now
    }
  }
}

module.exports = {
  formatTime: formatTime,
  formatMoonthTime,
  Log,
  GET_TOKEN,
  RANDOM_UID,
  RANDOM_ROOMID,
  queryNodes,
  getTHunderToken,
  throttle
}
