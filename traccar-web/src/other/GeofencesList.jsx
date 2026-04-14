import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import {
  List,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
} from '@mui/material';
import FenceIcon from '@mui/icons-material/Fence';

import { geofencesActions } from '../store';
import CollectionActions from '../settings/components/CollectionActions';
import { useCatchCallback } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  list: {
    flexGrow: 1,
    overflow: 'auto',
    padding: theme.spacing(1, 0),
  },
  item: {
    margin: theme.spacing(0.5, 1),
    padding: theme.spacing(1.2, 1.5),
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.3)',
    },
    '&.Mui-selected': {
      backgroundColor: 'rgba(59, 130, 246, 0.08) !important',
      borderLeft: `4px solid ${theme.palette.primary.main}`,
      borderColor: 'rgba(59, 130, 246, 0.2)',
    },
  },
  avatar: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    width: '40px',
    height: '40px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
  },
  icon: {
    width: '22px',
    height: '22px',
    color: '#38bdf8',
  },
}));

const GeofencesList = ({ onGeofenceSelected }) => {
  const { classes, cx } = useStyles();
  const dispatch = useDispatch();

  const items = useSelector((state) => state.geofences.items);
  const selectedId = useSelector((state) => state.geofences.selectedId);

  const refreshGeofences = useCatchCallback(async () => {
    const response = await fetchOrThrow('/api/geofences');
    dispatch(geofencesActions.refresh(await response.json()));
  }, [dispatch]);

  const handleSelect = (id) => {
    dispatch(geofencesActions.selectId(id));
    if (onGeofenceSelected) {
      onGeofenceSelected(id);
    }
  };

  return (
    <List className={classes.list}>
      {Object.values(items).map((item) => (
        <ListItemButton
          key={item.id}
          className={cx(classes.item, selectedId === item.id && 'Mui-selected')}
          onClick={() => handleSelect(item.id)}
          disableRipple
        >
          <ListItemAvatar>
            <Avatar className={classes.avatar}>
              <FenceIcon className={classes.icon} />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography sx={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                {item.name}
              </Typography>
            }
          />
          <CollectionActions
            itemId={item.id}
            editPath="/settings/geofence"
            endpoint="geofences"
            setTimestamp={refreshGeofences}
          />
        </ListItemButton>
      ))}
    </List>
  );
};

export default GeofencesList;
