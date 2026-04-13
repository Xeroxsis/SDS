import { useNavigate } from 'react-router-dom';
import { Brain, Upload, BarChart3, FileText, ArrowRight, Shield, Zap, Activity } from 'lucide-react';
import { Button } from '../components/ui/button';

const features = [
  {
    icon: Brain,
    title: 'ML-Powered Detection',
    desc: 'Advanced computer vision algorithms analyze MRI scans using feature extraction, asymmetry detection, and intensity analysis.',
  },
  {
    icon: BarChart3,
    title: 'Stroke Classification',
    desc: 'Classifies between Hemorrhagic Stroke, Ischemic Stroke, and Normal brain tissue with detailed confidence scores.',
  },
  {
    icon: FileText,
    title: 'PDF Reports',
    desc: 'Generate comprehensive medical reports with classification results, probability breakdowns, and treatment information.',
  },
];

const steps = [
  { num: '01', icon: Upload, title: 'Upload MRI', desc: 'Drag and drop or select your brain MRI scan image.' },
  { num: '02', icon: Zap, title: 'AI Analysis', desc: 'Our ML model extracts features and classifies the scan in seconds.' },
  { num: '03', icon: FileText, title: 'Get Report', desc: 'View results with detailed info and download a PDF report.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-body" data-testid="landing-page">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-[#E5E7EB]/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Brain className="w-7 h-7 text-[#0EA5E9]" strokeWidth={1.5} />
            <span className="font-heading font-semibold text-lg text-[#111827]">NeuroScan AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              data-testid="login-nav-btn"
              variant="ghost"
              onClick={() => navigate('/auth')}
              className="text-[#4B5563] hover:text-[#111827]"
            >
              Sign In
            </Button>
            <Button
              data-testid="get-started-btn"
              onClick={() => navigate('/auth?tab=register')}
              className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-lg px-5"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 lg:py-32">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0EA5E9]/10 text-[#0EA5E9] text-xs font-bold uppercase tracking-[0.15em] mb-6">
                <Activity className="w-3.5 h-3.5" strokeWidth={2} />
                AI-Powered Screening
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight font-light text-[#111827] mb-6 leading-[1.1]">
                Precision<br />
                <span className="font-medium">Stroke Detection</span>
              </h1>
              <p className="text-base md:text-lg text-[#4B5563] leading-relaxed mb-8 max-w-lg">
                Upload brain MRI scans and receive instant ML-powered analysis. Detect and classify strokes with detailed medical reports.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  data-testid="hero-cta-btn"
                  onClick={() => navigate('/auth?tab=register')}
                  className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-lg px-6 py-2.5 text-base gap-2"
                >
                  Start Analysis <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  data-testid="hero-learn-more-btn"
                  variant="outline"
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6] rounded-lg px-6 py-2.5 text-base"
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="md:col-span-6 lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-[#0EA5E9]/10 border border-[#E5E7EB]">
                <img
                  src="https://images.unsplash.com/photo-1758691463165-ca9b5bc2b28a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHwxfHxicmFpbiUyMG1yaSUyMHNjYW58ZW58MHx8fHwxNzc2MDYzMjk5fDA&ixlib=rb-4.1.0&q=85"
                  alt="Brain MRI scan analysis"
                  className="w-full h-auto object-cover aspect-[4/3]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#9CA3AF] mb-3">Capabilities</p>
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-[#111827]">
              Advanced MRI Analysis
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border border-[#E5E7EB] bg-white hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-[#0EA5E9]/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-[#0EA5E9]" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-lg font-medium text-[#111827] mb-2">{f.title}</h3>
                <p className="text-sm text-[#4B5563] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-[#FAFAFA]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#9CA3AF] mb-3">Process</p>
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium text-[#111827]">
              How It Works
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center mx-auto mb-5">
                  <s.icon className="w-6 h-6 text-[#0EA5E9]" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-bold text-[#0EA5E9] tracking-[0.15em] uppercase">Step {s.num}</span>
                <h3 className="font-heading text-lg font-medium text-[#111827] mt-2 mb-2">{s.title}</h3>
                <p className="text-sm text-[#4B5563] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Shield className="w-10 h-10 text-[#0EA5E9] mx-auto mb-5" strokeWidth={1.5} />
          <h2 className="font-heading text-2xl sm:text-3xl font-medium text-[#111827] mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-[#4B5563] mb-8 max-w-md mx-auto">
            Create your account and start analyzing MRI scans with our ML-powered detection system.
          </p>
          <Button
            data-testid="cta-btn"
            onClick={() => navigate('/auth?tab=register')}
            className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-lg px-8 py-3 text-base gap-2"
          >
            Create Account <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FAFAFA] border-t border-[#E5E7EB] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#0EA5E9]" strokeWidth={1.5} />
            <span className="font-heading font-medium text-sm text-[#111827]">NeuroScan AI</span>
          </div>
          <p className="text-xs text-[#9CA3AF]">
            For research and educational purposes only. Not a substitute for medical diagnosis.
          </p>
        </div>
      </footer>
    </div>
  );
}
