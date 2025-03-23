"""
PDF处理备选方案 - 用于Vercel部署

此文件提供了一个不依赖于Poppler的PDF文本提取方法，
使用PyPDF2作为替代，可以在Vercel的无服务器环境中运行。
"""

import os
import logging
import PyPDF2
import tempfile
import traceback

# 设置日志记录
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def extract_text_from_pdf_without_poppler(file_path):
    """
    使用PyPDF2从PDF文件中提取文本，不需要Poppler
    
    Args:
        file_path: PDF文件路径
        
    Returns:
        提取的文本内容
    """
    try:
        text_content = []
        
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            # 遍历每一页并提取文本
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                if text:
                    text_content.append(text)
        
        return "\n".join(text_content)
    except Exception as e:
        logger.error(f"PyPDF2处理错误: {str(e)}")
        logger.error(traceback.format_exc())
        raise

# 使用方法示例:
"""
要在main.py中使用此函数，替换现有的extract_text_from_pdf函数:

1. 在main.py的import部分添加:
    from pdf_processing_alternative import extract_text_from_pdf_without_poppler

2. 修改upload_file函数中的代码，使用新函数:
    if file_extension == 'pdf':
        try:
            # 尝试使用Poppler版本
            extracted_text = extract_text_from_pdf(uploaded_file_path)
        except Exception as e:
            logger.warning(f"Poppler PDF处理失败，尝试备用方法: {str(e)}")
            # 使用备用方法
            extracted_text = extract_text_from_pdf_without_poppler(uploaded_file_path)
""" 