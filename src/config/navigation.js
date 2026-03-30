import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LineChart,
  NotebookText,
  Users,
} from 'lucide-react';

export const studentNavigation = [
  { label: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Weekly Plan', to: '/student/weekly-plan', icon: CalendarDays },
  { label: 'Practice Tests', to: '/student/practice-tests', icon: LineChart },
  { label: 'MQL', to: '/student/mql', icon: NotebookText },
  { label: 'Payments', to: '/student/payments', icon: CreditCard },
];

export const coachNavigation = [
  { label: 'Dashboard', to: '/coach/dashboard', icon: LayoutDashboard },
  { label: 'Students', to: '/coach/students', icon: Users },
  { label: 'Planning Hub', to: '/coach/planning-hub', icon: CalendarDays },
  { label: 'Payments', to: '/coach/payments', icon: CreditCard },
];
