# 聚联云Meeter
本项目基于聚联云RTC、RTS的微信小程序端SDK开发，帮助开发者在微信小程序中实现音视频会议、消息互动、房间管理等功能。在微信小程序中搜索“聚联云Meeter”可进行体验。
该示例项目中主要包含了以下功能：

| 角色     | 定义                                   | 权限                             |
| -------- | -------------------------------------- | -------------------------------- |
| 普通用户 | 进入小程序加入大厅的所有用户           | 私聊，创建或加入新的房间         |
| 主播     | 房间创建者（房间号随机生成）           | 推流、公屏聊天、禁言、切换摄像头 |
| 观众     | 根据主播提供的房间号加入房间，成为观众 | 拉流、公屏聊天                   |

## 快速开始
### 环境准备
- 确保本地已安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 已在微信公众平台 [注册小程序](https://mp.weixin.qq.com/cgi-bin/wx?token=&lang=zh_CN)
- 注册 [Jocloud开发者账号](https://jocloud.com/cn/reg) 并申请 [项目AppID](https://docs.jocloud.com/cloud/cn/platform/console/create_and_manage_projects/create_and_manage_projects.html)

### 运行示例程序
本节主要讲解如何编译和运行示例程序。

1、注册[Jocloud开发者账号](https://jocloud.com/cn/reg)并申请[项目AppID](https://docs.jocloud.com/cloud/cn/platform/console/create_and_manage_projects/create_and_manage_projects.html)。

2、复制您项目的AppID。

3、根据目录 common/const/enum.js，找到appIdList，并填入获取到的AppID。
```js
const appIdList = []
```
4、启动微信开发者工具并导入该示例Demo。

> **说明：** 将提示扫码登录并填写小程序AppID。

5、通过⼯具菜单，设置 -> 项⽬设置，更改域名访问的[配置](https://jszc-bj.oss-cn-beijing.aliyuncs.com/Resource/WeChat/Static/wechat_config.png)。

6、配置小程序公众平台账号的开发设置。
* RTC SDK（ThunderBolt）
  ```bash
  wss://sslproxy-rtc.jocloud.com:4443
  wss://web-ap-service.jocloud.com
  ```
* RTS SDK（Hummer）
  ```bash
  wss://web-ap-service.jocloud.com
  ```
  > **注意：** 微信小程序目前约束了最多有两条socket的连接，如果多于2条会导致连接异常，所以用户在使用多条socket的时候，务必要控制好连接数量（RTS SDK 和 RTC SDK已经占用两条连接）。

## API调用流程
### 关键接口列表
> **说明：** 可将[下载](https://docs.jocloud.com/download)的ThunderBolt和Hummer的js放在 `lib`目录下。

#### 使用的 SDK 版本说明
| SDK | 版本 |
| :---- | ---- |
| RTC-WECHAT | 1.0.1 |
| RTS-JS | 3.2.1 |

#### 使用的 SDK API 说明
* RTS SDK

| SDK | 实现功能 |
| :---- | ---- |
| [VERSION](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/function.html#version) | 获取 SDK 版本信息 |
| [createHummer](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/function.html#%E5%88%9D%E5%A7%8B%E5%8C%96hummer) | 初始化Hummer |
| [login](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/function.html#%E7%99%BB%E5%BD%95login) | 登录SDK |
| [logout](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/function.html#%E7%99%BB%E5%87%BAlogout) | 登出SDK |
| [createRTSInstance](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/function.html#%E5%88%9D%E5%A7%8B%E5%8C%96rts-service) | 创建实例并初始化 |
| [sendMessageToUser](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/function.html#%E5%8F%91%E9%80%81%E7%82%B9%E5%AF%B9%E7%82%B9%E7%9A%84%E6%B6%88%E6%81%AFsendmessagetouser) | 发送点对点信令消息 |
| [getRoomMemberCount](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/function.html#client%E6%9F%A5%E8%AF%A2%E5%8D%95%E4%B8%AA%E6%88%96%E5%A4%9A%E4%B8%AA%E6%88%BF%E9%97%B4%E7%94%A8%E6%88%B7%E6%95%B0getroommembercount) | 批量查询房间成员总数 |
| [setRoomAttributes](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/function.html#room%E5%85%A8%E9%87%8F%E8%AE%BE%E7%BD%AE%E6%9F%90%E6%8C%87%E5%AE%9A%E6%88%BF%E9%97%B4%E7%9A%84%E5%B1%9E%E6%80%A7setroomattributes) | 设置房间属性 |
| [addOrUpdateRoomAttributes](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/function.html#room%E6%9B%B4%E6%96%B0%E6%88%BF%E9%97%B4%E5%B1%9E%E6%80%A7addorupdateroomattributes) | 添加或者更新指定房间的属性 |
| [deleteRoomAttributes](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/function.html#room%E5%88%A0%E9%99%A4%E6%9F%90%E6%8C%87%E5%AE%9A%E6%88%BF%E9%97%B4%E7%9A%84%E6%8C%87%E5%AE%9A%E5%B1%9E%E6%80%A7deleteroomattributesbykeys) | 删除指定房间的指定属性 |
| [getRoomAttributes](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/function.html#room%E6%9F%A5%E8%AF%A2%E6%9F%90%E6%8C%87%E5%AE%9A%E6%88%BF%E9%97%B4%E7%9A%84%E5%85%A8%E9%83%A8%E5%B1%9E%E6%80%A7getroomattributes) | 查询指定房间的全部属性 |
| [sendMessage](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/function.html#room%E5%8F%91%E9%80%81%E7%BB%84%E6%92%AD%E6%B6%88%E6%81%AFsendmessage) | 发送房间消息 |
| [creatRoom](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/function.html#%E5%88%9B%E5%BB%BA%E5%8D%95%E4%B8%AA%E6%88%BF%E9%97%B4%E5%AE%9E%E4%BE%8Bcreateroom) | 创建实例并初始化 |
| [join](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/function.html#%E5%8A%A0%E5%85%A5%E6%88%BF%E9%97%B4join) | 进入房间 |
| [leave](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/function.html#%E9%80%80%E5%87%BA%E6%88%BF%E9%97%B4leave) | 退出房间 |
| [getMembers](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/function.html#room%E8%8E%B7%E5%8F%96%E6%88%BF%E9%97%B4%E7%94%A8%E6%88%B7%E5%88%97%E8%A1%A8getmembers) | 获取指定房间的成员列表 |
| [ConnectionStateChanged](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/notification.html#%E6%8E%A5%E6%94%B6%E8%BF%9E%E6%8E%A5%E7%8A%B6%E6%80%81%E5%8F%98%E6%9B%B4%E7%9A%84%E5%9B%9E%E8%B0%83%E9%80%9A%E7%9F%A5hummeronconnectionstatechanged-data--) | SDK状态变化回调 |
| [MessageFromUser](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/notification.html#%E6%8E%A5%E6%94%B6%E5%AF%B9%E7%AB%AF%E6%B6%88%E6%81%AFclientonmessagefromuser-data--) | 当收到点对点信令消息时，会收到该事件的通知回调 |
| [RoomMessage](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/notification.html#room%E6%8E%A5%E6%94%B6%E7%BB%84%E6%92%AD%E6%B6%88%E6%81%AFroomonroommessage-data--) | 用户往房间内发信令消息时，房间内成员收到的通知 |
| [MemberJoined](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/notification.html#room%E6%8E%A5%E6%94%B6%E5%88%B0%E5%8A%A0%E5%85%A5%E6%88%BF%E9%97%B4notify%E5%9B%9E%E8%B0%83roomonmemberjoined-data--) | 成员进入房间通知 |
| [MemberLeft](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/notification.html#room%E6%8E%A5%E6%94%B6%E5%88%B0%E9%80%80%E5%87%BA%E6%88%BF%E9%97%B4notify%E5%9B%9E%E8%B0%83roomonmemberleft-data--) | 成员离开房间通知 |
| [RoomMemberOffline](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/notification.html#room%E6%8E%A5%E6%94%B6%E5%BD%93%E5%89%8D%E7%94%A8%E6%88%B7%E6%96%AD%E7%BA%BF%E8%B6%85%E6%97%B6%E7%A6%BB%E5%BC%80%E6%88%BF%E9%97%B4%E5%9B%9E%E8%B0%83roomonroommemberoffline---) | 当前用户断线超时离开房间通知 |
| [MemberCountUpdated](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/notification.html#room%E6%8E%A5%E6%94%B6%E5%88%B0%E6%88%BF%E9%97%B4%E7%94%A8%E6%88%B7%E6%95%B0%E5%8F%98%E6%9B%B4notify%E5%9B%9E%E8%B0%83roomonmembercountupdated-data--) | 房间人数变更通知 |
| [MemberAttributesAddedOrUpdated](https://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/notification.html#room%E6%8E%A5%E6%94%B6%E5%88%B0%E6%B7%BB%E5%8A%A0%E6%88%96%E6%9B%B4%E6%96%B0%E7%94%A8%E6%88%B7%E6%9F%90%E4%BA%9B%E5%B1%9E%E6%80%A7notify%E5%9B%9E%E8%B0%83roomonmemberattributesaddedorupdated-data--) | 房间成员的用户属性新增或更新回调通知 |


* RTC SDK

| SDK | 实现功能 |
| :---- | ---- |
| [new ClientSdk()](https://docs.jocloud.com/cloud/cn/product_category/rtc_service/rt_video_interaction/api/Wechat/v1.0.0/function.html#%E6%9E%84%E9%80%A0client%E5%AF%B9%E8%B1%A1) | 创建ClientSdk对象 |
| [init](https://docs.jocloud.com/cloud/cn/product_category/rtc_service/rt_video_interaction/api/Wechat/v1.0.0/function.html#init) | 初始化 |
| [on](https://docs.jocloud.com/cloud/cn/product_category/rtc_service/rt_video_interaction/api/Wechat/v1.0.0/function.html#on) | 增加事件绑定 |
| [joinRoom](https://docs.jocloud.com/cloud/cn/product_category/rtc_service/rt_video_interaction/api/Wechat/v1.0.0/function.html#joinRoom) | 加入频道 |
| [leaveRoom](https://docs.jocloud.com/cloud/cn/product_category/rtc_service/rt_video_interaction/api/Wechat/v1.0.0/function.html#leaveRoom) | 离开频道 |
| [publishMedia](https://docs.jocloud.com/cloud/cn/product_category/rtc_service/rt_video_interaction/api/Wechat/v1.0.0/function.html#publishMedia) | 发布音视频流 |
| [subscribeMedia](https://docs.jocloud.com/cloud/cn/product_category/rtc_service/rt_video_interaction/api/Wechat/v1.0.0/function.html#subscribeMedia) | 订阅音视频流 |
| [enableLocalMedia](https://docs.jocloud.com/cloud/cn/product_category/rtc_service/rt_video_interaction/api/Wechat/v1.0.0/function.html#enableLocalMedia) | 恢复发送本地音视频流 |
| [disableLocalMedia](https://docs.jocloud.com/cloud/cn/product_category/rtc_service/rt_video_interaction/api/Wechat/v1.0.0/function.html#disableLocalMedia) | 停止发送本地音视频流 |
| [enableRemoteMedia](https://docs.jocloud.com/cloud/cn/product_category/rtc_service/rt_video_interaction/api/Wechat/v1.0.0/function.html#enableRemoteMedia) | 恢复接收远端音视频流 |
| [disableRemoteMedia](https://docs.jocloud.com/cloud/cn/product_category/rtc_service/rt_video_interaction/api/Wechat/v1.0.0/function.html#disableRemoteMedia) | 停止接收远端音视频流 |
| [join_room_succ](https://docs.jocloud.com/cloud/cn/product_category/rtc_service/rt_video_interaction/api/Wechat/v1.0.0/notification.html#join-room-succ) | 加入频道成功后触发 |
| [update_publish_url](https://docs.jocloud.com/cloud/cn/product_category/rtc_service/rt_video_interaction/api/Wechat/v1.0.0/notification.html#update-publish-url) | publish之后返回推流url |
| [remote_stream_add](https://docs.jocloud.com/cloud/cn/product_category/rtc_service/rt_video_interaction/api/Wechat/v1.0.0/notification.html#remote-stream-add) | 远端用户开播后流通知 |
| [remote_stream_subscribed](https://docs.jocloud.com/cloud/cn/product_category/rtc_service/rt_video_interaction/api/Wechat/v1.0.0/notification.html#remote-stream-subscribed) | 远端视媒体流订阅成功后触发，返回远端用户拉流url |

## 联系我们
 * 如果你想了解更多官方示例，可以参考 [Demo下载](https://docs.jocloud.com/cn/download) 下的DEMO下载。
 * 如果你想了解聚联云SDK在复杂场景下的应用，可以参考 [场景方案](https://docs.jocloud.com/cn/download) 下的SDK集成。
 * 完整的 API 文档见 [RTC API参考](http://docs.jocloud.com/cloud/cn/product_category/rtc_service/rt_video_interaction/api/Wechat/v1.0.0/category.html) 和 [RTS API参考](http://docs.jocloud.com/cloud/cn/product_category/rtm_service/instant_messaging/api/Wechat/v3.2.0/category.html)。
