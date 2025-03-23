"""
DeepSeek API测试脚本

此脚本测试DeepSeek API连接，检查API密钥和URL是否正确配置，
并输出API响应的原始内容以便诊断问题。
"""

import os
import json
import requests
import logging
from dotenv import load_dotenv

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("API测试")

def test_deepseek_api():
    """测试DeepSeek API连接"""
    # 加载环境变量
    load_dotenv()
    api_key = os.getenv('DEEPSEEK_API_KEY')
    api_url = os.getenv('DEEPSEEK_API_URL')
    
    if not api_key:
        logger.error("⚠️ 未找到DeepSeek API密钥，请检查.env文件")
        return False
    
    if not api_url:
        logger.error("⚠️ 未找到DeepSeek API URL，请检查.env文件")
        return False
    
    logger.info(f"使用API URL: {api_url}")
    logger.info(f"API密钥前几位: {api_key[:8]}...")
    
    # 准备请求数据
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # 设置简单的请求内容
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "你是一位助手。"},
            {"role": "user", "content": "你好，请回复一个简单的问候。"}
        ],
        "temperature": 0.7,
        "max_tokens": 100,
        "stream": False
    }
    
    try:
        logger.info("正在发送测试请求...")
        response = requests.post(
            api_url,
            headers=headers,
            json=data,
            timeout=(10, 30)  # 连接超时10秒，读取超时30秒
        )
        
        logger.info(f"响应状态码: {response.status_code}")
        
        # 打印原始响应内容（不尝试解析JSON）
        logger.info(f"原始响应内容:\n{response.text[:500]}...")
        
        # 尝试解析为JSON
        try:
            result = response.json()
            logger.info("✅ 成功解析JSON响应")
            
            # 检查响应格式
            if 'choices' in result and len(result['choices']) > 0:
                content = result['choices'][0]['message']['content']
                logger.info(f"API返回内容: {content}")
                logger.info("✅ API测试成功，响应格式正确")
                return True
            else:
                logger.warning("⚠️ API响应中未找到预期的content字段")
                logger.info(f"实际响应: {json.dumps(result, indent=2)}")
                return False
                
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON解析错误: {e}")
            logger.error("响应不是有效的JSON格式")
            return False
    
    except requests.exceptions.Timeout:
        logger.error("❌ 请求超时")
        return False
    except requests.exceptions.ConnectionError:
        logger.error("❌ 连接错误")
        return False
    except Exception as e:
        logger.error(f"❌ 发生未知错误: {str(e)}")
        return False

if __name__ == "__main__":
    logger.info("开始测试DeepSeek API...")
    result = test_deepseek_api()
    
    if result:
        logger.info("========== 测试结果: 成功 ==========")
        logger.info("API连接正常，可以在Vercel上部署")
    else:
        logger.info("========== 测试结果: 失败 ==========")
        logger.info("API连接异常，请检查配置后再部署") 