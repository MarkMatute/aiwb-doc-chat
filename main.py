from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from services.pdf_processor import PDFProcessor
from services.text_chunker import TextChunker
from services.pinecone_service import PineconeService
import logging
import os
from typing import Optional, List
from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AIWB Chatbot API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Pydantic models for request/response
class QueryRequest(BaseModel):
    query: str
    businessId: str
    max_chunks: Optional[int] = 5

class QueryResponse(BaseModel):
    query: str
    businessId: str
    answer: str
    sources: List[dict]
    chunks_used: int

# Initialize services
pdf_processor = PDFProcessor()
text_chunker = TextChunker(chunk_size=1000, chunk_overlap=200)

# Initialize Pinecone service (will be None if credentials not provided)
pinecone_service: Optional[PineconeService] = None
openai_client: Optional[OpenAI] = None

# Try to initialize Pinecone service
try:
    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    pinecone_environment = os.getenv("PINECONE_ENVIRONMENT")
    
    if pinecone_api_key and pinecone_environment:
        pinecone_index_name = os.getenv("PINECONE_INDEX_NAME", "aiwb-chatbot")
        openai_api_key = os.getenv("OPENAI_API_KEY")
        
        if not openai_api_key:
            logger.warning("OpenAI API key not found. Vector embeddings will not work.")
        
        pinecone_service = PineconeService(
            api_key=pinecone_api_key,
            environment=pinecone_environment,
            index_name=pinecone_index_name,
            openai_api_key=openai_api_key
        )
        
        # Initialize OpenAI client for chat completions
        openai_client = OpenAI(api_key=openai_api_key)
        
        logger.info("Pinecone service and OpenAI client initialized successfully")
    else:
        logger.warning("Pinecone credentials not found. Vector storage will be disabled.")
except Exception as e:
    logger.error(f"Failed to initialize Pinecone service: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Welcome to AIWB Chatbot API"}

