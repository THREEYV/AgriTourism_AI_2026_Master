# GitHub Pages 部署指南

## 当前状态
- ✅ 项目已构建完成（`dist/` 目录包含完整的 Vue 3 应用）
- ✅ GitHub Actions 工作流已配置（`.github/workflows/deploy.yml`）
- ⚠️ **需要手动启用 GitHub Pages**

## 启用步骤

### 方法一：通过 GitHub Settings 启用（推荐）

1. **访问仓库设置页面：**
   ```
   https://github.com/THREEYV/AgriTourism_AI_2026_Master/settings/pages
   ```

2. **在 "Pages" 部分进行以下设置：**
   - **Source:** 选择 `Deploy from a branch`
   - **Branch:** 选择 `main`
   - **Folder:** 选择 `/ (root)`

3. **点击 "Save" 保存设置**

4. **等待 1-2 分钟**，GitHub 会部署您的页面

5. **访问您的网站：**
   ```
   https://threeyv.github.io/AgriTourism_AI_2026_Master/
   ```

### 方法二：通过 GitHub Actions 自动部署

1. **确保 Actions 已启用：**
   - 访问：https://github.com/THREEYV/AgriTourism_AI_2026_Master/actions
   - 如果看到 workflow 运行，说明已启用

2. **手动触发一次部署：**
   - 在 Actions 页面找到 "Deploy to GitHub Pages" workflow
   - 点击 "Run workflow" → "Run workflow"

3. **等待部署完成**（约 1-2 分钟）

4. **访问网站：**
   ```
   https://threeyv.github.io/AgriTourism_AI_2026_Master/
   ```

## 验证部署

部署成功后，您应该能看到：
- 乡韵智创的 Vue 应用界面
- 导航栏（首页、助农、文旅、视频创作、模型中心等）
- 完整的项目功能

## 常见问题

### Q: 页面显示空白？
A: 请尝试：
1. 强制刷新浏览器（Ctrl+F5）
2. 清除浏览器缓存
3. 使用无痕模式访问

### Q: 显示 404 错误？
A: 确认：
1. GitHub Pages 已正确启用（见上方步骤）
2. main 分支有最新的代码推送
3. Actions workflow 没有报错

### Q: 如何查看 Actions 运行日志？
A: 访问：https://github.com/THREEYV/AgriTourism_AI_2026_Master/actions

---

**技术支持：** 如有问题，请查看 Actions 日志或联系项目维护者。
