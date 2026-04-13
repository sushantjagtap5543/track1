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
        borderRadius: '12px',
        textTransform: 'none',
        fontWeight: 600,
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
      },
    },
  },
};
