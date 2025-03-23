// DOM元素选择
const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('ppt-file');
const fileDropArea = document.querySelector('.file-drop-area');
const fileNameDisplay = document.getElementById('file-name');
const uploadBtn = document.getElementById('upload-btn');
const uploadSection = document.getElementById('upload-section');
const qaSection = document.getElementById('qa-section');
const pptSummary = document.getElementById('ppt-summary');
const questionsList = document.getElementById('questions-list');
const answerInput = document.getElementById('answer-input');
const submitAnswerBtn = document.getElementById('submit-answer');
const newQuestionBtn = document.getElementById('new-question');
const restartBtn = document.getElementById('restart');
const feedbackArea = document.getElementById('feedback-area');
const feedbackContent = document.getElementById('feedback-content');

// 加载状态元素
const uploadStatus = document.getElementById('upload-status');
const answerStatus = document.getElementById('answer-status');
const questionStatus = document.getElementById('question-status');

// DeepSeek API配置
const DEEPSEEK_API_KEY = "sk-201fb97783f847a18427382308264e50";
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

// 存储上传的文件和内容
let uploadedFile = null;
let pptContent = null;
let currentQuestion = null;
let questionsHistory = [];
let answersHistory = [];
let allQuestions = [];
let currentQuestionIndex = 0;

// 初始化事件监听器
function initEventListeners() {
    // 文件拖放区域事件
    fileDropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropArea.classList.add('active');
    });

    fileDropArea.addEventListener('dragleave', () => {
        fileDropArea.classList.remove('active');
    });

    fileDropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropArea.classList.remove('active');
        
        if (e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    // 文件选择事件
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFileSelect(fileInput.files[0]);
        }
    });

    // 上传按钮点击事件（改为点击事件而不是表单提交）
    uploadBtn.addEventListener('click', () => {
        if (uploadedFile) {
            processFile();
        }
    });

    // 答案提交事件
    submitAnswerBtn.addEventListener('click', submitAnswer);

    // 新问题生成事件
    newQuestionBtn.addEventListener('click', generateNewQuestion);

    // 重新开始事件
    restartBtn.addEventListener('click', restart);
}

// 处理文件选择
function handleFileSelect(file) {
    // 检查文件类型
    const validTypes = ['.ppt', '.pptx', '.pdf'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
        alert('请上传PPT或PDF文件');
        return;
    }
    
    uploadedFile = file;
    fileNameDisplay.textContent = file.name;
    uploadBtn.disabled = false;
}

