
import React, { useState, useEffect } from 'react';
import { Search, DollarSign, CreditCard, Loader2, User, Calendar, CheckCircle2, AlertCircle, History, Receipt } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../context/ToastContext';

interface Bill {
  id: string;
  student_id: string;
  student_name: string;
  total_amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  fee_details: any[];
}

interface Payment {
  id: string;
  bill_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  created_at: string;
}

const FeeCollectionView: React.FC = () => {
  const { showToast } = useToast();
  const [pendingBills, setPendingBills] = useState<Bill[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Payment Form
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const [billsRes, paymentsRes] = await Promise.all([
        supabase.from('student_bills').select('*').eq('status', 'pending').order('due_date', { ascending: true }),
        supabase.from('fee_payments').select('*').order('created_at', { ascending: false }).limit(10)
      ]);

      if (billsRes.error) throw billsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      setPendingBills(billsRes.data || []);
      setRecentPayments(paymentsRes.data || []);
    } catch (e: any) {
      showToast("Failed to load fee collection data: " + e.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedBill || !supabase) return;

    setIsProcessing(true);
    try {
      // 1. Record the payment
      const { data: paymentData, error: paymentError } = await supabase
        .from('fee_payments')
        .insert([{
          bill_id: selectedBill.id,
          student_id: selectedBill.student_id,
          student_name: selectedBill.student_name,
          amount: selectedBill.total_amount,
          payment_method: paymentMethod,
          transaction_id: transactionId || `TXN-${Date.now()}`
        }])
        .select();

      if (paymentError) throw paymentError;

      // 2. Update bill status
      const { error: billError } = await supabase
        .from('student_bills')
        .update({ status: 'paid' })
        .eq('id', selectedBill.id);

      if (billError) throw billError;

      // 3. Update local state
      setPendingBills(pendingBills.filter(b => b.id !== selectedBill.id));
      setRecentPayments([paymentData[0], ...recentPayments.slice(0, 9)]);
      setSelectedBill(null);
      setTransactionId('');
      showToast("Payment processed successfully", "success");
    } catch (e: any) {
      showToast("Failed to process payment: " + e.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredBills = pendingBills.filter(bill => 
    bill.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-supabase-text uppercase tracking-tight">Fee Collection</h1>
          <p className="text-supabase-muted text-sm italic">Process payments and manage student accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-supabase-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search pending bills..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-supabase-panel border border-supabase-border rounded-xl pl-10 pr-4 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Bills List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text">Pending Collections</h3>
            <div className="text-[10px] text-supabase-muted uppercase tracking-widest font-black">
              Outstanding: {pendingBills.length}
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-supabase-panel border border-supabase-border rounded-2xl">
              <Loader2 className="animate-spin text-supabase-green mb-4" size={32} />
              <p className="text-xs font-black uppercase tracking-widest text-supabase-muted">Loading Ledger...</p>
            </div>
          ) : filteredBills.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredBills.map(bill => (
                <div 
                  key={bill.id} 
                  onClick={() => setSelectedBill(bill)}
                  className={`bg-supabase-panel border rounded-2xl p-5 cursor-pointer transition-all flex items-center justify-between group ${
                    selectedBill?.id === bill.id ? 'border-supabase-green bg-supabase-green/5' : 'border-supabase-border hover:border-supabase-green/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      selectedBill?.id === bill.id ? 'bg-supabase-green text-black' : 'bg-supabase-sidebar text-supabase-green'
                    }`}>
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-supabase-text uppercase tracking-tight">{bill.student_name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-supabase-muted uppercase tracking-widest font-black">ID: {bill.student_id}</span>
                        <span className="text-[10px] text-supabase-muted uppercase tracking-widest font-black flex items-center gap-1">
                          <Calendar size={10} />
                          Due: {new Date(bill.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-supabase-green">${bill.total_amount.toLocaleString()}</div>
                    <div className="text-[9px] font-black text-supabase-muted uppercase tracking-widest mt-1">Invoice #{bill.id.slice(0, 8).toUpperCase()}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-supabase-panel border border-supabase-border border-dashed rounded-2xl text-supabase-muted">
              <CheckCircle2 size={48} className="mb-4 text-supabase-green opacity-20" />
              <p className="text-xs font-black uppercase tracking-widest">All fees collected!</p>
            </div>
          )}
        </div>

        {/* Payment Processing Panel */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-supabase-panel border border-supabase-border rounded-2xl p-6 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text flex items-center gap-2">
              <DollarSign size={14} className="text-supabase-green" />
              Process Payment
            </h3>

            {selectedBill ? (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="p-4 bg-supabase-sidebar border border-supabase-border rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-supabase-muted uppercase tracking-widest">Student</span>
                    <span className="text-xs font-black text-supabase-text uppercase tracking-tight">{selectedBill.student_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-supabase-muted uppercase tracking-widest">Amount Due</span>
                    <span className="text-sm font-black text-supabase-green">${selectedBill.total_amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-supabase-muted uppercase tracking-widest">Payment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Cash', 'Bank Transfer', 'Card', 'Cheque'].map(method => (
                        <button 
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={`py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                            paymentMethod === method ? 'bg-supabase-green border-supabase-green text-black' : 'bg-supabase-sidebar border-supabase-border text-supabase-muted hover:border-supabase-green/30'
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-supabase-muted uppercase tracking-widest">Transaction ID / Reference</label>
                    <input 
                      type="text" 
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
                      placeholder="Optional reference..."
                      className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-3 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green"
                    />
                  </div>

                  <button 
                    onClick={handleProcessPayment}
                    disabled={isProcessing}
                    className="w-full py-3 bg-supabase-green text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-supabase-greenHover transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                    Confirm Payment
                  </button>
                  <button 
                    onClick={() => setSelectedBill(null)}
                    className="w-full py-2 text-[9px] font-black text-supabase-muted uppercase tracking-widest hover:text-supabase-text transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-supabase-muted text-center">
                <AlertCircle size={32} className="mb-3 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                  Select a pending bill from the list<br/>to process payment
                </p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text flex items-center gap-2">
              <History size={14} className="text-supabase-muted" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentPayments.map(payment => (
                <div key={payment.id} className="bg-supabase-panel border border-supabase-border rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-supabase-green/10 text-supabase-green flex items-center justify-center">
                    <Receipt size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-black text-supabase-text uppercase tracking-tight truncate">{(payment as any).student_name}</div>
                    <div className="text-[9px] text-supabase-muted uppercase tracking-widest font-black">${payment.amount.toLocaleString()} • {payment.payment_method}</div>
                  </div>
                  <div className="text-[9px] text-supabase-muted font-mono">{new Date(payment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeCollectionView;
