export const wait = (ms = 1200) => new Promise(resolve => setTimeout(resolve, ms))

export function buildAgricultureReport(form) {
  const area = form.area || '示例地区'
  const industry = form.industry || '特色种植业'
  return {
    title: `${area}${industry}发展建议`,
    summary: `结合${area}的产业基础，建议围绕品质提升、品牌塑造和稳定销售渠道三个方向逐步推进。以下内容为原型演示建议，实际决策请结合当地数据与专业意见。`,
    sections: [
      ['产业现状分析', `${industry}具有一定的区域发展空间。建议先梳理现有种植/养殖规模、产品品质、生产成本、季节性和主要销售去向，建立基础经营台账。`],
      ['发展优势与机会', `重点识别当地气候、土壤、生态环境、传统工艺和区位交通等优势，寻找差异化产品定位，避免同质化竞争。`],
      ['品牌建设建议', '统一产品名称、包装视觉和质量标准，讲好产地故事；通过真实产地图片、生产过程记录和用户评价建立信任。'],
      ['销售渠道建议', '可测试本地商超、社区团购、电商平台、短视频内容和企业团购等渠道，先小规模验证转化，再逐步扩大投入。'],
      ['分阶段实施路径', '第一阶段：摸清资源与成本；第二阶段：完成产品标准和品牌基础；第三阶段：开展渠道试销；第四阶段：复盘数据并优化生产与营销。']
    ]
  }
}

export function buildTourismReport(form) {
  const place = [form.province, form.city, form.spot].filter(Boolean).join(' · ') || '示例目的地'
  return {
    title: `${place}文旅融合发展建议`,
    summary: `围绕目的地资源识别、特色产品打造、产业联动和持续运营提出初步思路。当前报告为演示内容，不代表已完成真实实地调研。`,
    sections: [
      ['目的地资源画像', '建议从自然景观、历史文化、民俗活动、特色美食、农业资源和交通条件六个方面建立资源清单，并标注资源的开放条件与维护成本。'],
      ['文旅定位建议', '选择一至两个最具辨识度的核心主题，形成清晰的目的地定位，避免项目过多、主题分散。'],
      ['特色项目策划', '可探索主题游线、农事体验、地方美食体验、非遗互动、研学活动和乡村慢生活等轻量化产品。'],
      ['农文旅融合', '将当地农产品纳入游客体验、伴手礼和线上传播场景，推动“到访体验—产品购买—线上复购”的链路。'],
      ['营销推广策略', '围绕核心主题制作短视频内容，建立统一视觉和传播口径，结合节庆活动、达人探访与本地社群开展分阶段推广。'],
      ['实施路线', '先做资源盘点和游客访谈，再开展小规模试点，最后依据客流、停留时间、消费转化和满意度数据迭代。']
    ]
  }
}

export async function agricultureReport(form) {
  await wait(1400)
  return buildAgricultureReport(form)
}

export async function tourismReport(form) {
  await wait(1400)
  return buildTourismReport(form)
}

/** 报告转纯文本（复制 / 导出共用） */
export function reportToText(r) {
  return [
    r.title,
    `${r.type || '分析报告'} · ${r.date || ''}`,
    '',
    r.summary,
    '',
    ...r.sections.map((s, i) => `${String(i + 1).padStart(2, '0')} ${s[0]}\n${s[1]}\n`)
  ].join('\n')
}

/** 触发浏览器下载一个文本文件 */
export function downloadText(filename, text) {
  const blob = new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
