
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Trash2, Edit2, Save, X, CheckCircle2, AlertCircle, Gift, Loader2, Layers, Calendar } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { academicService, PreferredCourse, Offer } from '../services/academicService';
import { supabase } from '../services/supabaseClient';

const AcademicControlView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'courses' | 'offers' | 'academic'>('courses');
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  const [courses, setCourses] = useState<PreferredCourse[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  
  // Academic State
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [isFetchingAcademic, setIsFetchingAcademic] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', section: 'A', room_no: '', level: 0 });
  const [newSubject, setNewSubject] = useState('');
  const [newSection, setNewSection] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newTerm, setNewTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setIsFetchingAcademic(true);
    try {
      const [coursesData, offersData, classesRes, subjectsRes, sectionsRes, yearsData, termsData] = await Promise.all([
        academicService.getCourses(),
        academicService.getOffers(),
        supabase.from('classes').select('*').order('name'),
        supabase.from('subjects').select('*').order('name'),
        supabase.from('sections').select('*').order('name'),
        academicService.getAcademicYears(),
        academicService.getTerms()
      ]);
      setCourses(coursesData.sort((a, b) => a.name.localeCompare(b.name)));
      setOffers(offersData.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }));
      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
      setSections(sectionsRes.data || []);
      setAcademicYears(yearsData);
      setTerms(termsData);
    } catch (error: any) {
      showToast(error.message || 'Failed to fetch academic data', 'error');
    } finally {
      setLoading(false);
      setIsFetchingAcademic(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [isAddingOffer, setIsAddingOffer] = useState(false);

  const [newCourse, setNewCourse] = useState<Partial<PreferredCourse>>({
    name: '',
    code: '',
    description: '',
    status: 'active'
  });

  const [newOffer, setNewOffer] = useState<Partial<Offer>>({
    title: '',
    description: '',
    discount_percentage: 0,
    status: 'active'
  });

  const handleAddCourse = async () => {
    if (!newCourse.name || !newCourse.code) {
      showToast('Please fill in required fields', 'error');
      return;
    }
    try {
      const course = await academicService.addCourse({
        name: newCourse.name!,
        code: newCourse.code!,
        description: newCourse.description || '',
        status: (newCourse.status as 'active' | 'inactive') || 'active'
      });
      setCourses(prev => [...prev, course]);
      setIsAddingCourse(false);
      setNewCourse({ name: '', code: '', description: '', status: 'active' });
      showToast('Course added successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to add course', 'error');
    }
  };

  const handleAddOffer = async () => {
    if (!newOffer.title) {
      showToast('Please fill in required fields', 'error');
      return;
    }
    try {
      const offer = await academicService.addOffer({
        title: newOffer.title!,
        description: newOffer.description || '',
        discount_percentage: newOffer.discount_percentage,
        valid_until: newOffer.valid_until,
        status: (newOffer.status as 'active' | 'inactive') || 'active'
      });
      setOffers(prev => [...prev, offer]);
      setIsAddingOffer(false);
      setNewOffer({ title: '', description: '', discount_percentage: 0, status: 'active' });
      showToast('Offer added successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to add offer', 'error');
    }
  };

  const deleteCourse = async (id: string) => {
    try {
      await academicService.deleteCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
      showToast('Course deleted', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete course', 'error');
    }
  };

  const deleteOffer = async (id: string) => {
    try {
      await academicService.deleteOffer(id);
      setOffers(prev => prev.filter(o => o.id !== id));
      showToast('Offer deleted', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete offer', 'error');
    }
  };

  const handleAddClass = async () => {
    if (!newClass.name || !supabase) {
      showToast("Class name is required", "error");
      return;
    }
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.from('classes').insert([
        { 
          name: newClass.name, 
          section: newClass.section, 
          room_no: newClass.room_no, 
          level: newClass.level 
        }
      ]).select();
      
      if (error) throw error;
      
      setClasses([...classes, data[0]]);
      setNewClass({ name: '', section: 'A', room_no: '', level: 0 });
      showToast("Class added successfully", "success");
    } catch (e: any) {
      showToast("Failed to add class: " + e.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw error;
      setClasses(classes.filter(c => c.id !== id));
      showToast("Class removed", "success");
    } catch (e: any) {
      showToast("Failed to remove class: " + e.message, "error");
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.trim() || !supabase) {
      showToast("Subject name is required", "error");
      return;
    }
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.from('subjects').insert([
        { name: newSubject.trim() }
      ]).select();
      
      if (error) throw error;
      
      setSubjects([...subjects, data[0]]);
      setNewSubject('');
      showToast("Subject added successfully", "success");
    } catch (e: any) {
      showToast("Failed to add subject: " + e.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) throw error;
      setSubjects(subjects.filter(s => s.id !== id));
      showToast("Subject removed", "success");
    } catch (e: any) {
      showToast("Failed to remove subject: " + e.message, "error");
    }
  };

  const handleAddSection = async () => {
    if (!newSection.trim() || !supabase) {
      showToast("Section name is required", "error");
      return;
    }
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.from('sections').insert([
        { name: newSection.trim() }
      ]).select();
      
      if (error) throw error;
      
      setSections([...sections, data[0]]);
      setNewSection('');
      showToast("Section added successfully", "success");
    } catch (e: any) {
      showToast("Failed to add section: " + e.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('sections').delete().eq('id', id);
      if (error) throw error;
      setSections(sections.filter(s => s.id !== id));
      showToast("Section removed", "success");
    } catch (e: any) {
      showToast("Failed to remove section: " + e.message, "error");
    }
  };

  const handleAddYear = async () => {
    if (!newYear.trim()) {
      showToast("Year name is required", "error");
      return;
    }
    setIsProcessing(true);
    try {
      const year = await academicService.addAcademicYear(newYear.trim());
      setAcademicYears([...academicYears, year]);
      setNewYear('');
      showToast("Academic Year added successfully", "success");
    } catch (e: any) {
      showToast("Failed to add year: " + e.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteYear = async (id: string) => {
    try {
      await academicService.deleteAcademicYear(id);
      setAcademicYears(academicYears.filter(y => y.id !== id));
      showToast("Academic Year removed", "success");
    } catch (e: any) {
      showToast("Failed to remove year: " + e.message, "error");
    }
  };

  const handleAddTerm = async () => {
    if (!newTerm.trim()) {
      showToast("Term name is required", "error");
      return;
    }
    setIsProcessing(true);
    try {
      const term = await academicService.addTerm(newTerm.trim());
      setTerms([...terms, term]);
      setNewTerm('');
      showToast("Term added successfully", "success");
    } catch (e: any) {
      showToast("Failed to add term: " + e.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteTerm = async (id: string) => {
    try {
      await academicService.deleteTerm(id);
      setTerms(terms.filter(t => t.id !== id));
      showToast("Term removed", "success");
    } catch (e: any) {
      showToast("Failed to remove term: " + e.message, "error");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-supabase-green/10 rounded-lg flex items-center justify-center text-supabase-green">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-supabase-text uppercase tracking-tight">Academic Control</h1>
            <p className="text-supabase-muted text-sm">Manage preferred courses, special offers, and academic structure</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-supabase-border">
        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-3 px-4 text-sm font-medium transition-all relative ${
            activeTab === 'courses' ? 'text-supabase-green' : 'text-supabase-muted hover:text-supabase-text'
          }`}
        >
          Preferred Courses
          {activeTab === 'courses' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-supabase-green" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={`pb-3 px-4 text-sm font-medium transition-all relative ${
            activeTab === 'offers' ? 'text-supabase-green' : 'text-supabase-muted hover:text-supabase-text'
          }`}
        >
          Offers & Discounts
          {activeTab === 'offers' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-supabase-green" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('academic')}
          className={`pb-3 px-4 text-sm font-medium transition-all relative ${
            activeTab === 'academic' ? 'text-supabase-green' : 'text-supabase-muted hover:text-supabase-text'
          }`}
        >
          Academic Structure
          {activeTab === 'academic' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-supabase-green" />
          )}
        </button>
      </div>

      {activeTab === 'courses' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-supabase-text">Course List</h2>
            <button
              onClick={() => setIsAddingCourse(true)}
              className="flex items-center gap-2 bg-supabase-green text-supabase-bg px-4 py-2 rounded-md font-bold text-sm hover:bg-opacity-90 transition-all"
            >
              <Plus size={18} />
              Add Preferred Course
            </button>
          </div>

          {isAddingCourse && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-supabase-panel border border-supabase-border p-4 rounded-lg space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-supabase-muted uppercase">Course Name *</label>
                  <input
                    type="text"
                    value={newCourse.name}
                    onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                    className="w-full bg-supabase-bg border border-supabase-border rounded p-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green"
                    placeholder="e.g. Science (Medical)"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-supabase-muted uppercase">Course Code *</label>
                  <input
                    type="text"
                    value={newCourse.code}
                    onChange={e => setNewCourse({ ...newCourse, code: e.target.value })}
                    className="w-full bg-supabase-bg border border-supabase-border rounded p-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green"
                    placeholder="e.g. SCI-MED"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-supabase-muted uppercase">Description</label>
                  <textarea
                    value={newCourse.description}
                    onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                    className="w-full bg-supabase-bg border border-supabase-border rounded p-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green h-20"
                    placeholder="Enter course description..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsAddingCourse(false)}
                  className="px-4 py-2 text-sm font-bold text-supabase-muted hover:text-supabase-text transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCourse}
                  className="bg-supabase-green text-supabase-bg px-6 py-2 rounded-md font-bold text-sm hover:bg-opacity-90 transition-all"
                >
                  Save Course
                </button>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full py-20 flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-supabase-green" size={32} />
                <span className="text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Loading Courses...</span>
              </div>
            ) : courses.length === 0 ? (
              <div className="col-span-full py-20 text-center text-supabase-muted italic text-sm">
                No preferred courses added yet.
              </div>
            ) : (
              courses.map(course => (
                <div key={course.id} className="bg-supabase-panel border border-supabase-border p-4 rounded-lg hover:border-supabase-green/50 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-supabase-green bg-supabase-green/10 px-2 py-0.5 rounded uppercase mb-1 inline-block">
                        {course.code}
                      </span>
                      <h3 className="font-bold text-supabase-text">{course.name}</h3>
                    </div>
                    <button
                      onClick={() => deleteCourse(course.id)}
                      className="text-supabase-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-supabase-muted line-clamp-2">{course.description}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${course.status === 'active' ? 'bg-supabase-green' : 'bg-supabase-muted'}`} />
                    <span className="text-xs text-supabase-muted capitalize">{course.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : activeTab === 'offers' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-supabase-text">Active Offers</h2>
            <button
              onClick={() => setIsAddingOffer(true)}
              className="flex items-center gap-2 bg-supabase-green text-supabase-bg px-4 py-2 rounded-md font-bold text-sm hover:bg-opacity-90 transition-all"
            >
              <Plus size={18} />
              Add Offer
            </button>
          </div>

          {isAddingOffer && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-supabase-panel border border-supabase-border p-4 rounded-lg space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-supabase-muted uppercase">Offer Title *</label>
                  <input
                    type="text"
                    value={newOffer.title}
                    onChange={e => setNewOffer({ ...newOffer, title: e.target.value })}
                    className="w-full bg-supabase-bg border border-supabase-border rounded p-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green"
                    placeholder="e.g. Early Bird Discount"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-supabase-muted uppercase">Discount %</label>
                  <input
                    type="number"
                    value={newOffer.discount_percentage}
                    onChange={e => setNewOffer({ ...newOffer, discount_percentage: parseInt(e.target.value) })}
                    className="w-full bg-supabase-bg border border-supabase-border rounded p-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-supabase-muted uppercase">Valid Until</label>
                  <input
                    type="date"
                    value={newOffer.valid_until}
                    onChange={e => setNewOffer({ ...newOffer, valid_until: e.target.value })}
                    className="w-full bg-supabase-bg border border-supabase-border rounded p-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-supabase-muted uppercase">Description</label>
                  <textarea
                    value={newOffer.description}
                    onChange={e => setNewOffer({ ...newOffer, description: e.target.value })}
                    className="w-full bg-supabase-bg border border-supabase-border rounded p-2 text-sm text-supabase-text focus:outline-none focus:border-supabase-green h-20"
                    placeholder="Enter offer details..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsAddingOffer(false)}
                  className="px-4 py-2 text-sm font-bold text-supabase-muted hover:text-supabase-text transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOffer}
                  className="bg-supabase-green text-supabase-bg px-6 py-2 rounded-md font-bold text-sm hover:bg-opacity-90 transition-all"
                >
                  Save Offer
                </button>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full py-20 flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-supabase-green" size={32} />
                <span className="text-[10px] font-bold text-supabase-muted uppercase tracking-widest">Loading Offers...</span>
              </div>
            ) : offers.length === 0 ? (
              <div className="col-span-full py-20 text-center text-supabase-muted italic text-sm">
                No active offers added yet.
              </div>
            ) : (
              offers.map(offer => (
                <div key={offer.id} className="bg-supabase-panel border border-supabase-border p-4 rounded-lg hover:border-supabase-green/50 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-supabase-green/5 rounded-bl-full flex items-center justify-center text-supabase-green/20 -mr-4 -mt-4">
                    <Gift size={32} />
                  </div>
                  
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <div>
                      <h3 className="font-bold text-supabase-text">{offer.title}</h3>
                      {offer.discount_percentage && (
                        <span className="text-xl font-black text-supabase-green">
                          {offer.discount_percentage}% OFF
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteOffer(offer.id)}
                      className="text-supabase-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-supabase-muted line-clamp-2 mb-4">{offer.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${offer.status === 'active' ? 'bg-supabase-green' : 'bg-supabase-muted'}`} />
                      <span className="text-xs text-supabase-muted capitalize">{offer.status}</span>
                    </div>
                    {offer.valid_until && (
                      <span className="text-[10px] font-bold text-supabase-muted uppercase">
                        Until: {new Date(offer.valid_until).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Classes Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-4">
                <div className="bg-supabase-panel border border-supabase-border rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text flex items-center gap-2">
                    <Plus size={14} className="text-supabase-green" />
                    Add New Class
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-supabase-muted uppercase tracking-widest">Class Name</label>
                      <input 
                        type="text" 
                        value={newClass.name} 
                        onChange={e => setNewClass({...newClass, name: e.target.value})} 
                        placeholder="e.g. Class 10" 
                        className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-3 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-supabase-muted uppercase tracking-widest">Section</label>
                        {sections.length > 0 ? (
                          <select 
                            value={newClass.section} 
                            onChange={e => setNewClass({...newClass, section: e.target.value})} 
                            className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-3 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green"
                          >
                            <option value="">Select</option>
                            {sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                          </select>
                        ) : (
                          <input 
                            type="text" 
                            value={newClass.section} 
                            onChange={e => setNewClass({...newClass, section: e.target.value})} 
                            placeholder="A" 
                            className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-3 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green" 
                          />
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-supabase-muted uppercase tracking-widest">Room No</label>
                        <input 
                          type="text" 
                          value={newClass.room_no} 
                          onChange={e => setNewClass({...newClass, room_no: e.target.value})} 
                          placeholder="101" 
                          className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-3 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-supabase-muted uppercase tracking-widest">Level</label>
                      <select 
                        value={newClass.level} 
                        onChange={e => setNewClass({...newClass, level: parseInt(e.target.value)})} 
                        className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-3 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green"
                      >
                        <option value={0}>Junior</option>
                        <option value={1}>Senior</option>
                      </select>
                    </div>
                    <button 
                      onClick={handleAddClass}
                      disabled={isProcessing}
                      className="w-full py-2.5 bg-supabase-green text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-supabase-greenHover transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      Add Class
                    </button>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text">Existing Classes</h3>
                {isFetchingAcademic ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-supabase-green" /></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {classes.map(cls => (
                      <div key={cls.id} className="p-4 bg-supabase-panel border border-supabase-border rounded-xl flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-supabase-green/10 flex items-center justify-center text-supabase-green font-black text-[10px]">
                            {cls.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-widest">{cls.name}</p>
                            <p className="text-[9px] text-supabase-muted uppercase tracking-widest">Sec: {cls.section} • Room: {cls.room_no}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteClass(cls.id)} className="text-supabase-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Subjects Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-supabase-border">
              <div className="md:col-span-1 space-y-4">
                <div className="bg-supabase-panel border border-supabase-border rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text flex items-center gap-2">
                    <Plus size={14} className="text-supabase-green" />
                    Add New Subject
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-supabase-muted uppercase tracking-widest">Subject Name</label>
                      <input 
                        type="text" 
                        value={newSubject} 
                        onChange={e => setNewSubject(e.target.value)} 
                        placeholder="e.g. Mathematics" 
                        className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-3 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green" 
                      />
                    </div>
                    <button 
                      onClick={handleAddSubject}
                      disabled={isProcessing}
                      className="w-full py-2.5 bg-supabase-green text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-supabase-greenHover transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      Add Subject
                    </button>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text">Existing Subjects</h3>
                {isFetchingAcademic ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-supabase-green" /></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {subjects.map(sub => (
                      <div key={sub.id} className="p-4 bg-supabase-panel border border-supabase-border rounded-xl flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <BookOpen size={16} className="text-supabase-green" />
                          <span className="text-[11px] font-black uppercase tracking-widest">{sub.name}</span>
                        </div>
                        <button onClick={() => handleDeleteSubject(sub.id)} className="text-supabase-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sections Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-supabase-border">
              <div className="md:col-span-1 space-y-4">
                <div className="bg-supabase-panel border border-supabase-border rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text flex items-center gap-2">
                    <Plus size={14} className="text-supabase-green" />
                    Add New Section
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-supabase-muted uppercase tracking-widest">Section Name</label>
                      <input 
                        type="text" 
                        value={newSection} 
                        onChange={e => setNewSection(e.target.value)} 
                        placeholder="e.g. A, B, C" 
                        className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-3 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green" 
                      />
                    </div>
                    <button 
                      onClick={handleAddSection}
                      disabled={isProcessing}
                      className="w-full py-2.5 bg-supabase-green text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-supabase-greenHover transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      Add Section
                    </button>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text">Existing Sections</h3>
                {isFetchingAcademic ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-supabase-green" /></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sections.map(sec => (
                      <div key={sec.id} className="p-4 bg-supabase-panel border border-supabase-border rounded-xl flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <Layers size={16} className="text-supabase-green" />
                          <span className="text-[11px] font-black uppercase tracking-widest">{sec.name}</span>
                        </div>
                        <button onClick={() => handleDeleteSection(sec.id)} className="text-supabase-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Academic Years Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-supabase-border">
              <div className="md:col-span-1 space-y-4">
                <div className="bg-supabase-panel border border-supabase-border rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text flex items-center gap-2">
                    <Calendar size={14} className="text-supabase-green" />
                    Add Academic Year
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-supabase-muted uppercase tracking-widest">Year Name</label>
                      <input 
                        type="text" 
                        value={newYear} 
                        onChange={e => setNewYear(e.target.value)} 
                        placeholder="e.g. 2024-2025" 
                        className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-3 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green" 
                      />
                    </div>
                    <button 
                      onClick={handleAddYear}
                      disabled={isProcessing}
                      className="w-full py-2.5 bg-supabase-green text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-supabase-greenHover transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      Add Year
                    </button>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text">Academic Years</h3>
                {isFetchingAcademic ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-supabase-green" /></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {academicYears.map(year => (
                      <div key={year.id} className="p-4 bg-supabase-panel border border-supabase-border rounded-xl flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <Calendar size={16} className="text-supabase-green" />
                          <span className="text-[11px] font-black uppercase tracking-widest">{year.name}</span>
                        </div>
                        <button onClick={() => handleDeleteYear(year.id)} className="text-supabase-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Terms Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-supabase-border">
              <div className="md:col-span-1 space-y-4">
                <div className="bg-supabase-panel border border-supabase-border rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text flex items-center gap-2">
                    <Layers size={14} className="text-supabase-green" />
                    Add Term
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-supabase-muted uppercase tracking-widest">Term Name</label>
                      <input 
                        type="text" 
                        value={newTerm} 
                        onChange={e => setNewTerm(e.target.value)} 
                        placeholder="e.g. Term 1" 
                        className="w-full bg-supabase-sidebar border border-supabase-border rounded-lg px-3 py-2 text-sm text-supabase-text outline-none focus:border-supabase-green" 
                      />
                    </div>
                    <button 
                      onClick={handleAddTerm}
                      disabled={isProcessing}
                      className="w-full py-2.5 bg-supabase-green text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-supabase-greenHover transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      Add Term
                    </button>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-supabase-text">Terms</h3>
                {isFetchingAcademic ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-supabase-green" /></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {terms.map(term => (
                      <div key={term.id} className="p-4 bg-supabase-panel border border-supabase-border rounded-xl flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <Layers size={16} className="text-supabase-green" />
                          <span className="text-[11px] font-black uppercase tracking-widest">{term.name}</span>
                        </div>
                        <button onClick={() => handleDeleteTerm(term.id)} className="text-supabase-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default AcademicControlView;
