// 模板数据（抖音风格 · 实拍素材）
// layout：ecom = 助农带货（小黄车 + 价格标签）｜ vlog = 文旅打卡（定位 + 日期水印）｜ story = 纪实故事（电影黑边 + 章节字幕）
// 字幕中用【】包裹的词会以高亮花字显示
// 每个镜头：img = 实拍图（public/samples 下，来源与许可见 public/samples/CREDITS.md）
//           fx  = 运镜：push 推近 / pull 拉远 / pan-l、pan-r 横移 / tilt-u、tilt-d 上下摇
//           pos = 画面焦点（object-position），atmo = 氛围：sun 阳光 / mist 晨雾 / dust 浮尘 / steam 热气 / bokeh 灯光光斑 / embers 火星
//           grade = 单镜头调色（old = 旧胶片回忆）
import { findProduct, products } from './products'
const shots = (id, list) => list.map((s, i) => ({ img: `samples/${id}/${i + 1}.jpg`, ...s }))

export const templates = [
  // ———————— 助农 ————————
  {
    id: 'agri-apple', name: '农产品品牌宣传', desc: '产品卖点 · 产地故事', kind: '助农', layout: 'ecom',
    palette: ['#cfe8c6', '#5f9a5c'], bgm: '轻快民谣', ratio: '9:16', duration: '15 秒', style: '清新自然', atmo: 'dust',
    headline: '咬一口\n满嘴爆汁！', account: '@老王家果园', tags: ['助农', '产地直发', '新鲜水果'],
    cart: { title: '脆甜红富士 · 5斤装', price: '29.9' },
    keywords: ['苹果', '果园', '红富士', '水果', '鲜果', '采摘'],
    prompt: '展示果园风光、采摘过程和产品包装，突出自然、新鲜与产地特色。',
    scenes: shots('agri-apple', [
      { caption: '天刚亮 【果园】就醒了', fx: 'pan-r', atmo: 'sun' },
      { caption: '挂满枝头 个个【又大又红】', fx: 'push' },
      { caption: '现摘现发 【当天】就打包', fx: 'pull', pos: '50% 40%' },
      { caption: '家人们 【点下方小黄车】', fx: 'pan-l', atmo: 'none' }
    ])
  },
  {
    id: 'agri-harvest', name: '乡村丰收记录', desc: '田园风光 · 丰收氛围', kind: '助农', layout: 'story',
    palette: ['#f3dd9c', '#b98a35'], bgm: '温暖弦乐', ratio: '16:9', duration: '30 秒', style: '纪实风格', atmo: 'sun',
    headline: '又是一年\n丰收季', account: '@稻香村的阿强', tags: ['丰收', '乡村生活', '三农'], loc: '黑龙江 · 五常',
    keywords: ['稻', '丰收', '米', '收割', '粮', '秋收', '麦'],
    prompt: '展现秋日丰收景象，金黄的稻田、忙碌的农民和堆满果实的粮仓。',
    scenes: shots('agri-harvest', [
      { caption: '金色稻浪 【一眼望不到边】', fx: 'pan-r' },
      { caption: '种了【三十年】地的老爸笑了', fx: 'push', pos: '45% 40%' },
      { caption: '收割机一开 【一天百亩】', fx: 'pan-l', atmo: 'dust' },
      { caption: '这一碗米饭 【格外香】', fx: 'push', atmo: 'steam' }
    ])
  },
  {
    id: 'agri-enterprise', name: '农业企业形象', desc: '生产实力 · 品牌介绍', kind: '助农', layout: 'story',
    palette: ['#cfe1ea', '#5d8aa3'], bgm: '大气商务', ratio: '16:9', duration: '30 秒', style: '电影质感', atmo: 'none',
    headline: '一颗好菜的\n科技之旅', account: '@绿源农业科技', tags: ['智慧农业', '乡村振兴'], loc: '山东 · 寿光',
    keywords: ['企业', '基地', '大棚', '智能', '灌溉', '检测', '科技', '合作社'],
    prompt: '现代化农业生产基地，智能灌溉系统，标准化的生产线。',
    scenes: shots('agri-enterprise', [
      { caption: '【5000亩】现代化种植基地', fx: 'pan-r', atmo: 'sun' },
      { caption: '智能滴灌 【省水40%】', fx: 'push' },
      { caption: '出厂前 【28项】品质检测', fx: 'tilt-u' },
      { caption: '带动【300户】农户增收', fx: 'pull', pos: '50% 35%' }
    ])
  },
  {
    id: 'agri-kiwi', name: '特色农产品介绍', desc: '地方特产 · 品质保证', kind: '助农', layout: 'ecom',
    palette: ['#dcedbe', '#7fae43'], bgm: '轻松流行', ratio: '9:16', duration: '15 秒', style: '活力宣传', atmo: 'none',
    headline: '切开是红心的\n猕猴桃！', account: '@秦岭果妹', tags: ['红心猕猴桃', '助农', '源头好货'],
    cart: { title: '红心猕猴桃 · 24枚装', price: '39.9' },
    keywords: ['猕猴桃', '特产', '秦岭', '地理标志', '红心'],
    prompt: '当地特色农产品，从田间到餐桌的全过程展示。',
    scenes: shots('agri-kiwi', [
      { caption: '【秦岭北麓】国家地理标志', fx: 'pan-r', atmo: 'mist' },
      { caption: '一刀切开 竟然是【红心】', fx: 'push' },
      { caption: '酸甜比 【刚刚好】', fx: 'pull' },
      { caption: '坏果包赔 【放心下单】', fx: 'pan-l' }
    ])
  },
  {
    id: 'agri-tech', name: '农业技术科普', desc: '种植技巧 · 技术介绍', kind: '助农', layout: 'story',
    palette: ['#dfe4f6', '#7c8fd0'], bgm: '舒缓钢琴', ratio: '16:9', duration: '30 秒', style: '纪实风格', atmo: 'none',
    headline: '番茄增产\n3个小妙招', account: '@农技站李老师', tags: ['农技知识', '种植技巧', '涨知识'], loc: '河南 · 周口',
    keywords: ['种植', '技术', '科普', '番茄', '病虫', '施肥', '育苗', '技巧'],
    prompt: '科学种植方法，病虫害防治，提高产量的实用技巧。',
    scenes: shots('agri-tech', [
      { caption: '第一招 【育好壮苗】', fx: 'push', pos: '40% 50%' },
      { caption: '第二招 【黄板诱虫】不打药', fx: 'tilt-d' },
      { caption: '第三招 【水肥一体】增产两成', fx: 'pan-r' },
      { caption: '先【收藏】 慢慢学', fx: 'pull' }
    ])
  },
  {
    id: 'agri-village', name: '乡村振兴宣传', desc: '乡村建设 · 产业发展', kind: '助农', layout: 'story',
    palette: ['#f0dccb', '#b77d55'], bgm: '激昂进行', ratio: '16:9', duration: '30 秒', style: '电影质感', atmo: 'none',
    headline: '十年前的穷山村\n现在变成这样', account: '@幸福村村委会', tags: ['乡村振兴', '美丽乡村'], loc: '浙江 · 安吉',
    keywords: ['乡村振兴', '村', '白茶', '建设', '增收', '美丽乡村', '竹'],
    prompt: '美丽乡村建设成果，特色产业带动村民增收的故事。',
    scenes: shots('agri-village', [
      { caption: '这是【十年前】的村子', fx: 'push', grade: 'old' },
      { caption: '如今 【白茶产业】兴起', fx: 'pan-r', atmo: 'mist' },
      { caption: '人均收入 【翻了3倍】', fx: 'pan-l' },
      { caption: '欢迎来 【我们村】看看', fx: 'tilt-u', atmo: 'sun' }
    ])
  },
  {
    id: 'agri-live', name: '直播带货预告', desc: '开播预热 · 爆品种草', kind: '助农', layout: 'ecom',
    palette: ['#f8d3dc', '#d46a85'], bgm: '动感节拍', ratio: '9:16', duration: '15 秒', style: '活力宣传', atmo: 'sun',
    headline: '今晚8点\n田间直播！', account: '@果园主播小桃', tags: ['直播预告', '水蜜桃', '助农直播'],
    cart: { title: '水蜜桃 · 直播间专享', price: '19.9' },
    keywords: ['直播', '带货', '桃', '预告', '优惠', '下单'],
    prompt: '主播在田间预告直播时间，展示爆款农产品与限时优惠，营造抢购氛围。',
    scenes: shots('agri-live', [
      { caption: '今晚8点 【桃园现场开播】', fx: 'push' },
      { caption: '一掐【一兜水】的水蜜桃', fx: 'pan-r', atmo: 'none' },
      { caption: '直播间 【买二送一】', fx: 'pan-l', atmo: 'none' },
      { caption: '点【预约】 开播提醒你', fx: 'pull' }
    ])
  },
  {
    id: 'agri-ranch', name: '生态养殖展示', desc: '绿色养殖 · 放心品质', kind: '助农', layout: 'vlog',
    palette: ['#d6ebd2', '#6f9f6c'], bgm: '田园清晨', ratio: '16:9', duration: '30 秒', style: '纪实风格', atmo: 'none',
    headline: '这些牛\n每天爬山吃草', account: '@草原牧场阿木', tags: ['生态养殖', '草原', '放心奶'], loc: '内蒙古 · 锡林郭勒',
    keywords: ['养殖', '牛', '羊', '草原', '牧场', '奶', '生态'],
    prompt: '山坡草场上的生态放养，干净的养殖环境与全程可追溯的品质管理。',
    scenes: shots('agri-ranch', [
      { caption: '每天要走【10公里】吃草', fx: 'pan-r', atmo: 'sun' },
      { caption: '喝的是【山泉水】', fx: 'pull', pos: '50% 70%' },
      { caption: '每一头都有【身份证】', fx: 'push' },
      { caption: '这样的牛奶 【你想尝尝吗】', fx: 'tilt-d', pos: '50% 60%' }
    ])
  },
  {
    id: 'agri-tea', name: '茶园品牌故事', desc: '茶山风光 · 匠心制茶', kind: '助农', layout: 'story',
    palette: ['#dbe9c6', '#7d9a4f'], bgm: '古琴清音', ratio: '16:9', duration: '30 秒', style: '国风人文', atmo: 'none',
    headline: '一杯好茶\n要等一整年', account: '@武夷山陈师傅', tags: ['岩茶', '非遗制茶', '慢生活'], loc: '福建 · 武夷山',
    keywords: ['茶', '茶园', '茶山', '炒茶', '采茶', '岩茶'],
    prompt: '云雾茶山、采茶女手采嫩芽、传统炒茶工艺，讲述一杯好茶的由来。',
    scenes: shots('agri-tea', [
      { caption: '海拔【800米】的云雾茶山', fx: 'pan-r', atmo: 'mist' },
      { caption: '一芽一叶 【全靠手采】', fx: 'push', atmo: 'sun' },
      { caption: '手工揉捻 【条索紧实】', fx: 'pull' },
      { caption: '泡一杯 【品山野】', fx: 'push', atmo: 'steam' }
    ])
  },
  // ———————— 文旅 ————————
  {
    id: 'tour-laoshan', name: '景区形象宣传', desc: '自然风光 · 人文故事', kind: '文旅', layout: 'vlog',
    palette: ['#cbe4e4', '#4f8e8a'], bgm: '空灵国风', ratio: '16:9', duration: '30 秒', style: '电影质感', atmo: 'none',
    headline: '这里不是仙境\n是我的家乡', account: '@文旅小鹿', tags: ['旅行推荐', '人间仙境', '家乡的风景'], loc: '青岛 · 崂山',
    keywords: ['景区', '山', '云海', '仙境', '崂山', '风景', '古建', '日落'],
    prompt: '展示古城风貌、非遗文化和特色民宿，体现深厚的历史底蕴与现代旅游体验。',
    scenes: shots('tour-laoshan', [
      { caption: '云海翻涌 【像在仙境】', fx: 'pan-r', atmo: 'mist' },
      { caption: '百年古建 【一步一景】', fx: 'push', atmo: 'dust' },
      { caption: '沿着石阶 【慢慢走】', fx: 'tilt-u' },
      { caption: '日落时分 【美哭了】', fx: 'pull', atmo: 'sun' }
    ])
  },
  {
    id: 'tour-rural', name: '乡村旅游推广', desc: '乡野体验 · 特色民宿', kind: '文旅', layout: 'vlog',
    palette: ['#d9ebcb', '#74a861'], bgm: '惬意吉他', ratio: '9:16', duration: '15 秒', style: '清新自然', atmo: 'none',
    headline: '周末逃离城市\n来乡下住两天', account: '@周末去哪儿', tags: ['周末去哪儿', '宝藏民宿', '遛娃'], loc: '浙江 · 莫干山',
    keywords: ['民宿', '乡村游', '草莓', '露营', '篝火', '周末', '田园', '农家乐', '慢生活'],
    prompt: '田园风光、农家乐体验和乡村慢生活，展现美丽乡村新面貌。',
    scenes: shots('tour-rural', [
      { caption: '推开窗 【满眼都是绿】', fx: 'pan-r', atmo: 'sun' },
      { caption: '带娃 【摘草莓】', fx: 'push' },
      { caption: '晚上 【围着篝火】聊天', fx: 'pull', atmo: 'embers' },
      { caption: '人均【200】就能玩', fx: 'pan-l', atmo: 'sun' }
    ])
  },
  {
    id: 'tour-food', name: '地方美食介绍', desc: '特色美食 · 地域文化', kind: '文旅', layout: 'vlog',
    palette: ['#f5d9bb', '#cf7f3f'], bgm: '市井烟火', ratio: '9:16', duration: '15 秒', style: '活力宣传', atmo: 'steam',
    headline: '本地人才知道的\n宝藏小馆', account: '@吃货阿飞', tags: ['探店', '本地美食', '人均35'], loc: '重庆 · 磁器口',
    keywords: ['美食', '小吃', '火锅', '厨', '探店', '面', '菜', '味道'],
    prompt: '当地特色美食制作过程，从食材选择到烹饪技艺的全方位展示。',
    scenes: shots('tour-food', [
      { caption: '老板凌晨【4点】就备料', fx: 'pan-r', atmo: 'none' },
      { caption: '祖传【30年】的手艺', fx: 'push', atmo: 'embers' },
      { caption: '一口下去 【太香了】', fx: 'pull' },
      { caption: '人均【35】 吃到扶墙', fx: 'pan-l' }
    ])
  },
  {
    id: 'tour-heritage', name: '非遗文化宣传', desc: '传统技艺 · 活态传承', kind: '文旅', layout: 'story',
    palette: ['#efd3cf', '#a8574d'], bgm: '传统民乐', ratio: '16:9', duration: '30 秒', style: '国风人文', atmo: 'dust',
    headline: '这门手艺\n快没人会了', account: '@非遗守艺人', tags: ['非遗', '传统手艺', '匠心'], loc: '四川 · 成都',
    keywords: ['非遗', '刺绣', '手艺', '传承', '川剧', '文化', '匠'],
    prompt: '非物质文化遗产的传承故事，匠人精神和传统工艺之美。',
    scenes: shots('tour-heritage', [
      { caption: '一根针 【绣了六十年】', fx: 'push', pos: '50% 45%' },
      { caption: '一幅作品 【要绣一整年】', fx: 'pan-r' },
      { caption: '非遗舞台 【惊艳全场】', fx: 'pull', pos: '45% 40%', atmo: 'none' },
      { caption: '让更多人 【看见非遗】', fx: 'tilt-d' }
    ])
  },
  {
    id: 'tour-city', name: '城市形象宣传', desc: '城市名片 · 整体形象', kind: '文旅', layout: 'vlog',
    palette: ['#d5def0', '#5f78ad'], bgm: '都市电子', ratio: '16:9', duration: '30 秒', style: '电影质感', atmo: 'none',
    headline: '来了就不想走\n的城市', account: '@城市漫游者', tags: ['城市旅行', 'citywalk'], loc: '山东 · 青岛',
    keywords: ['城市', '天际线', '地标', '高铁', '老街', '青岛', '海边'],
    prompt: '城市地标建筑、现代化发展和独特的人文景观。',
    scenes: shots('tour-city', [
      { caption: '海边的【天际线】', fx: 'pan-r', atmo: 'mist' },
      { caption: '高铁【2小时】直达', fx: 'push' },
      { caption: '红瓦绿树 【碧海蓝天】', fx: 'pan-l' },
      { caption: '这座城 【等你来】', fx: 'pull', atmo: 'bokeh' }
    ])
  },
  {
    id: 'tour-festival', name: '节庆活动宣传', desc: '民俗节庆 · 特色活动', kind: '文旅', layout: 'vlog',
    palette: ['#f6d4c6', '#cf5f45'], bgm: '喜庆锣鼓', ratio: '9:16', duration: '15 秒', style: '活力宣传', atmo: 'bokeh',
    headline: '一年一次！\n灯会开幕了', account: '@古城文旅', tags: ['灯会', '元宵节', '年味'], loc: '江苏 · 南京',
    keywords: ['节', '灯会', '舞龙', '舞狮', '庆典', '民俗', '烟花', '元宵'],
    prompt: '传统节日庆典、民俗表演和特色活动的热闹场面。',
    scenes: shots('tour-festival', [
      { caption: '【十万盏】花灯点亮', fx: 'push' },
      { caption: '舞龙舞狮 【锣鼓喧天】', fx: 'pan-r', atmo: 'none' },
      { caption: '【200+】美食摊位', fx: 'pan-l', atmo: 'steam' },
      { caption: '元宵当晚 【不见不散】', fx: 'pull', atmo: 'embers' }
    ])
  },
  {
    id: 'tour-study', name: '研学旅行推广', desc: '自然课堂 · 寓教于乐', kind: '文旅', layout: 'vlog',
    palette: ['#d3e6f1', '#5b98b8'], bgm: '童趣轻快', ratio: '16:9', duration: '30 秒', style: '清新自然', atmo: 'none',
    headline: '让孩子在田野里\n上一堂课', account: '@自然研学营', tags: ['研学', '亲子游', '自然教育'], loc: '安徽 · 宏村',
    keywords: ['研学', '孩子', '课堂', '亲子', '学习', '书法', '插秧'],
    prompt: '孩子们走进田野和非遗工坊，动手体验农事与传统技艺，在旅行中学习成长。',
    scenes: shots('tour-study', [
      { caption: '研学出发 【走进乡村】', fx: 'pan-r', atmo: 'sun' },
      { caption: '田间课堂 【学插秧】', fx: 'push', pos: '50% 40%' },
      { caption: '书法课堂 【动手体验】', fx: 'pull' },
      { caption: '三天两晚 【收获满满】', fx: 'pan-l', atmo: 'sun' }
    ])
  },
  {
    id: 'tour-night', name: '古镇夜游宣传', desc: '灯火夜景 · 沉浸体验', kind: '文旅', layout: 'vlog',
    palette: ['#2a2540', '#5a4f9e'], bgm: '氛围电子', ratio: '9:16', duration: '15 秒', style: '电影质感', atmo: 'bokeh',
    headline: '晚上的古镇\n美到失语', account: '@夜游达人', tags: ['夜游', '古镇', '出片圣地'], loc: '湖南 · 凤凰古城',
    keywords: ['夜', '古镇', '灯笼', '夜游', '夜市', '船'],
    prompt: '华灯初上的古镇，石板路、灯笼长廊、水上光影秀和热闹的夜市。',
    scenes: shots('tour-night', [
      { caption: '华灯初上 【古镇入夜】', fx: 'pull' },
      { caption: '灯笼长廊 【随手出片】', fx: 'pan-r' },
      { caption: '乘船夜游 【水上光影】', fx: 'push' },
      { caption: '夜市烟火 【越夜越美】', fx: 'pan-l', atmo: 'steam' }
    ])
  },
  {
    id: 'tour-drive', name: '自驾路线推荐', desc: '风景公路 · 一路畅游', kind: '文旅', layout: 'vlog',
    palette: ['#dde8cb', '#7d9b55'], bgm: '公路民谣', ratio: '16:9', duration: '30 秒', style: '活力宣传', atmo: 'none',
    headline: '这条公路\n一定要自驾一次', account: '@自驾去远方', tags: ['自驾游', '旅行攻略', '风景公路'], loc: '海南 · 环岛旅游公路',
    keywords: ['自驾', '公路', '路线', '海岸', '开车', '旅行'],
    prompt: '沿着蜿蜒的风景公路自驾，串联山海、村落和观景台，推荐一条精品旅游路线。',
    scenes: shots('tour-drive', [
      { caption: '一边是山 【一边是海】', fx: 'pan-r', atmo: 'sun' },
      { caption: '每个弯道 【都是壁纸】', fx: 'tilt-d' },
      { caption: '【5个】必停观景台', fx: 'pan-l', atmo: 'sun' },
      { caption: '收藏这条路线 【说走就走】', fx: 'push', atmo: 'sun' }
    ])
  }
]

