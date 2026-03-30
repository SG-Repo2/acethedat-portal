import { DAT_SECTIONS, MQL_ERROR_TYPES } from './manualWorkflow';

export const SECTIONS = DAT_SECTIONS;

export const TASK_CATEGORIES = {
  Core: { color: '#c9a84c', bg: 'rgba(201,168,76,0.12)', border: 'rgba(201,168,76,0.25)' },
  Review: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' },
  Test: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)' },
};

export const ERROR_CATEGORIES = MQL_ERROR_TYPES.reduce((collection, errorType, index) => {
  collection[index + 1] = {
    label: errorType,
    desc: errorType,
    color: '#c9a84c',
    bg: 'rgba(201,168,76,0.12)',
  };
  return collection;
}, {});

export const demoCredentials = [];
export const demoProfiles = [];
export const demoStudents = [];
