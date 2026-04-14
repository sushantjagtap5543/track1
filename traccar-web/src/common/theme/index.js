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
                            input[type="datetime-local"]::-webkit-calendar-picker-indicator,
              input[type="date"]::-webkit-calendar-picker-indicator {
                filter: invert(1);
                cursor: pointer;
              }
              
              /* MapLibre Draw Controls - White Icons Override */
              .maplibregl-ctrl-group button.mapbox-gl-draw_polygon,
              .maplibregl-ctrl-group button.mapbox-gl-draw_line,
              .maplibregl-ctrl-group button.mapbox-gl-draw_trash {
                filter: invert(1) brightness(2);
                opacity: 0.9;
              }
              .maplibregl-ctrl-group button.mapbox-gl-draw_polygon:hover,
              .maplibregl-ctrl-group button.mapbox-gl-draw_line:hover,
              .maplibregl-ctrl-group button.mapbox-gl-draw_trash:hover {
                filter: invert(1) brightness(5);
                opacity: 1;
              }

              /* Custom Premium Scrollbar */
              * {
                scrollbar-width: thin;
                scrollbar-color: rgba(56, 189, 248, 0.2) transparent;
              }
              *::-webkit-scrollbar {
                width: 6px;
                height: 6px;
              }
              *::-webkit-scrollbar-track {
                background: transparent;
              }
              *::-webkit-scrollbar-thumb {
                background: rgba(56, 189, 248, 0.2);
                border-radius: 10px;
                border: 2px solid transparent;
                background-clip: content-box;
                transition: all 0.3s ease;
              }
              *::-webkit-scrollbar-thumb:hover {
                background: rgba(56, 189, 248, 0.4);
                background-clip: content-box;
              }
            `,
          },
        },
      }),
    [server, darkMode, direction],
  );
