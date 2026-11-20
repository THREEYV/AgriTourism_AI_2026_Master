<script setup>
import { useRouter } from 'vue-router'
import { ArrowUpRight, Sprout, Compass, Clapperboard, BrainCircuit, Leaf, MapPin, Play, ChevronRight } from 'lucide-vue-next'
import SectionTitle from '../components/SectionTitle.vue'
const router=useRouter()
const services=[
 {title:'AI 助农',desc:'农业产业分析与发展建议',icon:Sprout,tag:'产业顾问',path:'/agriculture',tone:'green'},
 {title:'AI 文旅',desc:'目的地分析与融合发展规划',icon:Compass,tag:'文旅规划',path:'/tourism',tone:'orange'},
 {title:'AI 视频工厂',desc:'模板创作 · 文生视频 · 图生视频',icon:Clapperboard,tag:'内容创作',path:'/video',tone:'purple'},
 {title:'模型服务中心',desc:'官方聚合服务与自定义 API',icon:BrainCircuit,tag:'模型接入',path:'/models',tone:'blue'}
]
const places=['山海田园乡村游','特色农产品品牌计划','非遗文化体验路线']
</script>
<template>
  <div>
    <section class="hero">
      <div class="hero-content"><div class="eyebrow"><span class="pulse"></span> AI 驱动乡村产业创新</div><h1>让农业更智慧<br>让文旅更精彩</h1><p>从产业分析到品牌传播，用 AI 连接农业与文旅的更多可能。</p><button class="btn btn-light" @click="router.push('/agriculture')">立即体验 <ArrowUpRight :size="17"/></button></div>
      <div class="hero-art"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="hero-leaf"><Leaf :size="88"/></div><div class="floating-chip chip-a">SMART AGRI</div><div class="floating-chip chip-b">AI + CULTURE</div></div>
      <div class="hero-bottom"><span><Sprout :size="16"/> 产业赋能</span><span><MapPin :size="16"/> 地域特色</span><span><Play :size="16"/> 智能创作</span></div>
    </section>
    <SectionTitle title="核心服务" subtitle="围绕农业发展、文旅规划与内容创作的一站式 AI 工具"/>
    <div class="service-grid">
      <article v-for="s in services" :key="s.path" class="service-card" @click="router.push(s.path)">
        <div class="service-icon" :class="s.tone"><component :is="s.icon" :size="25"/></div><span class="service-tag">{{s.tag}}</span><h3>{{s.title}}</h3><p>{{s.desc}}</p><div class="card-link">进入服务 <ArrowUpRight :size="16"/></div>
      </article>
    </div>
    <SectionTitle title="灵感与场景" subtitle="从一个小想法开始，探索乡村产业的新表达"/>
    <div class="feature-strip">
      <div class="feature-copy"><span class="kicker">CREATIVE INSPIRATION</span><h2>让家乡的好产品<br>被更多人看见</h2><p>上传产品照片，选择宣传模板，快速体验 AI 视频创作流程。</p><button class="btn btn-primary" @click="router.push('/video')">制作宣传视频 <ChevronRight :size="17"/></button></div>
      <div class="feature-visual"><div class="sun"></div><div class="hill hill-back"></div><div class="hill hill-front"></div><div class="visual-caption">FROM LOCAL TO WORLD</div></div>
    </div>
    <SectionTitle title="热门体验" subtitle="原型内置的体验场景"/>
    <div class="idea-list"><div v-for="(p,i) in places" :key="p" class="idea-item"><span class="idea-num">0{{i+1}}</span><b>{{p}}</b><button class="text-btn" @click="router.push(i===0?'/tourism':'/agriculture')">去看看 <ArrowUpRight :size="15"/></button></div></div>
  </div>
</template>