
import React, { useState, useEffect } from 'react';
import { 
    UserPlus, 
    Search, 
    Plus, 
    Loader2, 
    User, 
    CheckCircle2, 
    ArrowRight, 
    Save, 
    X,
    ClipboardCheck,
    Calendar,
    Hash,
    MapPin,
    ShieldCheck
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

const AdmissionView: React.FC = () => {
    const { showToast } = useToast();
    const [approvedRegistrations, setApprovedRegistrations] = useState<Registration[]>([]);
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Admission Modal state
    const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
    
    const [admissionData, setAdmissionData] = useState({
        full_name: '',
        roll_number: '',
        class_name: '',
        guardian_name: '',
        contact_number: '',
        email: '',
        address: '',
        date_of_birth: '',
        gender: 'Male',
        status: 'active'
    });

    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            try {
                const classData = await scheduleService.getClasses();
                setClasses(classData);
                await fetchApprovedRegistrations();
            } catch (error: any) {
                showToast("Initialization failed: " + error.message, "error");
            } finally {
                setIsLoading(false);
            }
        };
        initialize();
    }, []);

    const fetchApprovedRegistrations = async () => {
        if (!supabase) return;
        try {
            const { data, error } = await supabase
                .from('system_config')
                .select('value')
                .eq('key', 'registrations_data')
                .maybeSingle();
            
            if (error) throw error;
            const allRegs = (data?.value || []) as Registration[];
            setApprovedRegistrations(allRegs.filter(r => r.status === 'approved'));
        } catch (error: any) {
            showToast("Failed to fetch approved registrations: " + error.message, "error");
        }
    };

    const handleStartAdmission = (reg: Registration) => {
        setSelectedRegistration(reg);
        
        // Find class name from class_id
        const targetClass = classes.find(c => c.id === reg.class_id);
        
        setAdmissionData({
            full_name: reg.student_name,
            roll_number: '', // To be filled
            class_name: targetClass?.name || '',
            guardian_name: reg.parent_name,
            contact_number: reg.phone,
            email: reg.email || '',
            address: '',
            date_of_birth: '',
            gender: 'Male',
            status: 'active'
        });
        setIsAdmissionModalOpen(true);
    };

    const handleDirectAdmission = () => {
        setSelectedRegistration(null);
        setAdmissionData({
            full_name: '',
            roll_number: '',
            class_name: classes[0]?.name || '',
            guardian_name: '',
            contact_number: '',
            email: '',
            address: '',
            date_of_birth: '',
            gender: 'Male',
            status: 'active'
        });
        setIsAdmissionModalOpen(true);
    };

    const handleSubmitAdmission = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
        
        setIsSubmitting(true);
        try {
            // 1. Create student record
            const { error: studentError } = await supabase
                .from('students')
                .insert([admissionData]);
            
            if (studentError) throw studentError;
            
            // 2. Update registration status in system_config if applicable
            if (selectedRegistration) {
                const { data: configData } = await supabase
                    .from('system_config')
                    .select('value')
                    .eq('key', 'registrations_data')
                    .maybeSingle();
                
                const allRegs = (configData?.value || []) as Registration[];
                const updatedRegs = allRegs.map(reg => 
                    reg.id === selectedRegistration.id ? { ...reg, status: 'admitted' as const } : reg
                );

                const { error: regError } = await supabase.from('system_config').upsert({
                    key: 'registrations_data',
                    value: updatedRegs
                }, { onConflict: 'key' });
                
                if (regError) throw regError;
            }
            
            showToast("Admission completed successfully", "success");
            setIsAdmissionModalOpen(false);
            await fetchApprovedRegistrations();
        } catch (error: any) {
            showToast("Failed to complete admission: " + error.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredRegistrations = approvedRegistrations.filter(reg => 
        reg.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        reg.phone.includes(searchTerm)
    );

    return (
        <div className="p-6 bg-supabase-bg min-h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-supabase-text uppercase tracking-widest flex items-center gap-3">
                        <UserPlus className="text-supabase-green" />
                        Student Admission
                    </h1>
                    <p className="text-supabase-muted text-sm mt-1">Convert approved registrations to active students</p>
                </div>
                <button 
                    onClick={handleDirectAdmission}
                    className="bg-supabase-green text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-supabase-greenHover transition-all shadow-lg shadow-supabase-green/10"
                >
                    <Plus size={18} />
                    Direct Admission
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Approved Registrations */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-supabase-panel border border-supabase-border rounded-xl p-4 flex items-center gap-3 shadow-sm">
                        <Search className="text-supabase-muted" size={18} />
                        <input 
                            type="text"
                            placeholder="Search approved registrations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 bg-transparent border-none text-sm text-supabase-text focus:outline-none"
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="animate-spin text-supabase-green mb-4" size={40} />
                            <p className="text-supabase-muted font-mono text-xs tracking-widest uppercase">Fetching Approved Applications...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredRegistrations.length > 0 ? (
                                filteredRegistrations.map((reg) => (
                                    <div key={reg.id} className="bg-supabase-panel border border-supabase-border rounded-xl p-5 hover:border-supabase-green/50 transition-all group shadow-sm">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 bg-supabase-green/10 rounded-xl flex items-center justify-center text-supabase-green">
                                                <User size={24} />
                                            </div>
                                            <div className="px-2 py-1 bg-supabase-green/10 text-supabase-green text-[10px] font-bold uppercase tracking-widest rounded">
                                                Approved
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-supabase-text mb-1">{reg.student_name}</h3>
                                        <p className="text-xs text-supabase-muted mb-4 uppercase tracking-wider">Class ID: {reg.class_id}</p>
                                        
                                        <div className="space-y-2 mb-6">
                                            <div className="flex items-center gap-2 text-xs text-supabase-muted">
                                                <ClipboardCheck size={14} className="text-supabase-green" />
                                                Fee: {reg.registration_fee_status === 'paid' ? 'Paid' : 'Unpaid'}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-supabase-muted">
                                                <Calendar size={14} className="text-supabase-green" />
                                                Applied: {new Date(reg.created_at).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => handleStartAdmission(reg)}
                                            className="w-full bg-supabase-sidebar border border-supabase-border text-supabase-text hover:bg-supabase-green hover:text-black hover:border-supabase-green px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all"
                                        >
                                            Complete Admission
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full bg-supabase-panel border border-supabase-border border-dashed rounded-xl p-12 text-center">
                                    <div className="w-16 h-16 bg-supabase-sidebar rounded-full flex items-center justify-center text-supabase-muted mx-auto mb-4">
                                        <ClipboardCheck size={32} />
                                    </div>
                                    <h3 className="text-supabase-text font-bold mb-1 uppercase tracking-widest">No Pending Admissions</h3>
                                    <p className="text-supabase-muted text-xs">All approved registrations have been processed.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Admission Stats/Info */}
                <div className="space-y-6">
                    <div className="bg-supabase-panel border border-supabase-border rounded-xl p-6 shadow-sm">
                        <h3 className="text-sm font-black text-supabase-text uppercase tracking-widest mb-6 flex items-center gap-2">
                            <ShieldCheck className="text-supabase-green" size={18} />
                            Admission Policy
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <div className="w-5 h-5 bg-supabase-green/10 rounded flex items-center justify-center text-supabase-green shrink-0 mt-0.5">
                                    <CheckCircle2 size={12} />
                                </div>
                                <p className="text-xs text-supabase-muted leading-relaxed">
                                    Ensure all registration fees are cleared before completing admission.
                                </p>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-5 h-5 bg-supabase-green/10 rounded flex items-center justify-center text-supabase-green shrink-0 mt-0.5">
                                    <CheckCircle2 size={12} />
                                </div>
                                <p className="text-xs text-supabase-muted leading-relaxed">
                                    Verify student age and class eligibility as per school guidelines.
                                </p>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-5 h-5 bg-supabase-green/10 rounded flex items-center justify-center text-supabase-green shrink-0 mt-0.5">
                                    <CheckCircle2 size={12} />
                                </div>
                                <p className="text-xs text-supabase-muted leading-relaxed">
                                    Assign a unique roll number to each student upon admission.
                                </p>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-supabase-green/5 border border-supabase-green/20 rounded-xl p-6">
                        <h4 className="text-supabase-green font-black text-[10px] uppercase tracking-[0.2em] mb-2">Quick Tip</h4>
                        <p className="text-xs text-supabase-text/80 leading-relaxed">
                            You can directly admit students without a registration if they have completed the walk-in process.
                        </p>
                    </div>
                </div>
            </div>

            {/* Admission Modal */}
            {isAdmissionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-supabase-panel border border-supabase-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-supabase-border flex items-center justify-between bg-supabase-sidebar/50">
                            <h2 className="text-lg font-black text-supabase-text uppercase tracking-widest flex items-center gap-2">
                                <UserPlus className="text-supabase-green" size={20} />
                                {selectedRegistration ? 'Complete Admission' : 'Direct Admission'}
                            </h2>
                            <button onClick={() => setIsAdmissionModalOpen(false)} className="text-supabase-muted hover:text-supabase-text transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitAdmission} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-supabase-muted" size={16} />
                                            <input 
                                                required
                                                type="text"
                                                value={admissionData.full_name}
                                                onChange={(e) => setAdmissionData({...admissionData, full_name: e.target.value})}
                                                className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg pl-10 pr-4 py-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all"
                                                placeholder="Student's Full Name"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Roll Number</label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-supabase-muted" size={16} />
                                            <input 
                                                required
                                                type="text"
                                                value={admissionData.roll_number}
                                                onChange={(e) => setAdmissionData({...admissionData, roll_number: e.target.value})}
                                                className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg pl-10 pr-4 py-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all"
                                                placeholder="e.g. 2024-001"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Class Assignment</label>
                                        <select 
                                            required
                                            value={admissionData.class_name}
                                            onChange={(e) => setAdmissionData({...admissionData, class_name: e.target.value})}
                                            className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-4 py-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all"
                                        >
                                            {classes.map(c => (
                                                <option key={c.id} value={c.name}>{c.name} - {c.section}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Gender</label>
                                        <div className="flex gap-4">
                                            {['Male', 'Female', 'Other'].map(g => (
                                                <label key={g} className="flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="radio"
                                                        name="gender"
                                                        value={g}
                                                        checked={admissionData.gender === g}
                                                        onChange={(e) => setAdmissionData({...admissionData, gender: e.target.value})}
                                                        className="accent-supabase-green"
                                                    />
                                                    <span className="text-xs text-supabase-text">{g}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Date of Birth</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-supabase-muted" size={16} />
                                            <input 
                                                required
                                                type="date"
                                                value={admissionData.date_of_birth}
                                                onChange={(e) => setAdmissionData({...admissionData, date_of_birth: e.target.value})}
                                                className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg pl-10 pr-4 py-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Guardian Name</label>
                                        <input 
                                            required
                                            type="text"
                                            value={admissionData.guardian_name}
                                            onChange={(e) => setAdmissionData({...admissionData, guardian_name: e.target.value})}
                                            className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-4 py-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all"
                                            placeholder="Parent/Guardian Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 text-supabase-muted" size={16} />
                                            <textarea 
                                                required
                                                rows={3}
                                                value={admissionData.address}
                                                onChange={(e) => setAdmissionData({...admissionData, address: e.target.value})}
                                                className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg pl-10 pr-4 py-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all resize-none"
                                                placeholder="Full Residential Address"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-supabase-border flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsAdmissionModalOpen(false)}
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
                                    Finalize Admission
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdmissionView;
