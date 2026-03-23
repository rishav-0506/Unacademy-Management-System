
import React, { useState, useEffect } from 'react';
import { 
    ClipboardList, 
    Search, 
    Plus, 
    Filter, 
    Loader2, 
    User, 
    Phone, 
    Mail, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    MoreVertical, 
    Save, 
    X,
    GraduationCap,
    CreditCard
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { scheduleService } from '../services/scheduleService';
import { useToast } from '../context/ToastContext';
import { ClassInfo } from '../types';

interface Registration {
    id: string;
    student_name: string;
    parent_name: string;
    phone: string;
    email: string;
    class_id: string;
    status: 'pending' | 'approved' | 'rejected' | 'admitted';
    registration_fee_status: 'paid' | 'unpaid';
    created_at: string;
}

const RegistrationView: React.FC = () => {
    const { showToast } = useToast();
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<Partial<Registration>>({
        student_name: '',
        parent_name: '',
        phone: '',
        email: '',
        class_id: '',
        status: 'pending',
        registration_fee_status: 'unpaid'
    });

    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            try {
                const classData = await scheduleService.getClasses();
                setClasses(classData);
                if (classData.length > 0) {
                    setFormData(prev => ({ ...prev, class_id: classData[0].id }));
                }
                await fetchRegistrations();
            } catch (error: any) {
                showToast("Initialization failed: " + error.message, "error");
            } finally {
                setIsLoading(false);
            }
        };
        initialize();
    }, []);

    const fetchRegistrations = async () => {
        if (!supabase) return;
        try {
            const { data, error } = await supabase
                .from('system_config')
                .select('value')
                .eq('key', 'registrations_data')
                .maybeSingle();
            
            if (error) throw error;
            setRegistrations(data?.value || []);
        } catch (error: any) {
            showToast("Failed to fetch registrations: " + error.message, "error");
        }
    };

    const saveRegistrationsToConfig = async (updatedRegs: Registration[]) => {
        if (!supabase) return;
        try {
            const { error } = await supabase.from('system_config').upsert({
                key: 'registrations_data',
                value: updatedRegs
            }, { onConflict: 'key' });
            if (error) throw error;
        } catch (error: any) {
            showToast("Failed to persist registrations: " + error.message, "error");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
        
        setIsSubmitting(true);
        try {
            const newReg: Registration = {
                ...formData as Registration,
                id: crypto.randomUUID(),
                created_at: new Date().toISOString()
            };
            
            const updatedRegs = [newReg, ...registrations];
            setRegistrations(updatedRegs);
            await saveRegistrationsToConfig(updatedRegs);
            
            showToast("Registration submitted successfully", "success");
            setIsModalOpen(false);
            setFormData({
                student_name: '',
                parent_name: '',
                phone: '',
                email: '',
                class_id: classes[0]?.id || '',
                status: 'pending',
                registration_fee_status: 'unpaid'
            });
        } catch (error: any) {
            showToast("Failed to submit registration: " + error.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateStatus = async (id: string, newStatus: Registration['status']) => {
        if (!supabase) return;
        try {
            const updatedRegs = registrations.map(reg => 
                reg.id === id ? { ...reg, status: newStatus } : reg
            );
            setRegistrations(updatedRegs);
            await saveRegistrationsToConfig(updatedRegs);
            
            showToast(`Registration ${newStatus}`, "success");
        } catch (error: any) {
            showToast("Failed to update status: " + error.message, "error");
        }
    };

    const updateFeeStatus = async (id: string, newStatus: Registration['registration_fee_status']) => {
        if (!supabase) return;
        try {
            const updatedRegs = registrations.map(reg => 
                reg.id === id ? { ...reg, registration_fee_status: newStatus } : reg
            );
            setRegistrations(updatedRegs);
            await saveRegistrationsToConfig(updatedRegs);
            
            showToast(`Fee status updated to ${newStatus}`, "success");
        } catch (error: any) {
            showToast("Failed to update fee status: " + error.message, "error");
        }
    };

    const filteredRegistrations = registrations.filter(reg => {
        const matchesSearch = reg.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             reg.phone.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-6 bg-supabase-bg min-h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-supabase-text uppercase tracking-widest flex items-center gap-3">
                        <ClipboardList className="text-supabase-green" />
                        Student Registration
                    </h1>
                    <p className="text-supabase-muted text-sm mt-1">Manage new student applications and registration fees</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-supabase-green text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-supabase-greenHover transition-all shadow-lg shadow-supabase-green/10"
                >
                    <Plus size={18} />
                    New Registration
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-supabase-muted" size={18} />
                    <input 
                        type="text"
                        placeholder="Search by name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-supabase-panel border border-supabase-border rounded-lg pl-10 pr-4 py-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-supabase-muted" size={18} />
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-supabase-panel border border-supabase-border rounded-lg pl-10 pr-4 py-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green appearance-none transition-all"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="admitted">Admitted</option>
                    </select>
                </div>
                <button 
                    onClick={fetchRegistrations}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-supabase-panel border border-supabase-border rounded-lg text-supabase-text hover:bg-supabase-hover transition-all"
                >
                    <Clock size={18} />
                    Refresh
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="animate-spin text-supabase-green mb-4" size={40} />
                    <p className="text-supabase-muted font-mono text-xs tracking-widest uppercase">Synchronizing Registry...</p>
                </div>
            ) : (
                <div className="bg-supabase-panel border border-supabase-border rounded-xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-supabase-sidebar/50 border-b border-supabase-border">
                                    <th className="px-6 py-4 text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Student Details</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Contact</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Class</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Fee Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-supabase-muted uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-supabase-border">
                                {filteredRegistrations.length > 0 ? (
                                    filteredRegistrations.map((reg) => (
                                        <tr key={reg.id} className="hover:bg-supabase-hover/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-supabase-green/10 rounded-lg flex items-center justify-center text-supabase-green">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-supabase-text">{reg.student_name}</div>
                                                        <div className="text-[10px] text-supabase-muted uppercase tracking-wider">Parent: {reg.parent_name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs text-supabase-muted">
                                                        <Phone size={12} />
                                                        {reg.phone}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-supabase-muted">
                                                        <Mail size={12} />
                                                        {reg.email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-supabase-sidebar border border-supabase-border rounded text-[10px] font-bold text-supabase-text uppercase tracking-wider">
                                                    {classes.find(c => c.id === reg.class_id)?.name || 'Unknown'} - {classes.find(c => c.id === reg.class_id)?.section || '?'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => updateFeeStatus(reg.id, reg.registration_fee_status === 'paid' ? 'unpaid' : 'paid')}
                                                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                                                        reg.registration_fee_status === 'paid' 
                                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                    }`}
                                                >
                                                    <CreditCard size={12} />
                                                    {reg.registration_fee_status}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                                    reg.status === 'approved' ? 'bg-supabase-green/10 text-supabase-green' :
                                                    reg.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                                    reg.status === 'admitted' ? 'bg-blue-500/10 text-blue-500' :
                                                    'bg-supabase-muted/10 text-supabase-muted'
                                                }`}>
                                                    {reg.status === 'pending' && <Clock size={12} />}
                                                    {reg.status === 'approved' && <CheckCircle2 size={12} />}
                                                    {reg.status === 'rejected' && <XCircle size={12} />}
                                                    {reg.status === 'admitted' && <GraduationCap size={12} />}
                                                    {reg.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {reg.status === 'pending' && (
                                                        <>
                                                            <button 
                                                                onClick={() => updateStatus(reg.id, 'approved')}
                                                                className="p-2 text-supabase-green hover:bg-supabase-green/10 rounded-lg transition-all"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle2 size={18} />
                                                            </button>
                                                            <button 
                                                                onClick={() => updateStatus(reg.id, 'rejected')}
                                                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                                title="Reject"
                                                            >
                                                                <XCircle size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button className="p-2 text-supabase-muted hover:text-supabase-text rounded-lg transition-all">
                                                        <MoreVertical size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-supabase-muted">
                                            No registrations found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* New Registration Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-supabase-panel border border-supabase-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-supabase-border flex items-center justify-between bg-supabase-sidebar/50">
                            <h2 className="text-lg font-black text-supabase-text uppercase tracking-widest flex items-center gap-2">
                                <Plus className="text-supabase-green" size={20} />
                                New Registration
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-supabase-muted hover:text-supabase-text transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Student Name</label>
                                    <input 
                                        required
                                        type="text"
                                        value={formData.student_name}
                                        onChange={(e) => setFormData({...formData, student_name: e.target.value})}
                                        className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-4 py-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all"
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Parent/Guardian</label>
                                    <input 
                                        required
                                        type="text"
                                        value={formData.parent_name}
                                        onChange={(e) => setFormData({...formData, parent_name: e.target.value})}
                                        className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-4 py-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all"
                                        placeholder="Parent Name"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Phone Number</label>
                                    <input 
                                        required
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-4 py-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all"
                                        placeholder="+1..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Email Address</label>
                                    <input 
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-4 py-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Class Interested</label>
                                <select 
                                    required
                                    value={formData.class_id}
                                    onChange={(e) => setFormData({...formData, class_id: e.target.value})}
                                    className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-4 py-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all"
                                >
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-supabase-border rounded-lg text-sm font-bold text-supabase-muted hover:text-supabase-text hover:bg-supabase-hover transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-supabase-green text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-supabase-greenHover transition-all shadow-lg shadow-supabase-green/10 disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                    Submit Application
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistrationView;
