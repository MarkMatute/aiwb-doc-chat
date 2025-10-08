import fitz  # PyMuPDF
import logging
from typing import Dict, List, Optional
from pathlib import Path
import tempfile
import os

logger = logging.getLogger(__name__)

class PDFProcessor:
    """
    Service for processing PDF files and extracting their content using PyMuPDF (fitz)
    """
    
    def __init__(self):
        self.supported_extensions = ['.pdf']
    
    def is_pdf_file(self, filename: str) -> bool:
        """Check if the file is a PDF based on extension"""
        return Path(filename).suffix.lower() in self.supported_extensions
    
    def extract_text_from_pdf(self, file_content: bytes, filename: str) -> Dict:
        """
        Extract text content from a PDF file using PyMuPDF (fitz)
        
        Args:
            file_content: Raw bytes of the PDF file
            filename: Original filename for logging purposes
            
        Returns:
            Dict containing extracted text and metadata
        """
        temp_file_path = None
        try:
            # Create a temporary file to work with PyMuPDF
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                temp_file.write(file_content)
                temp_file_path = temp_file.name
            
            # Open the PDF with PyMuPDF
            doc = fitz.open(temp_file_path)
            
            # Get document info before processing pages
            total_pages = len(doc)
            metadata = doc.metadata
            
            extracted_content = {
                "filename": filename,
                "total_pages": total_pages,
                "pages": [],
                "full_text": "",
                "metadata": metadata,
                "success": True,
                "error": None
            }
            
            # Extract text from each page
            for page_num in range(total_pages):
                page = doc.load_page(page_num)
                page_text = page.get_text()
                
                page_content = {
                    "page_number": page_num + 1,
                    "text": page_text,
                    "text_length": len(page_text),
                    "width": page.rect.width,
                    "height": page.rect.height
                }
                
                extracted_content["pages"].append(page_content)
                extracted_content["full_text"] += page_text + "\n"
            
            # Close the document
            doc.close()
            
            logger.info(f"Successfully processed PDF: {filename} ({total_pages} pages)")
            return extracted_content
            
        except Exception as e:
            logger.error(f"Error processing PDF {filename}: {str(e)}")
            
            return {
                "filename": filename,
                "success": False,
                "error": str(e),
                "total_pages": 0,
                "pages": [],
                "full_text": "",
                "metadata": {}
            }
        finally:
            # Clean up temporary file
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except Exception as cleanup_error:
                    logger.warning(f"Failed to cleanup temp file {temp_file_path}: {cleanup_error}")
    
    def get_document_summary(self, extracted_content: Dict) -> Dict:
        """
        Generate a summary of the extracted document
        
        Args:
            extracted_content: Output from extract_text_from_pdf
            
        Returns:
            Dict containing document summary
        """
        if not extracted_content.get("success", False):
            return {
                "success": False,
                "error": extracted_content.get("error", "Unknown error")
            }
        
        full_text = extracted_content.get("full_text", "")
        total_pages = extracted_content.get("total_pages", 0)
        
        # Basic statistics
        word_count = len(full_text.split())
        char_count = len(full_text)
        
        # Get first 200 characters as preview
        preview = full_text[:200] + "..." if len(full_text) > 200 else full_text
        
        return {
            "success": True,
            "filename": extracted_content.get("filename"),
            "total_pages": total_pages,
            "word_count": word_count,
            "char_count": char_count,
            "preview": preview,
            "has_content": len(full_text.strip()) > 0
        } 