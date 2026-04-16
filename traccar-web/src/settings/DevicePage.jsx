import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControlLabel,
  Checkbox,
  TextField,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DevicesIcon from '@mui/icons-material/Devices';
import { Box } from '@mui/material';
import { MuiFileInput } from 'mui-file-input';
import EditItemView from './components/EditItemView';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import SelectField from '../common/components/SelectField';
import deviceCategories from '../common/util/deviceCategories';
import { useTranslation } from '../common/components/LocalizationProvider';
import useDeviceAttributes from '../common/attributes/useDeviceAttributes';
import { useManager } from '../common/util/permissions';
import SettingsMenu from './components/SettingsMenu';
import useCommonDeviceAttributes from '../common/attributes/useCommonDeviceAttributes';
import { useCatch } from '../reactHelper';
import useSettingsStyles from './common/useSettingsStyles';
import QrCodeDialog from '../common/components/QrCodeDialog';
import fetchOrThrow from '../common/util/fetchOrThrow';
import getCertificateHtml from './common/CertificateTemplate';

const DevicePage = () => {
  const { classes: settingsClasses } = useSettingsStyles();
  const t = useTranslation();

  const manager = useManager();

  const commonDeviceAttributes = useCommonDeviceAttributes(t);
  const deviceAttributes = useDeviceAttributes(t);

  const [searchParams] = useSearchParams();
  const uniqueId = searchParams.get('uniqueId');

  const [item, setItem] = useState(uniqueId ? { uniqueId } : null);
  const [showQr, setShowQr] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const handleFileInput = useCatch(async (newFile) => {
    setImageFile(newFile);
    if (newFile && item?.id) {
      const response = await fetchOrThrow(`/api/devices/${item.id}/image`, {
        method: 'POST',
        body: newFile,
      });
      setItem({ ...item, attributes: { ...item.attributes, deviceImage: await response.text() } });
    } else if (!newFile) {
      // eslint-disable-next-line no-unused-vars
      const { deviceImage, ...remainingAttributes } = item.attributes || {};
      setItem({ ...item, attributes: remainingAttributes });
    }
  });

  const validate = () => item && item.name && item.uniqueId;

  return (
    <EditItemView
      endpoint="devices"
      item={item}
      setItem={setItem}
      validate={validate}
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'sharedDevice']}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 5, ml: 1 }}>
        <Box className={settingsClasses.headerIconNew} sx={{ mr: 2 }}>
          <DevicesIcon />
        </Box>
        <Box>
          <Typography className={settingsClasses.headerTitle}>{t('sharedDevice')}</Typography>
          <Typography className={settingsClasses.headerSubtitle}>
            {t('settingsDeviceManageSubtitle')}
          </Typography>
        </Box>
      </Box>

      {item && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Accordion className={settingsClasses.accordion} defaultExpanded>
            <AccordionSummary className={settingsClasses.accordionSummary} expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('sharedRequired')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={settingsClasses.details}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  fullWidth
                  className={settingsClasses.textField}
                  variant="outlined"
                  value={item.name || ''}
                  onChange={(event) => setItem({ ...item, name: event.target.value })}
                  label={t('sharedName')}
                />
                <TextField
                  fullWidth
                  className={settingsClasses.textField}
                  variant="outlined"
                  value={item.uniqueId || ''}
                  onChange={(event) => setItem({ ...item, uniqueId: event.target.value })}
                  label={t('deviceIdentifier')}
                  helperText={t('deviceIdentifierHelp')}
                  disabled={Boolean(uniqueId)}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion className={settingsClasses.accordion}>
            <AccordionSummary className={settingsClasses.accordionSummary} expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ color: '#818cf8', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('sharedExtra')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={settingsClasses.details}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                <SelectField
                  className={settingsClasses.textField}
                  value={item.groupId}
                  onChange={(event) => setItem({ ...item, groupId: Number(event.target.value) })}
                  endpoint="/api/groups"
                  label={t('groupParent')}
                />
                <TextField
                  fullWidth
                  className={settingsClasses.textField}
                  value={item.phone || ''}
                  onChange={(event) => setItem({ ...item, phone: event.target.value })}
                  label={t('sharedPhone')}
                />
                <TextField
                  fullWidth
                  className={settingsClasses.textField}
                  value={item.model || ''}
                  onChange={(event) => setItem({ ...item, model: event.target.value })}
                  label={t('deviceModel')}
                />
                <TextField
                  fullWidth
                  className={settingsClasses.textField}
                  value={item.contact || ''}
                  onChange={(event) => setItem({ ...item, contact: event.target.value })}
                  label={t('deviceContact')}
                />
                <SelectField
                  className={settingsClasses.textField}
                  value={item.category || 'default'}
                  onChange={(event) => setItem({ ...item, category: event.target.value })}
                  data={deviceCategories
                    .map((category) => ({
                      id: category,
                      name: t(`category${category.replace(/^\w/, (c) => c.toUpperCase())}`),
                    }))
                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))}
                  label={t('deviceCategory')}
                />
                <SelectField
                  className={settingsClasses.textField}
                  value={item.calendarId}
                  onChange={(event) => setItem({ ...item, calendarId: Number(event.target.value) })}
                  endpoint="/api/calendars"
                  label={t('sharedCalendar')}
                />
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, alignItems: 'center', mb: 3 }}>
                <TextField
                  label={t('userExpirationTime')}
                  type="date"
                  fullWidth
                  className={settingsClasses.textField}
                  value={item.expirationTime ? item.expirationTime.split('T')[0] : '2099-01-01'}
                  onChange={(e) => {
                    if (e.target.value) {
                      setItem({ ...item, expirationTime: new Date(e.target.value).toISOString() });
                    }
                  }}
                  disabled={!manager}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Box sx={{ 
                  p: 2, borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', 
                  background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center' 
                }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={item.disabled}
                        onChange={(event) => setItem({ ...item, disabled: event.target.checked })}
                        sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#38bdf8' } }}
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>{t('sharedDisabled')}</Typography>}
                    disabled={!manager}
                  />
                </Box>
              </Box>

              <Button 
                variant="outlined" 
                onClick={() => setShowQr(true)}
                fullWidth
                className={settingsClasses.buttonSecondary}
                aria-label={t('sharedQrCode')}
              >
                {t('sharedQrCode')}
              </Button>
            </AccordionDetails>
          </Accordion>

          {item.category === 'ais140' && (
              <Accordion defaultExpanded className={settingsClasses.accordion}>
                <AccordionSummary className={settingsClasses.accordionSummary} expandIcon={<ExpandMoreIcon sx={{ color: '#10b981' }} />}>
                  <Typography sx={{ color: '#10b981', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {t('settingsAis140Compliance')}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails className={settingsClasses.details}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                    <TextField
                    fullWidth
                    className={settingsClasses.textField}
                    value={item.attributes?.vrn || ''}
                    onChange={(event) => setItem({ ...item, attributes: { ...item.attributes, vrn: event.target.value.toUpperCase() } })}
                    label={t('settingsVrn')}
                    placeholder={t('settingsVrnPlaceholder')}
                    />
                    <TextField
                    fullWidth
                    className={settingsClasses.textField}
                    value={item.attributes?.chassisNumber || ''}
                    onChange={(event) => setItem({ ...item, attributes: { ...item.attributes, chassisNumber: event.target.value.toUpperCase() } })}
                    label={t('settingsChassisNumber')}
                    />
                    <TextField
                    fullWidth
                    className={settingsClasses.textField}
                    value={item.attributes?.engineNumber || ''}
                    onChange={(event) => setItem({ ...item, attributes: { ...item.attributes, engineNumber: event.target.value.toUpperCase() } })}
                    label={t('settingsEngineNumber')}
                    />
                    <Box sx={{ 
                      p: 2, borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.2)', 
                      background: 'rgba(16, 185, 129, 0.05)', display: 'flex', alignItems: 'center' 
                    }}>
                      <FormControlLabel
                        control={
                            <Checkbox
                            checked={item.attributes?.vltForwarding || false}
                            onChange={(event) => setItem({ ...item, attributes: { ...item.attributes, vltForwarding: event.target.checked } })}
                            sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#10b981' } }}
                            />
                        }
                        label={<Typography sx={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>{t('settingsVltForwarding')}</Typography>}
                      />
                    </Box>
                </Box>
                {item.attributes?.vltForwarding && (
                  <TextField
                    fullWidth
                    className={settingsClasses.textField}
                    value={item.attributes?.forwardUrl || ''}
                    onChange={(event) => setItem({ ...event, attributes: { ...item.attributes, forwardUrl: event.target.value } })}
                    label={t('settingsVltGatewayUrl')}
                    placeholder={t('settingsVltGatewayPlaceholder')}
                    helperText={t('settingsVltGatewayHelp')}
                    sx={{ mb: 3 }}
                  />
                )}
                <Button 
                  variant="contained" 
                  fullWidth 
                  startIcon={<DevicesIcon />}
                  className={settingsClasses.buttonPrimary}
                  sx={{ 
                    py: 2, borderRadius: '16px',
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
                    '&:hover': { 
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 15px 30px rgba(16, 185, 129, 0.5)',
                    }
                  }}
                  aria-label={t('settingsGenerateAis140Certificate')}
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(getCertificateHtml(t, item));
                    printWindow.document.close();
                  }}
                >
                  {t('settingsGenerateAis140Certificate')}
                </Button>
              </AccordionDetails>
            </Accordion>
          )}

          <Accordion className={settingsClasses.accordion}>
            <AccordionSummary className={settingsClasses.accordionSummary} expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('attributeDeviceImage')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={settingsClasses.details}>
              <MuiFileInput
                placeholder={t('attributeDeviceImage')}
                value={imageFile}
                onChange={handleFileInput}
                inputProps={{ accept: 'image/*' }}
                fullWidth
                className={settingsClasses.textField}
              />
            </AccordionDetails>
          </Accordion>

          <EditAttributesAccordion
            attributes={item.attributes}
            layout="grid"
            setAttributes={(attributes) => setItem({ ...item, attributes })}
            definitions={{ ...commonDeviceAttributes, ...deviceAttributes }}
          />
        </Box>
      )}
      <QrCodeDialog open={showQr} onClose={() => setShowQr(false)} />
    </EditItemView>
  );
};

export default DevicePage;
