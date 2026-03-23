
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2, BookOpen, DollarSign, Layers } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../context/ToastContext';

interface FeeItem {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  description?: string;
}

const FeeStructureView: React.FC = () => {
  const { showToast } = useToast();
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newFee, setNewFee] = useState({
    name: '',
    amount: '',
    frequency: 'monthly' as const,
    description: ''
  });

  useEffect(() => {
    fetchFeeStructure();
  }, []);

  const fetchFeeStructure = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fee_structure')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeeItems(data || []);
    } catch (e: any) {
      showToast("Failed to fetch fee structure: " + e.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFee = async () => {
    if (!newFee.name || !newFee.amount || !supabase) {
      showToast("Name and Amount are required", "error");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('fee_structure')
        .insert([{
          name: newFee.name,
          amount: parseFloat(newFee.amount),
          frequency: newFee.frequency,
          description: newFee.description
        }])
        .select();

      if (error) throw error;
      
      setFeeItems([data[0], ...feeItems]);
      setNewFee({ name: '', amount: '', frequency: 'monthly', description: '' });
      showToast("Fee item added successfully", "success");
    } catch (e: any) {
      showToast("Failed to add fee: " + e.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFee = async (id: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('fee_structure')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setFeeItems(feeItems.filter(f => f.id !== id));
      showToast("Fee item removed", "success");
    } catch (e: any) {
      showToast("Failed to remove fee: " + e.message, "error");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-supabase-text uppercase tracking-tight">Fee Structure</h1>
          <p className="text-supabase-muted text-sm italic">Define and manage standard fee components for the institution.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-supabase-panel border border-supabase-border rounded-2xl p-6 space-y-4 sticky top-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text flex items-center gap-2">
              <Plus size={14} className="text-supabase-green" />
              Add Fee Component
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-supabase-muted uppercase tracking-widest">Component Name</label>
                <input 
                  type="text" 
                  value={newFee.name} 
                  onChange={e => setNewFee({...newFee, name: e.target.value})} 
                  placeholder="e.g. Tuition Fee" 
                  className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-3 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-supabase-muted uppercase tracking-widest">Amount</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-supabase-muted">
                    <DollarSign size={14} />
                  </div>
                  <input 
                    type="number" 
                    value={newFee.amount} 
                    onChange={e => setNewFee({...newFee, amount: e.target.value})} 
                    placeholder="0.00" 
                    className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg pl-8 pr-3 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green" 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-supabase-muted uppercase tracking-widest">Frequency</label>
                <select 
                  value={newFee.frequency} 
                  onChange={e => setNewFee({...newFee, frequency: e.target.value as any})}
                  className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-3 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-supabase-muted uppercase tracking-widest">Description (Optional)</label>
                <textarea 
                  value={newFee.description} 
                  onChange={e => setNewFee({...newFee, description: e.target.value})} 
                  placeholder="Brief details..." 
                  rows={2}
                  className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-3 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green resize-none" 
                />
              </div>
              <button 
                onClick={handleAddFee}
                disabled={isSaving}
                className="w-full py-2.5 bg-supabase-green text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-supabase-greenHover transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Component
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text">Current Fee Structure</h3>
            <div className="text-[10px] text-supabase-muted uppercase tracking-widest font-black">
              Total Components: {feeItems.length}
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-supabase-panel border border-supabase-border rounded-2xl">
              <Loader2 className="animate-spin text-supabase-green mb-4" size={32} />
              <p className="text-xs font-black uppercase tracking-widest text-supabase-muted">Synchronizing Schema...</p>
            </div>
          ) : feeItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {feeItems.map(fee => (
                <div key={fee.id} className="bg-supabase-panel border border-supabase-border rounded-2xl p-5 group hover:border-supabase-green/50 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-supabase-green/10 text-supabase-green rounded-lg">
                      <DollarSign size={20} />
                    </div>
                    <button 
                      onClick={() => handleDeleteFee(fee.id)}
                      className="text-supabase-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h4 className="text-sm font-black text-supabase-text uppercase tracking-tight mb-1">{fee.name}</h4>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-xl font-black text-supabase-green">${fee.amount.toLocaleString()}</span>
                    <span className="text-[10px] font-black text-supabase-muted uppercase tracking-widest">/ {fee.frequency}</span>
                  </div>
                  {fee.description && (
                    <p className="text-[11px] text-supabase-muted italic leading-relaxed line-clamp-2">
                      {fee.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-supabase-panel border border-supabase-border border-dashed rounded-2xl text-supabase-muted">
              <Layers size={48} className="mb-4 opacity-20" />
              <p className="text-xs font-black uppercase tracking-widest">No fee components defined yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeeStructureView;
