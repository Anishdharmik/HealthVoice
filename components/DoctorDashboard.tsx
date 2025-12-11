import React, { useState, useEffect } from 'react';
import { Appointment, User } from '../types';
import { appointmentService } from '../services/dataService';
import { Button } from './Button';

interface DoctorDashboardProps {
  user: User;
  onLogout: () => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ user, onLogout }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  
  // Tab & Search State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Patient Form State
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientSymptoms, setNewPatientSymptoms] = useState('');

  useEffect(() => {
    loadAppointments();
    // Poll for updates every 5 seconds to see new AI appointments
    const interval = setInterval(loadAppointments, 5000);
    return () => clearInterval(interval);
  }, [user.id]);

  const loadAppointments = () => {
    const data = appointmentService.getDoctorAppointments(user.id);
    setAppointments(data);
  };

  // --- Queue Logic ---
  const waitingQueue = appointments.filter(a => a.status === 'scheduled');
  const inConsultationQueue = appointments.filter(a => a.status === 'in-progress');
  const completedQueue = appointments.filter(a => a.status === 'completed');

  // --- Records Logic ---
  const filteredRecords = appointments.filter(a => 
    a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.symptomsSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.notes && a.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- Actions ---

  const handleCallNextPatient = () => {
    if (waitingQueue.length === 0) {
      alert("No patients waiting in the queue.");
      return;
    }
    const nextPatient = waitingQueue[0];
    updateStatus(nextPatient, 'in-progress');
    startConsultation(nextPatient);
  };

  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName) return;
    
    // Create new appointment via service
    await appointmentService.createAppointment(
        `manual-${Date.now()}`, 
        newPatientName, 
        newPatientSymptoms || "Walk-in patient"
    );
    
    setShowAddPatientModal(false);
    setNewPatientName('');
    setNewPatientSymptoms('');
    loadAppointments();
  };

  const updateStatus = (appt: Appointment, status: 'scheduled' | 'in-progress' | 'completed') => {
    const updated = { ...appt, status };
    appointmentService.updateAppointment(updated);
    setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
    // If moving to in-progress, ensure we track it as active locally if needed
    if (status === 'in-progress') {
        setActiveAppointment(updated);
        setConsultationNotes(updated.notes || '');
    }
  };

  const startConsultation = (appt: Appointment) => {
    setActiveAppointment(appt);
    setConsultationNotes(appt.notes || '');
    // Ensure status is updated if not already
    if (appt.status === 'scheduled') {
        updateStatus(appt, 'in-progress');
    }
  };

  const completeConsultation = () => {
    if (!activeAppointment) return;

    const updated: Appointment = {
        ...activeAppointment,
        status: 'completed',
        notes: consultationNotes
    };

    appointmentService.updateAppointment(updated);
    
    setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
    setActiveAppointment(null);
  };

  // --- Render Views ---

  // 1. Consultation View (Detailed)
  if (activeAppointment) {
      return (
          <div className="min-h-screen bg-slate-100 p-4 md:p-6 flex flex-col items-center">
              {/* Header */}
              <div className="w-full max-w-6xl flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-slate-500 cursor-pointer hover:text-slate-800" onClick={() => setActiveAppointment(null)}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                      <span className="font-medium">Back to Dashboard</span>
                  </div>
                  <div className="font-bold text-slate-700">In Consultation</div>
              </div>

              <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row h-[85vh]">
                  
                  {/* Left Sidebar: Patient Info */}
                  <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 p-8 flex flex-col">
                      <div className="mb-8 text-center">
                          <div className="w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold shadow-md">
                              {activeAppointment.patientName.charAt(0)}
                          </div>
                          <h2 className="text-2xl font-bold text-slate-800">{activeAppointment.patientName}</h2>
                          <p className="text-sm text-slate-500">ID: {activeAppointment.patientId}</p>
                      </div>

                      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reported Symptoms</h3>
                          <p className="text-sm text-slate-700 leading-relaxed italic">"{activeAppointment.symptomsSummary}"</p>
                      </div>

                      <div className="mt-auto pt-6 border-t border-slate-200">
                           <div className="flex justify-between items-center mb-2">
                               <span className="text-xs text-slate-400 uppercase font-bold">Time Slot</span>
                               <span className="text-sm font-semibold text-slate-700">{activeAppointment.timeSlot}</span>
                           </div>
                           <div className="flex justify-between items-center">
                               <span className="text-xs text-slate-400 uppercase font-bold">Status</span>
                               <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">IN PROGRESS</span>
                           </div>
                      </div>
                  </div>

                  {/* Right Content: Clinical Notes */}
                  <div className="w-full md:w-2/3 p-8 flex flex-col bg-white">
                      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                          <div>
                            <h2 className="text-xl font-bold text-slate-800">Clinical Notes</h2>
                            <p className="text-slate-400 text-sm">Record diagnosis and prescription below</p>
                          </div>
                          <div className="text-right">
                              <span className="block text-xs text-slate-400">Doctor</span>
                              <span className="font-medium text-slate-700">{user.name}</span>
                          </div>
                      </div>

                      <div className="flex-1 flex flex-col">
                          <textarea 
                             className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-6 text-base text-slate-800 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner font-sans"
                             placeholder="Type diagnosis, prescriptions, and advice here..."
                             value={consultationNotes}
                             onChange={(e) => setConsultationNotes(e.target.value)}
                             autoFocus
                          />
                      </div>

                      <div className="mt-6 flex justify-end gap-3">
                          <Button variant="secondary" onClick={() => setActiveAppointment(null)}>
                              Save Draft & Close
                          </Button>
                          <Button onClick={completeConsultation} className="bg-green-600 hover:bg-green-700 px-8 shadow-lg">
                              Complete Visit
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // 2. Main Dashboard Layout
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Top Navigation Bar */}
      <nav className="border-b border-slate-100 px-6 py-3 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">HealthAsist</span>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <div className="flex space-x-1">
             <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'dashboard' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
             >
                Dashboard
             </button>
             <button 
                onClick={() => setActiveTab('records')} 
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'records' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
             >
                Records
             </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                 <div className="text-sm font-bold text-slate-800">{user.name}</div>
                 <div className="text-xs text-slate-500 uppercase">Cardiology</div>
             </div>
             <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
             </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6 max-w-[1600px] mx-auto">
         
         {activeTab === 'dashboard' ? (
           <>
             {/* DASHBOARD TAB CONTENT */}
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                   <h1 className="text-2xl font-bold text-slate-800">Clinic Dashboard</h1>
                   <p className="text-slate-500">Manage patient flow and appointments</p>
                </div>
                <div className="flex gap-3">
                   <button 
                     onClick={handleCallNextPatient}
                     disabled={waitingQueue.length === 0}
                     className={`px-6 py-2.5 rounded-lg font-bold text-white shadow-md transition-all flex items-center gap-2 ${
                       waitingQueue.length > 0 ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg' : 'bg-slate-300 cursor-not-allowed'
                     }`}
                   >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                      Call Next Patient
                   </button>
                   <button 
                     onClick={() => setShowAddPatientModal(true)}
                     className="px-6 py-2.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm flex items-center gap-2"
                   >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add Patient
                   </button>
                </div>
             </div>

             {/* Kanban Columns */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
                
                {/* Column 1: WAITING */}
                <div className="flex flex-col bg-slate-50 rounded-xl border border-slate-200 h-full overflow-hidden">
                   <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                      <span className="font-bold text-slate-700 tracking-wide text-sm uppercase">Waiting</span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{waitingQueue.length}</span>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {waitingQueue.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 text-sm">No patients waiting.</div>
                      ) : (
                          waitingQueue.map((appt) => (
                            <div key={appt.id} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative">
                               <div className="flex justify-between items-start mb-2">
                                   <h3 className="font-bold text-slate-800">{appt.patientName}</h3>
                                   <span className="text-xs font-mono text-slate-400">{appt.timeSlot}</span>
                               </div>
                               <p className="text-sm text-slate-500 line-clamp-2 mb-3">{appt.symptomsSummary}</p>
                               <div className="flex justify-end">
                                   <button 
                                     onClick={() => { updateStatus(appt, 'in-progress'); startConsultation(appt); }}
                                     className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors"
                                   >
                                     Start Consult &rarr;
                                   </button>
                               </div>
                            </div>
                          ))
                      )}
                   </div>
                </div>

                {/* Column 2: IN CONSULTATION */}
                <div className="flex flex-col bg-blue-50 rounded-xl border border-blue-100 h-full overflow-hidden">
                   <div className="p-4 border-b border-blue-100 flex justify-between items-center bg-white">
                      <span className="font-bold text-blue-700 tracking-wide text-sm uppercase">In Consultation</span>
                      <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">{inConsultationQueue.length}</span>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {inConsultationQueue.length === 0 ? (
                          <div className="text-center py-10 text-blue-300 text-sm">Doctor is free.</div>
                      ) : (
                          inConsultationQueue.map((appt) => (
                            <div key={appt.id} className="bg-white p-5 rounded-lg border-l-4 border-blue-500 shadow-md">
                               <div className="flex items-center gap-3 mb-3">
                                   <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                      {appt.patientName.charAt(0)}
                                   </div>
                                   <div>
                                       <h3 className="font-bold text-slate-800 text-lg">{appt.patientName}</h3>
                                       <div className="text-xs text-blue-500 font-bold uppercase tracking-wider">Active Patient</div>
                                   </div>
                               </div>
                               <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm text-slate-600">
                                   {appt.symptomsSummary}
                               </div>
                               <button 
                                 onClick={() => startConsultation(appt)}
                                 className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition-colors"
                               >
                                 Continue Consultation
                               </button>
                            </div>
                          ))
                      )}
                   </div>
                </div>

                {/* Column 3: COMPLETED */}
                <div className="flex flex-col bg-slate-50 rounded-xl border border-slate-200 h-full overflow-hidden">
                   <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                      <span className="font-bold text-green-700 tracking-wide text-sm uppercase">Completed</span>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">{completedQueue.length}</span>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {completedQueue.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 text-sm">No completed visits yet.</div>
                      ) : (
                          completedQueue.map((appt) => (
                            <div key={appt.id} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm opacity-75 hover:opacity-100 transition-opacity">
                               <div className="flex justify-between items-center mb-1">
                                   <h3 className="font-medium text-slate-700">{appt.patientName}</h3>
                                   <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                               </div>
                               <p className="text-xs text-slate-400 mb-2 truncate">{appt.symptomsSummary}</p>
                               <button 
                                  onClick={() => { setActiveAppointment(appt); setConsultationNotes(appt.notes || ''); }}
                                  className="text-xs text-slate-500 hover:text-blue-600 underline"
                               >
                                  View Notes
                               </button>
                            </div>
                          ))
                      )}
                   </div>
                </div>
             </div>
           </>
         ) : (
           <>
             {/* RECORDS TAB CONTENT */}
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                 <div>
                    <h1 className="text-2xl font-bold text-slate-800">Patient Records</h1>
                    <p className="text-slate-500">View and manage patient history</p>
                 </div>
                 <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative group w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-sm"
                            placeholder="Search patients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                     onClick={() => setShowAddPatientModal(true)}
                     className="px-4 py-2.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm flex items-center gap-2 whitespace-nowrap"
                   >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add
                   </button>
                 </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Name</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date / Time</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Symptoms / Notes</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredRecords.map((appt) => (
                                <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                                                {appt.patientName.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-slate-900">{appt.patientName}</div>
                                                <div className="text-xs text-slate-500">ID: {appt.patientId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-900">{appt.date}</div>
                                        <div className="text-xs text-slate-500">{appt.timeSlot}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-900 line-clamp-1 font-medium">{appt.symptomsSummary}</div>
                                        {appt.notes ? (
                                            <div className="text-xs text-slate-500 mt-1 line-clamp-1 italic">"{appt.notes}"</div>
                                        ) : (
                                            <div className="text-xs text-slate-400 mt-1 italic">No notes added</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wide ${
                                            appt.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            appt.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {appt.status.replace('-', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                          onClick={() => { setActiveAppointment(appt); setConsultationNotes(appt.notes || ''); }} 
                                          className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
                                        >
                                          View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredRecords.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-slate-400 text-sm">
                                        <div className="flex flex-col items-center">
                                            <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            No records found matching "{searchTerm}"
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center text-sm text-slate-500">
                    <span>Showing {filteredRecords.length} records</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-slate-200 rounded hover:bg-white disabled:opacity-50" disabled>&larr; Previous</button>
                        <button className="px-3 py-1 border border-slate-200 rounded hover:bg-white disabled:opacity-50" disabled>Next &rarr;</button>
                    </div>
                </div>
             </div>
           </>
         )}
      </main>

      {/* Add Patient Modal */}
      {showAddPatientModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-lg text-slate-800">Add New Patient</h3>
                 <button onClick={() => setShowAddPatientModal(false)} className="text-slate-400 hover:text-slate-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              <form onSubmit={handleAddPatientSubmit} className="p-6">
                 <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name</label>
                    <input 
                      type="text" 
                      required
                      autoFocus
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                      placeholder="e.g. Michael Chen"
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                    />
                 </div>
                 <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Symptoms / Reason</label>
                    <textarea 
                      required
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all resize-none h-24"
                      placeholder="e.g. Fever, Cough since yesterday"
                      value={newPatientSymptoms}
                      onChange={(e) => setNewPatientSymptoms(e.target.value)}
                    />
                 </div>
                 <div className="flex gap-3">
                    <button type="button" onClick={() => setShowAddPatientModal(false)} className="flex-1 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">
                       Cancel
                    </button>
                    <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-colors">
                       Add to Queue
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};