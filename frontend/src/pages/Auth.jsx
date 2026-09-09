import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Sparkles, Shield, Zap, CheckCircle } from 'lucide-react';

export default function Auth() {
  console.log("THIS IS VERSION 3");
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const timestamp = Date.now();
    const endpoint = isLogin 
      ? `https://spotdraft-pdf-v3.onrender.com/auth/login?t=${timestamp}` 
      : `https://spotdraft-pdf-v3.onrender.com/auth/signup?t=${timestamp}`;
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail);
      
      if (isLogin) {
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userName', data.user.user_metadata?.name || formData.name);
        navigate('/dashboard');
      } else {
        if (data.user && data.user.email_confirmed_at) {
           localStorage.setItem('userId', data.user.id);
           navigate('/dashboard');
        } else {
           setError('✅ Account created! Please check your email to confirm your account.');
           setIsLogin(true);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <FileText className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-bold">SpotDraft AI</h1>
          </div>
          
          <h2 className="text-3xl font-bold mb-6 leading-tight">
            Transform Your PDFs with AI Intelligence
          </h2>
          
          <p className="text-blue-100 text-lg mb-8 leading-relaxed">
            Upload, summarize, and chat with your documents using the power of Google Gemini AI.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-yellow-300 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">AI-Powered Summaries</h3>
                <p className="text-blue-100 text-sm">Get instant, intelligent summaries of your documents</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Zap className="w-6 h-6 text-yellow-300 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Lightning Fast</h3>
                <p className="text-blue-100 text-sm">Process and analyze PDFs in seconds</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-yellow-300 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Secure & Private</h3>
                <p className="text-blue-100 text-sm">Your documents are encrypted and protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="bg-blue-600 p-2 rounded-xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">SpotDraft AI</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">
                {isLogin ? 'Welcome Back!' : 'Create Account'}
              </h2>
              <p className="text-slate-500">
                {isLogin ? 'Sign in to access your documents' : 'Start analyzing your PDFs with AI'}
              </p>
            </div>

            {error && (
              <div className={`mb-6 p-4 rounded-lg ${error.includes('✅') || error.includes('created') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    required 
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-slate-50 hover:bg-white"
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input 
                  type="email" 
                  placeholder="you@example.com" 
                  required 
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-slate-50 hover:bg-white"
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-slate-50 hover:bg-white"
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                />
                {isLogin && (
                  <p className="mt-2 text-xs text-slate-500 text-right cursor-pointer hover:text-blue-600">
                    Forgot password?
                  </p>
                )}
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm font-medium text-slate-700">Google</span>
                </button>
                
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="text-sm font-medium text-slate-700">GitHub</span>
                </button>
              </div>
            </div>

            <p className="text-center mt-8 text-slate-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }} 
                className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          <p className="text-center mt-6 text-slate-500 text-sm">
            By continuing, you agree to our{' '}
            <button className="text-blue-600 hover:underline">Terms of Service</button>
            {' '}and{' '}
            <button className="text-blue-600 hover:underline">Privacy Policy</button>
          </p>
        </div>
      </div>
    </div>
  );
}