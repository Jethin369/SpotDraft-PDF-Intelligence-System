from pypdf import PdfReader
import io
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Body,Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
import uuid


from config import GEMINI_API_KEY, SUPABASE_URL, SUPABASE_KEY
from supabase_client import supabase,supabase_admin
from typing import Optional, List
from datetime import datetime
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from Vercel and anywhere else
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from google import genai

client = genai.Client(api_key=GEMINI_API_KEY)

# Pydantic Models
class UserSignup(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class CommentCreate(BaseModel):
    document_id: str
    user_name: str
    content: str
    user_id: Optional[str] = None

class ChatMessage(BaseModel):
    document_id: str
    message: str
    history: List[str] = []

# Auth Routes
from datetime import datetime, timezone

@app.post("/auth/signup")
async def signup(user: UserSignup):
    try:
        # Step 1: Check if user already exists by attempting passwordless sign-in
        try:
            # This will fail if user doesn't exist, succeed if they do
            check_response = supabase.auth.sign_in_with_otp({
                "email": user.email
            })
            
            # If we get here without error, user exists
            raise HTTPException(status_code=400, detail="This email is already registered. Please login instead.")
            
        except Exception as check_error:
            # Check the error - if it's not "user not found", something else is wrong
            error_msg = str(check_error).lower()
            if "user not found" not in error_msg and "user could not be found" not in error_msg:
                # User exists - show error
                raise HTTPException(status_code=400, detail="This email is already registered. Please login instead.")
            # If "user not found", continue with signup
        
        # Step 2: User doesn't exist, create new account
        response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password,
            "options": {"data": {"name": user.name}}
        })
        
        return {"user": response.user, "message": "Signup successful"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
async def login(user: UserLogin):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
        return {"user": response.user, "session": response.session, "message": "Login successful"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/logout")
async def logout():
    supabase.auth.sign_out()
    return {"message": "Logged out"}

# PDF Upload & Summary
@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...), user_id: str = Form(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    try:
        # Read file
        file_content = await file.read()
        
        # Extract text
        pdf_reader = PdfReader(io.BytesIO(file_content)) # <--- MUST BE file_content
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() or ""
        
        # Generate summary with Gemini
        summary_prompt = f"""You are an expert document analyst. Analyze the following text extracted from a PDF document.

Provide a highly specific, 3-5 sentence summary that strictly includes:
1. The core purpose and nature of the document (e.g., is it a contract, a report, a manual?).
2. The key entities involved (e.g., parties in an agreement, author/subject of a report).
3. The most critical obligations, dates, financial figures, or conclusions.

Do NOT use generic phrases like "This document is about..." or "The text discusses...". Be direct and factual.

Document Text:
{text[:15000]}
"""
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=summary_prompt
        )
        summary = response.text
        
        # Upload to Supabase Storage
        file_id = str(uuid.uuid4())
        file_path = f"{file_id}/{file.filename}"
        
        supabase_admin.storage.from_("documents").upload(
            file_path, 
            file_content,
            {"content-type": "application/pdf"}
        )
        
        # Save to database
        doc_data = {
            "id": file_id,
            "filename": file.filename,
            "file_path": file_path,
            "summary": summary,
            "user_id": user_id  # <--- USE THE PASSED USER 
        }
        
        supabase_admin.table("documents").insert(doc_data).execute()
        
        return {
            "id": file_id,
            "filename": file.filename,
            "summary": summary,
            "message": "PDF uploaded and summarized successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get User Documents
@app.get("/documents")
async def get_documents(user_id: str):
    try:
        response = (
            supabase_admin
            .table("documents")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get Single Document
@app.get("/documents/{doc_id}")
async def get_document(doc_id: str):
    try:
        response = (
            supabase_admin
            .table("documents")
            .select("*")
            .eq("id", doc_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# AI Chat
@app.post("/chat")
async def chat_with_pdf(chat: ChatMessage):
    try:
        # Get document
        doc_response = (
            supabase_admin
            .table("documents")
            .select("*")
            .eq("id", chat.document_id)
            .execute()
        )

        if not doc_response.data:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )

        doc = doc_response.data[0]

        # Download PDF from the SAME bucket used during upload
        pdf_data = (
            supabase_admin
            .storage
            .from_("documents")
            .download(doc["file_path"])
        )

        # Extract text
        pdf_reader = PdfReader(io.BytesIO(pdf_data)) # <--- MUST BE pdf_data
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() or ""
        # Conversation history
        history_context = "\n".join(
            chat.history[-5:]
        ) if chat.history else ""

        prompt = f"""You are a precise document assistant. Your task is to answer the user's question based ONLY on the provided document content.

Rules:
1. Answer ONLY using facts found in the 'Document content' below.
2. If the answer is not explicitly in the text, you MUST reply: "I cannot find that information in the provided document." Do not guess or use outside knowledge.
3. Keep your answer concise and direct.

Document content:
{text[:50000]}

Previous conversation:
{history_context}

User's question: {chat.message}

Your Answer:"""
        
        # Gemini
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=prompt
        )

        return {
            "response": response.text,
            "document_id": chat.document_id
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# Comments      
@app.post("/comments")
async def create_comment(comment: CommentCreate):
    try:
        data = {
            "document_id": comment.document_id,
            "user_name": comment.user_name or "Anonymous",
            "content": comment.content,
            "user_id": comment.user_id
        }
        response = supabase.table("comments").insert(data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/comments/{doc_id}")
async def get_comments(doc_id: str):
    try:
        response = supabase.table("comments").select("*").eq("document_id", doc_id).order("created_at", desc=False).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Share Link
@app.post("/share/{doc_id}")
async def create_share_link(doc_id: str):
    try:
        # Check if share link already exists
        existing = supabase_admin.table("shared_links").select("*").eq("document_id", doc_id).execute()
        if existing.data:
            return {"link_id": existing.data[0]["id"], "message": "Link already exists"}
        
        # Create new share link
        data = {"document_id": doc_id}
        response = supabase_admin.table("shared_links").insert(data).execute()
        return {"link_id": response.data[0]["id"], "message": "Share link created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/share/{link_id}")
async def get_shared_document(link_id: str):
    try:
        # CRITICAL FIX: Use supabase_admin to bypass RLS for unauthenticated users
        link_response = supabase_admin.table("shared_links").select("*").eq("id", link_id).execute()
        if not link_response.data:
            raise HTTPException(status_code=404, detail="Share link not found")
        
        # Get document using admin client
        doc_id = link_response.data[0]["document_id"]
        doc_response = supabase_admin.table("documents").select("*").eq("id", doc_id).execute()
        if not doc_response.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return doc_response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)