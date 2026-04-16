import { useState } from 'react';
import TextField from '@mui/material/TextField';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Button,
  FormControl,
  Container,
  Checkbox,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MuiFileInput } from 'mui-file-input';
import { sessionActions } from '../store';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import { useTranslation } from '../common/components/LocalizationProvider';
import SelectField from '../common/components/SelectField';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import useCommonDeviceAttributes from '../common/attributes/useCommonDeviceAttributes';
import useCommonUserAttributes from '../common/attributes/useCommonUserAttributes';
import { useCatch } from '../reactHelper';
import useServerAttributes from '../common/attributes/useServerAttributes';
import useMapStyles from '../map/core/useMapStyles';
import { map } from '../map/core/MapView';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';

import SettingsIcon from '@mui/icons-material/Settings';
import MapIcon from '@mui/icons-material/Map';
import SecurityIcon from '@mui/icons-material/Security';
import FolderIcon from '@mui/icons-material/Folder';
import { Paper, Box } from '@mui/material';

const ServerPage = () => {
  const { classes: settingsClasses } = useSettingsStyles();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();

  const mapStyles = useMapStyles();
  const commonUserAttributes = useCommonUserAttributes(t);
  const commonDeviceAttributes = useCommonDeviceAttributes(t);
  const serverAttributes = useServerAttributes(t);

  const original = useSelector((state) => state.session.server);
  const [item, setItem] = useState({ ...original });

  const handleFileChange = useCatch(async (newFile) => {
    if (newFile) {
      await fetchOrThrow(`/api/server/file/${newFile.name}`, {
        method: 'POST',
        body: newFile,
      });
    }
  });

  const handleSave = useCatch(async () => {
    const response = await fetchOrThrow('/api/server', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    dispatch(sessionActions.updateServer(await response.json()));
    navigate(-1);
  });

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'settingsServer']}>
      <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 5, ml: 1 }}>
          <Box className={settingsClasses.headerIconNew} sx={{ mr: 2 }}>
            <SettingsIcon />
          </Box>
          <Box>
            <Typography className={settingsClasses.headerTitle}>{t('settingsServer')}</Typography>
            <Typography className={settingsClasses.headerSubtitle}>
              {t('settingsServerManageSubtitle')}
            </Typography>
          </Box>
        </Box>

        {item && (
          <>
            <Accordion className={settingsClasses.accordion} defaultExpanded>
              <AccordionSummary className={settingsClasses.accordionSummary} expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <MapIcon sx={{ color: '#38bdf8', fontSize: '1.2rem' }} />
                    <Typography sx={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sharedPreferences')}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails className={settingsClasses.details}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                    <TextField
                    fullWidth
                    className={settingsClasses.textField}
                    value={item.mapUrl || ''}
                    onChange={(event) => setItem({ ...item, mapUrl: event.target.value })}
                    label={t('mapCustomLabel')}
                    />
                    <TextField
                    fullWidth
                    className={settingsClasses.textField}
                    value={item.overlayUrl || ''}
                    onChange={(event) => setItem({ ...item, overlayUrl: event.target.value })}
                    label={t('mapOverlayCustom')}
                    />
                    <FormControl fullWidth className={settingsClasses.textField}>
                    <InputLabel>{t('mapDefault')}</InputLabel>
                    <Select
                        label={t('mapDefault')}
                        value={item.map || 'locationIqStreets'}
                        onChange={(e) => setItem({ ...item, map: e.target.value })}
                    >
                        {mapStyles
                        .filter((style) => style.available)
                        .map((style) => (
                            <MenuItem key={style.id} value={style.id}>
                            <Typography component="span">{style.title}</Typography>
                            </MenuItem>
                        ))}
                    </Select>
                    </FormControl>
                    <FormControl fullWidth className={settingsClasses.textField}>
                    <InputLabel>{t('settingsCoordinateFormat')}</InputLabel>
                    <Select
                        label={t('settingsCoordinateFormat')}
                        value={item.coordinateFormat || 'dd'}
                        onChange={(event) => setItem({ ...item, coordinateFormat: event.target.value })}
                    >
                        <MenuItem value="dd">{t('sharedDecimalDegrees')}</MenuItem>
                        <MenuItem value="ddm">{t('sharedDegreesDecimalMinutes')}</MenuItem>
                        <MenuItem value="dms">{t('sharedDegreesMinutesSeconds')}</MenuItem>
                    </Select>
                    </FormControl>
                    <FormControl fullWidth className={settingsClasses.textField}>
                    <InputLabel>{t('settingsSpeedUnit')}</InputLabel>
                    <Select
                        label={t('settingsSpeedUnit')}
                        value={item.attributes.speedUnit || 'kn'}
                        onChange={(e) =>
                        setItem({
                            ...item,
                            attributes: { ...item.attributes, speedUnit: e.target.value },
                        })
                        }
                    >
                        <MenuItem value="kn">{t('sharedKn')}</MenuItem>
                        <MenuItem value="kmh">{t('sharedKmh')}</MenuItem>
                        <MenuItem value="mph">{t('sharedMph')}</MenuItem>
                    </Select>
                    </FormControl>
                    <FormControl fullWidth className={settingsClasses.textField}>
                    <InputLabel>{t('settingsDistanceUnit')}</InputLabel>
                    <Select
                        label={t('settingsDistanceUnit')}
                        value={item.attributes.distanceUnit || 'km'}
                        onChange={(e) =>
                        setItem({
                            ...item,
                            attributes: { ...item.attributes, distanceUnit: e.target.value },
                        })
                        }
                    >
                        <MenuItem value="km">{t('sharedKm')}</MenuItem>
                        <MenuItem value="mi">{t('sharedMi')}</MenuItem>
                        <MenuItem value="nmi">{t('sharedNmi')}</MenuItem>
                    </Select>
                    </FormControl>
                    <FormControl fullWidth className={settingsClasses.textField}>
                    <InputLabel>{t('settingsAltitudeUnit')}</InputLabel>
                    <Select
                        label={t('settingsAltitudeUnit')}
                        value={item.attributes.altitudeUnit || 'm'}
                        onChange={(e) =>
                        setItem({
                            ...item,
                            attributes: { ...item.attributes, altitudeUnit: e.target.value },
                        })
                        }
                    >
                        <MenuItem value="m">{t('sharedMeters')}</MenuItem>
                        <MenuItem value="ft">{t('sharedFeet')}</MenuItem>
                    </Select>
                    </FormControl>
                    <FormControl fullWidth className={settingsClasses.textField}>
                    <InputLabel>{t('settingsVolumeUnit')}</InputLabel>
                    <Select
                        label={t('settingsVolumeUnit')}
                        value={item.attributes.volumeUnit || 'ltr'}
                        onChange={(e) =>
                        setItem({
                            ...item,
                            attributes: { ...item.attributes, volumeUnit: e.target.value },
                        })
                        }
                    >
                        <MenuItem value="ltr">{t('sharedLiter')}</MenuItem>
                        <MenuItem value="usGal">{t('sharedUsGallon')}</MenuItem>
                        <MenuItem value="impGal">{t('sharedImpGallon')}</MenuItem>
                    </Select>
                    </FormControl>
                    <SelectField
                    fullWidth
                    className={settingsClasses.textField}
                    value={item.attributes.timezone}
                    onChange={(e) =>
                        setItem({
                        ...item,
                        attributes: { ...item.attributes, timezone: e.target.value },
                        })
                    }
                    endpoint="/api/server/timezones"
                    keyGetter={(it) => it}
                    titleGetter={(it) => it}
                    label={t('sharedTimezone')}
                    />
                    <TextField
                    fullWidth
                    className={settingsClasses.textField}
                    value={item.poiLayer || ''}
                    onChange={(event) => setItem({ ...item, poiLayer: event.target.value })}
                    label={t('mapPoiLayer')}
                    />
                </Box>
                <TextField
                  fullWidth
                  className={settingsClasses.textField}
                  sx={{ mt: 3 }}
                  value={item.announcement || ''}
                  onChange={(event) => setItem({ ...item, announcement: event.target.value })}
                  label={t('serverAnnouncement')}
                />
                <FormGroup sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={item.forceSettings}
                        onChange={(event) =>
                          setItem({ ...item, forceSettings: event.target.checked })
                        }
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{t('serverForceSettings')}</Typography>}
                  />
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            <Accordion className={settingsClasses.accordion}>
              <AccordionSummary className={settingsClasses.accordionSummary} expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <MapIcon sx={{ color: '#fb923c', fontSize: '1.2rem' }} />
                    <Typography sx={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sharedLocation')}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails className={settingsClasses.details}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3, mb: 3 }}>
                    <TextField
                    type="number"
                    fullWidth
                    className={settingsClasses.textField}
                    value={item.latitude || 0}
                    onChange={(event) => setItem({ ...item, latitude: Number(event.target.value) })}
                    label={t('positionLatitude')}
                    />
                    <TextField
                    type="number"
                    fullWidth
                    className={settingsClasses.textField}
                    value={item.longitude || 0}
                    onChange={(event) => setItem({ ...item, longitude: Number(event.target.value) })}
                    label={t('positionLongitude')}
                    />
                    <TextField
                    type="number"
                    fullWidth
                    className={settingsClasses.textField}
                    value={item.zoom || 0}
                    onChange={(event) => setItem({ ...item, zoom: Number(event.target.value) })}
                    label={t('serverZoom')}
                    />
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<MapIcon />}
                  aria-label={t('mapCurrentLocation')}
                  onClick={() => {
                    const { lng, lat } = map.getCenter();
                    setItem({
                      ...item,
                      latitude: Number(lat.toFixed(6)),
                      longitude: Number(lng.toFixed(6)),
                      zoom: Number(map.getZoom().toFixed(1)),
                    });
                  }}
                  sx={{ 
                    borderRadius: '12px', py: 1.5, fontWeight: 700,
                    background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c',
                    border: '1px solid rgba(251, 146, 60, 0.2)',
                    '&:hover': { background: 'rgba(251, 146, 60, 0.2)' }
                  }}
                >
                  {t('mapCurrentLocation')}
                </Button>
              </AccordionDetails>
            </Accordion>

            <Accordion className={settingsClasses.accordion}>
              <AccordionSummary className={settingsClasses.accordionSummary} expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <SecurityIcon sx={{ color: '#a855f7', fontSize: '1.2rem' }} />
                    <Typography sx={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sharedPermissions')}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails className={settingsClasses.details}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={item.registration}
                        onChange={(event) =>
                          setItem({ ...item, registration: event.target.checked })
                        }
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{t('serverRegistration')}</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={item.readonly}
                        onChange={(event) => setItem({ ...item, readonly: event.target.checked })}
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{t('serverReadonly')}</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={item.deviceReadonly}
                        onChange={(event) =>
                          setItem({ ...item, deviceReadonly: event.target.checked })
                        }
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{t('userDeviceReadonly')}</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={item.limitCommands}
                        onChange={(event) =>
                          setItem({ ...item, limitCommands: event.target.checked })
                        }
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{t('userLimitCommands')}</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={item.disableReports}
                        onChange={(event) =>
                          setItem({ ...item, disableReports: event.target.checked })
                        }
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{t('userDisableReports')}</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={item.fixedEmail}
                        onChange={(e) => setItem({ ...item, fixedEmail: e.target.checked })}
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{t('userFixedEmail')}</Typography>}
                  />
                </Box>
              </AccordionDetails>
            </Accordion>

            <Accordion className={settingsClasses.accordion}>
              <AccordionSummary className={settingsClasses.accordionSummary} expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <FolderIcon sx={{ color: '#facc15', fontSize: '1.2rem' }} />
                    <Typography sx={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sharedFile')}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails className={settingsClasses.details}>
                <MuiFileInput
                  fullWidth
                  className={settingsClasses.textField}
                  placeholder={t('sharedSelectFile')}
                  value={null}
                  onChange={handleFileChange}
                />
              </AccordionDetails>
            </Accordion>

            <EditAttributesAccordion
              attributes={item.attributes}
              layout="grid"
              setAttributes={(attributes) => setItem({ ...item, attributes })}
              definitions={{
                ...commonUserAttributes,
                ...commonDeviceAttributes,
                ...serverAttributes,
              }}
            />
          </>
        )}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
          <Button 
            variant="outlined" 
            className={settingsClasses.buttonSecondary}
            onClick={() => navigate(-1)}
            sx={{ px: 4 }}
          >
            {t('sharedCancel')}
          </Button>
          <Button 
            variant="contained" 
            className={settingsClasses.buttonPrimary}
            onClick={handleSave}
            sx={{ px: 6 }}
          >
            {t('sharedSave')}
          </Button>
        </Box>
      </Box>
    </PageLayout>
  );
};

export default ServerPage;
