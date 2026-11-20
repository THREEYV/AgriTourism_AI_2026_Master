// 本地 LLM 代理：解决浏览器直连第三方 API 的跨域问题
// 用法：npm run proxy，然后把模型服务中心的 Base URL 保持真实地址即可，
// 前端直连失败时会自动带上 x-llm-target 走这里转发。
import http from 'node:http'

const PORT = Number(process.env.LLM_PROXY_PORT || 8787)
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'POST,OPTIONS'
}

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS)
    res.end()
    return
  }

  const target = req.headers['x-llm-target']
  if (!target || !/^https?:\/\//i.test(String(target))) {
    res.writeHead(400, { ...CORS, 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: { message: '缺少 x-llm-target 头' } }))
    return
  }

  const chunks = []
  for await (const chunk of req) chunks.push(chunk)

  try {
    const upstream = await fetch(String(target).replace(/\/+$/, '') + req.url, {
      method: req.method,
      headers: {
        'content-type': 'application/json',
        authorization: req.headers.authorization || ''
      },
      body: req.method === 'GET' ? undefined : Buffer.concat(chunks)
    })
    const text = await upstream.text()
    res.writeHead(upstream.status, {
      ...CORS,
      'content-type': upstream.headers.get('content-type') || 'application/json'
    })
    res.end(text)
  } catch (e) {
    res.writeHead(502, { ...CORS, 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: { message: '代理请求失败：' + e.message } }))
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`LLM proxy listening on http://127.0.0.1:${PORT}`)
})
