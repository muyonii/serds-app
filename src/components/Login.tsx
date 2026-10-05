import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Loader2 } from 'lucide-react';

interface LoginProps {
  onNavigate: (screen: 'signup' | 'main' | 'dispatcher' | 'responder' | 'admin') => void;
}

export default function Login({ onNavigate }: LoginProps) {
  const { login, loginAsGuestDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      onNavigate('main');
    } else {
      setError(result.error || 'Failed to sign in.');
    }
  };

  const handleDemoLogin = async (role: 'citizen' | 'responder' | 'dispatcher' | 'admin' = 'citizen') => {
    setLoading(true);
    await loginAsGuestDemo(role);
    setLoading(false);
    if (role === 'responder') {
      onNavigate('responder');
    } else if (role === 'dispatcher') {
      onNavigate('dispatcher');
    } else if (role === 'admin') {
      onNavigate('admin');
    } else {
      onNavigate('main');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-white px-6 py-12 relative overflow-y-auto font-sans">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto">
        <h1 className="text-5xl text-[#B41A46] mb-3 tracking-tighter font-bold">SERD.</h1>
        <p className="text-gray-500 text-sm mb-8 font-medium tracking-wide">Smart Emergency Response Dispatch</p>

        {error && (
          <div className="w-full mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:bg-white focus:border-[#B41A46]/20 focus:ring-4 focus:ring-[#B41A46]/5 text-gray-900 transition-all font-medium placeholder:text-gray-400"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:bg-white focus:border-[#B41A46]/20 focus:ring-4 focus:ring-[#B41A46]/5 text-gray-900 transition-all font-medium placeholder:text-gray-400"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-[#B41A46] text-white font-semibold py-4 rounded-2xl shadow-[0_8px_20px_rgb(180,26,70,0.25)] hover:shadow-[0_12px_25px_rgb(180,26,70,0.35)] hover:bg-[#9a143a] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'LOG IN WITH FIREBASE'}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-500">
          Don't have an account?{' '}
          <button onClick={() => onNavigate('signup')} className="text-[#B41A46] font-medium hover:underline cursor-pointer">
            Sign up
          </button>
        </p>

        <div className="mt-8 pt-6 w-full text-center border-t border-gray-100">
          <p className="text-[10px] text-gray-400 mb-3 uppercase tracking-wider font-bold">Quick Demo Access (Firebase Guest)</p>
          <div className="flex flex-col gap-2">
            <button 
              type="button"
              onClick={() => handleDemoLogin('citizen')} 
              className="text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-2.5 rounded-xl font-semibold transition-colors w-full text-center cursor-pointer"
            >
              Continue as Citizen (Demo)
            </button>
            <button 
              type="button"
              onClick={() => handleDemoLogin('responder')} 
              className="text-xs text-blue-700 bg-blue-50 px-3 py-2.5 rounded-xl font-semibold hover:bg-blue-100 transition-colors w-full text-center cursor-pointer"
            >
              Login as Responder (Mobile)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
