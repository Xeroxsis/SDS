import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Upload, X, ScanLine, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ScanPage() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/patients').then(r => setPatients(r.data)).catch(() => {});
  }, []);

  const handleFile = useCallback((f) => {
    if (!f) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff', 'image/webp'];
    if (!validTypes.includes(f.type) && !f.name.match(/\.(jpg|jpeg|png|bmp|tiff|tif|webp|dcm)$/i)) {
      toast.error('Please upload a valid image file (JPEG, PNG, BMP, TIFF, WebP)');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!file) {
      toast.error('Please upload an MRI image first');
      return;
    }
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (selectedPatient) {
        formData.append('patient_id', selectedPatient);
        const pt = patients.find(p => p.id === selectedPatient);
        if (pt) formData.append('patient_name', pt.name);
      } else {
        formData.append('patient_name', 'Unassigned');
      }
      const { data } = await api.post('/scans/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Analysis complete!');
      navigate(`/scan/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <DashboardLayout>
      <div data-testid="scan-page" className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-medium text-[#111827]">New Scan</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">Upload a brain MRI image for stroke analysis</p>
        </div>

        {/* Patient Selection */}
        <Card className="border border-[#E5E7EB] shadow-none">
          <CardContent className="p-6 space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#9CA3AF]">Patient (Optional)</p>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger data-testid="patient-select" className="border-[#E5E7EB]">
                <SelectValue placeholder="Select a patient or leave empty" />
              </SelectTrigger>
              <SelectContent>
                {patients.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} - Age {p.age}, {p.gender}
                  </SelectItem>
                ))}
                {patients.length === 0 && (
                  <div className="p-3 text-sm text-[#9CA3AF] text-center">
                    No patients yet. You can add them in the Patients page.
                  </div>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card className="border border-[#E5E7EB] shadow-none">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#9CA3AF] mb-4">MRI Image</p>

            {!file ? (
              <div
                data-testid="upload-dropzone"
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onClick={() => document.getElementById('file-input').click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
                  ${dragActive
                    ? 'border-[#0EA5E9] bg-[#0EA5E9]/5'
                    : 'border-[#E5E7EB] hover:border-[#93C5FD] hover:bg-[#F3F4F6]/50'}`}
              >
                <Upload className="w-10 h-10 text-[#9CA3AF] mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-[#111827] font-medium mb-1">Drop your MRI image here</p>
                <p className="text-sm text-[#9CA3AF]">or click to browse. Supports JPEG, PNG, BMP, TIFF (max 10MB)</p>
                <input
                  id="file-input"
                  data-testid="file-input"
                  type="file"
                  accept="image/*,.dcm"
                  className="hidden"
                  onChange={e => handleFile(e.target.files?.[0])}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F3F4F6]">
                  <img
                    src={preview}
                    alt="MRI Preview"
                    data-testid="mri-preview"
                    className="w-full max-h-[400px] object-contain mx-auto"
                  />
                  <button
                    data-testid="remove-file-btn"
                    onClick={removeFile}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-colors shadow"
                  >
                    <X className="w-4 h-4 text-[#4B5563]" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#4B5563]">
                  <ScanLine className="w-4 h-4 text-[#0EA5E9]" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-[#9CA3AF]">({(file.size / 1024).toFixed(0)} KB)</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analyze Button */}
        <Button
          data-testid="analyze-btn"
          onClick={handleAnalyze}
          disabled={!file || analyzing}
          className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-lg py-3 text-base gap-2 disabled:opacity-50"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Analyzing MRI...
            </>
          ) : (
            <>
              <ScanLine className="w-4 h-4" /> Analyze Scan
            </>
          )}
        </Button>

        {analyzing && (
          <div className="text-center space-y-3">
            <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div className="h-full bg-[#0EA5E9] rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
            <p className="text-sm text-[#9CA3AF]">Running ML analysis: feature extraction, classification...</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
