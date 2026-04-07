import { LeadSource, UserRole } from './types';

export const INITIAL_LEAD_SOURCES: LeadSource[] = [
  { id: '1', name: 'Facebook' },
  { id: '2', name: 'Instagram' },
  { id: '3', name: 'Google' },
  { id: '4', name: 'Walk-in' },
  { id: '5', name: 'Referral' },
  { id: '6', name: 'Newspaper' },
  { id: '7', name: 'Radio' },
  { id: '8', name: 'TV' }
];

export const INITIAL_ROLES: UserRole[] = ['superadmin', 'administrator', 'editor', 'teacher', 'viewer'];
export const INITIAL_DEPARTMENTS: string[] = ['Academic', 'Administration', 'IT Support', 'Human Resources'];
export const INITIAL_DESIGNATIONS: string[] = [
  'Counselling', 'Academic Works', 'Director', 'Teacher', 'Faculty Coordinator', 
  'Office Manager', 'HR Lead', 'Recruiter', 'System Admin', 'Support Tech'
];
export const INITIAL_LEAD_BY: string[] = ['Employee', 'Partner', 'Agent'];

export const DEFAULT_DEPT_MAP: Record<string, string[]> = {
  'Academic': ['Academic Works', 'Teacher', 'Faculty Coordinator'],
  'Administration': ['Director', 'Counselling', 'Office Manager'],
  'Human Resources': ['HR Lead', 'Recruiter'],
  'IT Support': ['System Admin', 'Support Tech']
};

export const DEFAULT_PERMISSIONS: any = {
  VIEW_DASHBOARD: ['superadmin', 'administrator', 'admin', 'editor', 'teacher', 'viewer'],
  VIEW_SCHEDULE_LIST: ['superadmin', 'administrator', 'admin', 'editor'],
  VIEW_LIVE_SCHEDULE: ['superadmin', 'administrator', 'admin', 'editor', 'teacher', 'viewer'],
  VIEW_CLASS_SCHEDULE: ['superadmin', 'administrator', 'admin', 'editor'],
  VIEW_TEACHER_TASKS: ['superadmin', 'administrator', 'admin', 'editor', 'teacher'],
  VIEW_SETTINGS: ['superadmin', 'administrator', 'admin'],
  MANAGE_TEACHERS: ['superadmin', 'administrator', 'admin'],
  DELETE_SCHEDULE: ['superadmin', 'administrator', 'admin'],
  PUBLISH_SCHEDULE: ['superadmin', 'administrator', 'editor', 'admin'],
  EDIT_SCHEDULE: ['superadmin', 'administrator', 'editor', 'admin'],
  VIEW_REPORTS: ['superadmin', 'administrator', 'editor', 'viewer', 'admin', 'teacher'],
  VIEW_ACADEMIC: ['superadmin', 'administrator', 'admin', 'editor', 'teacher', 'viewer'],
  ACCESS_SQL_EDITOR: ['superadmin', 'administrator', 'admin'],
  MANAGE_ROLES: ['superadmin'],
};
