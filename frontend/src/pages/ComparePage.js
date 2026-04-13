import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, GitCompareArrows, ArrowRight, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const classConfig = {
  hemorrhagic: { label: 'Hemorrhagic', color: '#E11D48', bg: 'bg-[#E11D48]/10 text-[#E11D48]' },
  ischemic: { label: 'Ischemic', color: '#F59E0B', bg: 'bg-[#F59E0B]/10 text-[#F59E0B]' },
  normal: { label: 'Normal', color: '#10B981', bg: 'bg-[#10B981]/10 text-[#10B981]' },
};

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [scanA, setScanA] = useState(searchParams.get('a') || '');
  const [scanB, setScanB] = useState(searchParams.get('b') || '');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingScans, setLoadingScans] = useState(true);

  useEffect(() => {
    api.get('/scans').then(r => setScans(r.data)).catch(() => {}).finally(() => setLoadingScans(false));
  }, []);

  useEffect(() => {
    if (scanA && scanB && scanA !== scanB) {
      setLoading(true);
      api.get(`/scans/compare/${scanA}/${scanB}`)
        .then(r => setComparison(r.data))
        .catch(() => setComparison(null))
        .finally(() => setLoading(false));
    } else {
      setComparison(null);
    }
  }, [scanA, scanB]);

  const clsA = comparison ? classConfig[comparison.scan_a.classification] || classConfig.normal : null;
  const clsB = comparison ? classConfig[comparison.scan_b.classification] || classConfig.normal : null;

  const probChartData = comparison ? [
    {
      name: 'Hemorrhagic',
      'Scan A': parseFloat(((comparison.scan_a.probabilities?.hemorrhagic || 0) * 100).toFixed(1)),
      'Scan B': parseFloat(((comparison.scan_b.probabilities?.hemorrhagic || 0) * 100).toFixed(1)),
    },
    {
      name: 'Ischemic',
      'Scan A': parseFloat(((comparison.scan_a.probabilities?.ischemic || 0) * 100).toFixed(1)),
      'Scan B': parseFloat(((comparison.scan_b.probabilities?.ischemic || 0) * 100).toFixed(1)),
    },
    {
      name: 'Normal',
      'Scan A': parseFloat(((comparison.scan_a.probabilities?.normal || 0) * 100).toFixed(1)),
      'Scan B': parseFloat(((comparison.scan_b.probabilities?.normal || 0) * 100).toFixed(1)),
    },
  ] : [];

  return (
    <DashboardLayout>
      <div data-testid="compare-page" className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-[#F3F4F6]" data-testid="back-btn">
            <ArrowLeft className="w-5 h-5 text-[#4B5563]" />
          </button>
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-medium text-[#111827]">Scan Comparison</h1>
            <p className="text-sm text-[#9CA3AF] mt-0.5">Side-by-side analysis of two MRI/CT scans</p>
          </div>
        </div>

        {/* Scan Selectors */}
        <Card className="border border-[#E5E7EB] shadow-none">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#9CA3AF] mb-2">Scan A</p>
                <Select value={scanA} onValueChange={setScanA}>
                  <SelectTrigger data-testid="select-scan-a" className="border-[#E5E7EB]">
                    <SelectValue placeholder="Select first scan" />
                  </SelectTrigger>
                  <SelectContent>
                    {scans.filter(s => s.id !== scanB).map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.patient_name || s.filename} — {s.classification} ({(s.confidence * 100).toFixed(0)}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="hidden md:flex items-center justify-center pb-1">
                <GitCompareArrows className="w-5 h-5 text-[#9CA3AF]" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#9CA3AF] mb-2">Scan B</p>
                <Select value={scanB} onValueChange={setScanB}>
                  <SelectTrigger data-testid="select-scan-b" className="border-[#E5E7EB]">
                    <SelectValue placeholder="Select second scan" />
                  </SelectTrigger>
                  <SelectContent>
                    {scans.filter(s => s.id !== scanA).map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.patient_name || s.filename} — {s.classification} ({(s.confidence * 100).toFixed(0)}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loadingScans && <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#0EA5E9] mx-auto" /></div>}

        {!scanA || !scanB ? (
          <div className="text-center py-16 text-[#9CA3AF]">
            <GitCompareArrows className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">Select two scans above to compare them side-by-side</p>
          </div>
        ) : loading ? (
          <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9] mx-auto" /></div>
        ) : comparison ? (
          <>
            {/* Side-by-Side Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ScanPanel scan={comparison.scan_a} label="Scan A" cls={clsA} />
              <ScanPanel scan={comparison.scan_b} label="Scan B" cls={clsB} />
            </div>

            {/* Match Indicator */}
            <div className={`p-4 rounded-xl text-center text-sm font-medium ${comparison.classification_match
              ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#F59E0B]/10 text-[#92400E]'}`}>
              {comparison.classification_match
                ? 'Both scans have the same classification'
                : `Different classifications: ${clsA?.label || '?'} vs ${clsB?.label || '?'}`}
            </div>

            {/* Probability Comparison Chart */}
            <Card className="border border-[#E5E7EB] shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg font-medium text-[#111827]">Probability Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={probChartData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4B5563' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} unit="%" />
                      <Tooltip formatter={v => `${v}%`} />
                      <Bar dataKey="Scan A" fill="#0EA5E9" radius={[4, 4, 0, 0]} barSize={32} />
                      <Bar dataKey="Scan B" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-3">
                  <div className="flex items-center gap-2 text-xs text-[#4B5563]">
                    <div className="w-3 h-3 rounded bg-[#0EA5E9]" /> Scan A
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#4B5563]">
                    <div className="w-3 h-3 rounded bg-[#F59E0B]" /> Scan B
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Deltas */}
            {comparison.feature_deltas && Object.keys(comparison.feature_deltas).length > 0 && (
              <Card className="border border-[#E5E7EB] shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-lg font-medium text-[#111827]">Feature Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(comparison.feature_deltas).map(([key, d]) => {
                      const delta = d.delta;
                      const pctChange = d.scan_a !== 0 ? ((delta / Math.abs(d.scan_a)) * 100) : 0;
                      const isUp = delta > 0.001;
                      const isDown = delta < -0.001;
                      return (
                        <div key={key} className="p-3 rounded-lg bg-[#F3F4F6] flex items-center justify-between">
                          <div>
                            <p className="text-xs text-[#9CA3AF] capitalize">{key.replace(/_/g, ' ')}</p>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span className="text-sm font-medium text-[#111827]">{typeof d.scan_a === 'number' ? d.scan_a.toFixed(3) : d.scan_a}</span>
                              <ArrowRight className="w-3 h-3 text-[#9CA3AF]" />
                              <span className="text-sm font-medium text-[#111827]">{typeof d.scan_b === 'number' ? d.scan_b.toFixed(3) : d.scan_b}</span>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1 text-xs font-medium ${isUp ? 'text-[#E11D48]' : isDown ? 'text-[#10B981]' : 'text-[#9CA3AF]'}`}>
                            {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {Math.abs(pctChange).toFixed(0)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

function ScanPanel({ scan, label, cls }) {
  return (
    <Card className="border border-[#E5E7EB] shadow-none overflow-hidden">
      <div className="p-3 bg-[#F3F4F6] flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.15em] font-bold text-[#9CA3AF]">{label}</span>
        <Badge className={`${cls?.bg || ''} border-0 text-xs`}>{cls?.label || scan.classification}</Badge>
      </div>
      {scan.image_data ? (
        <div className="bg-[#111827] flex items-center justify-center">
          <img
            src={`data:${scan.content_type || 'image/png'};base64,${scan.image_data}`}
            alt={label}
            data-testid={`compare-image-${label.toLowerCase().replace(' ', '-')}`}
            className="max-h-[300px] object-contain"
          />
        </div>
      ) : (
        <div className="h-48 bg-[#F3F4F6] flex items-center justify-center text-[#9CA3AF] text-sm">No image</div>
      )}
      <CardContent className="p-4 space-y-2">
        <p className="text-sm font-medium text-[#111827] truncate">{scan.patient_name || scan.filename}</p>
        <div className="flex justify-between text-xs text-[#4B5563]">
          <span>Confidence</span>
          <span className="font-medium">{(scan.confidence * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${scan.confidence * 100}%`, backgroundColor: cls?.color || '#9CA3AF' }} />
        </div>
        <p className="text-xs text-[#9CA3AF]">{scan.created_at ? new Date(scan.created_at).toLocaleString() : ''}</p>
      </CardContent>
    </Card>
  );
}
