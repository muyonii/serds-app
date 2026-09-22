import React from 'react';

interface LoginProps {
  onNavigate: (screen: 'signup' | 'main' | 'dispatcher' | 'responder' | 'admin') => void;
}

export default function Login({ onNavigate }: LoginProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-white px-6 py-12 relative overflow-y-auto font-sans">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto">
        <h1 className="text-5xl text-[#B41A46] mb-3 tracking-tighter font-bold">SERD.</h1>
        <p className="text-gray-500 text-sm mb-12 font-medium tracking-wide">Smart Emergency Response Dispatch</p>

        <div className="w-full space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:outline-none focus:bg-white focus:border-[#B41A46]/20 focus:ring-4 focus:ring-[#B41A46]/5 text-gray-900 transition-all font-medium placeholder:text-gray-400"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:outline-none focus:bg-white focus:border-[#B41A46]/20 focus:ring-4 focus:ring-[#B41A46]/5 text-gray-900 transition-all font-medium placeholder:text-gray-400"
          />
        </div>

        <button
          onClick={() => onNavigate('main')}
          className="w-full mt-8 bg-[#B41A46] text-white font-semibold py-4 rounded-2xl shadow-[0_8px_20px_rgb(180,26,70,0.25)] hover:shadow-[0_12px_25px_rgb(180,26,70,0.35)] hover:bg-[#9a143a] transition-all active:scale-[0.98]"
        >
          LOG IN
        </button>

        <p className="mt-6 text-sm text-gray-500">
          Don't have an account?{' '}
          <button onClick={() => onNavigate('signup')} className="text-[#B41A46] font-medium hover:underline">
            Sign up
          </button>
        </p>

        <div className="mt-8 pt-6 w-full text-center border-t border-gray-100">
          <p className="text-[10px] text-gray-400 mb-3 uppercase tracking-wider font-bold">Demo Account</p>
          <div className="flex flex-col gap-2">
            <button onClick={() => onNavigate('responder')} className="text-xs text-blue-700 bg-blue-50 px-3 py-2.5 rounded-xl font-semibold hover:bg-blue-100 transition-colors w-full text-center">Login as Responder (Mobile)</button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
