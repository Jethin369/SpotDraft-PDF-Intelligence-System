# SpotDraft AI - Intelligent PDF Document Management System

## 🌐 Live Application

- **Frontend:** https://spotdraftai.vercel.app
- **Backend API:** https://spotdraft-pdf-v3.onrender.com/docs

## 📋 Project Overview

SpotDraft AI is an intelligent PDF document management system that leverages AI to provide automated summarization, interactive chat, and collaborative features for PDF documents.

## 🚀 Key Features

✅ **User Authentication** - Secure signup/login with email confirmation via Supabase  
✅ **PDF Upload** - Upload PDFs with automatic AI-powered summarization  
✅ **AI Chat** - Chat with your documents using Google Gemini AI  
✅ **Comments** - Collaborate with team members via comments  
✅ **Share Links** - Generate public share links for documents  
✅ **Responsive UI** - Clean, modern interface built with Tailwind CSS  
✅ **Production Ready** - Deployed on Vercel (frontend) and Render (backend)

## 🛠️ Technology Stack

**Frontend:**
- React 18 with Vite
- React Router for navigation
- Tailwind CSS for styling
- Lucide Icons
- Deployment: Vercel

**Backend:**
- FastAPI (Python 3.11)
- PyPDF for PDF text extraction
- Google Gemini 1.5 Flash for AI features
- Supabase (Auth, PostgreSQL Database, Storage)
- Docker for containerization
- Deployment: Render

## 📦 Local Development Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase account (free tier)
- Google Gemini API key

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload