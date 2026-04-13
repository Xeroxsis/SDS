import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ScanLine, Users, AlertTriangle, ShieldCheck, Plus, Eye } from 'lucide-react';

const classMap = {
  hemorrhagic: { label: 'Hemorrhagic', color: 'bg-[#E11D48]/10 text-[#E11D48]' },
  ischemic: { label: 'Ischemic', color: 'bg-[#F59E0B]/10 text-[#F59E0B]' },
  normal: { label: 'Normal', color: 'bg-[#10B981]/10 text-[#10B981]' },
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div data-testid="dashboard-page" className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-medium text-[#111827]">Dashboard</h1>
            <p className="text-sm text-[#9CA3AF] mt-1">Overview of your scan activity</p>
          </div>
          <Button
            data-testid="new-scan-btn"
            onClick={() => navigate('/scan')}
            className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white gap-2 rounded-lg"
          >
            <Plus className="w-4 h-4" /> New Scan
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-white border border-[#E5E7EB] animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={ScanLine} label="Total Scans" value={stats.total_scans} color="#0EA5E9" />
              <StatCard icon={Users} label="Patients" value={stats.total_patients} color="#4B5563" />
              <StatCard icon={AlertTriangle} label="Strokes Detected" value={stats.hemorrhagic_count + stats.ischemic_count} color="#F59E0B" />
              <StatCard icon={ShieldCheck} label="Normal Scans" value={stats.normal_count} color="#10B981" />
            </div>

            {/* Recent Scans */}
            <Card className="border border-[#E5E7EB] shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="font-heading text-lg font-medium text-[#111827]">Recent Scans</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.recent_scans.length === 0 ? (
                  <div className="text-center py-12 text-[#9CA3AF]">
                    <ScanLine className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No scans yet. Upload your first MRI scan.</p>
                    <Button
                      data-testid="empty-new-scan-btn"
                      onClick={() => navigate('/scan')}
                      className="mt-4 bg-[#0EA5E9] hover:bg-[#0284C7] text-white gap-2"
                    >
                      <Plus className="w-4 h-4" /> New Scan
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[#9CA3AF]">Patient</TableHead>
                        <TableHead className="text-[#9CA3AF]">Date</TableHead>
                        <TableHead className="text-[#9CA3AF]">Classification</TableHead>
                        <TableHead className="text-[#9CA3AF]">Confidence</TableHead>
                        <TableHead className="text-[#9CA3AF] text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recent_scans.map(scan => {
                        const cls = classMap[scan.classification] || classMap.normal;
                        return (
                          <TableRow key={scan.id}>
                            <TableCell className="font-medium text-[#111827]">{scan.patient_name || 'Unknown'}</TableCell>
                            <TableCell className="text-[#4B5563] text-sm">
                              {new Date(scan.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${cls.color} border-0 font-medium`}>{cls.label}</Badge>
                            </TableCell>
                            <TableCell className="text-[#4B5563] text-sm">
                              {(scan.confidence * 100).toFixed(1)}%
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`view-scan-${scan.id}`}
                                onClick={() => navigate(`/scan/${scan.id}`)}
                                className="text-[#0EA5E9] hover:text-[#0284C7] gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <p className="text-[#9CA3AF]">Failed to load stats.</p>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card className="border border-[#E5E7EB] shadow-none hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <CardContent className="p-6 flex items-center gap-4">
        <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.15em] font-bold text-[#9CA3AF]">{label}</p>
          <p className="text-2xl font-heading font-medium text-[#111827] mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
