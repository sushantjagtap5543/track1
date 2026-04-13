import { makeStyles } from 'tss-react/mui';

export default makeStyles()((theme) => ({
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0b1120', // Even deeper blue-black
    '& > *': {
       zoom: '0.8', 
    }
  },
  containerMain: {
    overflow: 'auto', // Enable scrolling for the main content
    flex: 1,
    padding: theme.spacing(3),
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    backgroundImage: 'radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.08) 0, transparent 50%), radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.08) 0, transparent 50%)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent',
    '&::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '10px',
      border: '2px solid transparent',
      backgroundClip: 'content-box',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: 'rgba(255, 255, 255, 0.2)',
      backgroundClip: 'content-box',
    },
  },
  containerMap: {
    height: '40%',
    minHeight: '300px',
    position: 'relative',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    backdropFilter: 'blur(16px) saturate(180%)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    marginBottom: theme.spacing(3),
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  columnAction: {
    width: '1%',
    paddingLeft: theme.spacing(1),
    '@media print': {
      display: 'none',
    },
  },
  columnActionContainer: {
    display: 'flex',
    gap: theme.spacing(0.5),
    '& .MuiIconButton-root': {
      color: '#94a3b8',
      transition: 'all 0.2s ease',
      '&:hover': {
        color: '#f8fafc',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      }
    }
  },
  table: {
    borderCollapse: 'separate',
    borderSpacing: '0 10px',
    marginTop: -10, // Adjust for spacing
    '& .MuiTableHead-root': {
      '& .MuiTableCell-root': {
        borderBottom: 'none',
        backgroundColor: 'rgba(30, 41, 59, 0.9) !important',
        backdropFilter: 'blur(12px) saturate(160%)',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: '#94a3b8',
        fontSize: '0.75rem',
        padding: theme.spacing(2, 3),
        zIndex: 11,
      },
      '& .MuiTableCell-root:first-of-type': {
        borderTopLeftRadius: '12px',
        borderBottomLeftRadius: '12px',
      },
      '& .MuiTableCell-root:last-of-type': {
        borderTopRightRadius: '12px',
        borderBottomRightRadius: '12px',
      },
    },
    '& .MuiTableBody-root .MuiTableCell-root': {
      borderBottom: 'none',
      color: '#f8fafc',
      fontSize: '0.85rem',
      padding: theme.spacing(2, 3),
    },
  },
  tableRow: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      transform: 'translateY(-2px) scale(1.005)',
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
      '& .MuiTableCell-root': {
        color: '#ffffff',
      }
    },
    '& td:first-of-type': {
      borderTopLeftRadius: '16px',
      borderBottomLeftRadius: '16px',
      borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
    },
    '& td:last-of-type': {
      borderTopRightRadius: '16px',
      borderBottomRightRadius: '16px',
      borderRight: '1px solid rgba(255, 255, 255, 0.05)',
    },
  },
  deviceName: {
    fontWeight: 800,
    color: '#38bdf8', // Light blue for device names
    fontSize: '0.95rem',
    textShadow: '0 0 20px rgba(56, 189, 248, 0.2)',
  },
  eventText: {
    color: '#f8fafc',
    fontWeight: 500,
  },
  filter: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(2.5),
    padding: theme.spacing(3),
    '@media print': {
      display: 'none !important',
    },
  },
  filterItem: {
    minWidth: 0,
    flex: `1 1 ${theme.dimensions.filterFormWidth}`,
    '& .MuiInputBase-root': {
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: '12px',
        color: '#f8fafc',
        height: '45px', // Match button height
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
        },
        '&.Mui-focused': {
          borderColor: '#38bdf8',
          boxShadow: '0 0 0 2px rgba(56, 189, 248, 0.2)',
        }
    },
    '& .MuiInputLabel-root': {
        color: '#94a3b8',
        fontSize: '0.85rem',
        transform: 'translate(14px, 12px) scale(1)', // Center label vertically
        '&.Mui-focused, &.MuiInputLabel-shrink': {
          transform: 'translate(14px, -8px) scale(0.75)',
          color: '#38bdf8',
        }
    },
    '& .MuiOutlinedInput-notchedOutline': {
        border: 'none', // We handle border on MuiInputBase-root
    },
    '& .MuiSelect-select': {
        color: '#f8fafc',
        paddingTop: 0,
        paddingBottom: 0,
        display: 'flex',
        alignItems: 'center',
    },
    '& input::-webkit-calendar-picker-indicator': {
        filter: 'invert(1) opacity(0.6)',
        cursor: 'pointer',
        '&:hover': {
          filter: 'invert(1) opacity(1)',
        }
    },
    '& input': {
        cursor: 'pointer',
        height: '45px',
        padding: '0 14px !important',
        boxSizing: 'border-box',
    }
  },
  filterButtons: {
    display: 'flex',
    gap: theme.spacing(1.5),
    flex: `1 1 ${theme.dimensions.filterFormWidth}`,
    '& .MuiButton-root': {
        color: '#f8fafc',
        borderRadius: '12px',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.3)',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            transform: 'translateY(-1px)',
        }
    }
  },
  filterButton: {
    flexGrow: 1,
    borderRadius: '12px',
    height: '45px',
    fontWeight: 800,
    textTransform: 'none',
    letterSpacing: '0.02em',
    color: '#f8fafc',
  },
  chart: {
    flexGrow: 1,
    height: '500px',
    marginTop: theme.spacing(2),
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: '16px',
    padding: theme.spacing(3),
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  actionCellPadding: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  statCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: theme.spacing(3),
    marginBottom: theme.spacing(4),
  },
  statCard: {
    padding: theme.spacing(3),
    borderRadius: '24px',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    '&:hover': {
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      transform: 'translateY(-5px) scale(1.02)',
      borderColor: 'rgba(56, 189, 248, 0.4)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    }
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  statValue: {
    color: '#f8fafc',
    fontSize: '1.75rem',
    fontWeight: 900,
    letterSpacing: '-0.02em',
  },
  statIcon: {
    color: '#38bdf8',
    marginBottom: theme.spacing(1),
  },
}));