@app.post("/upload")
async def upload_file(
    businessId: str = Form(...),
    documentId: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Upload endpoint that accepts businessId, documentId, and file
    Processes PDF files, extracts text, chunks it, and stores in vector database
    """
    try:
        # Validate filename
        if not file.filename:
            raise HTTPException(status_code=400, detail="Filename is required")
        
        # Check if file is a PDF
        if not pdf_processor.is_pdf_file(file.filename):
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Only PDF files are supported. Received: {file.filename}"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Process PDF and extract text
        extracted_content = pdf_processor.extract_text_from_pdf(file_content, file.filename)
        
        if not extracted_content["success"]:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process PDF: {extracted_content['error']}"
            )
        
        # Generate document summary
        summary = pdf_processor.get_document_summary(extracted_content)
        
        # Initialize response
        response = {
            "message": "PDF processed successfully",
            "businessId": businessId,
            "document_id": documentId,
            "filename": file.filename,
            "content_type": file.content_type,
            "file_size": len(file_content),
            "document_summary": summary,
            "extracted_content": {
                "total_pages": extracted_content["total_pages"],
                "word_count": summary["word_count"],
                "char_count": summary["char_count"],
                "preview": summary["preview"]
            },
            "vector_storage": {
                "enabled": pinecone_service is not None,
                "chunks_created": 0,
                "chunks_stored": 0,
                "error": None
            }
        }
        
        # Process chunks and store in vector database if Pinecone is available
        if pinecone_service:
            try:
                # Create text chunks
                chunks = text_chunker.chunk_pdf_content(extracted_content, businessId, documentId)
                response["vector_storage"]["chunks_created"] = len(chunks)
                
                if chunks:
                    # Upsert chunks to Pinecone
                    upsert_result = pinecone_service.upsert_chunks(chunks)
                    response["vector_storage"]["chunks_stored"] = upsert_result.get("upserted_count", 0)
                    response["vector_storage"]["error"] = upsert_result.get("error")
                    
                    if not upsert_result["success"]:
                        logger.error(f"Failed to store chunks in Pinecone: {upsert_result.get('error')}")
                
            except Exception as e:
                logger.error(f"Error in vector storage processing: {str(e)}")
                response["vector_storage"]["error"] = str(e)
        else:
            response["vector_storage"]["error"] = "Pinecone service not available"
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing file {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/clear/{businessId}")
async def clear_business_data(businessId: str):
    """
    Clear all vectors for a specific business ID from Pinecone
    Useful for testing and development
    """
    try:
        if not pinecone_service:
            raise HTTPException(status_code=503, detail="Pinecone service not available")

        logger.info(f"Clearing all data for businessId: {businessId}")
        pinecone_service.index.delete(filter={"business_id": businessId})

        return {
            "message": f"Successfully cleared all data for businessId: {businessId}",
            "businessId": businessId
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error clearing data for businessId {businessId}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/document/{documentId}")
async def delete_document(documentId: str):
    """
    Delete all vectors for a specific document ID from Pinecone
    """
    try:
        if not pinecone_service:
            raise HTTPException(status_code=503, detail="Pinecone service not available")

        logger.info(f"Deleting document with documentId: {documentId}")
        pinecone_service.index.delete(filter={"document_id": documentId})

        return {
            "message": f"Successfully deleted document: {documentId}",
            "documentId": documentId
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document {documentId}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    pinecone_status = "disabled"
    if pinecone_service:
        try:
            stats = pinecone_service.get_index_stats()
            pinecone_status = "healthy" if stats.get("success") else "error"
        except:
            pinecone_status = "error"

    return {
        "status": "healthy",
        "services": {
            "pdf_processor": "healthy",
            "text_chunker": "healthy",
            "pinecone": pinecone_status,
            "openai": "healthy" if openai_client else "disabled"
        }
    }

@app.post("/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    """
    Query documents using RAG (Retrieval-Augmented Generation)
    
    Args:
        request: Query request containing query text, business ID, and optional parameters
        
    Returns:
        QueryResponse with answer and sources
    """
    try:
        # Validate services are available
        if not pinecone_service:
            raise HTTPException(status_code=503, detail="Pinecone service not available")
        
        if not openai_client:
            raise HTTPException(status_code=503, detail="OpenAI service not available")
        
        # Search for relevant chunks
        similar_chunks = pinecone_service.search_similar(
            query=request.query,
            business_id=request.businessId,
            top_k=request.max_chunks
        )
        
        # Debug logging
        logger.info(f"Query: '{request.query}' for businessId: '{request.businessId}'")
        logger.info(f"Found {len(similar_chunks)} similar chunks")
        
        if not similar_chunks:
            # Try searching without business_id filter to see if there are any documents at all
            all_chunks = pinecone_service.search_similar_no_filter(request.query, request.max_chunks)
            logger.info(f"Total chunks in index (no filter): {len(all_chunks)}")
            
            if all_chunks:
                business_ids = [chunk.get('business_id', 'unknown') for chunk in all_chunks]
                logger.info(f"Available business IDs: {set(business_ids)}")
                return QueryResponse(
                    query=request.query,
                    businessId=request.businessId,
                    answer=f"No documents found for business ID '{request.businessId}'. Available business IDs in the system: {list(set(business_ids))}",
                    sources=[],
                    chunks_used=0
                )
            else:
                return QueryResponse(
                    query=request.query,
                    businessId=request.businessId,
                    answer="No documents have been uploaded to the system yet. Please upload documents first using the /upload endpoint.",
                    sources=[],
                    chunks_used=0
                )
        
        # Prepare context from retrieved chunks
        context_parts = []
        sources = []
        
        for i, chunk in enumerate(similar_chunks):
            context_parts.append(f"[Document {i+1}]: {chunk['text']}")
            sources.append({
                "filename": chunk["filename"],
                "page_number": chunk["page_number"],
                "chunk_index": chunk["chunk_index"],
                "similarity_score": round(chunk["score"], 4)
            })
        
        context = "\n\n".join(context_parts)
        
        # Create prompt for GPT-4o-mini
        system_prompt = """You are a knowledgeable assistant who helps customers and team members find information from our company documents and resources.

        Your role:
        - Provide helpful, friendly responses using only the information in our documents
        - Speak as a member of our team who genuinely wants to help
        - Use "we," "our," and "us" when referring to the company
        - Cite our documents clearly (e.g., "According to our Product Guide..." or "Our Q3 Report shows...")
        - If you can't find the answer in our materials, say something like: "I don't see that information in the documents I have access to. Let me know if you'd like me to help you find someone who can assist with that."
        - Be conversational but professional, matching the tone of our company communications
        - When information is incomplete, offer what you can and suggest next steps: "Based on our documentation, I can tell you... For more detailed information, you might want to reach out to [relevant team/department]."

        Formatting requirements:
        - Format your response in well-structured markdown
        - Use headings (##, ###) to organize sections when appropriate
        - Use bullet points or numbered lists for clarity
        - Use **bold** for emphasis on key points
        - Use code blocks with ``` for any technical content, code snippets, or commands
        - Use > blockquotes for direct quotes from documents
        - Keep paragraphs concise and readable

        Remember: You're here to be genuinely helpful while representing our company well. If our documents have conflicting information, acknowledge it transparently and present both perspectives.
        """
        
        user_prompt = f"""Context from documents:
        {context}
        
        Question: {request.query}
        
        Please provide a comprehensive answer based on the context above."""
        
        # Get response from GPT-4o-mini
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1,
            max_tokens=1000
        )
        
        answer = response.choices[0].message.content
        
        logger.info(f"Successfully processed query for business {request.businessId}")
        
        return QueryResponse(
            query=request.query,
            businessId=request.businessId,
            answer=answer,
            sources=sources,
            chunks_used=len(similar_chunks)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 