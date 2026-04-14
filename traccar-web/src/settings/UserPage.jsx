import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormGroup,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  OutlinedInput,
  Dialog,
  DialogContent,
  DialogActions,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CachedIcon from '@mui/icons-material/Cached';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import TuneIcon from '@mui/icons-material/Tune';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SecurityIcon from '@mui/icons-material/Security';
import KeyIcon from '@mui/icons-material/Key';
import { useDispatch, useSelector } from 'react-redux';
import EditItemView from './components/EditItemView';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import { useTranslation } from '../common/components/LocalizationProvider';
import useUserAttributes from '../common/attributes/useUserAttributes';
import { sessionActions } from '../store';
import SelectField from '../common/components/SelectField';
import SettingsMenu from './components/SettingsMenu';
import useCommonUserAttributes from '../common/attributes/useCommonUserAttributes';
import { useAdministrator, useRestriction, useManager } from '../common/util/permissions';
import { useCatch } from '../reactHelper';
import useMapStyles from '../map/core/useMapStyles';
import { map } from '../map/core/MapView';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';

const UserPage = () => {
  const { classes: settingsClasses } = useSettingsStyles();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();

  const admin = useAdministrator();
  const manager = useManager();
  const fixedEmail = useRestriction('fixedEmail');

  const currentUser = useSelector((state) => state.session.user);
  const registrationEnabled = useSelector((state) => state.session.server.registration);
  const openIdForced = useSelector((state) => state.session.server.openIdForce);
  const totpEnable = useSelector((state) => state.session.server.attributes.totpEnable);
  const totpForce = useSelector((state) => state.session.server.attributes.totpForce);

  const mapStyles = useMapStyles();
  const commonUserAttributes = useCommonUserAttributes(t);
  const userAttributes = useUserAttributes(t);

  const { id } = useParams();
  const [item, setItem] = useState(id === (currentUser?.id || '').toString() ? currentUser : null);

  const [deleteEmail, setDeleteEmail] = useState();
  const [deleteFailed, setDeleteFailed] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeToken, setRevokeToken] = useState('');

  const handleDelete = useCatch(async () => {
    if (deleteEmail === currentUser.email) {
      setDeleteFailed(false);
      await fetchOrThrow(`/api/users/${currentUser.id}`, { method: 'DELETE' });
      navigate('/login');
      dispatch(sessionActions.updateUser(null));
    } else {
      setDeleteFailed(true);
    }
  });

  const handleGenerateTotp = useCatch(async () => {
    const response = await fetchOrThrow('/api/users/totp', { method: 'POST' });
    setItem({ ...item, totpKey: await response.text() });
  });

  const closeRevokeDialog = () => {
    setRevokeDialogOpen(false);
    setRevokeToken('');
  };

  const handleRevokeToken = useCatch(async () => {
    await fetchOrThrow('/api/session/token/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: revokeToken }).toString(),
    });
    closeRevokeDialog();
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const attribute = searchParams.get('attribute');

  useEffect(() => {
    if (item && attribute) {
      if (!item.attributes.hasOwnProperty(attribute)) {
        setItem({ ...item, attributes: { ...item.attributes, [attribute]: '' } });

        const newParams = new URLSearchParams(searchParams);
        newParams.delete('attribute');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [item, searchParams, setSearchParams, attribute]);

  const onItemSaved = (result) => {
    if (result.id === currentUser.id) {
      dispatch(sessionActions.updateUser(result));
    }
  };

  const validate = () =>
    item &&
    item.name &&
    item.email &&
    (item.id || item.password) &&
    (admin || !totpForce || item.totpKey);

  return (
    <EditItemView
      endpoint="users"
      item={item}
      setItem={setItem}
      defaultItem={admin ? { deviceLimit: -1 } : {}}
      validate={validate}
      onItemSaved={onItemSaved}
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'settingsUser']}
    >
      {item && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, ml: 1 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(129, 140, 248, 0.2) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2,
              border: '1px solid rgba(56, 189, 248, 0.2)',
            }}>
              <PersonIcon sx={{ color: '#38bdf8', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                {item.id ? item.name : t('settingsUser')}
              </Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                Manage profile details, system preferences, and security settings.
              </Typography>
            </Box>
          </Box>

          <Accordion defaultExpanded={!attribute} sx={{ background: 'transparent', boxShadow: 'none', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />} sx={{ px: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <KeyIcon sx={{ color: '#38bdf8', fontSize: '1.2rem' }} />
                <Typography sx={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sharedRequired')}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails className={settingsClasses.details}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  fullWidth
                  value={item.name || ''}
                  onChange={(e) => setItem({ ...item, name: e.target.value })}
                  label={t('sharedName')}
                />
                <TextField
                  fullWidth
                  value={item.email || ''}
                  onChange={(e) => setItem({ ...item, email: e.target.value })}
                  label={t('userEmail')}
                  disabled={fixedEmail && item.id === currentUser.id}
                />
              </Box>
              {!openIdForced && (
                <TextField
                  fullWidth
                  type="password"
                  onChange={(e) => setItem({ ...item, password: e.target.value })}
                  label={t('userPassword')}
                />
              )}
              {totpEnable && (
                <FormControl fullWidth>
                  <InputLabel>{t('loginTotpKey')}</InputLabel>
                  <OutlinedInput
                    readOnly
                    label={t('loginTotpKey')}
                    value={item.totpKey || ''}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton size="small" edge="end" onClick={handleGenerateTotp} sx={{ color: '#38bdf8' }}>
                          <CachedIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" edge="end" onClick={() => setItem({ ...item, totpKey: null })} sx={{ color: '#fb7185' }}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                </FormControl>
              )}
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'transparent', boxShadow: 'none', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />} sx={{ px: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <TuneIcon sx={{ color: '#818cf8', fontSize: '1.2rem' }} />
                <Typography sx={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sharedPreferences')}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails className={settingsClasses.details}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  fullWidth
                  value={item.phone || ''}
                  onChange={(e) => setItem({ ...item, phone: e.target.value })}
                  label={t('sharedPhone')}
                />
                <FormControl fullWidth>
                  <InputLabel>{t('mapDefault')}</InputLabel>
                  <Select
                    label={t('mapDefault')}
                    value={item.map || 'locationIqStreets'}
                    onChange={(e) => setItem({ ...item, map: e.target.value })}
                  >
                    {mapStyles.filter((style) => style.available).map((style) => (
                      <MenuItem key={style.id} value={style.id}>
                        {style.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>{t('settingsCoordinateFormat')}</InputLabel>
                  <Select
                    label={t('settingsCoordinateFormat')}
                    value={item.coordinateFormat || 'dd'}
                    onChange={(e) => setItem({ ...item, coordinateFormat: e.target.value })}
                  >
                    <MenuItem value="dd">{t('sharedDecimalDegrees')}</MenuItem>
                    <MenuItem value="ddm">{t('sharedDegreesDecimalMinutes')}</MenuItem>
                    <MenuItem value="dms">{t('sharedDegreesMinutesSeconds')}</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>{t('settingsSpeedUnit')}</InputLabel>
                  <Select
                    label={t('settingsSpeedUnit')}
                    value={(item.attributes && item.attributes.speedUnit) || 'kn'}
                    onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, speedUnit: e.target.value } })}
                  >
                    <MenuItem value="kn">{t('sharedKn')}</MenuItem>
                    <MenuItem value="kmh">{t('sharedKmh')}</MenuItem>
                    <MenuItem value="mph">{t('sharedMph')}</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>{t('settingsDistanceUnit')}</InputLabel>
                  <Select
                    label={t('settingsDistanceUnit')}
                    value={(item.attributes && item.attributes.distanceUnit) || 'km'}
                    onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, distanceUnit: e.target.value } })}
                  >
                    <MenuItem value="km">{t('sharedKm')}</MenuItem>
                    <MenuItem value="mi">{t('sharedMi')}</MenuItem>
                    <MenuItem value="nmi">{t('sharedNmi')}</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>{t('settingsAltitudeUnit')}</InputLabel>
                  <Select
                    label={t('settingsAltitudeUnit')}
                    value={(item.attributes && item.attributes.altitudeUnit) || 'm'}
                    onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, altitudeUnit: e.target.value } })}
                  >
                    <MenuItem value="m">{t('sharedMeters')}</MenuItem>
                    <MenuItem value="ft">{t('sharedFeet')}</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel>{t('settingsVolumeUnit')}</InputLabel>
                  <Select
                    label={t('settingsVolumeUnit')}
                    value={(item.attributes && item.attributes.volumeUnit) || 'ltr'}
                    onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, volumeUnit: e.target.value } })}
                  >
                    <MenuItem value="ltr">{t('sharedLiter')}</MenuItem>
                    <MenuItem value="usGal">{t('sharedUsGallon')}</MenuItem>
                    <MenuItem value="impGal">{t('sharedImpGallon')}</MenuItem>
                  </Select>
                </FormControl>
                <SelectField
                  fullWidth
                  value={item.attributes && item.attributes.timezone}
                  onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, timezone: e.target.value } })}
                  endpoint="/api/server/timezones"
                  keyGetter={(it) => it}
                  titleGetter={(it) => it}
                  label={t('sharedTimezone')}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'transparent', boxShadow: 'none', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />} sx={{ px: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LocationOnIcon sx={{ color: '#34d399', fontSize: '1.2rem' }} />
                <Typography sx={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sharedLocation')}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails className={settingsClasses.details}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3, mb: 2 }}>
                <TextField fullWidth type="number" label={t('positionLatitude')} value={item.latitude || 0} onChange={(e) => setItem({ ...item, latitude: Number(e.target.value) })} />
                <TextField fullWidth type="number" label={t('positionLongitude')} value={item.longitude || 0} onChange={(e) => setItem({ ...item, longitude: Number(e.target.value) })} />
                <TextField fullWidth type="number" label={t('serverZoom')} value={item.zoom || 0} onChange={(e) => setItem({ ...item, zoom: Number(e.target.value) })} />
              </Box>
              <Button
                variant="contained"
                startIcon={<LocationOnIcon />}
                onClick={() => {
                  const { lng, lat } = map.getCenter();
                  setItem({ ...item, latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)), zoom: Number(map.getZoom().toFixed(1)) });
                }}
                sx={{ 
                  borderRadius: '12px', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', 
                  border: '1px solid rgba(52, 211, 153, 0.2)', textTransform: 'none', fontWeight: 700,
                  '&:hover': { background: 'rgba(52, 211, 153, 0.2)' }
                }}
              >
                {t('mapCurrentLocation')}
              </Button>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'transparent', boxShadow: 'none', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />} sx={{ px: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <SecurityIcon sx={{ color: '#f59e0b', fontSize: '1.2rem' }} />
                <Typography sx={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sharedPermissions')}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails className={settingsClasses.details}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3, mb: 3 }}>
                <TextField fullWidth label={t('userExpirationTime')} type="date" value={item.expirationTime ? item.expirationTime.split('T')[0] : '2099-01-01'} onChange={(e) => e.target.value && setItem({ ...item, expirationTime: new Date(e.target.value).toISOString() })} disabled={!manager} InputLabelProps={{ shrink: true }} />
                <TextField fullWidth type="number" value={item.deviceLimit || 0} onChange={(e) => setItem({ ...item, deviceLimit: Number(e.target.value) })} label={t('userDeviceLimit')} disabled={!admin} />
                <TextField fullWidth type="number" value={item.userLimit || 0} onChange={(e) => setItem({ ...item, userLimit: Number(e.target.value) })} label={t('userUserLimit')} disabled={!admin} />
              </Box>
              
              <Button 
                variant="contained" 
                onClick={() => setRevokeDialogOpen(true)}
                sx={{ 
                  borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', 
                  border: '1px solid rgba(245, 158, 11, 0.2)', textTransform: 'none', fontWeight: 700, mb: 2,
                  '&:hover': { background: 'rgba(245, 158, 11, 0.2)' }
                }}
              >
                {t('userRevokeToken')}
              </Button>

              <FormGroup sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
                {[
                  { key: 'disabled', label: t('sharedDisabled'), disabled: !manager },
                  { key: 'administrator', label: t('userAdmin'), disabled: !admin },
                  { key: 'readonly', label: t('serverReadonly'), disabled: !manager },
                  { key: 'deviceReadonly', label: t('userDeviceReadonly'), disabled: !manager },
                  { key: 'limitCommands', label: t('userLimitCommands'), disabled: !manager },
                  { key: 'disableReports', label: t('userDisableReports'), disabled: !manager },
                  { key: 'fixedEmail', label: t('userFixedEmail'), disabled: !manager },
                ].map((cb) => (
                  <FormControlLabel
                    key={cb.key}
                    disabled={cb.disabled}
                    control={<Checkbox sx={{ color: '#334155', '&.Mui-checked': { color: '#f59e0b' } }} checked={item[cb.key] || false} onChange={(e) => setItem({ ...item, [cb.key]: e.target.checked })} />}
                    label={<Typography sx={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{cb.label}</Typography>}
                  />
                ))}
              </FormGroup>
            </AccordionDetails>
          </Accordion>

          <EditAttributesAccordion
            attribute={attribute}
            attributes={item.attributes}
            layout="grid"
            setAttributes={(attributes) => setItem({ ...item, attributes })}
            definitions={{ ...commonUserAttributes, ...userAttributes }}
            focusAttribute={attribute}
          />

          {registrationEnabled && item.id === currentUser.id && !manager && (
            <Accordion sx={{ background: 'transparent', boxShadow: 'none', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fb7185' }} />} sx={{ px: 1 }}>
                <Typography sx={{ color: '#fb7185', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase' }}>{t('userDeleteAccount')}</Typography>
              </AccordionSummary>
              <AccordionDetails className={settingsClasses.details}>
                <TextField fullWidth value={deleteEmail} onChange={(e) => setDeleteEmail(e.target.value)} label={t('userEmail')} error={deleteFailed} helperText={deleteFailed && 'Email mismatch'} sx={{ mb: 2 }} />
                <Button variant="contained" color="error" onClick={handleDelete} startIcon={<DeleteForeverIcon />} sx={{ borderRadius: '12px', py: 1.5, fontWeight: 700 }}>
                  {t('userDeleteAccount')}
                </Button>
              </AccordionDetails>
            </Accordion>
          )}
        </>
      )}

      <Dialog open={revokeDialogOpen} onClose={closeRevokeDialog} fullWidth maxWidth="xs" PaperProps={{ sx: { background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', backdropFilter: 'blur(30px)' } }}>
        <DialogContent sx={{ p: 4 }}>
          <TextField fullWidth value={revokeToken} onChange={(e) => setRevokeToken(e.target.value)} label={t('userToken')} autoFocus />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={closeRevokeDialog} sx={{ color: '#94a3b8' }}>{t('sharedCancel')}</Button>
          <Button onClick={handleRevokeToken} disabled={!revokeToken} variant="contained" sx={{ borderRadius: '12px', background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)', px: 3 }}>{t('userRevokeToken')}</Button>
        </DialogActions>
      </Dialog>
    </EditItemView>
  );
};

export default UserPage;
