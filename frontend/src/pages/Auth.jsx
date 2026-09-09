import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  console.log("THIS IS VERSION 3");
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const timestamp = Date.now();
    const endpoint = isLogin ? 'https://spotdraft-pdf-v3.onrender.com/auth/login' : 'https://spotdraft-pdf-v3.onrender.com/auth/signup';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail);
      
      // --- NEW LOGIC HERE ---
      if (isLogin) {
        // If Logging In: Supabase handles the "Email not confirmed" error automatically.
        // If we reach here, login was successful.
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userName', data.user.user_metadata?.name || formData.name);
        navigate('/dashboard');
      } else {
        // If Signing Up: Check if email is confirmed
        if (data.user && data.user.email_confirmed_at) {
           // Email already confirmed (rare, but possible)
           localStorage.setItem('userId', data.user.id);
           navigate('/dashboard');
        } else {
           // Email NOT confirmed. Stop here.
           setError('Account created! Please check your email to confirm your account before logging in.');
           setIsLogin(true); // Switch to login view so they can log in after confirming
        }
      }
      // ------------------------

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">{isLogin ? 'Login' : 'Sign Up'}</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input type="text" placeholder="Full Name" required 
              className="w-full p-2 border rounded"
              onChange={e => setFormData({...formData, name: e.target.value})} />
          )}
          <input type="email" placeholder="Email" required 
            className="w-full p-2 border rounded"
            onChange={e => setFormData({...formData, email: e.target.value})} />
          <input type="password" placeholder="Password" required 
            className="w-full p-2 border rounded"
            onChange={e => setFormData({...formData, password: e.target.value})} />
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-600 cursor-pointer" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
}