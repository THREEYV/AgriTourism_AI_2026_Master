<script setup>
const alert = (message) => window.alert(message)
import { ref, computed } from 'vue'
import { BrainCircuit, ShieldCheck, Plus, Trash2, Pencil, CheckCircle2, CircleAlert, Zap, LoaderCircle, PlugZap, RefreshCw } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import { testConnection, listModels } from '../utils/llm'
import { toast } from '../utils/toast'
const store=useAppStore()
const providers=['OpenAI','Anthropic Claude','Google Gemini','DeepSeek','通义千问','豆包','智谱 GLM','Kimi','MiniMax','其他兼容服务']
// 默认模型只是“标识”，真正调用的是上面启用的那条 API 配置
// 分组展示：国内对话 / 视频生成 / 图像生成 / 海外
const modelGroups = [
  { label: '国内 · 对话与多模态', items: ['DeepSeek-V4-Pro', 'DeepSeek-V4-Flash', 'Qwen3-Max', '豆包 Seed 2.0', 'GLM-4.6', 'Kimi K2', '文心一言 5.0', '腾讯混元 T1', 'MiniMax-M2'] },
  { label: '国内 · 视频生成', items: ['可灵 Kling 2.5', '可灵 Kling 2.1', 'MiniMax 海螺 02', '即梦 Seedance 2.0', '通义万相 Wan2.5', 'Vidu Q1'] },
  { label: '国内 · 图像生成', items: ['即梦 Seedream 4.0', '通义 Qwen-Image', '可图 Kolors 2.0', 'MiniMax Image-01'] },
  { label: '海外模型', items: ['GPT-5', 'Claude Sonnet 4.5', 'Gemini 2.5 Pro', 'Sora 2', 'Runway Gen-4'] }
]
const modelOptions = modelGroups.flatMap(g => g.items)
const legacyModel = computed(() => !!store.defaultModel && !modelOptions.includes(store.defaultModel))
const PRESETS={
  'OpenAI':'https://api.openai.com/v1',
  'DeepSeek':'https://api.deepseek.com/v1',
  '通义千问':'https://dashscope.aliyuncs.com/compatible-mode/v1',
  '豆包':'https://ark.cn-beijing.volces.com/api/v3',
  '智谱 GLM':'https://open.bigmodel.cn/api/paas/v4',
  'Kimi':'https://api.moonshot.cn/v1',
  'MiniMax':'https://api.minimax.chat/v1',
  'Anthropic Claude':'https://api.anthropic.com/v1',
  'Google Gemini':'https://generativelanguage.googleapis.com/v1beta/openai'
}
const active = computed(() => store.activeApi)
const showForm=ref(false), editing=ref(null), testing=ref(null)
const modelList=ref([]), loadingModels=ref(false), manualModel=ref(false)
const form=ref({provider:'DeepSeek',baseUrl:PRESETS['DeepSeek'],apiKey:'',model:'deepseek-v4-pro',remark:''})
function reset(){form.value={provider:'DeepSeek',baseUrl:PRESETS['DeepSeek'],apiKey:'',model:'deepseek-v4-pro',remark:''};editing.value=null;modelList.value=[];manualModel.value=false;showForm.value=true}
function onProvider(){ form.value.baseUrl = PRESETS[form.value.provider] || form.value.baseUrl; modelList.value=[]; manualModel.value=false }
async function fetchModels(){
  if(!form.value.baseUrl){alert('请先填写 API Base URL');return}
  if(!form.value.apiKey){alert('请先填写 API Key');return}
  loadingModels.value=true
  try{
    const ids=await listModels({ baseUrl: form.value.baseUrl, apiKey: form.value.apiKey })
    if(!ids.length) throw new Error('服务商没有返回任何模型')
    modelList.value=ids
    // 手填的大小写/别名和接口不一致时，自动纠正成接口里真实的名字
    const cur=String(form.value.model||'').trim()
    const exact=ids.find(m=>m===cur)
    const ci=ids.find(m=>m.toLowerCase()===cur.toLowerCase())
    form.value.model=exact||ci||ids[0]
    manualModel.value=false
    toast(`已获取 ${ids.length} 个可用模型`,'success',2600)
  }catch(e){
    modelList.value=[]
    manualModel.value=true
    toast(`获取模型失败：${e.message}（可手动填写模型名）`,'info',4800)
  }finally{
    loadingModels.value=false
  }
}
function save(){
  if(!form.value.baseUrl||!form.value.apiKey||!form.value.model){alert('请填写 Base URL、API Key 和模型名称');return}
  if(editing.value!==null){ store.apiConfigs[editing.value]={...form.value,status:'未测试'}; }
  else { store.apiConfigs.push({...form.value,status:'未测试',id:Date.now()}); }
  store.saveApis()
  if(!store.activeApi){ const last=store.apiConfigs[store.apiConfigs.length-1]; store.setActiveApi(last.id) }
  showForm.value=false
  toast('API 配置已保存')
}
function edit(i){form.value={...store.apiConfigs[i]};editing.value=i;modelList.value=[];manualModel.value=false;showForm.value=true}
async function test(i){
  const cfg=store.apiConfigs[i]
  testing.value=i; cfg.status='测试中…'; store.saveApis()
  try{
    const ms=await testConnection(cfg)
    cfg.status=`连接成功 · ${ms}ms`; toast(`连接成功，用时 ${ms}ms`)
  }catch(e){
    cfg.status='失败：'+e.message; toast('连接失败：'+e.message,'info',4000)
  }finally{ testing.value=null; store.saveApis() }
}
function del(i){
  if(!confirm('确定删除这条 API 配置吗？')){return}
  const cfg=store.apiConfigs[i]
  if(String(cfg.id)===String(store.activeApiId)) store.setActiveApi('')
  store.apiConfigs.splice(i,1); store.saveApis()
}
function setActive(i){ const cfg=store.apiConfigs[i]; store.setActiveApi(cfg.id); toast(`已启用 ${cfg.provider} · ${cfg.model}`) }
function setDefault(m){store.saveDefaultModel(m)}
</script>
<template>
  <div>
    <div class="page-heading"><div><span class="kicker">MODEL HUB</span><h1>AI 模型服务中心</h1><p>选择官方聚合服务，或接入你自己的模型 API。</p></div><div class="heading-art blue-art"><BrainCircuit :size="58"/></div></div>
    <div class="model-hero"><div><span class="kicker">ONE HUB · MULTIPLE MODELS</span><h2>让 AI 能力<br>触手可及</h2><p>统一管理模型选择与接入配置。</p></div><div class="model-orb"><BrainCircuit :size="56"/></div></div>
    <div class="section-title"><div><h2>选择接入方式</h2><p>两种方式，满足不同使用习惯</p></div></div>
    <div class="model-choice-grid">
      <div class="model-choice official"><div class="choice-icon"><Zap :size="23"/></div><span class="pill light-pill">推荐体验</span><h3>官方 AI 聚合服务</h3><p>无需自行配置 API Key，由平台统一提供模型调用与额度管理。</p><ul><li>多模型统一入口</li><li>套餐额度与用量统计</li><li>适合开箱即用的用户</li></ul><button class="btn btn-light" @click="alert('订阅流程为原型展示，暂不支持真实支付')">查看订阅套餐</button></div>
      <div class="model-choice custom"><div class="choice-icon"><BrainCircuit :size="23"/></div><span class="pill">灵活接入</span><h3>用户自定义 API</h3><p>配置第三方模型服务商，按自己的 API 账户使用模型。</p><ul><li>支持多服务商配置</li><li>自定义 Base URL 与模型</li><li>真实调用与连接测试</li></ul><button class="btn btn-primary" @click="reset"><Plus :size="17"/>添加 API 配置</button></div>
    </div>
    <div class="panel model-config"><div class="panel-heading"><div><h2>我的模型配置</h2><p>当前启用：<b>{{ active ? `${active.provider} · ${active.model}` : '未启用（生成时使用本地演示）' }}</b></p></div><span class="pill">{{store.apiConfigs.length}} 条自定义配置</span></div>
      <div class="default-model"><label>默认模型<select :value="store.defaultModel" @change="setDefault($event.target.value)"><option v-if="legacyModel" :value="store.defaultModel">{{ store.defaultModel }}（旧）</option><optgroup v-for="g in modelGroups" :key="g.label" :label="g.label"><option v-for="m in g.items" :key="m" :value="m">{{ m }}</option></optgroup></select></label><span class="muted">仅作原型里的模型标识；视频 / 图像模型需走各自的任务接口，真正调用的是上方「启用」的那条 API 配置</span></div>
      <div v-if="store.apiConfigs.length" class="api-list">
        <div v-for="(a,i) in store.apiConfigs" :key="a.id" class="api-row" :class="{ active: String(a.id) === String(store.activeApiId) }">
          <div class="api-avatar">{{a.provider.slice(0,1)}}</div>
          <div class="api-meta"><b>{{a.provider}} · {{a.model}}</b><small>{{a.baseUrl}}</small><small class="api-status"><CheckCircle2 v-if="a.status?.includes('成功')"/><CircleAlert v-else/> {{a.status||'尚未测试'}}</small></div>
          <button class="icon-btn" :disabled="testing===i" :title="'测试连接'" @click="test(i)"><LoaderCircle v-if="testing===i" :size="16" class="spin"/><CheckCircle2 v-else :size="16"/></button>
          <button class="icon-btn" :class="{ on: String(a.id) === String(store.activeApiId) }" :title="String(a.id) === String(store.activeApiId) ? '已启用' : '启用这条配置'" @click="setActive(i)"><PlugZap :size="16"/></button>
          <button class="icon-btn" @click="edit(i)" title="编辑"><Pencil :size="16"/></button>
          <button class="icon-btn danger" @click="del(i)" title="删除"><Trash2 :size="16"/></button>
        </div>
      </div>
      <div v-else class="empty-state">暂未添加自定义 API 配置，点击上方按钮开始添加。</div>
      <div v-if="showForm" class="api-form"><div class="panel-heading"><div><h3>{{editing!==null?'编辑 API 配置':'添加 API 配置'}}</h3><p>填写模型服务商提供的连接信息，保存后可点“测试连接”验证</p></div><button class="text-btn" @click="showForm=false">关闭</button></div><div class="form-grid"><label>服务商<select v-model="form.provider" @change="onProvider"><option v-for="p in providers" :key="p">{{p}}</option></select></label><label class="full">模型名称<div class="model-pick"><select v-if="modelList.length && !manualModel" v-model="form.model"><option v-for="m in modelList" :key="m" :value="m">{{m}}</option><option v-if="!modelList.includes(form.model)" :value="form.model">{{form.model}}（当前填写）</option></select><input v-else v-model="form.model" placeholder="例如：deepseek-v4-pro"><button type="button" class="btn btn-secondary pick-btn" :disabled="loadingModels" @click="fetchModels"><LoaderCircle v-if="loadingModels" :size="14" class="spin"/><RefreshCw v-else :size="14"/>{{modelList.length ? '刷新' : '获取模型'}}</button></div><small class="model-hint"><template v-if="modelList.length && !manualModel">共 {{modelList.length}} 个模型，已按接口返回的名字校正 · <button type="button" class="text-btn" @click="manualModel=true">手动输入</button></template><template v-else-if="modelList.length">已切到手动输入 · <button type="button" class="text-btn" @click="manualModel=false">改用列表选择</button></template><template v-else>点「获取模型」自动拉取该服务商的模型列表，避免名字写错</template></small></label><label class="full">API Base URL<input v-model="form.baseUrl" placeholder="https://api.example.com/v1"></label><label class="full">API Key<input v-model="form.apiKey" type="password" placeholder="输入你的 API Key"></label><label class="full">备注<input v-model="form.remark" placeholder="可选"></label></div><div class="form-actions"><button class="btn btn-secondary" @click="showForm=false">取消</button><button class="btn btn-primary" @click="save">保存配置</button></div></div>
    </div>
    <div class="security-note"><ShieldCheck :size="20"/><div><b>安全与跨域提示</b><p>API Key 仅保存在浏览器 LocalStorage，请勿在公用设备填写真实密钥；正式版本应由后端代理并加密存储。若服务商不支持浏览器跨域，先运行 <code>npm run proxy</code> 再测试，前端会自动经本机代理转发。</p></div></div>
  </div>
</template>

<style scoped>
.api-row.active{background:#f0f8f1;border-radius:10px}
.api-row .icon-btn.on{background:#246b4a;color:#fff}
.spin{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.model-pick{display:flex;align-items:center;gap:8px}
.model-pick select,.model-pick input{flex:1;min-width:0}
.pick-btn{white-space:nowrap;padding:9px 12px;font-size:11px}
.model-hint{display:block;margin-top:6px;font-weight:400;color:#94a097;font-size:10px}
.model-hint .text-btn{font-size:10px;color:#3c7650;padding:0}
</style>
