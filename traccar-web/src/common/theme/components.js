export default {
  MuiUseMediaQuery: {
    defaultProps: {
      noSsr: true,
    },
  },
  MuiTypography: {
    styleOverrides: {
      root: {
        fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        backgroundImage: 'none',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(5, 5, 5, 0.7)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
        borderRadius: '12px',
      }),
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: '12px',
        textTransform: 'none',
        fontWeight: 600,
      },
      sizeMedium: {
        height: '40px',
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        '@media print': {
          color: theme.palette.alwaysDark.main,
        },
      }),
    },
  },
};
