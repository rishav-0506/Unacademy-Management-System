
import React, { useState, useEffect } from 'react';
import { Search, FileText, Printer, Loader2, User, Calendar, CreditCard, Download, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../context/ToastContext';

interface Student {
  id: string;
  full_name: string;
  student_id: string;
  class_name: string;
}

interface FeeItem {
  id: string;
  name: string;
  amount: number;
}

interface Bill {
  id: string;
  student_id: string;
  student_name: string;
  total_amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  created_at: string;
}

const BillingView: React.FC = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [feeStructure, setFeeStructure] = useState<FeeItem[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Bill Form
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedFees, setSelectedFees] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const [studentsRes, feeRes, billsRes] = await Promise.all([
        supabase.from('students').select('id, full_name, student_id, class_name'),
        supabase.from('fee_structure').select('id, name, amount'),
        supabase.from('student_bills').select('*').order('created_at', { ascending: false })
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (feeRes.error) throw feeRes.error;
      if (billsRes.error) throw billsRes.error;

      setStudents(studentsRes.data || []);
      setFeeStructure(feeRes.data || []);
      setBills(billsRes.data || []);
    } catch (e: any) {
      showToast("Failed to load billing data: " + e.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBill = async () => {
    if (!selectedStudent || selectedFees.length === 0 || !supabase) {
      showToast("Please select a student and at least one fee component", "error");
      return;
    }

    setIsGenerating(true);
    try {
      const student = students.find(s => s.id === selectedStudent);
      const selectedFeeItems = feeStructure.filter(f => selectedFees.includes(f.id));
      const totalAmount = selectedFeeItems.reduce((sum, f) => sum + f.amount, 0);

      const { data, error } = await supabase
        .from('student_bills')
        .insert([{
          student_id: selectedStudent,
          student_name: student?.full_name,
          total_amount: totalAmount,
          due_date: dueDate,
          status: 'pending',
          fee_details: selectedFeeItems
        }])
        .select();

      if (error) throw error;

      setBills([data[0], ...bills]);
      setSelectedStudent('');
      setSelectedFees([]);
      showToast("Bill generated successfully", "success");
    } catch (e: any) {
      showToast("Failed to generate bill: " + e.message, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredBills = bills.filter(bill => 
    bill.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-supabase-text uppercase tracking-tight">Billing & Invoicing</h1>
          <p className="text-supabase-muted text-sm italic">Generate and manage student fee invoices.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-supabase-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search bills..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-supabase-panel border border-supabase-border rounded-xl pl-10 pr-4 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* New Bill Generator */}
        <div className="lg:col-span-1">
          <div className="bg-supabase-panel border border-supabase-border rounded-2xl p-6 space-y-6 sticky top-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text flex items-center gap-2">
              <Plus size={14} className="text-supabase-green" />
              Generate New Bill
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-supabase-muted uppercase tracking-widest">Select Student</label>
                <select 
                  value={selectedStudent}
                  onChange={e => setSelectedStudent(e.target.value)}
                  className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-3 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green"
                >
                  <option value="">Choose a student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.student_id})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-supabase-muted uppercase tracking-widest">Due Date</label>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-3 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-supabase-muted uppercase tracking-widest">Fee Components</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {feeStructure.map(fee => (
                    <label key={fee.id} className="flex items-center gap-3 p-2 bg-supabase-sidebar border border-supabase-border rounded-lg cursor-pointer hover:border-supabase-green/30 transition-all">
                      <input 
                        type="checkbox" 
                        checked={selectedFees.includes(fee.id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedFees([...selectedFees, fee.id]);
                          else setSelectedFees(selectedFees.filter(id => id !== fee.id));
                        }}
                        className="w-4 h-4 rounded border-supabase-border text-supabase-green focus:ring-supabase-green bg-supabase-panel"
                      />
                      <div className="flex-1">
                        <div className="text-[11px] font-black text-supabase-text uppercase tracking-tight">{fee.name}</div>
                        <div className="text-[10px] text-supabase-green font-black">${fee.amount.toLocaleString()}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-supabase-border">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-supabase-muted uppercase tracking-widest">Total Amount</span>
                  <span className="text-lg font-black text-supabase-green">
                    ${feeStructure.filter(f => selectedFees.includes(f.id)).reduce((sum, f) => sum + f.amount, 0).toLocaleString()}
                  </span>
                </div>
                <button 
                  onClick={handleGenerateBill}
                  disabled={isGenerating}
                  className="w-full py-3 bg-supabase-green text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-supabase-greenHover transition-all flex items-center justify-center gap-2"
                >
                  {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  Generate Invoice
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bill List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text">Recent Invoices</h3>
            <div className="text-[10px] text-supabase-muted uppercase tracking-widest font-black flex gap-4">
              <span>Total: {bills.length}</span>
              <span className="text-supabase-green">Paid: {bills.filter(b => b.status === 'paid').length}</span>
              <span className="text-orange-400">Pending: {bills.filter(b => b.status === 'pending').length}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-supabase-panel border border-supabase-border rounded-2xl">
              <Loader2 className="animate-spin text-supabase-green mb-4" size={32} />
              <p className="text-xs font-black uppercase tracking-widest text-supabase-muted">Loading Billing Ledger...</p>
            </div>
          ) : filteredBills.length > 0 ? (
            <div className="bg-supabase-panel border border-supabase-border rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-supabase-sidebar border-b border-supabase-border">
                    <th className="px-6 py-4 text-[10px] font-black text-supabase-muted uppercase tracking-widest">Invoice ID</th>
                    <th className="px-6 py-4 text-[10px] font-black text-supabase-muted uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4 text-[10px] font-black text-supabase-muted uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black text-supabase-muted uppercase tracking-widest">Due Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-supabase-muted uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-supabase-muted uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-supabase-border">
                  {filteredBills.map(bill => (
                    <tr key={bill.id} className="hover:bg-supabase-sidebar/50 transition-all group">
                      <td className="px-6 py-4">
                        <div className="text-[11px] font-mono text-supabase-muted">#{bill.id.slice(0, 8).toUpperCase()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-supabase-sidebar flex items-center justify-center text-supabase-green">
                            <User size={14} />
                          </div>
                          <div>
                            <div className="text-xs font-black text-supabase-text uppercase tracking-tight">{bill.student_name}</div>
                            <div className="text-[10px] text-supabase-muted uppercase tracking-widest">ID: {bill.student_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-black text-supabase-green">${bill.total_amount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-[11px] text-supabase-muted">
                          <Calendar size={12} />
                          {new Date(bill.due_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                          bill.status === 'paid' ? 'bg-supabase-green/10 text-supabase-green' :
                          bill.status === 'pending' ? 'bg-orange-400/10 text-orange-400' :
                          'bg-red-400/10 text-red-400'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button className="p-2 hover:bg-supabase-sidebar rounded-lg text-supabase-muted hover:text-supabase-green transition-all" title="Print Invoice">
                            <Printer size={14} />
                          </button>
                          <button className="p-2 hover:bg-supabase-sidebar rounded-lg text-supabase-muted hover:text-supabase-green transition-all" title="Download PDF">
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-supabase-panel border border-supabase-border border-dashed rounded-2xl text-supabase-muted">
              <FileText size={48} className="mb-4 opacity-20" />
              <p className="text-xs font-black uppercase tracking-widest">No invoices found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingView;
