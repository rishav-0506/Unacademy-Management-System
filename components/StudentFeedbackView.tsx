
import React, { useState, useEffect } from 'react';
import { 
    MessageSquare, 
    Search, 
    Plus, 
    Loader2, 
    User, 
    Star, 
    Calendar, 
    Save, 
    X,
    Quote,
    Filter,
    Clock
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../context/ToastContext';

interface Student {
    id: string;
    full_name: string;
    roll_number: string;
    class_name: string;
}

interface Feedback {
    id: string;
    student_id: string;
    feedback_text: string;
    rating: number;
    created_at: string;
    student?: Student;
}

const StudentFeedbackView: React.FC = () => {
    const { showToast } = useToast();
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        student_id: '',
        feedback_text: '',
        rating: 5
    });

    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            try {
                await Promise.all([
                    fetchFeedbacks(),
                    fetchStudents()
                ]);
            } catch (error: any) {
                showToast("Initialization failed: " + error.message, "error");
            } finally {
                setIsLoading(false);
            }
        };
        initialize();
    }, []);

    const fetchFeedbacks = async () => {
        if (!supabase) return;
        try {
            const { data, error } = await supabase
                .from('student_feedback')
                .select(`
                    *,
                    student:students(id, full_name, roll_number, class_name)
                `)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setFeedbacks(data || []);
        } catch (error: any) {
            showToast("Failed to fetch feedbacks: " + error.message, "error");
        }
    };

    const fetchStudents = async () => {
        if (!supabase) return;
        try {
            const { data, error } = await supabase
                .from('students')
                .select('id, full_name, roll_number, class_name')
                .eq('status', 'active');
            
            if (error) throw error;
            setStudents(data || []);
            if (data && data.length > 0) {
                setFormData(prev => ({ ...prev, student_id: data[0].id }));
            }
        } catch (error: any) {
            showToast("Failed to fetch students: " + error.message, "error");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
        
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('student_feedback')
                .insert([formData]);
            
            if (error) throw error;
            
            showToast("Feedback submitted successfully", "success");
            setIsModalOpen(false);
            setFormData({
                student_id: students[0]?.id || '',
                feedback_text: '',
                rating: 5
            });
            await fetchFeedbacks();
        } catch (error: any) {
            showToast("Failed to submit feedback: " + error.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredFeedbacks = feedbacks.filter(fb => {
        const matchesSearch = fb.student?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             fb.feedback_text.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRating = ratingFilter === 'all' || fb.rating === ratingFilter;
        return matchesSearch && matchesRating;
    });

    return (
        <div className="p-6 bg-supabase-bg min-h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-supabase-text uppercase tracking-widest flex items-center gap-3">
                        <MessageSquare className="text-supabase-green" />
                        Student Feedback
                    </h1>
                    <p className="text-supabase-muted text-sm mt-1">Monitor student satisfaction and academic feedback</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-supabase-green text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-supabase-greenHover transition-all shadow-lg shadow-supabase-green/10"
                >
                    <Plus size={18} />
                    Add Feedback
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-supabase-muted" size={18} />
                    <input 
                        type="text"
                        placeholder="Search feedback or student name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-supabase-panel border border-supabase-border rounded-lg pl-10 pr-4 py-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-supabase-muted" size={18} />
                    <select 
                        value={ratingFilter}
                        onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="w-full bg-supabase-panel border border-supabase-border rounded-lg pl-10 pr-4 py-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green appearance-none transition-all"
                    >
                        <option value="all">All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                    </select>
                </div>
                <button 
                    onClick={fetchFeedbacks}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-supabase-panel border border-supabase-border rounded-lg text-supabase-text hover:bg-supabase-hover transition-all"
                >
                    <Clock size={18} />
                    Refresh
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="animate-spin text-supabase-green mb-4" size={40} />
                    <p className="text-supabase-muted font-mono text-xs tracking-widest uppercase">Collecting Feedback...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFeedbacks.length > 0 ? (
                        filteredFeedbacks.map((fb) => (
                            <div key={fb.id} className="bg-supabase-panel border border-supabase-border rounded-2xl p-6 shadow-sm hover:border-supabase-green/30 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Quote size={60} />
                                </div>
                                
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-supabase-sidebar rounded-full flex items-center justify-center text-supabase-green border border-supabase-border">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-supabase-text">{fb.student?.full_name}</h3>
                                        <p className="text-[10px] text-supabase-muted uppercase tracking-widest">{fb.student?.class_name} • {fb.student?.roll_number}</p>
                                    </div>
                                </div>

                                <div className="flex gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star 
                                            key={star} 
                                            size={14} 
                                            className={star <= fb.rating ? "fill-supabase-green text-supabase-green" : "text-supabase-muted/30"} 
                                        />
                                    ))}
                                </div>

                                <p className="text-sm text-supabase-text/80 leading-relaxed italic mb-6">
                                    "{fb.feedback_text}"
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-supabase-border">
                                    <div className="flex items-center gap-2 text-[10px] text-supabase-muted uppercase tracking-widest font-bold">
                                        <Calendar size={12} />
                                        {new Date(fb.created_at).toLocaleDateString()}
                                    </div>
                                    <button className="text-[10px] font-bold text-supabase-green uppercase tracking-widest hover:underline">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-supabase-panel border border-supabase-border border-dashed rounded-2xl p-20 text-center">
                            <MessageSquare className="text-supabase-muted mx-auto mb-4" size={48} />
                            <h3 className="text-supabase-text font-bold uppercase tracking-widest">No Feedback Yet</h3>
                            <p className="text-supabase-muted text-sm max-w-xs mx-auto mt-2">
                                Start collecting feedback from students to improve academic performance.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Add Feedback Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-supabase-panel border border-supabase-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-supabase-border flex items-center justify-between bg-supabase-sidebar/50">
                            <h2 className="text-lg font-black text-supabase-text uppercase tracking-widest flex items-center gap-2">
                                <Plus className="text-supabase-green" size={20} />
                                New Feedback
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-supabase-muted hover:text-supabase-text transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Select Student</label>
                                <select 
                                    required
                                    value={formData.student_id}
                                    onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                                    className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-4 py-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all"
                                >
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.full_name} ({s.roll_number}) - {s.class_name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Rating</label>
                                <div className="flex gap-4">
                                    {[1, 2, 3, 4, 5].map((r) => (
                                        <button 
                                            key={r}
                                            type="button"
                                            onClick={() => setFormData({...formData, rating: r})}
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                                                formData.rating === r 
                                                ? 'bg-supabase-green text-black font-bold' 
                                                : 'bg-supabase-sidebar text-supabase-muted hover:text-supabase-text'
                                            }`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Feedback Message</label>
                                <textarea 
                                    required
                                    rows={4}
                                    value={formData.feedback_text}
                                    onChange={(e) => setFormData({...formData, feedback_text: e.target.value})}
                                    className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-4 py-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green transition-all resize-none"
                                    placeholder="Enter student feedback here..."
                                />
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
                                    Save Feedback
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentFeedbackView;
