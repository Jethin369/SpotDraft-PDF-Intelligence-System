import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, Search, LogOut, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');

  const fetchDocs = async () => {
    const res = await fetch(`http://localhost:8000/documents?user_id=${userId}`);
    const data = await res.json();
    setDocs(data || []);
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId); // <--- ADD THIS LINE

    try {
      const res = await fetch('http://localhost:8000/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        alert("Upload failed: " + err.detail);
      } else {
        fetchDocs();
      }
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = docs.filter(d => d.filename.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FileText className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">SpotDraft AI</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">Welcome, {userName}</span>
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="text-slate-500 hover:text-red-600 transition">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">My Documents</h2>
            <p className="text-slate-500 mt-1">Manage and analyze your PDFs with AI</p>
          </div>
          
          <label className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium cursor-pointer transition shadow-sm ${uploading ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'}`}>
            <Upload className="w-4 h-4" />
            {uploading ? 'Processing...' : 'Upload PDF'}
            <input type="file" accept="application/pdf" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search your documents..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white shadow-sm" 
          />
        </div>

        {/* Grid */}
        {filteredDocs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No documents found. Upload a PDF to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map(doc => (
              <div key={doc.id} onClick={() => navigate(`/view/${doc.id}`)} 
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 cursor-pointer transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg group-hover:bg-blue-100 transition">
                    <FileText className="text-blue-600 w-6 h-6" />
                  </div>
                  <span className="text-xs text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="font-semibold text-slate-800 mb-3 truncate">{doc.filename}</h3>
                <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{doc.summary}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}