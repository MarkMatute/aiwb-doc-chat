from pinecone import Pinecone, ServerlessSpec
import logging
from typing import List, Dict, Optional, Tuple
from openai import OpenAI
from services.text_chunker import TextChunk
import os

logger = logging.getLogger(__name__)

class PineconeService:
    """
    Service for Pinecone vector database operations
    """
    
    def __init__(self, api_key: str, environment: str, index_name: str = "aiwb-chatbot", openai_api_key: str = None):
        """
        Initialize Pinecone service
        
        Args:
            api_key: Pinecone API key
            environment: Pinecone environment (e.g., 'us-east-1')
            index_name: Name of the Pinecone index
            openai_api_key: OpenAI API key for embeddings
        """
        self.api_key = api_key
        self.environment = environment
        self.index_name = index_name
        self.index = None
        
        # Initialize OpenAI client for embeddings (1536 dimensions)
        self.openai_client = OpenAI(api_key=openai_api_key or os.getenv('OPENAI_API_KEY'))
        
        # Initialize Pinecone client
        self.pc = Pinecone(api_key=api_key)
        
        # Get or create index
        self._setup_index()
    
    def _setup_index(self):
        """Setup Pinecone index"""
        try:
            # Check if index exists
            existing_indexes = [index.name for index in self.pc.list_indexes()]
            
            if self.index_name not in existing_indexes:
                # Create index with serverless spec
                self.pc.create_index(
                    name=self.index_name,
                    dimension=1536,  # Dimension for text-embedding-3-small
                    metric='cosine',
                    spec=ServerlessSpec(
                        cloud='aws',
                        region=self.environment
                    )
                )
                logger.info(f"Created Pinecone index: {self.index_name}")
            
            # Connect to index
            self.index = self.pc.Index(self.index_name)
            logger.info(f"Connected to Pinecone index: {self.index_name}")
            
        except Exception as e:
            logger.error(f"Failed to setup Pinecone index: {str(e)}")
            raise
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts using OpenAI text-embedding-3-small
        
        Args:
            texts: List of text strings
            
        Returns:
            List of embedding vectors
        """
        try:
            # OpenAI API supports batch processing
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=texts
            )
            
            # Extract embeddings from response
            embeddings = [embedding.embedding for embedding in response.data]
            logger.info(f"Generated {len(embeddings)} embeddings using OpenAI text-embedding-3-small")
            return embeddings
            
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {str(e)}")
            raise
    
    def upsert_chunks(self, chunks: List[TextChunk]) -> Dict:
        """
        Upsert text chunks to Pinecone
        
        Args:
            chunks: List of TextChunk objects
            
        Returns:
            Dictionary with upsert results
        """
        if not chunks:
            return {"success": True, "upserted_count": 0, "error": None}
        
        try:
            # Prepare vectors for upsert
            vectors = []
            texts = []
            
            for chunk in chunks:
                # Create unique ID for the vector
                vector_id = f"{chunk.metadata['business_id']}_{chunk.metadata['filename']}_{chunk.chunk_id}"
                
                # Prepare metadata for Pinecone (truncate text if needed)
                text_for_metadata = chunk.text[:40000] if len(chunk.text) > 40000 else chunk.text
                pinecone_metadata = {
                    "text": text_for_metadata,
                    "business_id": chunk.metadata["business_id"],
                    "document_id": chunk.metadata["document_id"],
                    "filename": chunk.metadata["filename"],
                    "page_number": chunk.page_number,
                    "chunk_index": chunk.chunk_index,
                    "chunk_size": chunk.metadata["chunk_size"],
                    "total_pages": chunk.metadata["total_pages"]
                }
                
                vectors.append({
                    "id": vector_id,
                    "metadata": pinecone_metadata
                })
                texts.append(chunk.text)
            
            # Generate embeddings
            embeddings = self.generate_embeddings(texts)
            
            # Add embeddings to vectors
            for i, vector in enumerate(vectors):
                vector["values"] = embeddings[i]
            
            # Upsert to Pinecone
            self.index.upsert(vectors=vectors)
            
            logger.info(f"Successfully upserted {len(chunks)} chunks to Pinecone")
            return {
                "success": True,
                "upserted_count": len(chunks),
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Failed to upsert chunks to Pinecone: {str(e)}")
            return {
                "success": False,
                "upserted_count": 0,
                "error": str(e)
            }
    
    def search_similar(self, query: str, business_id: str, top_k: int = 5) -> List[Dict]:
        """
        Search for similar chunks based on query
        
        Args:
            query: Search query
            business_id: Business ID to filter results
            top_k: Number of top results to return
            
        Returns:
            List of similar chunks with scores
        """
        try:
            # Generate embedding for query
            query_embedding = self.generate_embeddings([query])[0]
            
            # Search in Pinecone with business_id filter
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                filter={"business_id": business_id},
                include_metadata=True
            )
            
            # Format results
            formatted_results = []
            for match in results.matches:
                formatted_results.append({
                    "id": match.id,
                    "score": match.score,
                    "text": match.metadata.get("text", ""),
                    "filename": match.metadata.get("filename", ""),
                    "page_number": match.metadata.get("page_number", 0),
                    "chunk_index": match.metadata.get("chunk_index", 0),
                    "business_id": match.metadata.get("business_id", "")
                })
            
            logger.info(f"Found {len(formatted_results)} similar chunks for query")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Failed to search Pinecone: {str(e)}")
            return []
    
    def search_similar_no_filter(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Search for similar chunks without business_id filter (for debugging)
        """
        try:
            # Generate embedding for query
            query_embedding = self.generate_embeddings([query])[0]
            
            # Search in Pinecone without filter
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True
            )
            
            # Format results
            formatted_results = []
            for match in results.matches:
                formatted_results.append({
                    "id": match.id,
                    "score": match.score,
                    "text": match.metadata.get("text", ""),
                    "filename": match.metadata.get("filename", ""),
                    "page_number": match.metadata.get("page_number", 0),
                    "chunk_index": match.metadata.get("chunk_index", 0),
                    "business_id": match.metadata.get("business_id", "")
                })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Failed to search Pinecone (no filter): {str(e)}")
            return []
    
    def delete_by_business_id(self, business_id: str) -> Dict:
        """
        Delete all vectors for a specific business ID
        
        Args:
            business_id: Business ID to delete
            
        Returns:
            Dictionary with deletion results
        """
        try:
            # Pinecone doesn't support direct deletion by metadata filter
            # We need to query first, then delete by IDs
            # For now, we'll return a placeholder
            logger.warning("Delete by business_id not implemented - requires querying first")
            return {
                "success": False,
                "deleted_count": 0,
                "error": "Delete by business_id not implemented yet"
            }
            
        except Exception as e:
            logger.error(f"Failed to delete vectors for business_id {business_id}: {str(e)}")
            return {
                "success": False,
                "deleted_count": 0,
                "error": str(e)
            }
    
    def get_index_stats(self) -> Dict:
        """
        Get Pinecone index statistics
        
        Returns:
            Dictionary with index statistics
        """
        try:
            stats = self.index.describe_index_stats()
            return {
                "success": True,
                "total_vector_count": stats.total_vector_count,
                "dimension": stats.dimension,
                "index_fullness": stats.index_fullness,
                "namespaces": stats.namespaces
            }
        except Exception as e:
            logger.error(f"Failed to get index stats: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            } 