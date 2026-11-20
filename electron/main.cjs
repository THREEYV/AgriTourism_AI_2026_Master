// Electron 外壳：本地起一个静态服务加载打包后的 dist，避免 file:// 下路由/资源问题
const { app, BrowserWindow, shell, Menu, dialog, session, nativeTheme } = require('electron')
const path = require('node:path')
const http = require('node:http')
const fs = require('node:fs')

// 应用身份：任务栏/窗口显示“乡韵智创”，而不是 Electron
app.setName('乡韵智创')
app.setAppUserModelId('com.xiangyun.ai')
// 原生标题栏/系统控件统一用浅色，和白色界面一致
nativeTheme.themeSource = 'light'

const DIST = path.join(__dirname, '..', 'dist')
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4'
}

function startServer() {
  const server = http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
      let file = path.normalize(path.join(DIST, urlPath === '/' ? 'index.html' : urlPath))
      if (!file.startsWith(DIST)) { res.writeHead(403); res.end('forbidden'); return }
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html')
      const ext = path.extname(file).toLowerCase()
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
      fs.createReadStream(file).pipe(res)
    } catch {
      res.writeHead(500); res.end('error')
    }
  })

  // 端口固定：origin 不变，localStorage（作品、报告、API 配置）才能跨启动保留。
  // 端口被占用时先重试同一端口，绝不改用随机端口，避免“换 origin = 数据变新”。
  return new Promise((resolve, reject) => {
    let attempt = 0
    const listen = () => {
      const onError = err => {
        server.removeListener('error', onError)
        if (err.code === 'EADDRINUSE' && attempt < 20) {
          attempt += 1
          setTimeout(listen, 300)
        } else {
          reject(err)
        }
      }
      server.once('error', onError)
      server.listen(47821, '127.0.0.1', () => {
        server.removeListener('error', onError)
        resolve(server)
      })
    }
    listen()
  })
}

let mainWindow = null
let server = null

// 内置 LLM 代理：与 npm run proxy 相同逻辑，解决第三方接口的浏览器跨域限制。
// 前端直连失败时会自动回退到 127.0.0.1:8787。端口被占用时静默跳过。
function startLLMProxy() {
  const proxy = http.createServer(async (req, res) => {
    res.setHeader('access-control-allow-origin', '*')
    res.setHeader('access-control-allow-headers', '*')
    res.setHeader('access-control-allow-methods', 'POST,OPTIONS')
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
    const target = req.headers['x-llm-target']
    if (!target || !/^https?:\/\//i.test(String(target))) {
      res.writeHead(400, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: { message: 'missing x-llm-target' } }))
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
      res.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') || 'application/json' })
      res.end(text)
    } catch (e) {
      res.writeHead(502, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: { message: '代理请求失败：' + e.message } }))
    }
  })
  proxy.on('error', () => {})
  proxy.listen(8787, '127.0.0.1', () => {})
}

startLLMProxy()

async function createWindow() {
  try {
    server = await startServer()
  } catch (e) {
    dialog.showErrorBox('无法启动', '本地端口 47821 被占用，程序可能已经在运行。请关闭已有窗口后重试。')
    app.quit()
    return
  }
  const port = server.address().port
  const iconPath = path.join(__dirname, '..', 'build', 'icon.ico')
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    title: '乡韵智创',
    backgroundColor: '#f5f7f4',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, spellcheck: false }
  })
  Menu.setApplicationMenu(null)
  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  await mainWindow.loadURL(`http://127.0.0.1:${port}/`)
  // 退出前强制把 localStorage 写盘，避免刚生成的作品/配置在下次启动时丢失
  mainWindow.on('close', () => {
    try { mainWindow.webContents.session.flushStorageData() } catch {}
  })
  mainWindow.on('closed', () => { mainWindow = null })
}

// 单实例：再次双击时聚焦已有窗口，而不是再起一个（新实例会抢端口，导致数据看起来是新的）
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
  app.whenReady().then(createWindow)
}

app.on('window-all-closed', () => {
  if (server) server.close()
  app.quit()
})

app.on('before-quit', () => {
  try { session.defaultSession.flushStorageData() } catch {}
})