export const agriTemplates = templates.filter(t => t.kind === '助农')
export const tourismTemplates = templates.filter(t => t.kind === '文旅')
export const findTemplate = name => templates.find(t => t.name === name)

/** 素材地址：small = 缩略图（列表、封面、头像用） */
const BASE = import.meta.env.BASE_URL || '/'
export function photo(img, small) {
  if (!img) return ''
  if (/^(data:|blob:|https?:)/.test(img)) return img
  return BASE + (small ? img.replace(/\.jpg$/, '_s.jpg') : img)
}
/** 模板封面 = 第一个镜头 */
export const tplCover = t => photo(t?.scenes?.[0]?.img, true)

/** 根据描述文字匹配最接近的模板（文生视频用来挑选画面） */
export function matchTemplate(text = '', kind) {
  const pool = kind ? templates.filter(t => t.kind === kind) : templates
  let best = null, score = 0
  for (const t of pool) {
    const s = t.keywords.reduce((n, k) => n + (String(text).includes(k) ? 1 : 0), 0)
    if (s > score) { best = t; score = s }
  }
  return best
}

/** 去掉高亮标记 */
export const plain = s => String(s || '').replace(/[【】]/g, '')
/** 拆分字幕：【】内为高亮 */
export const captionParts = s => String(s || '').split(/(【[^】]*】)/).filter(Boolean)
  .map(p => p.startsWith('【') ? { t: p.slice(1, -1), hl: true } : { t: p, hl: false })

