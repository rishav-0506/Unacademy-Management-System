import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Phone, Briefcase, Building, MapPin, Save, Loader2, Key, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../services/supabaseClient';

const ProfileView: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { showToast } = useToast();
    
    const [isSaving, setIsSaving] = useState(false);
    const [employeeData, setEmployeeData] = useState<any>(null);
    const [isLoadingEmployee, setIsLoadingEmployee] = useState(false);
    
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (user?.email) {
            fetchEmployeeData();
        }
    }, [user?.email]);

    const fetchEmployeeData = async () => {
        if (!supabase) return;
        setIsLoadingEmployee(true);
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('email', user?.email)
                .maybeSingle();
            
            if (error) throw error;
            setEmployeeData(data);
        } catch (error) {
            console.error('Error fetching employee data:', error);
        } finally {
            setIsLoadingEmployee(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateUser({
                name: formData.name,
                email: formData.email
            });
            showToast('Profile updated successfully', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to update profile', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        
        setIsSaving(true);
        try {
            if (!supabase) throw new Error('Database offline');
            
            // First verify current password
            const { data: dbUser, error: fetchError } = await supabase
                .from('system_users')
                .select('password')
                .eq('id', user?.id)
                .single();
            
            if (fetchError) throw fetchError;
            if (dbUser.password !== formData.currentPassword) {
                throw new Error('Current password incorrect');
            }

            const { error } = await supabase
                .from('system_users')
                .update({ password: formData.newPassword })
                .eq('id', user?.id);
            
            if (error) throw error;
            
            showToast('Password changed successfully', 'success');
            setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        } catch (error: any) {
            showToast(error.message || 'Failed to change password', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-supabase-border pb-6">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-supabase-green/10 border border-supabase-green/20 flex items-center justify-center text-supabase-green shadow-inner">
                        <UserCircle size={48} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-supabase-text uppercase tracking-tight">{user?.name}</h1>
                        <p className="text-xs text-supabase-muted font-bold uppercase tracking-widest mt-1">System Profile Protocol</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-supabase-sidebar border border-supabase-border rounded-full text-[10px] font-black uppercase tracking-widest text-supabase-muted">
                        ID: {user?.id.slice(0, 8)}...
                    </span>
                    <span className="px-3 py-1 bg-supabase-green/10 border border-supabase-green/30 rounded-full text-[10px] font-black uppercase tracking-widest text-supabase-green">
                        {user?.role}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Info */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-supabase-panel border border-supabase-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-supabase-border bg-supabase-sidebar flex items-center gap-3">
                            <User size={18} className="text-supabase-green" />
                            <h2 className="text-xs font-black text-supabase-text uppercase tracking-widest">Personal Matrix</h2>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-supabase-muted uppercase tracking-widest">Full Identity Name</label>
                                    <div className="relative">
                                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-supabase-muted" />
                                        <input 
                                            type="text" 
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            className="w-full bg-supabase-bg border border-supabase-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-supabase-muted uppercase tracking-widest">Primary Email Node</label>
                                    <div className="relative">
                                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-supabase-muted" />
                                        <input 
                                            type="email" 
                                            value={formData.email}
                                            onChange={e => setFormData({...formData, email: e.target.value})}
                                            className="w-full bg-supabase-bg border border-supabase-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="bg-supabase-green text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-supabase-greenHover transition-all shadow-lg shadow-supabase-green/20 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Commit Changes
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="bg-supabase-panel border border-supabase-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-supabase-border bg-supabase-sidebar flex items-center gap-3">
                            <Key size={18} className="text-supabase-green" />
                            <h2 className="text-xs font-black text-supabase-text uppercase tracking-widest">Security Protocol</h2>
                        </div>
                        <form onSubmit={handleChangePassword} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-supabase-muted uppercase tracking-widest">Current Access Key</label>
                                <input 
                                    type="password" 
                                    value={formData.currentPassword}
                                    onChange={e => setFormData({...formData, currentPassword: e.target.value})}
                                    className="w-full bg-supabase-bg border border-supabase-border rounded-xl px-4 py-2.5 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all"
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-supabase-muted uppercase tracking-widest">New Access Key</label>
                                    <input 
                                        type="password" 
                                        value={formData.newPassword}
                                        onChange={e => setFormData({...formData, newPassword: e.target.value})}
                                        className="w-full bg-supabase-bg border border-supabase-border rounded-xl px-4 py-2.5 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all"
                                        placeholder="New password"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-supabase-muted uppercase tracking-widest">Confirm New Key</label>
                                    <input 
                                        type="password" 
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                        className="w-full bg-supabase-bg border border-supabase-border rounded-xl px-4 py-2.5 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="bg-supabase-sidebar border border-supabase-border text-supabase-text px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-supabase-hover transition-all disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                                    Update Security Key
                                </button>
                            </div>
                        </form>
                    </section>
                </div>

                {/* Right Column: Employee Details */}
                <div className="space-y-8">
                    <section className="bg-supabase-panel border border-supabase-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-supabase-border bg-supabase-sidebar flex items-center gap-3">
                            <Briefcase size={18} className="text-supabase-green" />
                            <h2 className="text-xs font-black text-supabase-text uppercase tracking-widest">Employment Node</h2>
                        </div>
                        <div className="p-6">
                            {isLoadingEmployee ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-3">
                                    <Loader2 size={24} className="animate-spin text-supabase-green" />
                                    <p className="text-[10px] font-black text-supabase-muted uppercase tracking-widest">Syncing Data...</p>
                                </div>
                            ) : employeeData ? (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-supabase-sidebar rounded-lg border border-supabase-border">
                                                <Building size={16} className="text-supabase-muted" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-supabase-muted uppercase tracking-widest">Department</div>
                                                <div className="text-sm font-bold text-supabase-text">{employeeData.department}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-supabase-sidebar rounded-lg border border-supabase-border">
                                                <Briefcase size={16} className="text-supabase-muted" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-supabase-muted uppercase tracking-widest">Designation</div>
                                                <div className="text-sm font-bold text-supabase-text">{employeeData.designation}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-supabase-sidebar rounded-lg border border-supabase-border">
                                                <Phone size={16} className="text-supabase-muted" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-supabase-muted uppercase tracking-widest">Mobile Contact</div>
                                                <div className="text-sm font-bold text-supabase-text">{employeeData.mobile || 'Not set'}</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-supabase-border">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black text-supabase-muted uppercase tracking-widest">Status</span>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${employeeData.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {employeeData.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-supabase-muted uppercase tracking-widest">Joined</span>
                                            <span className="text-[10px] font-bold text-supabase-text">
                                                {new Date(employeeData.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 space-y-3">
                                    <div className="w-12 h-12 bg-supabase-sidebar border border-supabase-border rounded-full flex items-center justify-center mx-auto text-supabase-muted">
                                        <User size={24} />
                                    </div>
                                    <p className="text-xs text-supabase-muted leading-relaxed">
                                        No linked employee record found for this email node.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    <div className="bg-supabase-green/5 border border-supabase-green/20 rounded-2xl p-6 space-y-3">
                        <div className="flex items-center gap-2 text-supabase-green">
                            <Shield size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Access Level</span>
                        </div>
                        <p className="text-xs text-supabase-muted leading-relaxed">
                            Your account is currently operating under the <strong className="text-supabase-text">{user?.role}</strong> protocol. Some administrative functions may be restricted.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
