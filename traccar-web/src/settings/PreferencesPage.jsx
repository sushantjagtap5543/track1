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
import { sessionActions, notificationsActions } from '../store';
import { useAdministrator, useRestriction } from '../common/util/permissions';
import useReportStyles from '../reports/common/useReportStyles';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { playSound } from '../common/util/sound';
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
  const { classes: settingsClasses } = useSettingsStyles();
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
    dayjs().add(1, 'week').format('YYYY-MM-DD'),
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
    playSound(type);
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
    dispatch(notificationsActions.push(t('settingsSavedSuccessfully')));
    navigate(-1);
  });

  const handleReboot = useCatch(async () => {
    const response = await fetch('/api/server/reboot', { method: 'POST' });
    throw Error(response.statusText);
  });

  // Removed local customStyles to use centralized settingsClasses

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'sharedPreferences']}>
      <div className={classes.container}>
        <div className={classes.containerMain}>
          <Box maxWidth="md" sx={{ width: '100%', mx: 'auto', p: 4 }}>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 5, ml: 1 }}>
              <Box className={settingsClasses.headerIconNew} sx={{ mr: 2 }}>
                <MapIcon />
              </Box>
              <Box>
                <Typography className={settingsClasses.headerTitle}>
                  {t('sharedPreferences')}
                </Typography>
                <Typography className={settingsClasses.headerSubtitle}>
                  {t('settingsPersonalizeTagline')}
                </Typography>
              </Box>
            </Box>

            {!readonly && (
              <>
                <Accordion className={settingsClasses.accordion} defaultExpanded>
                  <AccordionSummary className={settingsClasses.accordionSummary} expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MapIcon sx={{ mr: 1.5, color: '#38bdf8', fontSize: 20 }} />
                      <Typography sx={{ color: '#f8fafc', fontWeight: 700 }}>{t('mapTitle')}</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails className={settingsClasses.details}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                      <FormControl className={settingsClasses.textField}>
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
                                {style.title} {!style.available && `(${t('sharedDisabled')})`}
                              </Typography>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl className={settingsClasses.textField}>
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
                      className={settingsClasses.textField}
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
                      <FormControl className={settingsClasses.textField}>
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
                      <FormControl className={settingsClasses.textField}>
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

                <Accordion className={settingsClasses.accordion}>
                  <AccordionSummary className={settingsClasses.accordionSummary} expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DevicesIcon sx={{ mr: 1.5, color: '#818cf8', fontSize: 20 }} />
                      <Typography sx={{ color: '#f8fafc', fontWeight: 700 }}>{t('deviceTitle')}</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails className={settingsClasses.details}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                      <SelectField
                        className={settingsClasses.textField}
                        value={attributes.devicePrimary || 'name'}
                        onChange={(e) => setAttributes({ ...attributes, devicePrimary: e.target.value })}
                        data={deviceFields}
                        titleGetter={(it) => t(it.name)}
                        label={t('devicePrimaryInfo')}
                      />
                      <SelectField
                        className={settingsClasses.textField}
                        value={attributes.deviceSecondary}
                        onChange={(e) => setAttributes({ ...attributes, deviceSecondary: e.target.value })}
                        data={deviceFields}
                        titleGetter={(it) => t(it.name)}
                        label={t('deviceSecondaryInfo')}
                      />
                    </Box>
                  </AccordionDetails>
                </Accordion>

                <Accordion className={settingsClasses.accordion}>
                  <AccordionSummary className={settingsClasses.accordionSummary} expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <VolumeUpIcon sx={{ mr: 1.5, color: '#fb7185', fontSize: 20 }} />
                      <Typography sx={{ color: '#f8fafc', fontWeight: 700 }}>{t('sharedSound')}</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails className={settingsClasses.details}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                      <SelectField
                        multiple
                        className={settingsClasses.textField}
                        value={attributes.soundEvents?.split(',') || []}
                        onChange={(e) => setAttributes({ ...attributes, soundEvents: e.target.value.join(',') })}
                        endpoint="/api/notifications/types"
                        keyGetter={(it) => it.type}
                        titleGetter={(it) => it.type === 'all' ? t('eventAll') : t(prefixString('event', it.type))}
                        label={t('eventsSoundEvents')}
                      />
                      <SelectField
                        multiple
                        className={settingsClasses.textField}
                        value={attributes.soundAlarms?.split(',') || ['sos']}
                        onChange={(e) => setAttributes({ ...attributes, soundAlarms: e.target.value.join(',') })}
                        data={[{ key: 'all', name: t('eventAll') }, ...alarms]}
                        keyGetter={(it) => it.key}
                        label={t('eventsSoundAlarms')}
                      />
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, alignItems: 'center' }}>
                      <FormControl className={settingsClasses.textField}>
                        <InputLabel>{t('settingsSoundType')}</InputLabel>
                        <Select
                          label={t('settingsSoundType')}
                          value={attributes.soundType || 'default'}
                          onChange={(e) => setAttributes({ ...attributes, soundType: e.target.value })}
                        >
                          <MenuItem value="default">{t('settingsDefaultChime')}</MenuItem>
                          <MenuItem value="siren">{t('settingsEmergencySiren')}</MenuItem>
                          <MenuItem value="digital">{t('settingsDigitalAlert')}</MenuItem>
                          <MenuItem value="minimal">{t('settingsMinimalPing')}</MenuItem>
                          <MenuItem value="softBell">{t('settingsSoftBell')}</MenuItem>
                          <MenuItem value="rapidBeeps">{t('settingsRapidBeeps')}</MenuItem>
                          <MenuItem value="doubleChime">{t('settingsDoubleChime')}</MenuItem>
                          <MenuItem value="radarSweep">{t('settingsRadarSweep')}</MenuItem>
                          <MenuItem value="digitalPulse">{t('settingsDigitalPulse')}</MenuItem>
                          <MenuItem value="technoAlert">{t('settingsTechnoAlert')}</MenuItem>
                          <MenuItem value="echoPing">{t('settingsEchoPing')}</MenuItem>
                          <MenuItem value="warningBlips">{t('settingsWarningBlips')}</MenuItem>
                          <MenuItem value="smoothSine">{t('settingsSmoothSine')}</MenuItem>
                          <MenuItem value="techBeep">{t('settingsTechBeep')}</MenuItem>
                        </Select>
                      </FormControl>
                      <Tooltip title={t('settingsPreviewTone')}>
                        <IconButton 
                          onClick={() => playTestSound(attributes.soundType)}
                          aria-label={t('settingsPreviewTone')}
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

            <Accordion className={settingsClasses.accordion}>
              <AccordionSummary className={settingsClasses.accordionSummary} expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <KeyIcon sx={{ mr: 1.5, color: '#f59e0b', fontSize: 20 }} />
                  <Typography sx={{ color: '#f8fafc', fontWeight: 700 }}>{t('userToken')}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails className={settingsClasses.details}>
                <TextField
                  fullWidth
                  className={settingsClasses.textField}
                  label={t('userExpirationTime')}
                  type="date"
                  value={tokenExpiration}
                  onChange={(e) => {
                    setTokenExpiration(e.target.value);
                    setToken(null);
                  }}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <FormControl className={settingsClasses.textField}>
                  <OutlinedInput
                    multiline
                    rows={4}
                    readOnly
                    value={token || ''}
                    placeholder={t('settingsTokenPlaceholder')}
                    endAdornment={
                      <InputAdornment position="end">
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Tooltip title={t('settingsGenerateToken')}>
                            <IconButton onClick={generateToken} disabled={!!token} sx={{ color: '#38bdf8' }} aria-label={t('settingsGenerateToken')}>
                              <CachedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('settingsCopyToClipboard')}>
                            <IconButton onClick={() => navigator.clipboard.writeText(token)} disabled={!token} sx={{ color: '#38bdf8' }} aria-label={t('settingsCopyToClipboard')}>
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

            <Accordion className={settingsClasses.accordion}>
              <AccordionSummary className={settingsClasses.accordionSummary} expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <InfoIcon sx={{ mr: 1.5, color: '#94a3b8', fontSize: 20 }} />
                  <Typography sx={{ color: '#f8fafc', fontWeight: 700 }}>{t('sharedInfoTitle')}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails className={settingsClasses.details}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                  <TextField className={settingsClasses.textField} value={versionApp} label={t('settingsAppVersion')} disabled />
                  <TextField className={settingsClasses.textField} value={versionServer || '-'} label={t('settingsServerVersion')} disabled />
                  <TextField className={settingsClasses.textField} value={socket ? t('deviceStatusOnline') : t('deviceStatusOffline')} label={t('settingsConnection')} disabled />
                  <Button 
                    variant="outlined" 
                    className={settingsClasses.buttonSecondary}
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
                  className={settingsClasses.buttonSecondary}
                  onClick={() => navigate(-1)}
                >
                  {t('sharedCancel')}
                </Button>
                <Button 
                  fullWidth
                  variant="contained"
                  startIcon={<SaveIcon />}
                  className={settingsClasses.buttonPrimary}
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
