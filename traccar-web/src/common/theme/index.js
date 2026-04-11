import { useMemo } from 'react';
import { createTheme } from '@mui/material/styles';
import palette from './palette';
import dimensions from './dimensions';
import components from './components';

export default (server, darkMode, direction) =>
  useMemo(
    () =>
      createTheme({
        typography: {
          fontFamily:
            "'Inter', 'Outfit', 'Roboto', 'Segoe UI', 'Helvetica Neue', 'Arial', sans-serif",
        },
        palette: palette(server, darkMode),
        direction,
        dimensions,
        components: {
          ...components,
          MuiCssBaseline: {
            styleOverrides: `
              @keyframes pulse-red {
                0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
                100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
              }
              @keyframes slide-in-right {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
              .critical-alert {
                animation: pulse-red 2s infinite, slide-in-right 0.5s ease-out;
                border: 2px solid #ef4444 !important;
                background-color: #fef2f2 !important;
                color: #b91c1c !important;
              }
              .premium-snack {
                border-radius: 16px !important;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255,255,255,0.1);
              }
            `,
          },
        },
      }),
    [server, darkMode, direction],
  );
