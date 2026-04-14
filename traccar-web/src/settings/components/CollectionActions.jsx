import { useState } from 'react';
import { IconButton, Menu, MenuItem, useMediaQuery, useTheme } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { makeStyles } from 'tss-react/mui';
import RemoveDialog from '../../common/components/RemoveDialog';
import { useTranslation } from '../../common/components/LocalizationProvider';

const useStyles = makeStyles()((theme) => ({
  row: {
    display: 'flex',
    gap: theme.spacing(0.5),
  },
  iconButton: {
    padding: '6px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    color: '#94a3b8',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      color: '#f1f5f9',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      transform: 'scale(1.05)',
    },
    '& .MuiSvgIcon-root': {
      fontSize: '18px',
    },
  },
  deleteIcon: {
    '&:hover': {
      color: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderColor: 'rgba(239, 68, 68, 0.2)',
    },
  },
}));

const CollectionActions = ({
  itemId,
  editPath,
  endpoint,
  setTimestamp,
  customActions,
  readonly,
}) => {
  const theme = useTheme();
  const { classes, cx } = useStyles();
  const navigate = useNavigate();
  const t = useTranslation();

  const phone = useMediaQuery(theme.breakpoints.down('sm'));

  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [removing, setRemoving] = useState(false);

  const handleEdit = () => {
    navigate(`${editPath}/${itemId}`);
    setMenuAnchorEl(null);
  };

  const handleRemove = () => {
    setRemoving(true);
    setMenuAnchorEl(null);
  };

  const handleCustom = (action) => {
    action.handler(itemId);
    setMenuAnchorEl(null);
  };

  const handleRemoveResult = (removed) => {
    setRemoving(false);
    if (removed) {
      setTimestamp(Date.now());
    }
  };

  return (
    <>
      {phone ? (
        <>
          <IconButton className={classes.iconButton} onClick={(event) => setMenuAnchorEl(event.currentTarget)}>
            <MoreVertIcon />
          </IconButton>
          <Menu open={!!menuAnchorEl} anchorEl={menuAnchorEl} onClose={() => setMenuAnchorEl(null)}>
            {customActions &&
              customActions.map((action) => (
                <MenuItem onClick={() => handleCustom(action)} key={action.key}>
                  {action.title}
                </MenuItem>
              ))}
            <>
              {editPath && <MenuItem disabled={readonly} onClick={handleEdit}>{t('sharedEdit')}</MenuItem>}
              <MenuItem disabled={readonly} onClick={handleRemove}>{t('sharedRemove')}</MenuItem>
            </>
          </Menu>
        </>
      ) : (
        <div className={classes.row}>
          {customActions &&
            customActions.map((action) => (
              <Tooltip title={action.title} key={action.key}>
                <IconButton className={classes.iconButton} onClick={() => handleCustom(action)}>
                  {action.icon}
                </IconButton>
              </Tooltip>
            ))}
          <>
            {editPath && (
              <Tooltip title={t('sharedEdit')}>
                <span>
                  <IconButton className={classes.iconButton} onClick={handleEdit} disabled={readonly}>
                    <EditIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            <Tooltip title={t('sharedRemove')}>
              <span>
                <IconButton className={cx(classes.iconButton, classes.deleteIcon)} onClick={handleRemove} disabled={readonly}>
                  <DeleteIcon />
                </IconButton>
              </span>
            </Tooltip>
          </>
        </div>
      )}
      <RemoveDialog
        style={{ transform: 'none' }}
        open={removing}
        endpoint={endpoint}
        itemId={itemId}
        onResult={handleRemoveResult}
      />
    </>
  );
};

export default CollectionActions;
