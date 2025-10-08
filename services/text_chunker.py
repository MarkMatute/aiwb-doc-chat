import re
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class TextChunk:
    """Represents a chunk of text with metadata"""
    text: str
    chunk_id: str
    page_number: int
    chunk_index: int
    start_char: int
    end_char: int
    metadata: Dict

class TextChunker:
    """
    Service for chunking text into smaller pieces for RAG processing
    """
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        """
        Initialize the text chunker
        
        Args:
            chunk_size: Maximum number of characters per chunk
            chunk_overlap: Number of characters to overlap between chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def chunk_by_sentences(self, text: str, page_number: int, metadata: Dict) -> List[TextChunk]:
        """
        Chunk text by sentences while respecting chunk size limits
        
        Args:
            text: Text to chunk
            page_number: Page number for metadata
            metadata: Additional metadata to include
            
        Returns:
            List of TextChunk objects
        """
        # Split text into sentences (basic implementation)
        sentences = self._split_into_sentences(text)
        
        chunks = []
        current_chunk = ""
        current_start = 0
        chunk_index = 0
        
        for sentence in sentences:
            # If adding this sentence would exceed chunk size, save current chunk
            if len(current_chunk) + len(sentence) > self.chunk_size and current_chunk:
                chunk = self._create_chunk(
                    current_chunk.strip(),
                    page_number,
                    chunk_index,
                    current_start,
                    current_start + len(current_chunk),
                    metadata
                )
                chunks.append(chunk)
                
                # Start new chunk with overlap
                overlap_text = self._get_overlap_text(current_chunk)
                current_chunk = overlap_text + sentence
                current_start = current_start + len(current_chunk) - len(overlap_text) - len(sentence)
                chunk_index += 1
            else:
                current_chunk += sentence
        
        # Add the last chunk if there's content
        if current_chunk.strip():
            chunk = self._create_chunk(
                current_chunk.strip(),
                page_number,
                chunk_index,
                current_start,
                current_start + len(current_chunk),
                metadata
            )
            chunks.append(chunk)
        
        return chunks
    
    def chunk_by_fixed_size(self, text: str, page_number: int, metadata: Dict) -> List[TextChunk]:
        """
        Chunk text by fixed character size
        
        Args:
            text: Text to chunk
            page_number: Page number for metadata
            metadata: Additional metadata to include
            
        Returns:
            List of TextChunk objects
        """
        chunks = []
        chunk_index = 0
        
        for i in range(0, len(text), self.chunk_size - self.chunk_overlap):
            chunk_text = text[i:i + self.chunk_size]
            
            if chunk_text.strip():
                chunk = self._create_chunk(
                    chunk_text.strip(),
                    page_number,
                    chunk_index,
                    i,
                    min(i + self.chunk_size, len(text)),
                    metadata
                )
                chunks.append(chunk)
                chunk_index += 1
        
        return chunks
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """
        Split text into sentences using regex
        
        Args:
            text: Text to split
            
        Returns:
            List of sentences
        """
        # Simple sentence splitting - can be improved with more sophisticated NLP
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _get_overlap_text(self, text: str) -> str:
        """
        Get the last part of text for overlap
        
        Args:
            text: Text to get overlap from
            
        Returns:
            Overlap text
        """
        if len(text) <= self.chunk_overlap:
            return text
        return text[-self.chunk_overlap:]
    
    def _create_chunk(self, text: str, page_number: int, chunk_index: int, 
                     start_char: int, end_char: int, metadata: Dict) -> TextChunk:
        """
        Create a TextChunk object
        
        Args:
            text: Chunk text
            page_number: Page number
            chunk_index: Index of chunk within the page
            start_char: Starting character position
            end_char: Ending character position
            metadata: Additional metadata
            
        Returns:
            TextChunk object
        """
        chunk_id = f"page_{page_number}_chunk_{chunk_index}"
        
        chunk_metadata = {
            **metadata,
            "page_number": page_number,
            "chunk_index": chunk_index,
            "start_char": start_char,
            "end_char": end_char,
            "chunk_size": len(text)
        }
        
        return TextChunk(
            text=text,
            chunk_id=chunk_id,
            page_number=page_number,
            chunk_index=chunk_index,
            start_char=start_char,
            end_char=end_char,
            metadata=chunk_metadata
        )
    
    def chunk_pdf_content(self, extracted_content: Dict, business_id: str, document_id: str) -> List[TextChunk]:
        """
        Chunk PDF content from the PDF processor output

        Args:
            extracted_content: Output from PDFProcessor.extract_text_from_pdf
            business_id: Business ID for metadata
            document_id: Document ID for metadata (stored as document_id in vector)

        Returns:
            List of TextChunk objects
        """
        if not extracted_content.get("success", False):
            logger.warning(f"Cannot chunk failed PDF extraction: {extracted_content.get('error')}")
            return []

        all_chunks = []
        filename = extracted_content.get("filename", "unknown")

        # Process each page
        for page_data in extracted_content.get("pages", []):
            page_text = page_data.get("text", "")
            page_number = page_data.get("page_number", 1)

            if not page_text.strip():
                continue

            # Create metadata for this page
            page_metadata = {
                "business_id": business_id,
                "document_id": document_id,
                "filename": filename,
                "total_pages": extracted_content.get("total_pages", 0),
                "page_width": page_data.get("width", 0),
                "page_height": page_data.get("height", 0)
            }
            
            # Chunk the page text
            page_chunks = self.chunk_by_sentences(page_text, page_number, page_metadata)
            all_chunks.extend(page_chunks)
        
        logger.info(f"Created {len(all_chunks)} chunks from PDF {filename}")
        return all_chunks 