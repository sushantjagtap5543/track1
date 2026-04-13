import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Toolbar,
  IconButton,
  OutlinedInput,
  InputAdornment,
  Popover,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Badge,
  ListItemButton,
  ListItemText,
  Tooltip,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import MapIcon from '@mui/icons-material/Map';
import DnsIcon from '@mui/icons-material/Dns';
import AddIcon from '@mui/icons-material/Add';
import TuneIcon from '@mui/icons-material/Tune';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useDeviceReadonly } from '../common/util/permissions';
import DeviceRow from './DeviceRow';

const useStyles = makeStyles()((theme) => ({
  toolbar: {
    display: 'flex',
    gap: theme.spacing(1),
  },
  filterPanel: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
    gap: theme.spacing(2),
    width: theme.dimensions.drawerWidthTablet,
  },
}));

const MainToolbar = ({
  filteredDevices,
  devicesOpen,
  setDevicesOpen,
  keyword,
  setKeyword,
  filter,
  setFilter,
  filterSort,
  setFilterSort,
  filterMap,
  setFilterMap,
}) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const navigate = useNavigate();
  const t = useTranslation();

  const deviceReadonly = useDeviceReadonly();

  const groups = useSelector((state) => state.groups.items);
  const devices = useSelector((state) => state.devices.items);

  const toolbarRef = useRef();
  const inputRef = useRef();
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [devicesAnchorEl, setDevicesAnchorEl] = useState(null);

  const deviceStatusCount = (status) =>
    Object.values(devices).filter((d) => d.status === status).length;

  return (
    <Toolbar ref={toolbarRef} className={classes.toolbar} sx={{ px: 1, backgroundColor: 'transparent', minHeight: '48px !important' }}>
      <IconButton 
        edge="start" 
        onClick={() => setDevicesOpen(!devicesOpen)}
        sx={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.05)', 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#f8fafc',
          borderRadius: '8px',
          width: '36px',
          height: '36px',
          transition: 'all 0.2s ease',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)', transform: 'scale(1.05)' }
        }}
      >
        {devicesOpen ? <MapIcon sx={{ fontSize: '18px' }} /> : <DnsIcon sx={{ fontSize: '18px' }} />}
      </IconButton>
      <OutlinedInput
        ref={inputRef}
        placeholder={t('sharedSearchDevices')}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onFocus={() => setDevicesAnchorEl(toolbarRef.current)}
        onBlur={() => setDevicesAnchorEl(null)}
        endAdornment={
          <InputAdornment position="end">
            <IconButton 
              size="small" 
              edge="end" 
              onClick={() => setFilterAnchorEl(inputRef.current)}
              sx={{ color: '#f8fafc', opacity: 0.6, mr: 0.5 }}
            >
              <Badge
                color="primary"
                variant="dot"
                invisible={!filter.statuses.length && !filter.groups.length}
              >
                <TuneIcon sx={{ fontSize: '18px' }} />
              </Badge>
            </IconButton>
          </InputAdornment>
        }
        size="small"
        fullWidth
        sx={{
          backgroundColor: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          height: '36px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
          '&:hover': {
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
          '&.Mui-focused': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          },
          '& .MuiOutlinedInput-input': {
            color: '#f8fafc',
            fontWeight: 500,
            fontSize: '0.8rem',
            '&::placeholder': {
              color: 'rgba(255,255,255,0.3)',
              opacity: 1,
            }
          }
        }}
      />
      <Popover
        open={!!devicesAnchorEl && !devicesOpen}
        anchorEl={devicesAnchorEl}
        onClose={() => setDevicesAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: Number(theme.spacing(2).slice(0, -2)),
        }}
        marginThreshold={0}
        slotProps={{
          paper: {
            style: { 
              width: `calc(${toolbarRef.current?.clientWidth}px - ${theme.spacing(4)})`,
              backgroundColor: 'rgba(15, 23, 42, 0.96)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              marginTop: '8px',
            },
          },
        }}
        elevation={0}
        disableAutoFocus
        disableEnforceFocus
      >
        {filteredDevices.slice(0, 3).map((_, index) => (
          <DeviceRow key={filteredDevices[index].id} devices={filteredDevices} index={index} />
        ))}
        {filteredDevices.length > 3 && (
          <ListItemButton 
            alignItems="center" 
            onClick={() => setDevicesOpen(true)}
            sx={{ borderRadius: '0 0 12px 12px' }}
          >
            <ListItemText primary={t('notificationAlways')} style={{ textAlign: 'center' }} />
          </ListItemButton>
        )}
      </Popover>
      <Popover
        open={!!filterAnchorEl}
        anchorEl={filterAnchorEl}
        onClose={() => setFilterAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <div className={classes.filterPanel}>
          <FormControl>
            <InputLabel>{t('deviceStatus')}</InputLabel>
            <Select
              label={t('deviceStatus')}
              value={filter.statuses}
              onChange={(e) => setFilter({ ...filter, statuses: e.target.value })}
              multiple
            >
              <MenuItem value="online">{`${t('deviceStatusOnline')} (${deviceStatusCount('online')})`}</MenuItem>
              <MenuItem value="offline">{`${t('deviceStatusOffline')} (${deviceStatusCount('offline')})`}</MenuItem>
              <MenuItem value="unknown">{`${t('deviceStatusUnknown')} (${deviceStatusCount('unknown')})`}</MenuItem>
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>{t('settingsGroups')}</InputLabel>
            <Select
              label={t('settingsGroups')}
              value={filter.groups}
              onChange={(e) => setFilter({ ...filter, groups: e.target.value })}
              multiple
            >
              {Object.values(groups)
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                .map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>{t('sharedSortBy')}</InputLabel>
            <Select
              label={t('sharedSortBy')}
              value={filterSort}
              onChange={(e) => setFilterSort(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">{'\u00a0'}</MenuItem>
              <MenuItem value="name">{t('sharedName')}</MenuItem>
              <MenuItem value="lastUpdate">{t('deviceLastUpdate')}</MenuItem>
            </Select>
          </FormControl>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox checked={filterMap} onChange={(e) => setFilterMap(e.target.checked)} />
              }
              label={t('sharedFilterMap')}
            />
          </FormGroup>
        </div>
      </Popover>
      <IconButton 
        edge="end" 
        onClick={() => navigate('/ai-insights')}
        sx={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.05)', 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#f8fafc',
          borderRadius: '8px',
          width: '36px',
          height: '36px',
          transition: 'all 0.2s ease',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)', transform: 'scale(1.05)' }
        }}
      >
        <Tooltip title="AI Insights" arrow>
          <AutoAwesomeIcon sx={{ fontSize: '18px' }} />
        </Tooltip>
      </IconButton>
      <IconButton 
        edge="end" 
        onClick={() => navigate('/settings/device')} 
        disabled={deviceReadonly}
        sx={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.05)', 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#f8fafc',
          borderRadius: '8px',
          width: '36px',
          height: '36px',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
        }}
      >
        <Tooltip
          open={!deviceReadonly && Object.keys(devices).length === 0}
          title={t('deviceRegisterFirst')}
          arrow
        >
          <AddIcon sx={{ fontSize: '18px' }} />
        </Tooltip>
      </IconButton>
    </Toolbar>
  );
};

export default MainToolbar;
