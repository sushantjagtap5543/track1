import { makeStyles } from 'tss-react/mui';

export default makeStyles()((theme) => ({
  container: {
    padding: theme.spacing(3, 4),
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    boxSizing: 'border-box',
    zoom: '0.8', // Match the high-density feel of reports and device list
  },
  containerMain: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(15, 23, 42, 0.6)', // Deeper slate transparency
    backdropFilter: 'blur(30px) saturate(180%)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    overflow: 'auto',
    padding: theme.spacing(3),
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(56, 189, 248, 0.3) transparent',
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(56, 189, 248, 0.2)',
      borderRadius: '10px',
      border: '2px solid transparent',
      backgroundClip: 'content-box',
      '&:hover': {
          background: 'rgba(56, 189, 248, 0.4)',
          backgroundClip: 'content-box',
      }
    },
  },
  table: {
    '& .MuiTableCell-root': {
      borderColor: 'rgba(255, 255, 255, 0.05)',
      padding: theme.spacing(1.5, 2),
      color: '#cbd5e1', // Slate 300 (lighter)
    },
    '& .MuiTableHead-root .MuiTableCell-root': {
      backgroundColor: 'rgba(15, 23, 42, 0.9) !important',
      color: '#f8fafc', // Slate 50
      fontWeight: 700,
      fontSize: '0.78rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    '& .MuiTableBody-root .MuiTableRow-root:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
  },
  columnAction: {
    width: '1%',
    paddingRight: theme.spacing(1),
  },
  columnActionContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(0.5),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3.5),
    paddingBottom: theme.spacing(2.5),
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: '14px',
    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(129, 140, 248, 0.2) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    color: '#38bdf8',
  },
  headerTitle: {
    color: '#f8fafc',
    fontWeight: 800,
    fontSize: '1.4rem',
    letterSpacing: '-0.02em',
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: '0.82rem',
    marginTop: theme.spacing(0.3),
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2.5),
    padding: theme.spacing(4), // More breathing room
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  },
  buttons: {
    marginTop: theme.spacing(3),
    display: 'flex',
    gap: theme.spacing(2),
    '& > *': {
      flex: 1,
    },
  },
  statCard: {
    background: 'rgba(30, 41, 59, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    padding: theme.spacing(2.5, 3),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statValue: {
    color: '#f8fafc',
    fontSize: '1.5rem',
    fontWeight: 800,
  },
  accordion: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '20px !important',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    marginBottom: theme.spacing(2),
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:before': { display: 'none' },
    '&:hover': {
      backgroundColor: 'rgba(30, 41, 59, 0.5)',
      borderColor: 'rgba(56, 189, 248, 0.2)',
    },
    '&.Mui-expanded': {
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      margin: theme.spacing(0, 0, 2, 0),
    }
  },
  accordionSummary: {
    padding: theme.spacing(1, 3),
    '& .MuiAccordionSummary-expandIconWrapper': {
      color: '#94a3b8',
    },
    '&.Mui-expanded': {
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      minHeight: '48px',
    }
  },
  textField: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      borderRadius: '12px',
      color: '#f8fafc',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'all 0.2s ease',
      '& fieldset': { border: 'none' },
      '&:hover': {
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderColor: 'rgba(56, 189, 248, 0.3)',
      },
      '&.Mui-focused': {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        boxShadow: '0 0 0 2px rgba(56, 189, 248, 0.2)',
        '& fieldset': { border: 'none' },
      }
    },
    '& .MuiInputLabel-root': {
      color: '#94a3b8',
      '&.Mui-focused': { color: '#38bdf8' }
    },
    '& .MuiInputBase-input': {
      padding: theme.spacing(1.5, 2),
    }
  },
  buttonPrimary: {
    borderRadius: '14px',
    padding: theme.spacing(1.5, 4),
    textTransform: 'none',
    fontWeight: 800,
    fontSize: '0.95rem',
    background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
    boxShadow: '0 4px 15px rgba(56, 189, 248, 0.4)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(56, 189, 248, 0.5)',
    },
    '&:active': {
      transform: 'translateY(0)',
    }
  },
  buttonSecondary: {
    borderRadius: '14px',
    padding: theme.spacing(1.5, 4),
    textTransform: 'none',
    fontWeight: 700,
    fontSize: '0.95rem',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#94a3b8',
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
      background: 'rgba(255, 255, 255, 0.05)',
      color: '#f8fafc',
    }
  },
  headerIconNew: {
    width: 44,
    height: 44,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(129, 140, 248, 0.15) 100%)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    '& svg': { fontSize: 22, color: '#38bdf8' }
  }
}));
