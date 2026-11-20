<script setup>
const alert = (message) => window.alert(message)
const confirm = (message) => window.confirm(message)
import { useRouter } from 'vue-router'
import { ChevronRight, UserRound, Shield, Bell, Lock, FileText, MessageCircle, Info, BrainCircuit, Trash2 } from 'lucide-vue-next'
const router=useRouter()
const groups=[
 {title:'账户设置',items:[['个人资料','管理昵称与账户信息',UserRound],['账号安全','密码与登录状态',Shield]]},
 {title:'偏好设置',items:[['消息通知','管理消息提醒',Bell],['隐私设置','数据与隐私选项',Lock]]},
 {title:'其他',items:[['用户协议','查看服务条款',FileText],['意见反馈','告诉我们你的建议',MessageCircle],['关于我们','产品介绍与版本信息',Info]]}
]
function action(name){if(name==='个人资料')alert('个人资料编辑为原型占位');else alert(`${name}：此功能为原型演示，正式版本后续接入`)}
function clear(){if(confirm('确定清理本地演示数据吗？此操作不可恢复。')){['zn_reports','zn_videos','zn_apis','zn_favorites'].forEach(k=>localStorage.removeItem(k));alert('本地演示数据已清理，请刷新页面。')}}
</script>
<template><div><div class="page-heading"><div><span class="kicker">PREFERENCES</span><h1>设置</h1><p>管理应用偏好与账户相关选项。</p></div></div><button class="settings-feature" @click="router.push('/models')"><div class="settings-feature-icon"><BrainCircuit :size="24"/></div><div><b>AI 模型服务中心</b><small>官方聚合订阅 · 自定义 API 接入</small></div><ChevronRight/></button><div v-for="g in groups" :key="g.title" class="settings-group"><h3>{{g.title}}</h3><div class="panel"><button v-for="it in g.items" :key="it[0]" class="menu-row" @click="action(it[0])"><div class="menu-icon"><component :is="it[2]" :size="19"/></div><div class="menu-copy"><b>{{it[0]}}</b><small>{{it[1]}}</small></div><ChevronRight :size="18" class="muted"/></button></div></div><div class="settings-group"><h3>数据管理</h3><div class="panel"><button class="menu-row" @click="clear"><div class="menu-icon danger-bg"><Trash2 :size="19"/></div><div class="menu-copy"><b>清理本地演示数据</b><small>删除报告、视频记录与模型配置</small></div><ChevronRight :size="18" class="muted"/></button></div></div><p class="version">乡韵智创 · Prototype v1.0.0</p></div></template>