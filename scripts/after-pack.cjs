// 打包后给 exe 写入中文应用名与图标，避免任务栏显示 "Electron"
const { execFileSync } = require('node:child_process')
const path = require('node:path')
const fs = require('node:fs')

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return
  const projectDir = context.packager.projectDir
  const rcedit = path.join(projectDir, 'build', 'rcedit.exe')
  const icon = path.join(projectDir, 'build', 'icon.ico')
  const exe = path.join(context.appOutDir, '乡韵智创.exe')
  if (!fs.existsSync(rcedit) || !fs.existsSync(icon) || !fs.existsSync(exe)) return
  execFileSync(rcedit, [
    exe,
    '--set-icon', icon,
    '--set-version-string', 'FileDescription', '乡韵智创',
    '--set-version-string', 'ProductName', '乡韵智创',
    '--set-version-string', 'OriginalFilename', '乡韵智创.exe',
    '--set-version-string', 'CompanyName', '乡韵智创',
    '--set-version-string', 'LegalCopyright', '乡韵智创'
  ], { stdio: 'inherit' })
}
