import { useState } from 'react';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  IconButton,
  OutlinedInput,
  Autocomplete,
  TextField,
  createFilterOptions,
  Button,
  Box,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CachedIcon from '@mui/icons-material/Cached';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MapIcon from '@mui/icons-material/Map';
import DevicesIcon from '@mui/icons-material/Devices';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import KeyIcon from '@mui/icons-material/Key';
import InfoIcon from '@mui/icons-material/Info';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

import { useTranslation, useTranslationKeys } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import usePositionAttributes from '../common/attributes/usePositionAttributes';
import { prefixString, unprefixString } from '../common/util/stringUtils';
import SelectField from '../common/components/SelectField';
import useMapStyles from '../map/core/useMapStyles';
import useMapOverlays from '../map/overlay/useMapOverlays';
import { useCatch } from '../reactHelper';
import { sessionActions } from '../store';
import { useAdministrator, useRestriction } from '../common/util/permissions';
import useReportStyles from '../reports/common/useReportStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';
import alarm from '../resources/alarm.mp3';

const deviceFields = [
  { id: 'name', name: 'sharedName' },
  { id: 'uniqueId', name: 'deviceIdentifier' },
  { id: 'phone', name: 'sharedPhone' },
  { id: 'model', name: 'deviceModel' },
  { id: 'contact', name: 'deviceContact' },
  { id: 'geofenceIds', name: 'sharedGeofence' },
  { id: 'driverUniqueId', name: 'sharedDriver' },
  { id: 'motion', name: 'positionMotion' },
];

