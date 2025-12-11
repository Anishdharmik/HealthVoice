import { User, Appointment, UserRole } from "../types";

// --- Mock Data ---

const USERS_STORAGE_KEY = 'healthvoice_users';
const APPOINTMENTS_STORAGE_KEY = 'healthvoice_appointments';

// Initial Mock Data
const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'John Doe', email: 'patient@demo.com', role: 'patient', password: '123' },
  { id: 'd1', name: 'Dr. Sarah Smith', email: 'doctor@demo.com', role: 'doctor', password: '123' },
  { id: 'a1', name: 'Admin User', email: 'admin@demo.com', role: 'admin', password: '123' }
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'appt-1',
    patientId: 'u3',
    patientName: 'Alice Johnson',
    doctorId: 'd1',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '09:00 AM',
    status: 'scheduled',
    symptomsSummary: 'Severe migraine, sensitivity to light, nausea.'
  },
  {
    id: 'appt-2',
    patientId: 'u4',
    patientName: 'Bob Williams',
    doctorId: 'd1',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '11:30 AM',
    status: 'completed',
    symptomsSummary: 'Skin rash on left arm, itching.',
    notes: 'Prescribed antihistamine and topical cream.'
  }
];

// --- Helpers ---

const getStoredUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : INITIAL_USERS;
};

const getStoredAppointments = (): Appointment[] => {
  const stored = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : INITIAL_APPOINTMENTS;
};

// --- API ---

export const authService = {
  login: async (email: string, password: string): Promise<User | null> => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));
    const users = getStoredUsers();
    const user = users.find(u => u.email === email && u.password === password);
    return user || null;
  },

  signup: async (name: string, email: string, password: string, role: UserRole): Promise<User> => {
    await new Promise(r => setTimeout(r, 600));
    const users = getStoredUsers();
    
    if (users.find(u => u.email === email)) {
      throw new Error("User already exists");
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      password,
      role
    };

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([...users, newUser]));
    return newUser;
  }
};

export const appointmentService = {
  getDoctorAppointments: (doctorId: string): Appointment[] => {
    // In a real app, filter by doctorId. For demo, show all if logged in as doctor.
    const all = getStoredAppointments();
    // Sort logic: In-Progress first, then Scheduled by time, then Completed
    return all.sort((a, b) => {
        if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
        if (b.status === 'in-progress' && a.status !== 'in-progress') return 1;
        // Then by time slot roughly
        return a.timeSlot.localeCompare(b.timeSlot);
    });
  },

  createAppointment: async (patientId: string, patientName: string, symptoms: string): Promise<Appointment> => {
    // Minimal delay for responsiveness
    await new Promise(r => setTimeout(r, 100));
    const appointments = getStoredAppointments();
    
    // Generate simplified time slot based on current time
    const now = new Date();
    const timeSlot = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newAppt: Appointment = {
      id: `appt-${Date.now()}`,
      patientId, // might be 'manual-...' or real user id
      patientName,
      doctorId: 'd1', // Assign to default doctor for demo
      date: new Date().toISOString().split('T')[0],
      timeSlot: timeSlot,
      status: 'scheduled',
      symptomsSummary: symptoms
    };

    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify([...appointments, newAppt]));
    return newAppt;
  },

  updateAppointment: (updated: Appointment) => {
    const appointments = getStoredAppointments();
    const index = appointments.findIndex(a => a.id === updated.id);
    if (index !== -1) {
      appointments[index] = updated;
      localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
    }
  }
};