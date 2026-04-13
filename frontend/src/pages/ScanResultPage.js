import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Download, AlertTriangle, Info, Activity, Shield, FileText, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const classConfig = {
  hemorrhagic: { label: 'Hemorrhagic Stroke', color: '#E11D48', bgColor: 'bg-[#E11D48]/10 text-[#E11D48]', icon: AlertTriangle },
  ischemic: { label: 'Ischemic Stroke', color: '#F59E0B', bgColor: 'bg-[#F59E0B]/10 text-[#F59E0B]', icon: Activity },
  normal: { label: 'No Stroke Detected', color: '#10B981', bgColor: 'bg-[#10B981]/10 text-[#10B981]', icon: Shield },
};

const CHART_COLORS = ['#E11D48', '#F59E0B', '#10B981'];

export default function ScanResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get(`/scans/${id}`)
      .then(r => setScan(r.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/scans/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `stroke_report_${id.slice(0, 8)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!scan) return null;

  const cls = classConfig[scan.classification] || classConfig.normal;
  const ClsIcon = cls.icon;

  const chartData = scan.probabilities ? [
    { name: 'Hemorrhagic', value: parseFloat((scan.probabilities.hemorrhagic * 100).toFixed(1)) },
    { name: 'Ischemic', value: parseFloat((scan.probabilities.ischemic * 100).toFixed(1)) },
    { name: 'Normal', value: parseFloat((scan.probabilities.normal * 100).toFixed(1)) },
  ] : [];

  const strokeInfo = scan.stroke_info || {};

  return (
    <DashboardLayout>
      <div data-testid="scan-result-page" className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              data-testid="back-to-dashboard"
              className="p-2 rounded-lg hover:bg-[#F3F4F6] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#4B5563]" />
            </button>
            <div>
              <h1 className="font-heading text-xl sm:text-2xl font-medium text-[#111827]">Scan Results</h1>
              <p className="text-sm text-[#9CA3AF]">
                {scan.patient_name || 'Unknown'} &middot; {new Date(scan.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Button
            data-testid="download-pdf-btn"
            onClick={downloadPdf}
            disabled={downloading}
            className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white gap-2 rounded-lg"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Image */}
          <div className="lg:col-span-2">
            <Card className="border border-[#E5E7EB] shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-lg font-medium text-[#111827]">MRI Image</CardTitle>
              </CardHeader>
              <CardContent>
                {scan.image_data ? (
                  <div className="rounded-xl overflow-hidden bg-[#111827] flex items-center justify-center">
                    <img
                      src={`data:${scan.content_type || 'image/png'};base64,${scan.image_data}`}
                      alt="MRI Scan"
                      data-testid="scan-image"
                      className="max-h-[500px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-64 rounded-xl bg-[#F3F4F6] flex items-center justify-center text-[#9CA3AF]">
                    Image not available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Classification */}
          <div className="space-y-6">
            {/* Result Card */}
            <Card className="border border-[#E5E7EB] shadow-none">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#9CA3AF] mb-4">Classification</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cls.color}15` }}>
                    <ClsIcon className="w-5 h-5" style={{ color: cls.color }} strokeWidth={1.5} />
                  </div>
                  <div>
                    <Badge className={`${cls.bgColor} border-0 text-sm font-semibold`} data-testid="classification-badge">
                      {cls.label}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-[#4B5563]">Confidence</span>
                    <span className="font-medium text-[#111827]" data-testid="confidence-value">
                      {(scan.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${scan.confidence * 100}%`, backgroundColor: cls.color }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Probability Chart */}
            {chartData.length > 0 && (
              <Card className="border border-[#E5E7EB] shadow-none">
                <CardContent className="p-6">
                  <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#9CA3AF] mb-4">Probability Distribution</p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.map((_, idx) => (
                            <Cell key={idx} fill={CHART_COLORS[idx]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val) => `${val}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-2">
                    {chartData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                          <span className="text-[#4B5563]">{d.name}</span>
                        </div>
                        <span className="font-medium text-[#111827]">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Stroke Information */}
        <Card className="border border-[#E5E7EB] shadow-none">
          <CardHeader>
            <CardTitle className="font-heading text-lg font-medium text-[#111827] flex items-center gap-2">
              <Info className="w-5 h-5 text-[#0EA5E9]" strokeWidth={1.5} />
              {strokeInfo.name || 'Analysis Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {strokeInfo.description && (
              <p className="text-[#4B5563] leading-relaxed">{strokeInfo.description}</p>
            )}

            {strokeInfo.symptoms && (
              <div>
                <h4 className="text-sm font-semibold text-[#111827] mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#F59E0B]" strokeWidth={1.5} />
                  Symptoms
                </h4>
                <ul className="space-y-1.5 ml-6">
                  {strokeInfo.symptoms.map((s, i) => (
                    <li key={i} className="text-sm text-[#4B5563] list-disc">{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {strokeInfo.treatment && (
              <div>
                <Separator className="mb-4" />
                <h4 className="text-sm font-semibold text-[#111827] mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0EA5E9]" strokeWidth={1.5} />
                  Treatment Options
                </h4>
                <ul className="space-y-1.5 ml-6">
                  {strokeInfo.treatment.map((t, i) => (
                    <li key={i} className="text-sm text-[#4B5563] list-disc">{t}</li>
                  ))}
                </ul>
              </div>
            )}

            {strokeInfo.risk_factors && (
              <div>
                <Separator className="mb-4" />
                <h4 className="text-sm font-semibold text-[#111827] mb-2">Risk Factors</h4>
                <ul className="space-y-1.5 ml-6">
                  {strokeInfo.risk_factors.map((r, i) => (
                    <li key={i} className="text-sm text-[#4B5563] list-disc">{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {strokeInfo.recommendations && (
              <div>
                <Separator className="mb-4" />
                <h4 className="text-sm font-semibold text-[#111827] mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#10B981]" strokeWidth={1.5} />
                  Recommendations
                </h4>
                <ul className="space-y-1.5 ml-6">
                  {strokeInfo.recommendations.map((r, i) => (
                    <li key={i} className="text-sm text-[#4B5563] list-disc">{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {strokeInfo.prevalence && (
              <p className="text-xs text-[#9CA3AF] mt-4 italic">
                {strokeInfo.prevalence}
              </p>
            )}

            {/* Feature Analysis */}
            {scan.features && (
              <div>
                <Separator className="mb-4" />
                <h4 className="text-sm font-semibold text-[#111827] mb-3">Image Feature Analysis</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(scan.features).map(([key, val]) => (
                    <div key={key} className="p-3 rounded-lg bg-[#F3F4F6]">
                      <p className="text-xs text-[#9CA3AF] capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-medium text-[#111827] mt-0.5">{typeof val === 'number' ? val.toFixed(4) : val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="p-4 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/20">
          <p className="text-xs text-[#92400E] leading-relaxed">
            <strong>Disclaimer:</strong> This is an automated AI-based screening tool for educational and research purposes only.
            It should NOT be used as a substitute for professional medical diagnosis. Always consult with a qualified healthcare professional.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
