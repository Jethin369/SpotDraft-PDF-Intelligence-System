import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Share2, MessageSquare, Bot, Sparkles, ArrowLeft } from 'lucide-react';

export default function Viewer() {
  const { docId, linkId } = useParams();
  const navigate = useNavigate();
  
  const [doc, setDoc] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState('');

  const isShared = !!linkId;
  const currentId = docId || linkId;
  const userName = localStorage.getItem('userName') || 'Anonymous';
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');
        
        // Fetch document
        const endpoint = isShared 
          ? `http://localhost:8000/share/${linkId}` 
          : `http://localhost:8000/documents/${docId}`;
        
        const docRes = await fetch(endpoint);
        if (!docRes.ok) {
          throw new Error('Failed to load document');
        }
        const docData = await docRes.json();
        setDoc(docData);
        
        // Build PDF URL - using your Supabase project
        const pdfUrl = `https://cthkxfzhraitzmrzjbmx.supabase.co/storage/v1/object/public/documents/${docData.file_path}`;
        setPdfUrl(pdfUrl);
        
        // Fetch comments
        const commentsRes = await fetch(`http://localhost:8000/comments/${currentId}`);
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setComments(commentsData || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      }
    };

    if (currentId) {
      fetchData();
    }
  }, [currentId, docId, linkId, isShared]);

  const handleComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      await fetch('http://localhost:8000/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          document_id: currentId, 
          user_name: userName, 
          content: newComment, 
          user_id: userId 
        })
      });
      setNewComment('');
      
      // Refresh comments
      const res = await fetch(`http://localhost:8000/comments/${currentId}`);
      if (res.ok) {
        setComments(await res.json());
      }
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    
    setLoadingChat(true);
    const userMsg = { role: 'user', content: chatInput };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatInput('');

    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          document_id: currentId, 
          message: chatInput, 
          history: newHistory.map(m => `${m.role}: ${m.content}`) 
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setChatHistory([...newHistory, { role: 'ai', content: data.response }]);
      } else {
        setChatHistory([...newHistory, { role: 'ai', content: 'Sorry, I encountered an error.' }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleShare = async () => {
    try {
      const res = await fetch(`http://localhost:8000/share/${docId}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const link = `${window.location.origin}/shared/${data.link_id}`;
        navigator.clipboard.writeText(link);
        alert('Share link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share error:', err);
      alert('Failed to create share link');
    }
  };

  // Loading state
  if (!doc) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading document...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="bg-blue-600 p-2 rounded-lg">
            <FileText className="text-white w-5 h-5" />
          </div>
          <h1 className="font-bold text-lg text-slate-800 truncate max-w-xl">{doc.filename}</h1>
        </div>
        <div className="flex gap-2">
          {!isShared && (
            <button 
              onClick={handleShare} 
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          )}
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100 px-6 py-4">
        <div className="flex items-start gap-3 max-w-6xl mx-auto">
          <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="font-semibold text-slate-800 mb-1">AI Summary</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{doc.summary}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer */}
        <div className="flex-1 bg-slate-200">
          <iframe 
            src={pdfUrl} 
            className="w-full h-full border-none" 
            title="PDF Viewer"
          />
        </div>

        {/* Sidebars */}
        <div className="w-[450px] flex flex-col border-l border-slate-200 bg-white shadow-xl">
          {/* Comments */}
          <div className="flex-1 flex flex-col border-b border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments ({comments.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {comments.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">No comments yet</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs font-semibold text-slate-600 mb-1">{c.user_name}</p>
                    <p className="text-sm text-slate-700">{c.content}</p>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <div className="flex gap-2">
                <input 
                  value={newComment} 
                  onChange={e => setNewComment(e.target.value)} 
                  placeholder="Add a comment..." 
                  className="flex-1 border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                />
                <button 
                  onClick={handleComment} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* AI Chat */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Bot className="w-4 h-4" />
                AI Chat
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatHistory.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">Ask anything about this document</p>
              ) : (
                chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-slate-100 text-slate-800 rounded-bl-none'
                    }`}>
                      <p className="text-xs font-semibold mb-1 opacity-75">{msg.role === 'user' ? 'You' : 'AI'}</p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {loadingChat && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 p-3 rounded-lg rounded-bl-none">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <div className="flex gap-2">
                <input 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleChat()} 
                  placeholder="Ask about this PDF..." 
                  className="flex-1 border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" 
                />
                <button 
                  onClick={handleChat} 
                  disabled={loadingChat}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg transition"
                >
                  Ask
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}