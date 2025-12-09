"use strict";
const electron = require("electron");
const api = {
  projects: {
    list: () => electron.ipcRenderer.invoke("projects:list"),
    create: (name) => electron.ipcRenderer.invoke("projects:create", name),
    update: (projectId, data) => electron.ipcRenderer.invoke("projects:update", projectId, data),
    delete: (projectId) => electron.ipcRenderer.invoke("projects:delete", projectId)
  },
  chats: {
    list: (projectId) => electron.ipcRenderer.invoke("chats:list", projectId),
    create: (projectId, name) => electron.ipcRenderer.invoke("chats:create", projectId, name),
    delete: (chatId) => electron.ipcRenderer.invoke("chats:delete", chatId)
  },
  messages: {
    list: (chatId) => electron.ipcRenderer.invoke("messages:list", chatId),
    append: (chatId, role, content) => electron.ipcRenderer.invoke("messages:append", chatId, role, content)
  },
  models: {
    list: () => electron.ipcRenderer.invoke("models:list"),
    send: (payload) => electron.ipcRenderer.invoke("models:send", payload)
  },
  keys: {
    set: (key, value) => electron.ipcRenderer.invoke("keys:set", key, value),
    get: (key) => electron.ipcRenderer.invoke("keys:get", key)
  }
};
electron.contextBridge.exposeInMainWorld("wisteria", api);
