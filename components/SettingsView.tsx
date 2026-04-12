
import React, { useState, useEffect } from 'react';
/* Added ChevronRight to imports */
import { 
  Shield, Trash2, ShieldPlus, Loader2, Building2, Plus, 
  Database, CloudCheck, Layout, Briefcase, Award, Link2, Check, Search,
  ChevronRight, Activity, 
  RefreshCw, Server, Wifi, WifiOff, X, UserCheck, BookOpen, Layers, Share2, User, UserPlus, Ban
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../services/supabaseClient';

const SettingsView: React.FC = () => {
  const { 
    availableRoles, deleteRole, addRole, 
    departments, addDepartment, deleteDepartment, 
    designations, addDesignation, deleteDesignation,
    leadSources, addLeadSource, updateLeadSource, deleteLeadSource, deleteLeadSourceByIndex, clearAllLeadSources,
    leadBy, addLeadBy, deleteLeadBy,
    mapLeaders, allEmployees, toggleMapLeader, toggleCounsellor,
    counsellors, addCounsellor, deleteCounsellor,
    departmentDesignationMap, updateDeptMap, saveConfigItem, saveSystemConfig
  } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'roles' | 'departments' | 'designations' | 'mappings' | 'lead_sources' | 'system'>('roles');
  const [activeLeadSourceSubTab, setActiveLeadSourceSubTab] = useState<'manage' | 'lead_by' | 'counsellors'>('manage');
  const [newRole, setNewRole] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newDesig, setNewDesig] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('');
  const [newLeadCode, setNewLeadCode] = useState('');
  const [newLeadBy, setNewLeadBy] = useState('');
  const [newCounsellor, setNewCounsellor] = useState('');
  
  const [editingLeadSourceId, setEditingLeadSourceId] = useState<string | null>(null);
  const [editingLeadSourceName, setEditingLeadSourceName] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMappingDept, setSelectedMappingDept] = useState<string | null>(null);

  const [dbStatus, setDbStatus] = useState<'Checking' | 'Connected' | 'Error' | 'Disconnected'>('Checking');
  const [dbError, setDbError] = useState<string | null>(null);
  const [networkInfo, setNetworkInfo] = useState<{ reachable: boolean | null, latency?: number, error?: string }>({ reachable: null });
  const [serverHealth, setServerHealth] = useState<{ status: string, duration?: string, error?: string } | null>(null);
  const [isCheckingServer, setIsCheckingServer] = useState(false);

  useEffect(() => {
    checkDatabaseConnection();
  }, [activeTab]);

  const checkDatabaseConnection = async (manual = false) => {
    let currentSupabase = supabase;
    
    if (!currentSupabase) {
      const { reinitializeSupabase } = await import('../services/supabaseClient');
      currentSupabase = reinitializeSupabase();
    }

    if (!currentSupabase) {
      setDbStatus('Disconnected');
      setDbError('Supabase client not initialized. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in the Secrets menu and you have clicked "Apply changes".');
      if (manual) showToast('Supabase client not initialized. Check Secrets.', 'error');
      return;
    }

    setDbStatus('Checking');
    setDbError(null);
    setNetworkInfo({ reachable: null });
    
    const supabaseUrl = currentSupabase.supabaseUrl;
    
    // Create a promise that rejects after 10 seconds
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Connection timed out after 10 seconds trying to reach: ${supabaseUrl}. This usually indicates a network/firewall issue or that the Supabase project is paused.`)), 10000)
    );

    try {
      const start = Date.now();
      
      // 2. Direct REST API Check (faster, no internal retries)
      const healthCheck = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
              'apikey': currentSupabase.supabaseKey,
              'Authorization': `Bearer ${currentSupabase.supabaseKey}`
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.status === 503) {
            throw new Error('Supabase project is paused or unavailable (503). Please unpause it in your Supabase dashboard.');
          }
          
          if (!response.ok && response.status !== 404 && response.status !== 401 && response.status !== 400) {
            throw new Error(`Server returned status ${response.status}`);
          }
          return true;
        } catch (err: any) {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
            throw new Error('Request aborted due to timeout');
          }
          throw err;
        }
      };
      
      // Race everything against the timeout
      await Promise.race([
        healthCheck(),
        timeoutPromise
      ]);
      
      setNetworkInfo({ reachable: true, latency: Date.now() - start });
      
      setDbStatus('Connected');
      setDbError(null);
      if (manual) showToast('Database connected successfully', 'success');
    } catch (e: any) {
      console.error('Database connection check failed:', e);
      setDbStatus('Error');
      
      // Try to determine if it's a network issue
      if (e.message?.includes('timed out')) {
        setDbError(`Timeout: The browser could not reach ${supabaseUrl} within 10s. Check your internet connection or firewall.`);
      } else {
        setDbError(e.message || 'Unknown connection error');
      }
      
      if (manual) showToast(`Connection failed: ${e.message || 'Unknown error'}`, 'error');
    }
  };

  const checkServerHealth = async () => {
    setIsCheckingServer(true);
    setServerHealth(null);
    try {
      const response = await fetch('/api/supabase-health');
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      const data = await response.json();
      setServerHealth(data);
      if (data.status === 'ok') {
        showToast(`Server connection OK (${data.duration}ms)`, 'success');
      } else {
        showToast(`Server connection failed: ${data.error}`, 'error');
      }
    } catch (error: any) {
      setServerHealth({ status: 'error', error: error.message });
      showToast(`Failed to check server health: ${error.message}`, 'error');
    } finally {
      setIsCheckingServer(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRole.trim()) return;
    setIsProcessing(true);
    try {
      const updatedRoles = [...availableRoles, newRole.trim()];
      await addRole(newRole);
      await saveConfigItem('system_roles', updatedRoles);
      showToast(`Role '${newRole}' saved to database`, 'success');
      setNewRole('');
    } catch (e: any) {
      showToast(`Failed to save role: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteRole = async (role: string) => {
    setIsProcessing(true);
    try {
      const updatedRoles = availableRoles.filter(r => r !== role);
      await deleteRole(role);
      await saveConfigItem('system_roles', updatedRoles);
      showToast(`Role '${role}' removed and updated in database`, 'success');
    } catch (e: any) {
      showToast(`Failed to delete role: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddDept = async () => {
    if (!newDept.trim()) return;
    setIsProcessing(true);
    try {
      const updatedDepts = [...departments, newDept.trim()];
      await addDepartment(newDept);
      await saveConfigItem('system_departments', updatedDepts);
      showToast(`Department '${newDept}' saved to database`, 'success');
      setNewDept('');
    } catch (e: any) {
      showToast(`Failed to save department: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteDept = async (dept: string) => {
    setIsProcessing(true);
    try {
      const updatedDepts = departments.filter(d => d !== dept);
      await deleteDepartment(dept);
      await saveConfigItem('system_departments', updatedDepts);
      showToast(`Department '${dept}' removed and updated in database`, 'success');
    } catch (e: any) {
      showToast(`Failed to delete department: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddDesig = async () => {
    if (!newDesig.trim()) return;
    setIsProcessing(true);
    try {
      const updatedDesigs = [...designations, newDesig.trim()];
      await addDesignation(newDesig);
      await saveConfigItem('system_designations', updatedDesigs);
      showToast(`Designation '${newDesig}' saved to database`, 'success');
      setNewDesig('');
    } catch (e: any) {
      showToast(`Failed to save designation: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteDesig = async (desig: string) => {
    setIsProcessing(true);
    try {
      const updatedDesigs = designations.filter(d => d !== desig);
      await deleteDesignation(desig);
      await saveConfigItem('system_designations', updatedDesigs);
      showToast(`Designation '${desig}' removed and updated in database`, 'success');
    } catch (e: any) {
      showToast(`Failed to delete designation: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddLeadSource = async () => {
    if (!newLeadSource.trim() || !newLeadCode.trim()) return;
    
    // Auto-generate a unique ID
    const autoId = `LS-${Date.now()}`;

    setIsProcessing(true);
    try {
      const updatedSources = [...leadSources, { id: autoId, name: newLeadSource.trim(), code: newLeadCode.trim() }];
      await addLeadSource(autoId, newLeadSource, newLeadCode);
      await saveConfigItem('lead_source', updatedSources);
      showToast(`Lead Source '${newLeadSource}' saved to database`, 'success');
      setNewLeadSource('');
      setNewLeadCode('');
    } catch (e: any) {
      showToast(`Failed to save lead source: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFixDuplicateIds = async () => {
    setIsProcessing(true);
    try {
      const seenIds = new Set<string>();
      const cleanedSources = leadSources.map(source => {
        let uniqueId = source.id;
        let counter = 1;
        while (seenIds.has(uniqueId)) {
          uniqueId = `${source.id}_${counter}`;
          counter++;
        }
        seenIds.add(uniqueId);
        return { ...source, id: uniqueId };
      });

      // Update state
      cleanedSources.forEach(source => {
        updateLeadSource(source.id, source);
      });
      
      // Update DB
      await saveConfigItem('lead_source', cleanedSources);
      showToast(`Duplicate IDs fixed and saved to database`, 'success');
      
      // Force reload state by re-fetching or just updating locally
      // Since we updated state and DB, it should be fine.
    } catch (e: any) {
      showToast(`Failed to fix duplicate IDs: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteLeadSource = async (id: string, index: number) => {
    setIsProcessing(true);
    try {
      // Use index-based filtering to ensure only the selected item is removed,
      // even if IDs are duplicated in the current database state.
      const updatedSources = leadSources.filter((_, i) => i !== index);
      await deleteLeadSourceByIndex(index);
      await saveConfigItem('lead_source', updatedSources);
      showToast(`Lead Source removed and updated in database`, 'success');
    } catch (e: any) {
      showToast(`Failed to delete lead source: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateLeadSource = async (id: string, data: any) => {
    setIsProcessing(true);
    try {
      const updatedSources = leadSources.map(ls => ls.id === id ? { ...ls, ...data } : ls);
      updateLeadSource(id, data);
      await saveConfigItem('lead_source', updatedSources);
      showToast(`Lead Source updated in database`, 'success');
      setEditingLeadSourceId(null);
    } catch (e: any) {
      showToast(`Failed to update lead source: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddLeadBy = async () => {
    if (!newLeadBy.trim()) return;
    setIsProcessing(true);
    try {
      const updatedLeadBy = [...leadBy, newLeadBy.trim()];
      await addLeadBy(newLeadBy);
      await saveConfigItem('lead_by', updatedLeadBy);
      showToast(`Lead Access '${newLeadBy}' saved to database`, 'success');
      setNewLeadBy('');
    } catch (e: any) {
      showToast(`Failed to save lead access: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteLeadBy = async (item: string) => {
    setIsProcessing(true);
    try {
      const updatedLeadBy = leadBy.filter(l => l !== item);
      await deleteLeadBy(item);
      await saveConfigItem('lead_by', updatedLeadBy);
      showToast(`Lead Access removed and updated in database`, 'success');
    } catch (e: any) {
      showToast(`Failed to delete lead access: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddCounsellor = async () => {
    if (!newCounsellor.trim()) return;
    setIsProcessing(true);
    try {
      // Note: This old logic is deprecated in favor of toggleCounsellor
      await addCounsellor(newCounsellor);
      setNewCounsellor('');
      showToast(`Counsellor added`, 'success');
    } catch (e: any) {
      showToast(`Failed to save counsellor: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCounsellor = async (item: string) => {
    setIsProcessing(true);
    try {
      await deleteCounsellor(item);
      showToast(`Counsellor removed`, 'success');
    } catch (e: any) {
      showToast(`Failed to delete counsellor: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleDesignationInMap = async (desig: string) => {
    if (!selectedMappingDept) return;
    const current = departmentDesignationMap[selectedMappingDept] || [];
    const updated = current.includes(desig) 
      ? current.filter(d => d !== desig) 
      : [...current, desig];
    
    updateDeptMap(selectedMappingDept, updated);
    
    try {
      const updatedMap = {
        ...departmentDesignationMap,
        [selectedMappingDept]: updated
      };
      await saveConfigItem('dept_designation_map', updatedMap);
      showToast(`Mapping updated in database`, 'success');
    } catch (e: any) {
      showToast(`Failed to update mapping: ${e.message}`, 'error');
    }
  };

  const isCoreRole = (role: string) => ['superadmin', 'administrator', 'editor', 'teacher', 'viewer'].includes(role);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-supabase-text uppercase tracking-tight">Infrastructure Settings</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-supabase-sidebar text-supabase-muted border border-supabase-border text-[8px] font-black uppercase tracking-widest">
              <Database size={10} />
              Management Core
            </div>
          </div>
          <p className="text-supabase-muted text-sm italic">System-wide configuration and organizational scaling.</p>
        </div>
      </div>

      <div className="flex border-b border-supabase-border gap-6 overflow-x-auto scrollbar-hide">
        {[
          { id: 'roles', icon: ShieldPlus, label: 'Roles' },
          { id: 'departments', icon: Building2, label: 'Departments' },
          { id: 'designations', icon: Briefcase, label: 'Designations' },
          { id: 'mappings', icon: Link2, label: 'Relationship Mapping' },
          { id: 'lead_sources', icon: Share2, label: 'Work Access' },
          { id: 'system', icon: Server, label: 'System' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id ? 'text-supabase-green' : 'text-supabase-muted hover:text-supabase-text'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-supabase-green"></div>}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-left-4 duration-300">
            <div className="md:col-span-1 space-y-4">
               <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text">Add New Role</h3>
               <div className="flex gap-2">
                 <input type="text" value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Role name..." className="flex-1 bg-supabase-sidebar border border-supabase-border rounded-lg px-3 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green" />
                 <button onClick={handleAddRole} className="p-2 bg-supabase-green/10 text-supabase-green rounded-lg border border-supabase-green/20 hover:bg-supabase-green/20"><Plus size={18} /></button>
               </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 h-fit">
               {availableRoles.map(role => (
                 <div key={role} className="flex items-center justify-between p-4 bg-supabase-panel border border-supabase-border rounded-xl group">
                   <div className="flex items-center gap-3">
                     <Shield size={16} className={isCoreRole(role) ? 'text-supabase-muted' : 'text-supabase-green'} />
                     <span className="text-[11px] font-black uppercase tracking-widest">{role}</span>
                   </div>
                   {!isCoreRole(role) && <button onClick={() => handleDeleteRole(role)} className="text-supabase-muted hover:text-red-500 opacity-0 group-hover:opacity-100 disabled:opacity-50" disabled={isProcessing}><Trash2 size={14} /></button>}
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-right-4 duration-300">
            <div className="md:col-span-1 space-y-4">
               <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text">Define Unit</h3>
               <div className="flex gap-2">
                 <input type="text" value={newDept} onChange={e => setNewDept(e.target.value)} placeholder="Dept name..." className="flex-1 bg-supabase-sidebar border border-supabase-border rounded-lg px-3 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green" />
                 <button onClick={handleAddDept} className="p-2 bg-supabase-green/10 text-supabase-green rounded-lg border border-supabase-green/20 hover:bg-supabase-green/20"><Plus size={18} /></button>
               </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 h-fit">
               {departments.map(dept => (
                 <div key={dept} className="flex items-center justify-between p-4 bg-supabase-panel border border-supabase-border rounded-xl group">
                   <div className="flex items-center gap-3"><Building2 size={16} className="text-supabase-muted" /><span className="text-[11px] font-black uppercase tracking-widest">{dept}</span></div>
                   <button onClick={() => handleDeleteDept(dept)} className="text-supabase-muted hover:text-red-500 opacity-0 group-hover:opacity-100 disabled:opacity-50" disabled={isProcessing}><Trash2 size={14} /></button>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'designations' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in zoom-in-95 duration-300">
            <div className="md:col-span-1 space-y-4">
               <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text">Create Designation</h3>
               <div className="flex gap-2">
                 <input type="text" value={newDesig} onChange={e => setNewDesig(e.target.value)} placeholder="Title..." className="flex-1 bg-supabase-sidebar border border-supabase-border rounded-lg px-3 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green" />
                 <button onClick={handleAddDesig} className="p-2 bg-supabase-green/10 text-supabase-green rounded-lg border border-supabase-green/20 hover:bg-supabase-green/20"><Plus size={18} /></button>
               </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 h-fit">
               {designations.map(desig => (
                 <div key={desig} className="flex items-center justify-between p-4 bg-supabase-panel border border-supabase-border rounded-xl group">
                   <div className="flex items-center gap-3"><Award size={16} className="text-supabase-muted" /><span className="text-[11px] font-black uppercase tracking-widest">{desig}</span></div>
                   <button onClick={() => handleDeleteDesig(desig)} className="text-supabase-muted hover:text-red-500 opacity-0 group-hover:opacity-100 disabled:opacity-50" disabled={isProcessing}><Trash2 size={14} /></button>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'mappings' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-400 h-[500px]">
            <div className="md:col-span-4 bg-supabase-panel border border-supabase-border rounded-2xl overflow-hidden flex flex-col">
               <div className="px-5 py-4 border-b border-supabase-border bg-supabase-sidebar">
                  <h3 className="text-[10px] font-black uppercase text-supabase-muted tracking-widest flex items-center gap-2"><Building2 size={12}/> Parent Departments</h3>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {departments.map(dept => (
                    <button key={dept} onClick={() => setSelectedMappingDept(dept)} className={`w-full text-left p-4 border-b border-supabase-border/30 flex items-center justify-between transition-all ${selectedMappingDept === dept ? 'bg-supabase-green/10 text-supabase-green' : 'hover:bg-supabase-hover'}`}>
                        <span className="text-[11px] font-black uppercase tracking-widest">{dept}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-supabase-sidebar px-1.5 py-0.5 rounded border border-supabase-border text-supabase-muted">{(departmentDesignationMap[dept] || []).length}</span>
                            {selectedMappingDept === dept && <ChevronRight size={14} />}
                        </div>
                    </button>
                  ))}
               </div>
            </div>
            <div className="md:col-span-8 bg-supabase-panel border border-supabase-border rounded-2xl overflow-hidden flex flex-col">
              {selectedMappingDept ? (
                <>
                  <div className="px-6 py-4 border-b border-supabase-border bg-supabase-sidebar flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text">Mapped Designations for {selectedMappingDept}</h3>
                    <div className="text-[9px] text-supabase-muted italic">Click to link or unlink roles</div>
                  </div>
                  <div className="flex-1 p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto custom-scrollbar">
                    {designations.map(desig => {
                      const isMapped = (departmentDesignationMap[selectedMappingDept] || []).includes(desig);
                      return (
                        <button 
                          key={desig} 
                          onClick={() => toggleDesignationInMap(desig)}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isMapped ? 'bg-supabase-green/5 border-supabase-green text-supabase-green shadow-sm' : 'bg-supabase-sidebar border-supabase-border text-supabase-muted hover:border-supabase-muted'}`}
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest">{desig}</span>
                          {isMapped && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-supabase-muted opacity-30 gap-3">
                  <Link2 size={48} />
                  <p className="text-xs font-black uppercase tracking-widest">Select a department to manage role mappings</p>
                </div>
              )}
            </div>
          </div>
        )}


        {activeTab === 'lead_sources' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="flex border-b border-supabase-border/50 gap-4 mb-4">
              <button 
                onClick={() => setActiveLeadSourceSubTab('manage')}
                className={`pb-2 text-[9px] font-black uppercase tracking-widest transition-all relative ${
                  activeLeadSourceSubTab === 'manage' ? 'text-supabase-green' : 'text-supabase-muted hover:text-supabase-text'
                }`}
              >
                Manage Lead Sources
                {activeLeadSourceSubTab === 'manage' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-supabase-green"></div>}
              </button>
              <button 
                onClick={() => setActiveLeadSourceSubTab('lead_by')}
                className={`pb-2 text-[9px] font-black uppercase tracking-widest transition-all relative ${
                  activeLeadSourceSubTab === 'lead_by' ? 'text-supabase-green' : 'text-supabase-muted hover:text-supabase-text'
                }`}
              >
                Lead Access
                {activeLeadSourceSubTab === 'lead_by' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-supabase-green"></div>}
              </button>
              <button 
                onClick={() => setActiveLeadSourceSubTab('counsellors')}
                className={`pb-2 text-[9px] font-black uppercase tracking-widest transition-all relative ${
                  activeLeadSourceSubTab === 'counsellors' ? 'text-supabase-green' : 'text-supabase-muted hover:text-supabase-text'
                }`}
              >
                Counsellors
                {activeLeadSourceSubTab === 'counsellors' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-supabase-green"></div>}
              </button>
            </div>

            {activeLeadSourceSubTab === 'manage' && (
              <div className="bg-supabase-panel border border-supabase-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text flex items-center gap-2">
                    <Share2 size={14} className="text-supabase-green" />
                    Manage Lead Sources
                  </h3>
                  {leadSources.length > 0 && (
                    <button
                      onClick={handleFixDuplicateIds}
                      className="text-[9px] font-black uppercase tracking-widest text-supabase-muted hover:text-supabase-green transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw size={12} className={isProcessing ? 'animate-spin' : ''} />
                      Fix Duplicate IDs
                    </button>
                  )}
                </div>
                
                <div className="flex gap-2 mb-8">
                  <div className="flex-[0.3]">
                    <input
                      type="text"
                      value={newLeadCode}
                      onChange={(e) => setNewLeadCode(e.target.value)}
                      placeholder="Lead Code..."
                      className="w-full bg-supabase-sidebar border border-supabase-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-supabase-green transition-colors"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLeadSource()}
                    />
                  </div>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-supabase-muted" size={16} />
                    <input
                      type="text"
                      value={newLeadSource}
                      onChange={(e) => setNewLeadSource(e.target.value)}
                      placeholder="Enter new lead source (e.g. Facebook, Referral)..."
                      className="w-full bg-supabase-sidebar border border-supabase-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-supabase-green transition-colors"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLeadSource()}
                    />
                  </div>
                  <button
                    onClick={handleAddLeadSource}
                    disabled={isProcessing || !newLeadSource.trim() || !newLeadCode.trim()}
                    className="bg-supabase-green text-supabase-bg px-6 rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Add
                  </button>
                </div>

                <div className="overflow-hidden border border-supabase-border rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-supabase-sidebar border-b border-supabase-border">
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-supabase-muted w-24">Lead Code</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-supabase-muted">Lead Source Name</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-supabase-muted w-16 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-supabase-border/30">
                      {leadSources.map((source, index) => (
                        <tr key={`${source.id}-${index}`} className="hover:bg-supabase-hover transition-colors group">
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-mono text-supabase-muted bg-supabase-panel px-1.5 py-0.5 rounded border border-supabase-border">{source.code || source.id}</span>
                          </td>
                          <td className="px-4 py-3">
                            {editingLeadSourceId === source.id ? (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={editingLeadSourceName}
                                  onChange={(e) => setEditingLeadSourceName(e.target.value)}
                                  className="flex-1 bg-supabase-sidebar border border-supabase-border rounded-lg py-1 px-2 text-sm focus:outline-none focus:border-supabase-green"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateLeadSource(source.id, { name: editingLeadSourceName });
                                    if (e.key === 'Escape') setEditingLeadSourceId(null);
                                  }}
                                />
                                <button 
                                  onClick={() => handleUpdateLeadSource(source.id, { name: editingLeadSourceName })}
                                  className="text-supabase-green hover:opacity-80"
                                >
                                  <Check size={14} />
                                </button>
                                <button 
                                  onClick={() => setEditingLeadSourceId(null)}
                                  className="text-supabase-muted hover:text-supabase-text"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-supabase-text">{source.name}</span>
                                <button 
                                  onClick={() => {
                                    setEditingLeadSourceId(source.id);
                                    setEditingLeadSourceName(source.name);
                                  }}
                                  className="text-supabase-muted hover:text-supabase-green opacity-0 group-hover:opacity-100 transition-all text-[10px] font-black uppercase tracking-widest"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDeleteLeadSource(source.id, index)}
                              className="text-supabase-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {leadSources.length === 0 && (
                    <div className="p-8 text-center text-supabase-muted italic text-xs">
                      No lead sources defined.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeLeadSourceSubTab === 'lead_by' && (
              <div className="bg-supabase-panel border border-supabase-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text flex items-center gap-2">
                    <UserCheck size={14} className="text-supabase-green" />
                    Lead Access (Map Leaders)
                  </h3>
                  <span className="text-[10px] text-supabase-muted italic">Map employees to lead sources</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: All Employees */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-supabase-muted">All Employees</span>
                      <span className="text-[10px] text-supabase-muted">{allEmployees.length} Total</span>
                    </div>
                    <div className="border border-supabase-border rounded-xl overflow-hidden bg-supabase-sidebar max-h-[400px] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-supabase-panel border-b border-supabase-border">
                            <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-supabase-muted">Name</th>
                            <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-supabase-muted text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-supabase-border/30">
                          {allEmployees.map((emp) => {
                            const isEnabled = mapLeaders.some(ml => ml.uuid === emp.id);
                            return (
                              <tr key={emp.id} className="hover:bg-supabase-hover transition-colors group">
                                <td className="px-4 py-2">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-supabase-text">{emp.full_name}</span>
                                    <span className="text-[9px] font-mono text-supabase-muted">{emp.employee_id || emp.id?.substring(0, 8)}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <button
                                    onClick={() => toggleMapLeader(emp)}
                                    disabled={isProcessing}
                                    className={`p-1.5 rounded-lg transition-all ${
                                      isEnabled 
                                        ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' 
                                        : 'text-supabase-muted hover:text-supabase-green hover:bg-supabase-green/10'
                                    }`}
                                    title={isEnabled ? "Disable" : "Enable"}
                                  >
                                    {isEnabled ? <Ban size={14} /> : <UserPlus size={14} />}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {allEmployees.length === 0 && (
                            <tr>
                              <td colSpan={2} className="px-4 py-8 text-center text-supabase-muted italic text-xs">
                                No employees found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Column: Enabled Employees */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-supabase-muted">Enabled Leaders</span>
                      <span className="text-[10px] text-supabase-muted">{mapLeaders.length} Enabled</span>
                    </div>
                    <div className="border border-supabase-border rounded-xl overflow-hidden bg-supabase-sidebar max-h-[400px] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-supabase-panel border-b border-supabase-border">
                            <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-supabase-muted">ID</th>
                            <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-supabase-muted">Name</th>
                            <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-supabase-muted text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-supabase-border/30">
                          {mapLeaders.map((leader) => (
                            <tr key={leader.id} className="hover:bg-supabase-hover transition-colors group">
                              <td className="px-4 py-2">
                                <span className="text-[10px] font-mono text-supabase-muted bg-supabase-panel px-1.5 py-0.5 rounded border border-supabase-border">{leader.id}</span>
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-supabase-text">{leader.name}</span>
                                  <span className="text-[9px] font-mono text-supabase-muted">
                                    {leader.employee_id || allEmployees.find(e => e.id === leader.uuid)?.employee_id || leader.uuid?.substring(0, 8)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right">
                                <button
                                  onClick={() => {
                                    const emp = allEmployees.find(e => e.id === leader.uuid);
                                    if (emp) toggleMapLeader(emp);
                                  }}
                                  disabled={isProcessing}
                                  className="p-1.5 text-red-500 hover:text-red-600 transition-all"
                                  title="Disable"
                                >
                                  <Ban size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {mapLeaders.length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-4 py-8 text-center text-supabase-muted italic text-xs">
                                No leaders enabled.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeLeadSourceSubTab === 'counsellors' && (
              <div className="bg-supabase-panel border border-supabase-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text flex items-center gap-2">
                    <User size={14} className="text-supabase-green" />
                    Manage Counsellors
                  </h3>
                  <span className="text-[10px] text-supabase-muted italic">Map employees as counsellors</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: All Employees */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-supabase-muted">All Employees</span>
                      <span className="text-[10px] text-supabase-muted">{allEmployees.length} Total</span>
                    </div>
                    <div className="border border-supabase-border rounded-xl overflow-hidden bg-supabase-sidebar max-h-[400px] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-supabase-panel border-b border-supabase-border">
                            <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-supabase-muted">Name</th>
                            <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-supabase-muted text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-supabase-border/30">
                          {allEmployees.map((emp) => {
                            const isEnabled = counsellors.some(c => c.uuid === emp.id);
                            return (
                              <tr key={emp.id} className="hover:bg-supabase-hover transition-colors group">
                                <td className="px-4 py-2">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-supabase-text">{emp.full_name}</span>
                                    <span className="text-[9px] font-mono text-supabase-muted">{emp.employee_id || emp.id?.substring(0, 8)}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <button
                                    onClick={() => toggleCounsellor(emp)}
                                    disabled={isProcessing}
                                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                      isEnabled 
                                        ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' 
                                        : 'text-supabase-muted hover:text-supabase-green hover:bg-supabase-green/10'
                                    }`}
                                    title={isEnabled ? "Disable" : "Enable"}
                                  >
                                    {isEnabled ? <Ban size={14} /> : <UserPlus size={14} />}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {allEmployees.length === 0 && (
                            <tr>
                              <td colSpan={2} className="px-4 py-8 text-center text-supabase-muted italic text-xs">
                                No employees found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Column: Enabled Counsellors */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-supabase-muted">Enabled Counsellors</span>
                      <span className="text-[10px] text-supabase-muted">{counsellors.length} Enabled</span>
                    </div>
                    <div className="border border-supabase-border rounded-xl overflow-hidden bg-supabase-sidebar max-h-[400px] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-supabase-panel border-b border-supabase-border">
                            <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-supabase-muted">ID</th>
                            <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-supabase-muted">Name</th>
                            <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-supabase-muted text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-supabase-border/30">
                          {counsellors.map((c) => (
                            <tr key={c.id} className="hover:bg-supabase-hover transition-colors group">
                              <td className="px-4 py-2">
                                <span className="text-[10px] font-mono text-supabase-muted bg-supabase-panel px-1.5 py-0.5 rounded border border-supabase-border">{c.id}</span>
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-supabase-text">{c.name}</span>
                                  <span className="text-[9px] font-mono text-supabase-muted">
                                    {c.employee_id || allEmployees.find(e => e.id === c.uuid)?.employee_id || c.uuid?.substring(0, 8)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right">
                                <button
                                  onClick={() => {
                                    const emp = allEmployees.find(e => e.id === c.uuid);
                                    if (emp) toggleCounsellor(emp);
                                  }}
                                  disabled={isProcessing}
                                  className="p-1.5 text-red-500 hover:text-red-600 transition-all cursor-pointer"
                                  title="Disable"
                                >
                                  <Ban size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {counsellors.length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-4 py-8 text-center text-supabase-muted italic text-xs">
                                No counsellors enabled.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* System Health Section */}
              <div className="bg-supabase-panel border border-supabase-border rounded-2xl overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-supabase-border bg-supabase-sidebar flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text flex items-center gap-2">
                    <Activity size={14} className="text-supabase-green" />
                    System Health & Connectivity
                  </h3>
                  <button 
                    onClick={() => checkDatabaseConnection(true)}
                    className="p-1.5 text-supabase-muted hover:text-supabase-green transition-colors"
                  >
                    <RefreshCw size={14} className={dbStatus === 'Checking' ? 'animate-spin' : ''} />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-supabase-sidebar border border-supabase-border rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black text-supabase-muted uppercase tracking-widest">Client Status</p>
                        <button 
                          onClick={() => checkDatabaseConnection(true)}
                          className="p-1 text-supabase-muted hover:text-supabase-green transition-colors"
                          title="Check Client Connection"
                        >
                          <RefreshCw size={10} className={dbStatus === 'Checking' ? 'animate-spin' : ''} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          dbStatus === 'Connected' ? 'bg-supabase-green shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                          dbStatus === 'Checking' ? 'bg-orange-400 animate-pulse' : 
                          'bg-red-500'
                        }`} />
                        <span className={`text-sm font-black uppercase tracking-tight ${
                          dbStatus === 'Connected' ? 'text-supabase-green' : 
                          dbStatus === 'Checking' ? 'text-orange-400' : 
                          'text-red-500'
                        }`}>{dbStatus}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-supabase-sidebar border border-supabase-border rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black text-supabase-muted uppercase tracking-widest">Server Status</p>
                        <button 
                          onClick={checkServerHealth}
                          disabled={isCheckingServer}
                          className="p-1 text-supabase-muted hover:text-supabase-green transition-colors disabled:opacity-50"
                          title="Check Server Connection"
                        >
                          <RefreshCw size={10} className={isCheckingServer ? 'animate-spin' : ''} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          serverHealth?.status === 'ok' ? 'bg-supabase-green shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                          isCheckingServer ? 'bg-orange-400 animate-pulse' : 
                          serverHealth?.status === 'error' ? 'bg-red-500' :
                          'bg-supabase-muted'
                        }`} />
                        <span className={`text-sm font-black uppercase tracking-tight ${
                          serverHealth?.status === 'ok' ? 'text-supabase-green' : 
                          isCheckingServer ? 'text-orange-400' : 
                          serverHealth?.status === 'error' ? 'text-red-500' :
                          'text-supabase-muted'
                        }`}>
                          {isCheckingServer ? 'Checking' : (serverHealth?.status === 'ok' ? 'Connected' : (serverHealth?.status === 'error' ? 'Error' : 'Unknown'))}
                        </span>
                        {serverHealth?.duration && (
                          <span className="text-[10px] text-supabase-muted font-mono ml-auto">{serverHealth.duration}ms</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {serverHealth?.error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3">
                      <Server size={18} className="text-red-400 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Server Connection Error</p>
                        <p className="text-xs text-red-300/80 leading-relaxed font-mono">{serverHealth.error}</p>
                      </div>
                    </div>
                  )}

                  {dbError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-3">
                      <div className="flex gap-3">
                        <WifiOff size={18} className="text-red-400 shrink-0" />
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Connection Error</p>
                          <p className="text-xs text-red-300/80 leading-relaxed font-mono">{dbError}</p>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-red-500/10 flex flex-wrap gap-2">
                        <div className="px-2 py-1 bg-red-500/20 rounded text-[9px] font-mono text-red-300">
                          Reachability: {networkInfo.reachable === null ? 'Unknown' : (networkInfo.reachable ? 'YES' : 'NO')}
                        </div>
                        {networkInfo.latency && (
                          <div className="px-2 py-1 bg-red-500/20 rounded text-[9px] font-mono text-red-300">
                            Latency: {networkInfo.latency}ms
                          </div>
                        )}
                        {networkInfo.error && (
                          <div className="px-2 py-1 bg-red-500/20 rounded text-[9px] font-mono text-red-300">
                            Net Error: {networkInfo.error}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-supabase-muted">Environment Variables</h4>
                    <div className="space-y-2">
                      {[
                        { name: 'VITE_SUPABASE_URL', status: !!supabase },
                        { name: 'VITE_SUPABASE_ANON_KEY', status: !!supabase }
                      ].map(env => (
                        <div key={env.name} className="flex items-center justify-between p-3 bg-supabase-sidebar/50 border border-supabase-border/50 rounded-lg">
                          <span className="text-[10px] font-mono text-supabase-muted">{env.name}</span>
                          {env.status ? (
                            <Check size={12} className="text-supabase-green" />
                          ) : (
                            <X size={12} className="text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-supabase-border/50">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-supabase-muted">Application Version</h4>
                    <div className="flex items-center justify-between p-3 bg-supabase-sidebar/50 border border-supabase-border/50 rounded-lg">
                      <span className="text-[10px] font-mono text-supabase-muted">Current Build</span>
                      <span className="text-[10px] font-mono text-supabase-green font-bold">v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seed Data Section */}
              <div className="bg-supabase-panel border border-supabase-border rounded-2xl overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-supabase-border bg-supabase-sidebar">
                  <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text flex items-center gap-2">
                    <Database size={14} className="text-supabase-green" />
                    Seed Data Management
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="p-4 bg-supabase-sidebar border border-supabase-border rounded-xl space-y-3 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-supabase-panel flex items-center justify-center text-supabase-muted">
                        <UserCheck size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-supabase-text uppercase tracking-tight">Sample Personnel</p>
                        <p className="text-[10px] text-supabase-muted uppercase tracking-widest">Coming Soon</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-supabase-muted leading-relaxed">
                      Populate sample teachers, students, and employees to test HR and attendance features.
                    </p>
                    <button 
                      disabled
                      className="w-full py-3 bg-supabase-panel border border-supabase-border text-supabase-muted rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
                    >
                      Locked
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-supabase-sidebar border border-supabase-border rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-supabase-panel border border-supabase-border flex items-center justify-center text-supabase-muted">
                  <Server size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-supabase-text uppercase tracking-tight">System Version</h4>
                  <p className="text-[10px] text-supabase-muted font-mono uppercase tracking-widest">v2.4.0-stable (Enterprise)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-supabase-text uppercase tracking-widest">Last Infrastructure Sync</p>
                  <p className="text-[10px] text-supabase-muted font-mono">{new Date().toLocaleString()}</p>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      await saveSystemConfig();
                      showToast("Full system backup successful", "success");
                    } catch (e: any) {
                      showToast("Backup failed: " + e.message, "error");
                    }
                  }}
                  className="px-6 py-2.5 bg-supabase-panel border border-supabase-border text-supabase-text rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-supabase-green transition-all"
                >
                  Full System Backup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-supabase-panel border border-supabase-border rounded-2xl flex flex-col md:flex-row items-center gap-6 shadow-sm border-dashed">
        <div className="w-12 h-12 rounded-xl bg-supabase-green/10 flex items-center justify-center text-supabase-green shrink-0">
          <CloudCheck size={24} />
        </div>
        <div className="flex-1">
            <h3 className="text-[10px] font-black uppercase text-supabase-text tracking-[0.2em] mb-1">Infrastructure Persistence</h3>
            <p className="text-xs leading-relaxed text-supabase-muted max-w-2xl">
              Configuration objects are stored in the <strong>system_config</strong> table. Relationships defined here drive the dynamic logic in the personnel matrix.
            </p>
        </div>
      </div>

    </div>
  );
};

export default SettingsView;
