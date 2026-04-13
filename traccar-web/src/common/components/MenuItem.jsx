import { makeStyles } from 'tss-react/mui';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Link } from 'react-router-dom';

const useStyles = makeStyles()((theme) => ({
  menuItemText: {
    whiteSpace: 'nowrap',
    '& span': {
        fontWeight: 600,
        fontSize: '0.9rem',
        color: '#94a3b8',
    }
  },
  button: {
    margin: theme.spacing(0.5, 1),
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      '& .MuiListItemIcon-root': {
        color: theme.palette.primary.main,
      },
      '& .MuiListItemText-root span': {
        color: '#f1f5f9',
      }
    },
    '&.Mui-selected': {
      backgroundColor: 'rgba(59, 130, 246, 0.08) !important',
      '& .MuiListItemIcon-root': {
        color: theme.palette.primary.main,
      },
      '& .MuiListItemText-root span': {
        color: '#f1f5f9',
        fontWeight: 800,
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        height: '60%',
        width: '4px',
        backgroundColor: theme.palette.primary.main,
        borderRadius: '0 4px 4px 0',
      }
    },
  },
  icon: {
    minWidth: '40px',
    color: '#64748b',
    transition: 'color 0.2s ease',
  }
}));

const MenuItem = ({ title, link, icon, selected }) => {
  const { classes } = useStyles();
  return (
    <ListItemButton key={link} component={Link} to={link} selected={selected} className={classes.button}>
      <ListItemIcon className={classes.icon}>{icon}</ListItemIcon>
      <ListItemText primary={title} className={classes.menuItemText} />
    </ListItemButton>
  );
};

export default MenuItem;
