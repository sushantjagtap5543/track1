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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, ml: 1, animation: 'slide-in-right 0.5s ease-out' }}>
        <Box sx={{
          width: 56, height: 56, borderRadius: '18px',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(129, 140, 248, 0.25) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2.5,
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        }}>
          <DevicesIcon sx={{ color: '#38bdf8', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.025em', lineHeight: 1.2 }}>{t('sharedDevice')}</Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem', mt: 0.5 }}>
            Configure technical parameters, identification tokens, and category icons for your hardware.
          </Typography>
        </Box>
      </Box>

      {item && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Accordion defaultExpanded sx={{ background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(10px)', borderRadius: '20px !important', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#38bdf8' }} />} sx={{ px: 3, py: 1 }}>
              <Typography sx={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('sharedRequired')}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, pb: 4, pt: 0 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={item.name || ''}
                  onChange={(event) => setItem({ ...item, name: event.target.value })}
                  label={t('sharedName')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  value={item.uniqueId || ''}
                  onChange={(event) => setItem({ ...item, uniqueId: event.target.value })}
                  label={t('deviceIdentifier')}
                  helperText={t('deviceIdentifierHelp')}
                  disabled={Boolean(uniqueId)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(10px)', borderRadius: '20px !important', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#818cf8' }} />} sx={{ px: 3, py: 1 }}>
              <Typography sx={{ color: '#818cf8', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('sharedExtra')}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, pb: 4, pt: 0 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                <SelectField
                  value={item.groupId}
                  onChange={(event) => setItem({ ...item, groupId: Number(event.target.value) })}
                  endpoint="/api/groups"
                  label={t('groupParent')}
                />
                <TextField
                  fullWidth
                  value={item.phone || ''}
                  onChange={(event) => setItem({ ...item, phone: event.target.value })}
                  label={t('sharedPhone')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
                />
                <TextField
                  fullWidth
                  value={item.model || ''}
                  onChange={(event) => setItem({ ...item, model: event.target.value })}
                  label={t('deviceModel')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
                />
                <TextField
                  fullWidth
                  value={item.contact || ''}
                  onChange={(event) => setItem({ ...item, contact: event.target.value })}
                  label={t('deviceContact')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
                />
                <SelectField
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
                  value={item.expirationTime ? item.expirationTime.split('T')[0] : '2099-01-01'}
                  onChange={(e) => {
                    if (e.target.value) {
                      setItem({ ...item, expirationTime: new Date(e.target.value).toISOString() });
                    }
                  }}
                  disabled={!manager}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
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
                        sx={{ color: '#475569', '&.Mui-checked': { color: '#38bdf8' } }}
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
                sx={{ 
                  borderRadius: '14px', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8',
                  py: 1.5, textTransform: 'none', fontWeight: 800, fontSize: '0.95rem',
                  background: 'rgba(56, 189, 248, 0.05)',
                  '&:hover': {
                    borderColor: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.1)',
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                {t('sharedQrCode')}
              </Button>
            </AccordionDetails>
          </Accordion>

          {item.category === 'ais140' && (
            <Accordion defaultExpanded sx={{ background: 'rgba(16, 185, 129, 0.05)', backdropFilter: 'blur(10px)', borderRadius: '20px !important', border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: '0 8px 32px rgba(16, 185, 129, 0.1)', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#10b981' }} />} sx={{ px: 3, py: 1 }}>
                <Typography sx={{ color: '#10b981', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  AIS140 Compliance (RTO Standards)
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 4, pt: 0 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                    <TextField
                    fullWidth
                    value={item.attributes?.vrn || ''}
                    onChange={(event) => setItem({ ...item, attributes: { ...item.attributes, vrn: event.target.value.toUpperCase() } })}
                    label="Vehicle Registration Number (VRN)"
                    placeholder="e.g. MH12AB1234"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
                    />
                    <TextField
                    fullWidth
                    value={item.attributes?.chassisNumber || ''}
                    onChange={(event) => setItem({ ...item, attributes: { ...item.attributes, chassisNumber: event.target.value.toUpperCase() } })}
                    label="Chassis Number"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
                    />
                    <TextField
                    fullWidth
                    value={item.attributes?.engineNumber || ''}
                    onChange={(event) => setItem({ ...item, attributes: { ...item.attributes, engineNumber: event.target.value.toUpperCase() } })}
                    label="Engine Number"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
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
                            sx={{ color: '#475569', '&.Mui-checked': { color: '#10b981' } }}
                            />
                        }
                        label={<Typography sx={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>Enable Government VLT Forwarding</Typography>}
                      />
                    </Box>
                </Box>
                {item.attributes?.vltForwarding && (
                  <TextField
                    fullWidth
                    value={item.attributes?.forwardUrl || ''}
                    onChange={(event) => setItem({ ...item, attributes: { ...item.attributes, forwardUrl: event.target.value } })}
                    label="VLT Gateway URL"
                    placeholder="http://vlt.rto-gateway.in/api"
                    helperText="The official government server endpoint for position forwarding."
                    sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
                  />
                )}
                <Button 
                  variant="contained" 
                  fullWidth 
                  startIcon={<DevicesIcon />}
                  sx={{ 
                    fontWeight: 900, py: 2, borderRadius: '16px',
                    fontSize: '1rem', textTransform: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
                    '&:hover': { 
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 15px 30px rgba(16, 185, 129, 0.5)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>AIS140 Installation Certificate</title>
                          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
                          <style>
                            body { font-family: 'Inter', sans-serif; padding: 60px; color: #0f172a; background: #f8fafc; }
                            .cert-container { max-width: 800px; margin: 0 auto; background: white; padding: 60px; border-radius: 24px; box-shadow: 0 40px 100px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
                            .cert-container::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 10px; background: linear-gradient(90deg, #10b981, #3b82f6); }
                            .header { text-align: center; margin-bottom: 50px; }
                            .logo-placeholder { font-weight: 900; font-size: 24px; color: #10b981; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px; }
                            .badge { background: #10b981; color: white; font-weight: 800; padding: 10px 20px; border-radius: 99px; display: inline-block; margin-top: 20px; font-size: 13px; letter-spacing: 1px; }
                            .title { font-size: 32px; font-weight: 800; margin: 0; color: #1e293b; letter-spacing: -1px; }
                            .subtitle { color: #64748b; font-size: 16px; margin-top: 8px; }
                            .details { margin-top: 40px; }
                            .row { display: flex; justify-content: space-between; padding: 20px 0; border-bottom: 1px solid #f1f5f9; }
                            .row:last-child { border-bottom: none; }
                            .label { font-weight: 600; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
                            .value { font-weight: 700; color: #0f172a; font-size: 16px; }
                            .footer { margin-top: 60px; text-align: center; border-top: 2px solid #f1f5f9; pt: 40px; }
                            .footer-text { font-size: 14px; color: #94a3b8; line-height: 1.6; max-width: 500px; margin: 20px auto 0; }
                            .signature-area { display: flex; justify-content: space-between; margin-top: 80px; }
                            .sig-block { text-align: center; width: 200px; }
                            .sig-line { border-top: 2px solid #e2e8f0; margin-top: 10px; padding-top: 10px; font-weight: 700; color: #64748b; font-size: 14px; }
                            @media print { body { background: white; padding: 0; } .cert-container { box-shadow: none; border: none; width: 100%; max-width: none; } }
                          </style>
                        </head>
                        <body>
                          <div class="cert-container">
                            <div class="header">
                              <div class="logo-placeholder">GEOSUREPATH</div>
                              <h1 class="title">AIS140 Compliance Certificate</h1>
                              <p class="subtitle">Certificate of Original Installation & Government Compliance</p>
                              <div class="badge">SECURED & VALIDATED</div>
                            </div>
                            <div class="details">
                              <div class="row"><span class="label">Vehicle Name</span> <span class="value">${item.name}</span></div>
                              <div class="row"><span class="label">Registration No (VRN)</span> <span class="value">${item.attributes?.vrn || 'PENDING'}</span></div>
                              <div class="row"><span class="label">Chassis Number</span> <span class="value">${item.attributes?.chassisNumber || 'PENDING'}</span></div>
                              <div class="row"><span class="label">Engine Number</span> <span class="value">${item.attributes?.engineNumber || 'PENDING'}</span></div>
                              <div class="row"><span class="label">IMEI / Unique Identifier</span> <span class="value">${item.uniqueId}</span></div>
                              <div class="row"><span class="label">Hardware Model</span> <span class="value">${item.model || 'Standard AIS140'}</span></div>
                              <div class="row"><span class="label">Installation Date</span> <span class="value">${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                              <div class="row"><span class="label">VLT Gateway Status</span> <span class="value" style="color: ${item.attributes?.vltForwarding ? '#10b981' : '#f59e0b'}">${item.attributes?.vltForwarding ? 'SYNCHRONIZED' : 'LOCAL ONLY'}</span></div>
                            </div>
                            <div class="signature-area">
                              <div class="sig-block"><div style="height: 40px"></div><div class="sig-line">Official Seal / Tech</div></div>
                              <div class="sig-block"><div style="height: 40px"></div><div class="sig-line">Registered Owner</div></div>
                            </div>
                            <div class="footer">
                              <p class="footer-text">This document serves as official proof of AIS140 hardware integration on the GeoSurePath Secure Cloud. Valid only for the vehicle and IMEI mentioned above.</p>
                              <p style="font-weight: 800; font-size: 12px; transform: uppercase; letter-spacing: 1px; color: #cbd5e1; margin-top: 30px;">Digital ID: GSP-${item.id}-${Date.now().toString(36).toUpperCase()}</p>
                            </div>
                          </div>
                          <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }</script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }}
                >
                  Generate Official AIS140 Certificate
                </Button>
              </AccordionDetails>
            </Accordion>
          )}

          <Accordion sx={{ background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(10px)', borderRadius: '20px !important', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#f59e0b' }} />} sx={{ px: 3, py: 1 }}>
              <Typography sx={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('attributeDeviceImage')}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, pb: 4, pt: 0 }}>
              <MuiFileInput
                placeholder={t('attributeDeviceImage')}
                value={imageFile}
                onChange={handleFileInput}
                inputProps={{ accept: 'image/*' }}
                fullWidth
                sx={{ 
                    '& .MuiOutlinedInput-root': { borderRadius: '14px', background: 'rgba(255,255,255,0.02)' },
                    '& .MuiTypography-root': { color: '#f8fafc' },
                    '& .MuiButtonBase-root': { color: '#f59e0b' }
                }}
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
