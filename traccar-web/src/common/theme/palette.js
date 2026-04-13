import { grey } from '@mui/material/colors';

const validatedColor = (color) => (/^#([0-9A-Fa-f]{3}){1,2}$/.test(color) ? color : null);

export default (server, darkMode) => ({
  mode: darkMode ? 'dark' : 'light',
  background: {
    default: darkMode ? '#020617' : '#f8fafc',
    paper: darkMode ? '#0f172a' : '#ffffff',
  },
  primary: {
    main: validatedColor(server?.attributes?.colorPrimary) || '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
  },
  secondary: {
    main: validatedColor(server?.attributes?.colorSecondary) || '#10b981',
  },
  neutral: {
    main: grey[500],
  },
  geometry: {
    main: '#3bb2d0',
  },
  error: {
    main: '#ef4444',
  },
  warning: {
    main: '#f59e0b',
  },
  success: {
    main: '#22c55e',
  },
});
