# 创业项目模拟答辩平台

这是一个为大学生创业团队提供创业项目模拟答辩的网页应用。该应用允许用户上传创业项目的路演PPT，然后利用DeepSeek开源模型分析PPT内容，生成如投资人或创业导师可能会提出的问题，帮助创业团队提前准备答辩。

## 功能特点

- **PPT/PDF上传**: 支持上传PPT、PPTX或PDF格式的路演文件
- **内容分析**: 服务器端解析PPT/PDF内容，提取关键信息，并使用DeepSeek API进行分析
- **智能提问**: 基于提取的内容生成投资人可能会提出的问题
- **答辩反馈**: 对回答进行评估，提供针对性反馈和改进建议
- **多轮问答**: 支持多轮问答，模拟真实答辩场景

## 安装指南

### 前提条件

- 安装 [Node.js](https://nodejs.org/) (推荐版本 14.x 或更高版本)
- 注册并获取 [DeepSeek API](https://api-docs.deepseek.com/zh-cn/) 密钥

### 安装步骤

1. 克隆或下载本项目
2. 进入项目根目录
3. 安装依赖包:

```bash
npm install
```

## 使用方法

1. 启动服务器:

```bash
npm start
```

2. 在浏览器中访问 `http://localhost:3000`
3. 上传您的路演PPT或PDF文件
4. 系统会分析PPT内容并显示摘要
5. 回答系统生成的问题
6. 查看系统提供的反馈和建议
7. 点击"生成新问题"继续模拟答辩
8. 完成后可点击"重新开始"上传新的PPT

## 服务器端文件解析

本项目实现了服务器端PPT/PDF文件解析功能:

1. **PDF解析**: 使用pdf-parse库提取PDF文本内容
2. **PPTX解析**: 使用pptx-extract库解析PPTX文件内容
3. **PPT解析**: 目前采用模拟数据，实际部署时可使用LibreOffice等工具转换为PPTX后解析

上传的文件会被临时存储在服务器，处理完成后自动删除，不会长期保存用户数据。

## DeepSeek API 集成

本项目已集成DeepSeek API，使用流程如下：

1. PPT分析：上传PPT后，系统解析内容并调用DeepSeek API生成问题
2. 回答评估：提交回答后，系统调用DeepSeek API分析回答质量并提供反馈
3. 动态问题生成：当预设问题用完后，系统会基于之前的问答记录生成新问题

当前使用的API密钥：`sk-201fb97783f847a18427382308264e50`

## 本地开发

要进行本地开发，您可以:

1. 启动开发模式 (自动重启服务器): 
```bash
npm run dev
```

2. 在浏览器中访问 `http://localhost:3000`

## 项目结构

```
startup-pitch-simulator/
├── index.html              # 主页面
├── public/
│   └── style.css           # 样式文件
├── js/
│   └── main.js             # 前端脚本
├── uploads/                # 文件上传临时目录
├── server.js               # 服务器端代码 (包含文件解析功能)
├── package.json            # 项目依赖
├── 404.html                # 404错误页面
└── README.md               # 项目说明
```

## 进阶自定义

### 添加LibreOffice支持

要支持.ppt格式文件的转换，可以安装LibreOffice并修改server.js中的parsePpt方法：

1. 下载并安装 [LibreOffice](https://www.libreoffice.org/)
2. 确保LibreOffice可以通过命令行访问
3. 修改server.js中的parsePpt方法实现实际转换:

```javascript
async parsePpt(filePath) {
    const outputDir = path.dirname(filePath);
    const filename = path.basename(filePath, '.ppt');
    const outputPath = path.join(outputDir, filename + '.pptx');
    
    return new Promise((resolve, reject) => {
        exec(`soffice --headless --convert-to pptx "${filePath}" --outdir "${outputDir}"`, 
            async (error) => {
                if (error) {
                    console.error('PPT转换错误:', error);
                    return reject(error);
                }
                
                try {
                    // 转换成功后解析PPTX
                    const content = await this.parsePptx(outputPath);
                    
                    // 删除转换后的临时文件
                    try {
                        fs.unlinkSync(outputPath);
                    } catch (e) {
                        console.warn('删除临时文件失败:', e);
                    }
                    
                    resolve(content);
                } catch (err) {
                    reject(err);
                }
            }
        );
    });
}
```

## 后续开发计划

- 增强PPT内容结构化分析能力
- 添加用户认证和数据存储功能
- 开发评分系统，对答辩表现进行量化评估
- 支持更多文件格式
- 添加语音输入和朗读功能
- 开发多语言支持

---

© 2025 创业项目模拟答辩平台 