export default {
  MuiUseMediaQuery: {
    defaultProps: {
      noSsr: true,
    },
  },
  MuiTypography: {
    styleOverrides: {
      root: {
        fontFamily: '"Outfit", "Inter", sans-serif',
      },
      h6: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        backgroundImage: 'none',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: '20px',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(2, 6, 23, 0.8)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'none',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: '14px',
        textTransform: 'none',
        fontWeight: 700,
        fontSize: '0.9rem',
        letterSpacing: '0.01em',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        '&.Mui-disabled': {
          opacity: 0.6,
          cursor: 'not-allowed',
          pointerEvents: 'auto',
          background: 'rgba(255, 255, 255, 0.03) !important',
          color: 'rgba(255, 255, 255, 0.2) !important',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        },
      },
      containedPrimary: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        boxShadow: '0 4px 15px rgba(37, 99, 235, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        '&:hover': {
          background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
          boxShadow: '0 8px 25px rgba(37, 99, 235, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateY(-2px) scale(1.02)',
        },
        '&.Mui-disabled': {
          background: 'rgba(255, 255, 255, 0.03) !important',
          color: 'rgba(255, 255, 255, 0.2) !important',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'none',
        },
      },
      containedError: {
        background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
        boxShadow: '0 4px 15px rgba(225, 29, 72, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        '&:hover': {
          background: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)',
          boxShadow: '0 8px 25px rgba(225, 29, 72, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateY(-2px) scale(1.02)',
        },
        '&.Mui-disabled': {
          background: 'rgba(255, 255, 255, 0.03) !important',
          color: 'rgba(255, 255, 255, 0.2) !important',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'none',
        },
      },
      outlinedPrimary: {
        borderColor: 'rgba(59, 130, 246, 0.5)',
        color: '#60a5fa',
        '&:hover': {
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
        },
        '&.Mui-disabled': {
          borderColor: 'rgba(255, 255, 255, 0.1) !important',
          color: 'rgba(255, 255, 255, 0.15) !important',
        },
      },
      outlinedError: {
        borderColor: 'rgba(244, 63, 94, 0.5)',
        color: '#fb7185',
        '&:hover': {
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.05)',
        },
        '&.Mui-disabled': {
          borderColor: 'rgba(255, 255, 255, 0.1) !important',
          color: 'rgba(255, 255, 255, 0.15) !important',
        },
      },
      textPrimary: {
        color: '#60a5fa',
        '&:hover': {
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
        },
        '&.Mui-disabled': {
          color: 'rgba(255, 255, 255, 0.15) !important',
        },
      },
      textError: {
        color: '#fb7185',
        '&:hover': {
          backgroundColor: 'rgba(244, 63, 94, 0.08)',
        },
        '&.Mui-disabled': {
          color: 'rgba(255, 255, 255, 0.15) !important',
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          transform: 'scale(1.1) translateY(-2px)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        },
        '&.Mui-disabled': {
          opacity: 0.4,
          backgroundColor: 'transparent !important',
          border: '1px solid rgba(255, 255, 255, 0.04) !important',
          color: 'rgba(255, 255, 255, 0.15) !important',
          backdropFilter: 'none',
        },
      },
    },
  },
  MuiFab: {
    styleOverrides: {
      root: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        boxShadow: '0 8px 30px rgba(37, 99, 235, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        '&:hover': {
          background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
          transform: 'scale(1.15) rotate(8deg)',
          boxShadow: '0 15px 45px rgba(37, 99, 235, 0.6)',
        },
        '&.Mui-disabled': {
          background: 'rgba(255, 255, 255, 0.05) !important',
          color: 'rgba(255, 255, 255, 0.2) !important',
          border: '1px solid rgba(255, 255, 255, 0.1) !important',
          boxShadow: 'none',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        },
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        color: '#f8fafc !important',
      },
    },
  },
  MuiInputBase: {
    styleOverrides: {
      root: {
        color: '#f8fafc !important',
      },
      input: {
        color: '#f8fafc !important',
      },
    },
  },
  MuiSelect: {
    styleOverrides: {
      icon: {
        color: '#f8fafc !important',
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        color: '#f8fafc !important',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      label: {
        color: '#f8fafc !important',
      },
    },
  },
  MuiAutocomplete: {
    styleOverrides: {
      input: {
        color: '#f8fafc !important',
      },
      option: {
        color: '#f8fafc !important',
      },
      noOptions: {
        color: '#f8fafc !important',
      },
      loading: {
        color: '#f8fafc !important',
      },
    },
  },
  MuiFormHelperText: {
    styleOverrides: {
      root: {
        color: '#cbd5e1 !important',
        fontSize: '0.75rem',
        fontWeight: 500,
        marginTop: '6px',
        opacity: 0.8,
      },
    },
  },
};