/** 根据名称生成稳定的“点赞/评论/收藏/转发/播放”数据 */
export function statsOf(seed = '') {
  let h = 7
  for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) % 100003
  const w = n => n >= 10000 ? (n / 10000).toFixed(1) + 'w' : String(n)
  const likes = 8000 + (h % 90000)
  return { likes: w(likes), comments: w(Math.round(likes / 9)), stars: w(Math.round(likes / 5)), shares: w(Math.round(likes / 7)), plays: w(likes * 11) }
}

/** 时长文字 → 每个镜头的播放毫秒数（预览节奏与所选时长一致，限制在合理范围） */
export function shotMs(duration = '15 秒', count = 4) {
  const sec = parseInt(duration, 10) || 15
  return Math.min(4200, Math.max(2400, Math.round(sec * 1000 / Math.max(count, 1))))
}

/** 简单的字符串哈希，用来稳定地挑文案，避免每次刷新都换一句 */
function hashOf(str = '') {
  let h = 7
  for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) % 100003
  return h
}

// —— 提示词 → 空镜 ——
// 把“包装、产地、基地、丰收、草原、茶山”等关键词映射到对应实拍素材，
// 这样提示词一变，画面搭配也会跟着变，而不是只改字幕。
const CONTEXT_SHOTS = {
  packaging: { img: 'samples/agri-enterprise/4.jpg', tags: ['包装', '打包', '发货', '快递', '装箱', '物流', '分拣', '发货'], fx: 'push', atmo: 'none' },
  base: { img: 'samples/agri-enterprise/1.jpg', tags: ['基地', '大棚', '种植', '科技', '标准', '车间', '工厂', '规模'], fx: 'pan-l', atmo: 'none' },
  village: { img: 'samples/agri-village/3.jpg', tags: ['乡村', '村庄', '老家', '山里', '产地', '田园', '原产地', '农户'], fx: 'pan-r', atmo: 'sun' },
  green: { img: 'samples/agri-village/4.jpg', tags: ['山林', '竹', '绿色', '生态', '云雾', '茶山', '林下'], fx: 'push', atmo: 'none' },
  harvest: { img: 'samples/agri-harvest/1.jpg', tags: ['丰收', '稻田', '收割', '田野', '秋收', '金黄'], fx: 'pan-r', atmo: 'sun' },
  ranch: { img: 'samples/agri-ranch/1.jpg', tags: ['草原', '牧场', '养殖', '牛羊', '放养'], fx: 'pan-l', atmo: 'sun' },
  mountain: { img: 'samples/agri-kiwi/1.jpg', tags: ['高山', '山区', '云雾', '海拔', '秦岭', '山坡'], fx: 'pan-r', atmo: 'mist' }
}