// 处理文件内容
function processFile() {
    // 显示上传状态
    uploadBtn.disabled = true;
    uploadStatus.classList.remove('hidden');
    
    // 创建FormData对象，用于文件上传
    const formData = new FormData();
    formData.append('pptFile', uploadedFile);
    
    // 发送文件到服务器进行解析
    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`上传失败: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            throw new Error(data.error || '文件处理失败');
        }
        
        // 存储解析的内容
        pptContent = {
            title: data.filename,
            content: data.content
        };
        
        // 隐藏上传状态
        uploadStatus.classList.add('hidden');
        
        // 显示问答区域并隐藏上传区域
        uploadSection.classList.add('hidden');
        qaSection.classList.remove('hidden');
        
        // 显示PPT内容摘要
        displayPPTSummary();
        
        // 调用DeepSeek API生成第一个问题
        analyzePPTAndGenerateQuestions(data.content);
    })
    .catch(error => {
        console.error('处理文件时出错:', error);
        alert('处理文件时出错: ' + error.message);
        
        // 隐藏加载状态，重置按钮
        uploadStatus.classList.add('hidden');
        uploadBtn.disabled = false;
        
        // 如果服务器不可用，使用模拟数据（便于本地测试）
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            console.warn('服务器不可用，使用模拟数据');
            fallbackProcessFile();
        }
    });
}

// 后备方案：使用模拟数据处理文件（当服务器不可用时）
function fallbackProcessFile() {
    console.log('使用模拟数据处理文件');
    
    const fileName = uploadedFile.name;
    const fileType = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    
    // 模拟PPT内容摘要
    const simulatedContent = `
项目名称：${fileName.replace(/\.[^/.]+$/, "")}
项目类型：大学生创业项目
文件类型：${fileType}

项目简介：
这是一个基于创新技术的创业项目，旨在解决用户在日常生活中面临的特定问题。
项目具有明确的市场定位和目标用户群体，采用独特的商业模式。
团队成员来自不同专业背景，优势互补。

核心亮点：
1. 创新的解决方案
2. 明确的市场需求
3. 可行的盈利模式
4. 有竞争力的团队组成
    `;
    
    pptContent = {
        title: fileName,
        content: simulatedContent
    };
    
    // 显示问答区域并隐藏上传区域
    uploadSection.classList.add('hidden');
    qaSection.classList.remove('hidden');
    
    // 显示PPT内容摘要
    displayPPTSummary();
    
    // 调用DeepSeek API生成第一个问题
    analyzePPTAndGenerateQuestions(simulatedContent);
}

// 分析PPT内容并生成问题
function analyzePPTAndGenerateQuestions(pptContent) {
    const prompt = `
我有一个创业项目PPT，内容如下：

${pptContent}

请针对这个创业项目，生成5个投资人或创业导师可能会在路演答辩环节提出的问题。
这些问题应该有深度，能够帮助评估项目的可行性、盈利能力、团队能力等关键方面。
请以JSON格式返回，格式为：{"questions": ["问题1", "问题2", "问题3", "问题4", "问题5"]}
    `;
    
    callDeepSeekAPI(prompt, (response) => {
        try {
            let questions;
            
            if (typeof response === 'string') {
                // 尝试从返回的文本中提取JSON
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    questions = JSON.parse(jsonMatch[0]).questions;
                }
            } else if (response.data) {
                questions = JSON.parse(response.data).questions;
            }
            
            if (!questions || !Array.isArray(questions)) {
                // 如果解析失败，使用预设问题
                questions = [
                    "请详细介绍一下你们的创业项目是如何解决目标用户痛点的？",
                    "您的商业模式如何实现盈利？请具体说明收入来源和盈利点。",
                    "您的团队成员各自具备什么样的专业背景和经验？如何互补？",
                    "相比现有市场上的竞争对手，您的项目有哪些核心竞争优势？",
                    "您如何评估当前的市场规模和未来三年的增长潜力？"
                ];
            }
            
            // 存储所有问题以便后续使用
            allQuestions = questions;
            
            // 显示第一个问题
            const firstQuestion = {
                id: 1,
                text: questions[0]
            };
            
            currentQuestion = firstQuestion;
            questionsHistory.push(firstQuestion);
            
            displayQuestion(firstQuestion);
        } catch (error) {
            console.error("解析DeepSeek API响应时出错:", error);
            // 使用默认问题
            generateFirstQuestion();
        }
    });
}

// 显示PPT内容摘要
function displayPPTSummary() {
    pptSummary.innerHTML = `
        <p><strong>项目名称：</strong> ${uploadedFile.name.replace(/\.[^/.]+$/, "")}</p>
        <p><strong>内容摘要：</strong></p>
        <p>${pptContent.content.replace(/\n/g, '<br>')}</p>
    `;
}

// 生成第一个问题（备用方法，当API调用失败时使用）
function generateFirstQuestion() {
    // 实际应用中，这里会调用DeepSeek API生成问题
    // 这里我们模拟此过程
    
    setTimeout(() => {
        const firstQuestion = {
            id: 1,
            text: "请详细介绍一下你们的创业项目是如何解决目标用户痛点的？"
        };
        
        currentQuestion = firstQuestion;
        questionsHistory.push(firstQuestion);
        
        displayQuestion(firstQuestion);
    }, 1000);
}

// 显示问题
function displayQuestion(question) {
    const questionElement = document.createElement('div');
    questionElement.classList.add('question-card');
    questionElement.innerHTML = `
        <p><strong>问题 ${question.id}：</strong> ${question.text}</p>
    `;
    
    questionsList.appendChild(questionElement);
    
    // 滚动到底部
    questionsList.scrollTop = questionsList.scrollHeight;
}

// 提交答案
function submitAnswer() {
    if (!answerInput.value.trim() || !currentQuestion) return;
    
    const answer = {
        questionId: currentQuestion.id,
        text: answerInput.value.trim()
    };
    
    answersHistory.push(answer);
    
    displayAnswer(answer);
    
    // 清空输入框并禁用按钮
    answerInput.value = '';
    submitAnswerBtn.disabled = true;
    answerInput.disabled = true;
    
    // 显示评估状态
    answerStatus.classList.remove('hidden');
    
    // 评估答案并生成反馈
    evaluateAnswer(answer);
}

// 显示答案
function displayAnswer(answer) {
    const answerElement = document.createElement('div');
    answerElement.classList.add('answer-card');
    answerElement.innerHTML = `
        <p><strong>您的回答：</strong> ${answer.text}</p>
    `;
    
    questionsList.appendChild(answerElement);
    
    // 滚动到底部
    questionsList.scrollTop = questionsList.scrollHeight;
}

// 评估答案并生成反馈
function evaluateAnswer(answer) {
    const question = questionsHistory.find(q => q.id === answer.questionId);
    
    const prompt = `
作为创业导师，请对以下创业项目路演中的问答进行评估和反馈：

问题：${question.text}
回答：${answer.text}

请从以下三个方面给出评价：
1. 回答的优点
2. 回答可以改进的地方
3. 具体建议

请以JSON格式返回，格式为：{"strengths": "优点...", "weaknesses": "可改进...", "suggestions": "建议..."}
    `;
    
    callDeepSeekAPI(prompt, (response) => {
        try {
            let feedback;
            
            if (typeof response === 'string') {
                // 尝试从返回的文本中提取JSON
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    feedback = JSON.parse(jsonMatch[0]);
                }
            } else if (response.data) {
                feedback = JSON.parse(response.data);
            }
            
            if (!feedback || !feedback.strengths || !feedback.weaknesses || !feedback.suggestions) {
                throw new Error("未能从API响应中获取有效反馈");
            }
            
            displayFeedback(feedback);
        } catch (error) {
            console.error("生成反馈时出错:", error);
            // 使用默认反馈
            const defaultFeedback = {
                strengths: "您的回答提供了有关项目的关键信息，展示了您对项目的了解。",
                weaknesses: "回答可以更具体，提供更多数据和具体例子来支持您的论点。",
                suggestions: "建议您准备更多关于市场验证的信息，并考虑如何更清晰地阐述项目的独特价值主张。"
            };
            displayFeedback(defaultFeedback);
        } finally {
            // 隐藏评估状态
            answerStatus.classList.add('hidden');
            
            // 重新启用输入
            submitAnswerBtn.disabled = false;
            answerInput.disabled = false;
        }
    });
}

// 显示反馈
function displayFeedback(feedback) {
    feedbackArea.classList.remove('hidden');
    
    feedbackContent.innerHTML = `
        <p><strong>优点：</strong> ${feedback.strengths}</p>
        <p><strong>可改进：</strong> ${feedback.weaknesses}</p>
        <p><strong>建议：</strong> ${feedback.suggestions}</p>
    `;
}

// 生成新问题
function generateNewQuestion() {
    // 隐藏反馈区域
    feedbackArea.classList.add('hidden');
    
    // 显示加载状态
    newQuestionBtn.disabled = true;
    questionStatus.classList.remove('hidden');
    
    if (allQuestions.length > 0 && currentQuestionIndex < allQuestions.length - 1) {
        // 使用从DeepSeek API获取的问题
        currentQuestionIndex++;
        const questionId = questionsHistory.length + 1;
        
        const newQuestion = {
            id: questionId,
            text: allQuestions[currentQuestionIndex]
        };
        
        currentQuestion = newQuestion;
        questionsHistory.push(newQuestion);
        
        displayQuestion(newQuestion);
        
        // 隐藏加载状态
        questionStatus.classList.add('hidden');
        newQuestionBtn.disabled = false;
    } else {
        // 如果已经用完了预设问题，则调用API生成新问题
        const userAnswers = answersHistory.map(a => `问题：${questionsHistory.find(q => q.id === a.questionId).text}\n回答：${a.text}`).join('\n\n');
        
        const prompt = `
基于以下创业项目的PPT内容和之前的问答记录，请生成一个新的投资人问题。这个问题应该有深度，不应该重复之前已经问过的问题，并且应该针对创业项目的某个方面进行深入探讨。

PPT内容：
${pptContent.content}

之前的问答记录：
${userAnswers}

已经问过的问题：
${questionsHistory.map(q => q.text).join('\n')}

请给出一个新的投资人问题：
        `;
        
        callDeepSeekAPI(prompt, (response) => {
            try {
                let newQuestionText = '';
                
                if (typeof response === 'string') {
                    newQuestionText = response.trim();
                } else if (response.data) {
                    newQuestionText = response.data.trim();
                }
                
                if (!newQuestionText) {
                    throw new Error("未能从API响应中获取问题");
                }
                
                const questionId = questionsHistory.length + 1;
                const newQuestion = {
                    id: questionId,
                    text: newQuestionText
                };
                
                currentQuestion = newQuestion;
                questionsHistory.push(newQuestion);
                
                displayQuestion(newQuestion);
            } catch (error) {
                console.error("生成新问题时出错:", error);
                // 使用备用方法生成问题
                fallbackGenerateNewQuestion();
            } finally {
                // 隐藏加载状态
                questionStatus.classList.add('hidden');
                newQuestionBtn.disabled = false;
            }
        });
    }
}

// 备用生成新问题方法
function fallbackGenerateNewQuestion() {
    // 与原来的generateNewQuestion逻辑相同
    setTimeout(() => {
        const questionId = questionsHistory.length + 1;
        const questions = [
            "您的商业模式如何实现盈利？请具体说明收入来源和盈利点。",
            "您的团队成员各自具备什么样的专业背景和经验？如何互补？",
            "相比现有市场上的竞争对手，您的项目有哪些核心竞争优势？",
            "您如何评估当前的市场规模和未来三年的增长潜力？",
            "您计划如何获取早期用户并实现快速增长？",
            "您的项目目前面临哪些主要风险或挑战？如何应对？",
            "您需要多少融资，打算如何使用这些资金？",
            "您的项目在技术层面有哪些创新或护城河？"
        ];
        
        // 选择一个尚未问过的问题
        let newQuestionText = "";
        const askedQuestions = questionsHistory.map(q => q.text);
        
        for (const q of questions) {
            if (!askedQuestions.includes(q)) {
                newQuestionText = q;
                break;
            }
        }
        
        // 如果所有预设问题都已问过，随机选择一个
        if (!newQuestionText) {
            const randomIndex = Math.floor(Math.random() * questions.length);
            newQuestionText = questions[randomIndex];
        }
        
        const newQuestion = {
            id: questionId,
            text: newQuestionText
        };
        
        currentQuestion = newQuestion;
        questionsHistory.push(newQuestion);
        
        displayQuestion(newQuestion);
        
        // 隐藏加载状态
        questionStatus.classList.add('hidden');
        newQuestionBtn.disabled = false;
    }, 1000);
}

// 重新开始
function restart() {
    // 重置状态
    uploadedFile = null;
    pptContent = null;
    currentQuestion = null;
    questionsHistory = [];
    answersHistory = [];
    allQuestions = [];
    currentQuestionIndex = 0;
    
    // 重置UI
    fileNameDisplay.textContent = '';
    uploadBtn.disabled = true;
    questionsList.innerHTML = '';
    pptSummary.innerHTML = '';
    feedbackArea.classList.add('hidden');
    
    // 显示上传区域并隐藏问答区域
    uploadSection.classList.remove('hidden');
    qaSection.classList.add('hidden');
}

// 调用DeepSeek API
function callDeepSeekAPI(prompt, callback) {
    console.log("调用DeepSeek API...");
    
    fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                {"role": "system", "content": "你是一位经验丰富的创业导师和投资人，精通创业项目分析和评估。"},
                {"role": "user", "content": prompt}
            ],
            temperature: 0.7,  // 添加温度参数以控制创造性
            max_tokens: 1000,  // 限制响应长度
            stream: false
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("DeepSeek API响应:", data);
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            callback(data.choices[0].message.content);
        } else {
            throw new Error("API响应格式不正确");
        }
    })
    .catch(error => {
        console.error("调用DeepSeek API时出错:", error);
        // 在API调用失败时，使用模拟响应
        setTimeout(() => {
            const fallbackResponse = {
                success: true,
                data: "这是模拟的DeepSeek模型响应"
            };
            callback(fallbackResponse);
        }, 1500);
    });
}

// 初始化应用
function initApp() {
    initEventListeners();
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp); 