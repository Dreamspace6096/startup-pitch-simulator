# 创业路演模拟器

一个帮助创业者准备投资路演的交互式Web应用程序。用户可以上传路演材料（PPT或PDF），系统会生成投资人可能提出的问题，并对用户的回答进行专业分析和评估。

## 功能特点

- 支持PDF和PPT/PPTX文件上传和处理
- 自动生成投资人可能提出的关键问题（5个高质量问题）
- 交互式问答界面，轻松记录回答
- 专业的AI分析和评估功能，包括多维度评分和改进建议
- 实时状态更新，提升用户体验

## 技术栈

- 前端：HTML/CSS/JavaScript，TailwindCSS
- 后端：Python，Flask
- 文件处理：pdf2image，python-pptx，PyPDF2
- OCR识别：Tesseract

## 部署说明

### 本地开发

1. 克隆仓库
   ```
   git clone https://github.com/Dreamspace6096/startup-pitch-simulator.git
   cd startup-pitch-simulator
   ```

2. 安装依赖
   ```
   pip install -r requirements.txt
   ```

3. 配置外部依赖

   - 安装Tesseract OCR: [https://github.com/UB-Mannheim/tesseract/wiki](https://github.com/UB-Mannheim/tesseract/wiki)
   - 安装Poppler: [https://github.com/oschwartz10612/poppler-windows/releases](https://github.com/oschwartz10612/poppler-windows/releases)

4. 配置环境变量
   创建`.env`文件并配置DeepSeek API密钥:
   ```
   DEEPSEEK_API_KEY=your_api_key_here
   DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
   ```

5. 运行应用
   ```
   python main.py
   ```

### Vercel部署

本应用已针对Vercel部署进行了优化：

1. 使用预定义数据：由于Vercel部署可能面临API连接问题，应用会使用预定义的高质量问题和分析反馈，确保即使没有API连接，应用也能正常运行。

2. Vercel配置文件：项目包含`vercel.json`和相关配置文件。

3. 部署步骤：
   - 将代码推送到GitHub仓库
   - 在Vercel中导入项目
   - 设置环境变量（可选，因为应用会使用内置数据）
   - 部署

## 使用说明

1. 访问应用首页
2. 上传您的路演PPT或PDF文件
3. 系统会生成5个投资人可能提出的问题
4. 为每个问题输入您的回答
5. 点击"AI分析回答"按钮获取专业评估
6. 查看分析结果，包括总体评分和各维度点评

## 注意事项

- 上传文件大小限制为50MB
- 支持的文件格式：PDF, PPT, PPTX
- 系统会在处理完成后删除上传的文件，保护用户隐私

## 离线模式说明

当无法连接DeepSeek API时，系统会自动切换到离线模式，使用预定义的高质量问题和分析模板。这确保了应用在所有环境下都能正常运行，是专门为Vercel部署设计的解决方案。

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