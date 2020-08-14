import storage from "./storage.js"

import {
  global
} from "../const/global.js"

export function getUser () {
  const user = storage.getStorage(global.STORAGE_GLOBAL_USER)
  return user
}

export function saveUser (user) {
  return storage.setStorage(global.STORAGE_GLOBAL_USER, user)
}

export function getUserUid () {
  const user = getUser()
  if (!user || !user.uid) return null
  return user.uid
}

export function deleteUser () {
  return storage.removeStorage(global.STORAGE_GLOBAL_USER)
}

export function getChat () {
  const chat = storage.getStorage(global.STORAGE_GLOBAL_CHAT)
  return chat
}

export function saveChat (chats) {
  return storage.setStorage(global.STORAGE_GLOBAL_CHAT, chats)
}

export function removeChat () {
  return storage.removeStorage(global.STORAGE_GLOBAL_USER)
}
