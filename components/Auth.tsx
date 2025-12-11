import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/dataService';
import { Button } from './Button';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const user = await authService.login(email, password);
        if (user) {
          onLogin(user);
        } else {
          setError('Invalid email or password');
        }
      } else {
        const user = await authService.signup(name, email, password, role);
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-800">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-slate-500 mt-2">Access HealthVoice AI Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">I am a:</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${role === 'patient' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="role" className="hidden" checked={role === 'patient'} onChange={() => setRole('patient')} />
                  <span className="font-medium">Patient</span>
                </label>
                <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${role === 'doctor' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="role" className="hidden" checked={role === 'doctor'} onChange={() => setRole('doctor')} />
                  <span className="font-medium">Doctor</span>
                </label>
              </div>
            </div>
          )}

          {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

          <Button type="submit" isLoading={isLoading} className="w-full py-3 mt-4 text-lg">
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-600 text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-teal-600 font-semibold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
      
      {/* Demo Credentials Hint */}
      {isLogin && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg text-xs text-slate-500 border border-slate-200 max-w-xs">
          <p className="font-bold mb-1">Demo Credentials:</p>
          <div className="grid grid-cols-2 gap-2">
            <div>Patient:</div>
            <div>patient@demo.com / 123</div>
            <div>Doctor:</div>
            <div>doctor@demo.com / 123</div>
          </div>
        </div>
      )}
    </div>
  );
};