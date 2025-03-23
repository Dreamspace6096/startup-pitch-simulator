"""
Vercel部署前测试脚本

此脚本检查应用程序的必要组件是否可用，
并提前发现可能在Vercel部署中出现的问题。
"""

import os
import sys
import importlib
import tempfile
import logging

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("测试")

def check_dependency(module_name, package_name=None):
    """检查依赖是否可用"""
    if package_name is None:
        package_name = module_name
        
    try:
        importlib.import_module(module_name)
        logger.info(f"✅ {package_name} 已安装")
        return True
    except ImportError:
        logger.error(f"❌ {package_name} 未安装")
        return False

def check_env_vars():
    """检查环境变量是否已设置"""
    from dotenv import load_dotenv
    load_dotenv()
    
    required_vars = ['DEEPSEEK_API_KEY', 'DEEPSEEK_API_URL']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"❌ 缺少环境变量: {', '.join(missing_vars)}")
        return False
    else:
        logger.info("✅ 所有必需的环境变量已设置")
        return True

def check_tmp_directory():
    """检查临时目录是否可写"""
    try:
        with tempfile.NamedTemporaryFile(dir='/tmp', delete=True) as f:
            f.write(b'test')
        logger.info("✅ /tmp 目录可写")
        return True
    except Exception as e:
        logger.error(f"❌ /tmp 目录不可写: {str(e)}")
        return False

def check_pdf_processing():
    """检查PDF处理功能"""
    # 检查主要PDF处理方法
    poppler_available = False
    try:
        from pdf2image import convert_from_path
        # 尝试获取版本信息
        from pdf2image.pdf2image import pdfinfo_path
        if os.path.exists(pdfinfo_path()):
            logger.info("✅ Poppler (pdf2image) 可用")
            poppler_available = True
        else:
            logger.warning("⚠️ pdf2image已安装，但Poppler可能不在PATH中")
    except Exception as e:
        logger.warning(f"⚠️ Poppler检查失败: {str(e)}")
    
    # 检查备选PDF处理方法
    alternative_available = False
    try:
        import PyPDF2
        logger.info("✅ PyPDF2 (备选PDF处理) 可用")
        alternative_available = True
    except ImportError:
        logger.error("❌ PyPDF2未安装，备选PDF处理不可用")
    
    if not poppler_available and not alternative_available:
        logger.error("❌ 没有可用的PDF处理方法")
        return False
    
    return True

def main():
    """运行所有检查"""
    logger.info("开始Vercel部署前检查...")
    
    # 检查基本依赖
    dependencies = [
        ('flask', 'Flask'),
        ('dotenv', 'python-dotenv'),
        ('PIL', 'Pillow'),
        ('pytesseract', 'Pytesseract'),
        ('pptx', 'python-pptx'),
        ('requests', 'Requests'),
    ]
    
    for module, package in dependencies:
        check_dependency(module, package)
    
    # 检查环境变量
    env_ok = check_env_vars()
    
    # 检查临时目录
    tmp_ok = check_tmp_directory()
    
    # 检查PDF处理
    pdf_ok = check_pdf_processing()
    
    # 总结
    if env_ok and tmp_ok and pdf_ok:
        logger.info("✅ 所有检查通过，应用可以部署到Vercel")
        return 0
    else:
        logger.warning("⚠️ 有些检查未通过，请查看日志并解决问题后再部署")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 