/** 提示词命中的通用空镜（按命中强度排序） */
function contextShots(prompt = '') {
  const p = String(prompt || '')
  return Object.entries(CONTEXT_SHOTS)
    .map(([key, s]) => ({ key, ...s, score: s.tags.reduce((n, t) => n + (p.includes(t) ? 1 : 0), 0) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
}

/** 按提示词从全部模板镜头里挑画面；提示词一个关键词都没命中时返回空数组 */
function pickShots(prompt = '', kind = '助农', count = 4) {
  const p = String(prompt || '')
  const pool = []
  for (const t of templates) {
    if (t.kind !== kind) continue
    for (const s of t.scenes) {
      const captionWords = String(s.caption || '').replace(/[【】]/g, '').split(/[，,。、\s]/).filter(Boolean)
      const tags = [...t.keywords, t.name, ...captionWords]
      pool.push({ s, score: tags.reduce((n, tag) => n + (p.includes(tag) ? 1 : 0), 0) })
    }
  }
  pool.sort((a, b) => b.score - a.score)
  if (!pool.length || pool[0].score <= 0) return []
  const seen = new Set(), out = []
  for (const { s } of pool) {
    if (seen.has(s.img)) continue
    seen.add(s.img)
    out.push(s)
    if (out.length >= count) break
  }
  return out
}

// —— 图生视频：抖音带货式分镜 ——
// 上传的图只当“产品特写”，其余镜头借最匹配模板的实拍素材（产地 / 过程 / 打包 / 下单引导），
// 这样成片是一条有节奏的助农宣传片，而不是一张图配几行字。
const IMAGE_COPY = {
  助农: {
    hooks: ['实物比图片【更好看】', '先看【品相】再说', '这个【细节】藏不住'],
    details: ['镜头怼近 【看得见的新鲜】', '细节拉满 【所见即所得】', '没有滤镜 【就是这个样子】']
  },
  文旅: {
    hooks: ['先看【实拍】不修图', '这个角度【随手出片】', '镜头里的【真实风景】'],
    details: ['镜头怼近 【细节满分】', '走近一点 【更出片】', '不加滤镜 【就这样美】']
  }
}
function imageStoryboard(tpl, kind, seed, prompt = '') {
  const copy = IMAGE_COPY[kind] || IMAGE_COPY['助农']
  const h = hashOf(seed)
  const pick = arr => arr[h % arr.length]
  const picks = pickShots(prompt, kind, 4)
  const s = picks.length >= 2 ? picks : tpl.scenes
  return [
    { still: true, tone: 'a', caption: pick(copy.hooks), atmo: tpl.atmo, pos: '50% 45%' },
    { ...s[0] },
    { ...s[1] },
    { still: true, tone: 'b', caption: pick(copy.details), atmo: 'none', pos: '46% 42%' },
    { ...(s[2] || s[0]) },
    { ...(s[3] || s[1]) }
  ]
}

/** 图生视频（助农）：按识别到的农产品生成 6 个带货镜头 —— 产品特写 + 该品类的实拍素材 */
function productStoryboard(p, override = null, prompt = '', allowStill = true) {
  const f = p.footage
  const ctx = contextShots(prompt)
  const pickBy = keys => ctx.find(s => keys.includes(s.key))
  // 产地类空镜放“产地”镜头，包装/基地类放“过程”镜头，更贴合文案
  const originCtx = pickBy(['village', 'mountain', 'green', 'harvest', 'ranch'])
  const processCtx = pickBy(['packaging', 'base'])
  const otherCtx = ctx.find(s => s !== originCtx && s !== processCtx)
  const shot = (ctxShot, fallbackIdx, fx, atmo) => ctxShot
    ? { img: ctxShot.img, fx: ctxShot.fx, atmo: ctxShot.atmo }
    : { img: f[fallbackIdx], fx, atmo }
  // 有上传图才用“活照片”镜头；文生视频没有图，改用该品类的实拍素材
  const stillShot = (tone, caption, pos, idx, fx = 'push') => allowStill
    ? { still: true, tone, caption, atmo: 'none', pos }
    : { img: f[idx], fx, atmo: 'none', caption }
  const originText = override?.origin ? String(override.origin).replace(/\s*·\s*/g, '') : ''
  const originLine = originText ? `来自【${originText}】的${p.name}` : p.originLine
  return [
    stillShot('a', p.hook, '50% 45%', 1, 'push'),
    { ...shot(originCtx, 0, 'pan-r', 'sun'), caption: originLine },
    stillShot('d', p.point, '50% 40%', 3, 'pan-l'),
    { ...shot(processCtx, 2, 'push', 'none'), caption: p.process },
    { ...shot(otherCtx, 3, 'pan-l', 'none'), caption: p.care },
    stillShot('b', p.cta, '46% 55%', 0, 'pan-l')
  ]
}

/** 按模型返回的品类名去匹配目录里的产品 */
function matchProductName(name) {
  const s = String(name || '')
  if (!s) return null
  return products.find(p => p.name === s || p.keywords.some(k => s.includes(k))) || null
}

/** 根据视频记录生成可播放的分镜与抖音样式信息（模板 / 文生 / 图生 统一处理） */
export function videoView(v = {}) {
  const isTpl = v.type === '模板创作'
  const isImage = v.type === '图生视频'
  const script = v.script && typeof v.script === 'object' ? v.script : null
  const tpl = (isTpl && (findTemplate(v.template) || findTemplate(v.title)))
    || matchTemplate(`${v.prompt || ''}${v.title || ''}`, v.kind)
    || findTemplate(v.baseTemplate) || findTemplate(v.template) || findTemplate(v.title)
    || templates.find(t => t.kind === (v.kind || '助农'))
  const kind = v.kind || tpl.kind
  let product = findProduct(v.productId) || (script?.product ? matchProductName(script.product) : null)
  // 旧版本作品没有 productId：图生视频（助农）先落到通用“时令鲜货”，
  // 避免套用匹配模板的素材（比如香蕉图却配了苹果园）
  if (!product && isImage && kind !== '文旅') product = findProduct('fresh')
  const override = v.productOverride && typeof v.productOverride === 'object' ? v.productOverride : null
  const useProduct = !!(product && kind !== '文旅')
  let scenes
  if (isTpl && tpl) {
    scenes = tpl.scenes
  } else if (useProduct) {
    // 已识别品类：整条片子围绕这个农产品来写（空镜按提示词替换）
    // 文生视频没有上传图，用该品类的实拍素材代替“活照片”镜头
    scenes = productStoryboard(product, override, v.prompt || v.title, !!v.thumb)
  } else if (isImage && tpl) {
    // 没识别出品类（或文旅）：上传图 + 按提示词挑的实拍镜头混排
    scenes = imageStoryboard(tpl, kind, `${v.title || ''}${v.prompt || ''}`, v.prompt || v.title)
  } else {
    // 文生：字幕取自描述，画面按提示词从全部模板镜头里挑
    const parts = String(v.prompt || v.title || 'AI 创意视频')
      .split(/[，,。；;、！!？?\n·]/).map(s => s.trim()).filter(Boolean).slice(0, 4)
    let caps = parts.length ? parts : ['AI 创意视频']
    // 第一句已作为大标题时，字幕从第二句开始，避免重复
    if (caps.length >= 3 && String(v.title || '').startsWith(caps[0].slice(0, 8))) caps = caps.slice(1)
    const picks = pickShots(v.prompt || v.title, kind, 4)
    const base = picks.length ? picks : tpl.scenes
    scenes = caps.map((c, i) => ({ ...base[i % base.length], caption: c.slice(0, 14), grade: undefined }))
  }
  let meta = useProduct    ? {
        name: v.title,
        layout: 'ecom',
        headline: product.headline,
        account: product.account,
        tags: product.tags,
        cart: { title: `${product.name} · ${override?.spec || product.spec}`, price: override?.price || product.price },
        loc: override?.origin || product.origin,
        atmo: product.atmo,
        bgm: v.bgm || product.bgm
      }
    : (isTpl || isImage) && tpl
      ? {
          name: v.title,
          layout: v.layout || tpl.layout,
          headline: tpl.headline,
          account: tpl.account,
          tags: tpl.tags,
          cart: tpl.cart,
          loc: tpl.loc,
          atmo: tpl.atmo,
          bgm: v.bgm || tpl.bgm
        }
      : {
          name: v.title,
          layout: v.layout || (kind === '文旅' ? 'vlog' : 'story'),
          headline: plain(v.title || 'AI 创意视频').slice(0, 10),
          account: '@乡韵智创',
          tags: [kind, 'AI创作', '乡韵智创'],
          cart: undefined,
          loc: undefined,
          atmo: tpl.atmo,
          bgm: v.bgm || tpl.bgm || '原创音乐'
        }
  // 大模型返回的文案优先于本地模板文案
  if (script?.captions?.length) {
    scenes = scenes.map((s, i) => ({ ...s, caption: String(script.captions[i % script.captions.length]).slice(0, 18) }))
  }
  if (script) {
    if (script.headline) meta.headline = script.headline
    if (script.tags?.length) meta.tags = script.tags
    if (meta.cart) {
      meta.cart = {
        ...meta.cart,
        title: product ? `${product.name} · ${override?.spec || script.spec || product.spec}` : meta.cart.title,
        price: override?.price || script.price || meta.cart.price
      }
    }
  }
  // 用户改过的产地要落到“产地”那条字幕上（即使文案来自大模型）
  if (useProduct && override?.origin) {
    const originText = String(override.origin).replace(/\s*·\s*/g, '')
    const line = `来自【${originText}】的${product.name}`
    scenes = scenes.map((s, i) => i === 1 ? { ...s, caption: line } : s)
  }
  // 模板创作选了农产品：把模板文案里的泛称替换成具体品类
  if (useProduct && isTpl) {
    scenes = scenes.map(s => ({
      ...s,
      caption: String(s.caption || '').replace(/时令鲜货|农产品|特色产品|好物/g, product.name)
    }))
  }
  return {
    kind, scenes, meta,
    palette: useProduct && product.palette ? product.palette : tpl.palette,
    cover: v.thumb || photo(scenes[0]?.img, true),
    ratio: v.ratio || tpl.ratio || '9:16',
    duration: v.duration || tpl.duration || '15 秒',
    style: v.style || tpl.style || '清新自然',
    image: v.thumb || ''
  }
}
