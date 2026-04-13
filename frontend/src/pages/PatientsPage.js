import { useState, useEffect } from 'react';
import api from '../lib/api';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Plus, Pencil, Trash2, Users, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  const fetchPatients = () => {
    api.get('/patients')
      .then(r => setPatients(r.data))
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPatients(); }, []);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this patient and all associated scans?')) return;
    try {
      await api.delete(`/patients/${id}`);
      toast.success('Patient deleted');
      fetchPatients();
    } catch {
      toast.error('Failed to delete patient');
    }
  };

  const openEdit = (patient) => {
    setEditingPatient(patient);
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingPatient(null);
    setDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div data-testid="patients-page" className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-medium text-[#111827]">Patients</h1>
            <p className="text-sm text-[#9CA3AF] mt-1">Manage patient records</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                data-testid="add-patient-btn"
                onClick={openNew}
                className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white gap-2 rounded-lg"
              >
                <Plus className="w-4 h-4" /> Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading">
                  {editingPatient ? 'Edit Patient' : 'Add New Patient'}
                </DialogTitle>
              </DialogHeader>
              <PatientForm
                patient={editingPatient}
                onSuccess={() => {
                  setDialogOpen(false);
                  fetchPatients();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            data-testid="patient-search"
            placeholder="Search patients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 border-[#E5E7EB]"
          />
        </div>

        {/* Table */}
        <Card className="border border-[#E5E7EB] shadow-none">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-[#9CA3AF]">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">{patients.length === 0 ? 'No patients yet.' : 'No matching patients.'}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[#9CA3AF]">Name</TableHead>
                    <TableHead className="text-[#9CA3AF]">Age</TableHead>
                    <TableHead className="text-[#9CA3AF]">Gender</TableHead>
                    <TableHead className="text-[#9CA3AF]">Medical History</TableHead>
                    <TableHead className="text-[#9CA3AF]">Created</TableHead>
                    <TableHead className="text-[#9CA3AF] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-[#111827]">{p.name}</TableCell>
                      <TableCell className="text-[#4B5563]">{p.age}</TableCell>
                      <TableCell className="text-[#4B5563] capitalize">{p.gender}</TableCell>
                      <TableCell className="text-[#4B5563] text-sm max-w-[200px] truncate">
                        {p.medical_history || '-'}
                      </TableCell>
                      <TableCell className="text-[#4B5563] text-sm">
                        {new Date(p.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`edit-patient-${p.id}`}
                            onClick={() => openEdit(p)}
                            className="text-[#4B5563] hover:text-[#0EA5E9]"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`delete-patient-${p.id}`}
                            onClick={() => handleDelete(p.id)}
                            className="text-[#4B5563] hover:text-[#E11D48]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function PatientForm({ patient, onSuccess }) {
  const [name, setName] = useState(patient?.name || '');
  const [age, setAge] = useState(patient?.age?.toString() || '');
  const [gender, setGender] = useState(patient?.gender || '');
  const [medicalHistory, setMedicalHistory] = useState(patient?.medical_history || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !age || !gender) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      if (patient) {
        await api.put(`/patients/${patient.id}`, {
          name, age: parseInt(age), gender, medical_history: medicalHistory
        });
        toast.success('Patient updated');
      } else {
        await api.post('/patients', {
          name, age: parseInt(age), gender, medical_history: medicalHistory
        });
        toast.success('Patient added');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="patient-form">
      <div className="space-y-2">
        <Label className="text-[#111827]">Name *</Label>
        <Input
          data-testid="patient-name-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Patient name"
          required
          className="border-[#E5E7EB]"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[#111827]">Age *</Label>
          <Input
            data-testid="patient-age-input"
            type="number"
            value={age}
            onChange={e => setAge(e.target.value)}
            placeholder="Age"
            min="0"
            max="150"
            required
            className="border-[#E5E7EB]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#111827]">Gender *</Label>
          <Select value={gender} onValueChange={setGender} required>
            <SelectTrigger data-testid="patient-gender-select" className="border-[#E5E7EB]">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-[#111827]">Medical History</Label>
        <Textarea
          data-testid="patient-history-input"
          value={medicalHistory}
          onChange={e => setMedicalHistory(e.target.value)}
          placeholder="Previous conditions, medications, etc."
          rows={3}
          className="border-[#E5E7EB]"
        />
      </div>
      <Button
        type="submit"
        data-testid="patient-form-submit"
        disabled={loading}
        className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white"
      >
        {loading ? 'Saving...' : patient ? 'Update Patient' : 'Add Patient'}
      </Button>
    </form>
  );
}
