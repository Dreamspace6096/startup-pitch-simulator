# 通过Vercel部署创业路演模拟器

## 准备工作

1. 安装Node.js和npm(如果尚未安装)
   - 从[Node.js官网](https://nodejs.org/)下载并安装最新的LTS版本

2. 安装Vercel CLI
   ```bash
   npm install -g vercel
   ```

3. 确保你有一个Vercel账户
   - 可通过[vercel.com](https://vercel.com)注册

## 部署步骤

### 1. 登录Vercel CLI

打开命令行终端，执行以下命令：

```bash
vercel login
```

按照提示使用GitHub、GitLab或邮箱登录Vercel账户。

### 2. 配置环境变量

在部署前，你需要设置环境变量。主要是DeepSeek API的配置。

在项目根目录创建一个`.env.production`文件(这个文件不会被上传)，包含：

```
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
```

或者，你可以在Vercel部署时手动添加这些环境变量。

### 3. 部署项目

在项目根目录下运行：

```bash
vercel
```

部署过程中，Vercel CLI会询问一系列问题：

- 是否要链接到现有项目？ 选择"No"创建新项目。
- 项目名称：默认为目录名，可以自定义。
- 在哪个范围内部署？ 选择你的账户或组织。
- 要覆盖设置吗？ 选择"No"使用vercel.json设置。
- 要部署到生产环境吗？ 第一次部署选择"No"进行测试。

### 4. 设置环境变量（如果尚未通过.env.production设置）

部署完成后，前往Vercel控制台：

1. 打开项目设置
2. 点击"Environment Variables"
3. 添加以下环境变量：
   - `DEEPSEEK_API_KEY`: 你的DeepSeek API密钥
   - `DEEPSEEK_API_URL`: DeepSeek API的URL

### 5. 重新部署到生产环境

在本地终端运行：

```bash
vercel --prod
```

### 6. 配置Poppler（如果需要）

**重要说明**：该应用需要Poppler库来处理PDF文件。由于Vercel是无服务器环境，处理PDF可能会有限制。
你可能需要考虑以下解决方案：

- 修改代码，使用纯JavaScript库处理PDF（如pdf.js）
- 使用Serverless函数的Layer添加Poppler支持
- 或者将PDF处理部分转移到其他服务上

## 测试部署

完成部署后，Vercel会提供一个URL来访问你的应用，例如：
`https://your-project-name.vercel.app`

## 故障排除

1. **日志检查**：在Vercel控制台中查看部署和函数日志以定位问题

2. **文件上传问题**：
   - Vercel函数有执行时间限制（通常为10秒）
   - 大文件处理可能超时
   - 考虑使用S3等外部存储

3. **Python依赖问题**：
   - 确保requirements.txt中的所有依赖兼容
   - 某些需要编译的依赖可能在Vercel上无法正常工作

4. **临时文件存储**：
   - 确保应用中的文件上传使用`/tmp`目录
   - 请注意，`/tmp`目录中的文件在函数执行结束后会被清除

如有更多问题，请参考[Vercel文档](https://vercel.com/docs)或创建GitHub Issue。
