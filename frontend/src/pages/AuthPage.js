import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brain, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user && user !== false) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-body flex" data-testid="auth-page">
      {/* Left - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 max-w-xl mx-auto w-full">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-[#4B5563] hover:text-[#111827] mb-10 transition-colors self-start"
          data-testid="back-to-home"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>

        <div className="flex items-center gap-2.5 mb-8">
          <Brain className="w-8 h-8 text-[#0EA5E9]" strokeWidth={1.5} />
          <span className="font-heading font-semibold text-xl text-[#111827]">NeuroScan AI</span>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-8 bg-[#F3F4F6]">
            <TabsTrigger value="login" data-testid="login-tab">Sign In</TabsTrigger>
            <TabsTrigger value="register" data-testid="register-tab">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login"><LoginForm /></TabsContent>
          <TabsContent value="register"><RegisterForm /></TabsContent>
        </Tabs>
      </div>

      {/* Right - Branding */}
      <div className="hidden lg:flex flex-1 bg-[#0EA5E9]/5 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#0EA5E9]/10 flex items-center justify-center mx-auto mb-8">
            <Brain className="w-10 h-10 text-[#0EA5E9]" strokeWidth={1.5} />
          </div>
          <h2 className="font-heading text-2xl font-medium text-[#111827] mb-3">Precision Stroke Detection</h2>
          <p className="text-[#4B5563] leading-relaxed">
            Upload MRI scans and get instant AI-powered analysis with detailed classification and medical reports.
          </p>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
      <h2 className="font-heading text-xl font-medium text-[#111827] mb-1">Welcome back</h2>
      <p className="text-sm text-[#9CA3AF] mb-4">Sign in to your account to continue.</p>

      {error && <div className="text-sm text-[#E11D48] bg-red-50 p-3 rounded-lg" data-testid="login-error">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-[#111827]">Email</Label>
        <Input
          id="login-email"
          data-testid="login-email-input"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="border-[#E5E7EB] focus:ring-[#93C5FD] focus:border-[#0EA5E9]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password" className="text-[#111827]">Password</Label>
        <Input
          id="login-password"
          data-testid="login-password-input"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="border-[#E5E7EB] focus:ring-[#93C5FD] focus:border-[#0EA5E9]"
        />
      </div>
      <Button
        type="submit"
        data-testid="login-submit-btn"
        disabled={loading}
        className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-lg py-2.5"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}

function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="register-form">
      <h2 className="font-heading text-xl font-medium text-[#111827] mb-1">Create account</h2>
      <p className="text-sm text-[#9CA3AF] mb-4">Sign up to start analyzing MRI scans.</p>

      {error && <div className="text-sm text-[#E11D48] bg-red-50 p-3 rounded-lg" data-testid="register-error">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="reg-name" className="text-[#111827]">Full Name</Label>
        <Input
          id="reg-name"
          data-testid="register-name-input"
          placeholder="Dr. Jane Smith"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="border-[#E5E7EB] focus:ring-[#93C5FD] focus:border-[#0EA5E9]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-email" className="text-[#111827]">Email</Label>
        <Input
          id="reg-email"
          data-testid="register-email-input"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="border-[#E5E7EB] focus:ring-[#93C5FD] focus:border-[#0EA5E9]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password" className="text-[#111827]">Password</Label>
        <Input
          id="reg-password"
          data-testid="register-password-input"
          type="password"
          placeholder="Min. 6 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="border-[#E5E7EB] focus:ring-[#93C5FD] focus:border-[#0EA5E9]"
        />
      </div>
      <Button
        type="submit"
        data-testid="register-submit-btn"
        disabled={loading}
        className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-lg py-2.5"
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );
}