const PreferencesPage = () => {
  const { classes } = useReportStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const admin = useAdministrator();
  const readonly = useRestriction('readonly');

  const user = useSelector((state) => state.session.user);
  const [attributes, setAttributes] = useState(user.attributes);

  const versionApp = import.meta.env.VITE_APP_VERSION;
  const versionServer = useSelector((state) => state.session.server.version);
  const socket = useSelector((state) => state.session.socket);

  const [token, setToken] = useState(null);
  const [tokenExpiration, setTokenExpiration] = useState(
    dayjs().add(1, 'week').locale('en').format('YYYY-MM-DD'),
  );

  const mapStyles = useMapStyles();
  const mapOverlays = useMapOverlays();

  const positionAttributes = usePositionAttributes(t);

  const filter = createFilterOptions();

  const generateToken = useCatch(async () => {
    const expiration = dayjs(tokenExpiration, 'YYYY-MM-DD').toISOString();
    const response = await fetchOrThrow('/api/session/token', {
      method: 'POST',
      body: new URLSearchParams(`expiration=${expiration}`),
    });
    setToken(await response.text());
  });

  const playTestSound = (type) => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);

    switch(type) {
      case 'siren':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 1.0);
        break;
      case 'digital':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(1600, audioCtx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.2);
        break;
      case 'minimal':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        break;
      case 'softBell':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(1500, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
        break;
      case 'rapidBeeps':
        oscillator.type = 'square';
        [0, 0.2, 0.4].forEach(t => {
          oscillator.frequency.setValueAtTime(1800, audioCtx.currentTime + t);
          gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime + t);
          gainNode.gain.setValueAtTime(0, audioCtx.currentTime + t + 0.1);
        });
        break;
      case 'doubleChime':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(1108, audioCtx.currentTime + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        break;
      case 'radarSweep':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.8);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.9);
        break;
      case 'digitalPulse':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + 0.2);
        break;
      case 'technoAlert':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.5);
        oscillator.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 1);
        break;
      case 'echoPing':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(2000, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
        break;
      case 'warningBlips':
        oscillator.type = 'sine';
        [0, 0.15, 0.3].forEach(t => {
          oscillator.frequency.setValueAtTime(3000, audioCtx.currentTime + t);
          gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime + t);
          gainNode.gain.setValueAtTime(0, audioCtx.currentTime + t + 0.05);
        });
        break;
      case 'smoothSine':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);
        break;
      case 'techBeep':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(2500, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        break;
      default:
        new Audio(alarm).play().catch(() => {
           oscillator.type = 'triangle';
           oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
           oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.2);
        });
        break;
    }

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 1);
  };

  const alarms = useTranslationKeys((it) => it.startsWith('alarm')).map((it) => ({
    key: unprefixString('alarm', it),
    name: t(it),
  }));

  const handleSave = useCatch(async () => {
    const response = await fetchOrThrow(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, attributes }),
    });
    dispatch(sessionActions.updateUser(await response.json()));
    navigate(-1);
  });

  const handleReboot = useCatch(async () => {
    const response = await fetch('/api/server/reboot', { method: 'POST' });
    throw Error(response.statusText);
  });

  const customStyles = {
    accordion: {
      backgroundColor: 'rgba(30, 41, 59, 0.4)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '20px !important',
      boxShadow: 'none',
      marginBottom: '16px',
      overflow: 'visible',
      '&:before': { display: 'none' },
    },
    accordionSummary: {
      padding: '8px 24px',
      '& .MuiAccordionSummary-expandIconWrapper': {
        color: '#94a3b8',
      },
      '&.Mui-expanded': {
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }
    },
    details: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      padding: '24px',
    },
    textField: {
      '& .MuiOutlinedInput-root': {
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: '12px',
        color: '#f8fafc !important',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        '& fieldset': { border: 'none' },
        '&:hover': {
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
        },
        '&.Mui-focused': {
          boxShadow: '0 0 0 2px rgba(56, 189, 248, 0.2)',
        }
      },
      '& .MuiInputLabel-root': {
        color: '#94a3b8 !important',
        '&.Mui-focused': { color: '#38bdf8 !important' }
      },
      '& .MuiInputBase-input': {
        color: '#f8fafc !important',
      }
    },
    headerIcon: {
      width: 40,
      height: 40,
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '16px',
      background: 'linear-gradient(135deg, rgba(56,189,248,0.2) 0%, rgba(129,140,248,0.2) 100%)',
      border: '1px solid rgba(56,189,248,0.2)',
      '& svg': { fontSize: 20, color: '#38bdf8' }
    }
  };

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'sharedPreferences']}>
      <div className={classes.container}>
        <div className={classes.containerMain}>
          <Box maxWidth="md" sx={{ width: '100%', mx: 'auto', p: 4 }}>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Box sx={customStyles.headerIcon}>
                <MapIcon />
              </Box>
              <Box>
                <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                  {t('sharedPreferences')}
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                  Personalize your GeoSurePath experience and dashboard settings
                </Typography>
              </Box>
            </Box>

            {!readonly && (
              <>
                <Accordion sx={customStyles.accordion} defaultExpanded>
                  <AccordionSummary sx={customStyles.accordionSummary} expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MapIcon sx={{ mr: 1.5, color: '#38bdf8', fontSize: 20 }} />
                      <Typography sx={{ color: '#f8fafc', fontWeight: 700 }}>{t('mapTitle')}</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={customStyles.details}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                      <FormControl sx={customStyles.textField}>
                        <InputLabel>{t('mapActive')}</InputLabel>
                        <Select
                          label={t('mapActive')}
                          value={attributes.activeMapStyles?.split(',') || ['locationIqStreets', 'locationIqDark', 'openFreeMap']}
                          onChange={(e, child) => {
                            const clickedVal = e.target.value[e.target.value.length - 1];
                            const clicked = mapStyles.find((s) => s.id === clickedVal);
                            if (clicked && clicked.available) {
                              setAttributes({ ...attributes, activeMapStyles: e.target.value.join(',') });
                            }
                          }}
                          multiple
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                '& .MuiMenuItem-root': {
                                  '&:hover': { backgroundColor: 'rgba(56, 189, 248, 0.1)' }
                                }
                              }
                            }
                          }}
                        >
                          {mapStyles.filter((s) => s.available || (attributes.activeMapStyles?.split(',') || []).includes(s.id)).map((style) => (
                            <MenuItem key={style.id} value={style.id}>
                              <Typography sx={{ color: style.available ? '#f8fafc' : '#ef4444', fontWeight: style.available ? 600 : 400 }}>
                                {style.title} {!style.available && '(Locked)'}
                              </Typography>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl sx={customStyles.textField}>
                        <InputLabel>{t('mapOverlay')}</InputLabel>
                        <Select
                          label={t('mapOverlay')}
                          value={attributes.selectedMapOverlay || ''}
                          onChange={(e) => {
                            const clicked = mapOverlays.find((o) => o.id === e.target.value);
                            if (!clicked || clicked.available) {
                                setAttributes({ ...attributes, selectedMapOverlay: e.target.value });
                            }
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                              }
                            }
                          }}
                        >
                          <MenuItem value="">{'\u00a0'}</MenuItem>
                          {mapOverlays.filter((o) => o.available || o.id === attributes.selectedMapOverlay).map((overlay) => (
                            <MenuItem key={overlay.id} value={overlay.id}>
                              <Typography sx={{ color: overlay.available ? '#f8fafc' : '#ef4444' }}>{overlay.title}</Typography>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <Autocomplete
                      multiple
                      freeSolo
                      sx={customStyles.textField}
                      options={Object.keys(positionAttributes)}
                      getOptionLabel={(option) => {
                        if (typeof option === 'object' && option.inputValue) return option.inputValue;
                        return positionAttributes[option]?.name || option;
                      }}
                      value={attributes.positionItems?.split(',') || ['fixTime', 'address', 'speed', 'totalDistance']}
                      onChange={(_, newValue) => {
                        setAttributes({
                          ...attributes,
                          positionItems: newValue.map((x) => (typeof x === 'string' ? x : x.inputValue)).join(','),
                        });
                      }}
                      renderInput={(params) => <TextField {...params} label={t('attributePopupInfo')} />}
                    />

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                      <FormControl sx={customStyles.textField}>
                        <InputLabel>{t('mapLiveRoutes')}</InputLabel>
                        <Select
                          label={t('mapLiveRoutes')}
                          value={attributes.mapLiveRoutes || 'none'}
                          onChange={(e) => setAttributes({ ...attributes, mapLiveRoutes: e.target.value })}
                        >
                          <MenuItem value="none">{t('sharedDisabled')}</MenuItem>
                          <MenuItem value="selected">{t('deviceSelected')}</MenuItem>
                          <MenuItem value="all">{t('notificationAlways')}</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl sx={customStyles.textField}>
                        <InputLabel>{t('mapDirection')}</InputLabel>
                        <Select
                          label={t('mapDirection')}
                          value={attributes.mapDirection || 'selected'}
                          onChange={(e) => setAttributes({ ...attributes, mapDirection: e.target.value })}
                        >
                          <MenuItem value="none">{t('sharedDisabled')}</MenuItem>
                          <MenuItem value="selected">{t('deviceSelected')}</MenuItem>
                          <MenuItem value="all">{t('notificationAlways')}</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    <FormGroup sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                      {[
                        { key: 'mapGeofences', label: t('attributeShowGeofences'), default: true },
                        { key: 'mapFollow', label: t('deviceFollow'), default: false },
                        { key: 'mapCluster', label: t('mapClustering'), default: true },
                        { key: 'mapOnSelect', label: t('mapOnSelect'), default: true },
                      ].map((cb) => (
                        <FormControlLabel
                          key={cb.key}
                          sx={{ color: '#f8fafc', '& .MuiCheckbox-root': { color: '#334155', '&.Mui-checked': { color: '#38bdf8' } } }}
                          control={
                            <Checkbox
                              checked={attributes.hasOwnProperty(cb.key) ? attributes[cb.key] : cb.default}
                              onChange={(e) => setAttributes({ ...attributes, [cb.key]: e.target.checked })}
                            />
                          }
                          label={<Typography sx={{ fontSize: '0.85rem' }}>{cb.label}</Typography>}
                        />
                      ))}
                    </FormGroup>
                  </AccordionDetails>
                </Accordion>

                <Accordion sx={customStyles.accordion}>
                  <AccordionSummary sx={customStyles.accordionSummary} expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DevicesIcon sx={{ mr: 1.5, color: '#818cf8', fontSize: 20 }} />
                      <Typography sx={{ color: '#f8fafc', fontWeight: 700 }}>{t('deviceTitle')}</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={customStyles.details}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                      <SelectField
                        sx={customStyles.textField}
                        value={attributes.devicePrimary || 'name'}
                        onChange={(e) => setAttributes({ ...attributes, devicePrimary: e.target.value })}
                        data={deviceFields}
                        titleGetter={(it) => t(it.name)}
                        label={t('devicePrimaryInfo')}
                      />
                      <SelectField
                        sx={customStyles.textField}
                        value={attributes.deviceSecondary}
                        onChange={(e) => setAttributes({ ...attributes, deviceSecondary: e.target.value })}
                        data={deviceFields}
                        titleGetter={(it) => t(it.name)}
                        label={t('deviceSecondaryInfo')}
                      />
                    </Box>
                  </AccordionDetails>
                </Accordion>

                <Accordion sx={customStyles.accordion}>
                  <AccordionSummary sx={customStyles.accordionSummary} expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <VolumeUpIcon sx={{ mr: 1.5, color: '#fb7185', fontSize: 20 }} />
                      <Typography sx={{ color: '#f8fafc', fontWeight: 700 }}>{t('sharedSound')}</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={customStyles.details}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                      <SelectField
                        multiple
                        sx={customStyles.textField}
                        value={attributes.soundEvents?.split(',') || []}
                        onChange={(e) => setAttributes({ ...attributes, soundEvents: e.target.value.join(',') })}
                        endpoint="/api/notifications/types"
                        keyGetter={(it) => it.type}
                        titleGetter={(it) => it.type === 'all' ? 'All Events' : t(prefixString('event', it.type))}
                        label={t('eventsSoundEvents')}
                      />
                      <SelectField
                        multiple
                        sx={customStyles.textField}
                        value={attributes.soundAlarms?.split(',') || ['sos']}
                        onChange={(e) => setAttributes({ ...attributes, soundAlarms: e.target.value.join(',') })}
                        data={[{ key: 'all', name: 'All Alarms' }, ...alarms]}
                        keyGetter={(it) => it.key}
                        label={t('eventsSoundAlarms')}
                      />
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, alignItems: 'center' }}>
                      <FormControl sx={customStyles.textField}>
                        <InputLabel>Sound Type</InputLabel>
                        <Select
                          label="Sound Type"
                          value={attributes.soundType || 'default'}
                          onChange={(e) => setAttributes({ ...attributes, soundType: e.target.value })}
                        >
                          <MenuItem value="default">Default Chime</MenuItem>
                          <MenuItem value="siren">Emergency Siren</MenuItem>
                          <MenuItem value="digital">Digital Alert</MenuItem>
                          <MenuItem value="minimal">Minimal Ping</MenuItem>
                          <MenuItem value="softBell">Soft Bell</MenuItem>
                          <MenuItem value="rapidBeeps">Rapid Beeps</MenuItem>
                          <MenuItem value="doubleChime">Double Chime</MenuItem>
                          <MenuItem value="radarSweep">Radar Sweep</MenuItem>
                          <MenuItem value="digitalPulse">Digital Pulse</MenuItem>
                          <MenuItem value="technoAlert">Techno Alert</MenuItem>
                          <MenuItem value="echoPing">Echo Ping</MenuItem>
                          <MenuItem value="warningBlips">Warning Blips</MenuItem>
                          <MenuItem value="smoothSine">Smooth Sine</MenuItem>
                          <MenuItem value="techBeep">Tech Beep</MenuItem>
                        </Select>
                      </FormControl>
                      <Tooltip title="Preview Selected Tone">
                        <IconButton 
                          onClick={() => playTestSound(attributes.soundType)}
                          sx={{ 
                            background: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)', 
                            color: '#fff',
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(251, 113, 133, 0.4)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                              transform: 'scale(1.05)',
                            }
                          }}
                        >
                          <VolumeUpIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </>
            )}

            <Accordion sx={customStyles.accordion}>
              <AccordionSummary sx={customStyles.accordionSummary} expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <KeyIcon sx={{ mr: 1.5, color: '#f59e0b', fontSize: 20 }} />
                  <Typography sx={{ color: '#f8fafc', fontWeight: 700 }}>{t('userToken')}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={customStyles.details}>
                <TextField
                  fullWidth
                  sx={customStyles.textField}
                  label={t('userExpirationTime')}
                  type="date"
                  value={tokenExpiration}
                  onChange={(e) => {
                    setTokenExpiration(e.target.value);
                    setToken(null);
                  }}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <FormControl sx={customStyles.textField}>
                  <OutlinedInput
                    multiline
                    rows={4}
                    readOnly
                    value={token || ''}
                    placeholder="Generated token will appear here..."
                    endAdornment={
                      <InputAdornment position="end">
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Tooltip title="Generate Token">
                            <IconButton onClick={generateToken} disabled={!!token} sx={{ color: '#38bdf8' }}>
                              <CachedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Copy to Clipboard">
                            <IconButton onClick={() => navigator.clipboard.writeText(token)} disabled={!token} sx={{ color: '#38bdf8' }}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </InputAdornment>
                    }
                  />
                </FormControl>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={customStyles.accordion}>
              <AccordionSummary sx={customStyles.accordionSummary} expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <InfoIcon sx={{ mr: 1.5, color: '#94a3b8', fontSize: 20 }} />
                  <Typography sx={{ color: '#f8fafc', fontWeight: 700 }}>{t('sharedInfoTitle')}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={customStyles.details}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                  <TextField sx={customStyles.textField} value={versionApp} label={t('settingsAppVersion')} disabled />
                  <TextField sx={customStyles.textField} value={versionServer || '-'} label={t('settingsServerVersion')} disabled />
                  <TextField sx={customStyles.textField} value={socket ? t('deviceStatusOnline') : t('deviceStatusOffline')} label={t('settingsConnection')} disabled />
                  <Button 
                    variant="outlined" 
                    sx={{ borderRadius: '12px', borderColor: 'rgba(56,189,248,0.4)', color: '#38bdf8', textTransform: 'none', fontWeight: 700 }}
                    onClick={() => navigate('/emulator')}
                  >
                    {t('sharedEmulator')}
                  </Button>
                </Box>
                {admin && (
                  <Button 
                    variant="contained" 
                    color="error" 
                    sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, mt: 1 }}
                    onClick={handleReboot}
                  >
                    {t('serverReboot')}
                  </Button>
                )}
              </AccordionDetails>
            </Accordion>

            {!readonly && (
              <Box sx={{ display: 'flex', gap: 2, mt: 4, pt: 4, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Button 
                  fullWidth
                  variant="outlined"
                  startIcon={<CloseIcon />}
                  sx={{ borderRadius: '14px', py: 1.5, textTransform: 'none', fontWeight: 700, borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
                  onClick={() => navigate(-1)}
                >
                  {t('sharedCancel')}
                </Button>
                <Button 
                  fullWidth
                  variant="contained"
                  startIcon={<SaveIcon />}
                  sx={{ 
                    borderRadius: '14px', py: 1.5, textTransform: 'none', fontWeight: 800,
                    background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                    boxShadow: '0 4px 15px rgba(56, 189, 248, 0.4)'
                  }}
                  onClick={handleSave}
                >
                  {t('sharedSave')}
                </Button>
              </Box>
            )}
            
          </Box>
        </div>
      </div>
    </PageLayout>
  );
};

export default PreferencesPage;
