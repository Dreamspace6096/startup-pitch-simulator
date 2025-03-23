const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const formidable = require('formidable');
const pdf = require('pdf-parse');
const pptxExtract = require('pptx-extract');

const PORT = 3000;

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 文件解析器
const FileParser = {
    async parsePptx(filePath) {
        return new Promise((resolve, reject) => {
            pptxExtract.extract(filePath, (err, result) => {
                if (err) return reject(err);
                
                let content = '';
                // 提取幻灯片标题和内容
                result.slides.forEach((slide, index) => {
                    content += `=== 幻灯片 ${index + 1} ===\n`;
                    if (slide.title) content += `标题: ${slide.title}\n`;
                    if (slide.content) content += `${slide.content}\n\n`;
                });
                
                resolve(content);
            });
        });
    },
    
    async parsePdf(filePath) {
        try {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            return data.text;
        } catch (error) {
            console.error('PDF解析错误:', error);
            throw error;
        }
    },
    
    async parsePpt(filePath) {
        // 由于直接解析.ppt比较复杂，这里提供一个模拟实现
        // 在实际环境中，可以使用LibreOffice或其他工具将PPT转换为PPTX
        
        // 注意：这只是一个模拟，实际部署时应替换为真实转换逻辑
        console.warn('PPT解析采用模拟数据，实际部署时请实现转换功能');
        
        const filename = path.basename(filePath, '.ppt');
        return `
=== ${filename} 内容模拟 ===

由于浏览器环境限制，无法直接解析PPT文件格式。
在实际部署中，您应该:
1. 安装LibreOffice并使用命令行工具转换
2. 或使用专门的PPT解析库
3. 或提供一个基于云的转换服务

模拟提取的内容：
幻灯片1: 项目介绍
这是一个创业项目路演PPT

幻灯片2: 市场分析
市场规模大，增长潜力高

幻灯片3: 产品方案
创新解决方案，解决用户痛点

幻灯片4: 商业模式
清晰的盈利模式和收入来源

幻灯片5: 团队介绍
经验丰富的团队成员，优势互补
`;
    },
    
    // 根据文件类型选择合适的解析方法
    async parseFile(filePath, fileType) {
        const ext = fileType.toLowerCase();
        
        if (ext === '.pdf') {
            return await this.parsePdf(filePath);
        } else if (ext === '.pptx') {
            return await this.parsePptx(filePath);
        } else if (ext === '.ppt') {
            return await this.parsePpt(filePath);
        } else {
            throw new Error(`不支持的文件类型: ${ext}`);
        }
    }
};

// 创建HTTP服务器
const server = http.createServer(async (req, res) => {
    // 处理文件上传API请求
    if (req.url === '/api/upload' && req.method.toLowerCase() === 'post') {
        console.log('接收到文件上传请求');
        
        // 设置CORS头部，允许跨域请求
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // 如果是预检请求，直接返回成功
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        try {
            const form = new formidable.IncomingForm();
            form.uploadDir = uploadDir;
            form.keepExtensions = true;
            
            form.parse(req, async (err, fields, files) => {
                if (err) {
                    console.error('文件上传错误:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: '文件上传失败' }));
                    return;
                }
                
                try {
                    const file = files.pptFile;
                    if (!file) {
                        throw new Error('未找到上传的文件');
                    }
                    
                    const filePath = file.filepath || file.path; // 兼容formidable不同版本
                    const fileName = file.originalFilename || file.name;
                    const fileExt = path.extname(fileName);
                    
                    console.log(`文件上传成功: ${fileName}, 路径: ${filePath}`);
                    
                    // 解析文件内容
                    const extractedContent = await FileParser.parseFile(filePath, fileExt);
                    
                    // 删除临时文件
                    try {
                        fs.unlinkSync(filePath);
                        console.log(`临时文件已删除: ${filePath}`);
                    } catch (delErr) {
                        console.warn(`删除临时文件失败: ${delErr.message}`);
                    }
                    
                    // 生成结构化内容
                    const projectName = path.basename(fileName, fileExt);
                    const structuredContent = `
项目名称：${projectName}
文件类型：${fileExt}

提取内容：
${extractedContent}
                    `;
                    
                    // 返回解析结果
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        content: structuredContent,
                        filename: fileName
                    }));
                    
                } catch (error) {
                    console.error('文件处理错误:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        error: '文件解析失败: ' + error.message 
                    }));
                }
            });
        } catch (error) {
            console.error('请求处理错误:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '服务器错误' }));
        }
        
        return;
    }
    
    // 处理静态文件请求
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);
    
    const extname = path.extname(filePath).toLowerCase();
    let contentType = 'text/html';
    
    // 设置不同文件类型的Content-Type
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
        case '.jpeg':
            contentType = 'image/jpeg';
            break;
        case '.gif':
            contentType = 'image/gif';
            break;
    }
    
    // 读取文件
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // 页面不存在
                fs.readFile(path.join(__dirname, '404.html'), (err, content) => {
                    if (err) {
                        // 如果404页面也不存在，返回简单的404消息
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end('<h1>404 Not Found</h1><p>页面不存在</p>');
                    } else {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end(content, 'utf8');
                    }
                });
            } else {
                // 服务器错误
                res.writeHead(500);
                res.end(`服务器错误: ${err.code}`);
            }
        } else {
            // 成功返回文件内容
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf8');
        }
    });
});

// 启动服务器
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`按Ctrl+C停止服务器`);
}); 