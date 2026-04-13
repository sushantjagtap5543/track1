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
  const { classes } = useSettingsStyles();
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
      {item && (
        <>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{t('sharedRequired')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <TextField
                value={item.name || ''}
                onChange={(event) => setItem({ ...item, name: event.target.value })}
                label={t('sharedName')}
              />
              <TextField
                value={item.uniqueId || ''}
                onChange={(event) => setItem({ ...item, uniqueId: event.target.value })}
                label={t('deviceIdentifier')}
                helperText={t('deviceIdentifierHelp')}
                disabled={Boolean(uniqueId)}
              />
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{t('sharedExtra')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <SelectField
                value={item.groupId}
                onChange={(event) => setItem({ ...item, groupId: Number(event.target.value) })}
                endpoint="/api/groups"
                label={t('groupParent')}
              />
              <TextField
                value={item.phone || ''}
                onChange={(event) => setItem({ ...item, phone: event.target.value })}
                label={t('sharedPhone')}
              />
              <TextField
                value={item.model || ''}
                onChange={(event) => setItem({ ...item, model: event.target.value })}
                label={t('deviceModel')}
              />
              <TextField
                value={item.contact || ''}
                onChange={(event) => setItem({ ...item, contact: event.target.value })}
                label={t('deviceContact')}
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
              <TextField
                label={t('userExpirationTime')}
                type="date"
                value={item.expirationTime ? item.expirationTime.split('T')[0] : '2099-01-01'}
                onChange={(e) => {
                  if (e.target.value) {
                    setItem({ ...item, expirationTime: new Date(e.target.value).toISOString() });
                  }
                }}
                disabled={!manager}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={item.disabled}
                    onChange={(event) => setItem({ ...item, disabled: event.target.checked })}
                  />
                }
                label={t('sharedDisabled')}
                disabled={!manager}
              />
              <Button variant="outlined" color="primary" onClick={() => setShowQr(true)}>
                {t('sharedQrCode')}
              </Button>
            </AccordionDetails>
          </Accordion>
          {item.category === 'ais140' && (
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ color: '#2ecc71', fontWeight: 'bold' }}>
                  AIS140 compliance (RTO)
                </Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
                <TextField
                  value={item.attributes?.vrn || ''}
                  onChange={(event) => setItem({ ...item, attributes: { ...item.attributes, vrn: event.target.value.toUpperCase() } })}
                  label="Vehicle Registration Number (VRN)"
                  placeholder="e.g. MH12AB1234"
                  variant="outlined"
                />
                <TextField
                  value={item.attributes?.chassisNumber || ''}
                  onChange={(event) => setItem({ ...item, attributes: { ...item.attributes, chassisNumber: event.target.value.toUpperCase() } })}
                  label="Chassis Number"
                  variant="outlined"
                />
                <TextField
                  value={item.attributes?.engineNumber || ''}
                  onChange={(event) => setItem({ ...item, attributes: { ...item.attributes, engineNumber: event.target.value.toUpperCase() } })}
                  label="Engine Number"
                  variant="outlined"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={item.attributes?.vltForwarding || false}
                      onChange={(event) => setItem({ ...item, attributes: { ...item.attributes, vltForwarding: event.target.checked } })}
                    />
                  }
                  label="Enable VLT Government Forwarding"
                />
                {item.attributes?.vltForwarding && (
                  <TextField
                    value={item.attributes?.forwardUrl || ''}
                    onChange={(event) => setItem({ ...item, attributes: { ...item.attributes, forwardUrl: event.target.value } })}
                    label="VLT Gateway URL (Target IP/Endpoint)"
                    placeholder="http://vlt.rto-gateway.in/api"
                    variant="outlined"
                    helperText="The official government server endpoint for position forwarding."
                  />
                )}
                <Button 
                  variant="contained" 
                  color="success" 
                  fullWidth 
                  sx={{ mt: 2, fontWeight: 'bold' }}
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>AIS140 Installation Certificate</title>
                          <style>
                            body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; }
                            .header { text-align: center; border-bottom: 2px solid #2ecc71; padding-bottom: 20px; }
                            .badge { color: #2ecc71; font-weight: bold; border: 1px solid #2ecc71; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 10px; }
                            .details { margin-top: 40px; border: 1px solid #eee; padding: 20px; border-radius: 8px; }
                            .row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #f9f9f9; padding-bottom: 5px; }
                            .label { font-weight: bold; color: #666; }
                            .footer { margin-top: 60px; font-size: 12px; color: #999; text-align: center; }
                            .signature { margin-top: 40px; display: flex; justify-content: space-between; }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <h1>AIS140 Installation Certificate</h1>
                            <p>Certificate of Conformity & Installation</p>
                            <div class="badge">RTO VALIDATED</div>
                          </div>
                          <div class="details">
                            <div class="row"><span class="label">Vehicle Name:</span> <span>${item.name}</span></div>
                            <div class="row"><span class="label">Registration Number (VRN):</span> <span>${item.attributes?.vrn || 'N/A'}</span></div>
                            <div class="row"><span class="label">Chassis Number:</span> <span>${item.attributes?.chassisNumber || 'N/A'}</span></div>
                            <div class="row"><span class="label">Engine Number:</span> <span>${item.attributes?.engineNumber || 'N/A'}</span></div>
                            <div class="row"><span class="label">Device IMEI (Unique ID):</span> <span>${item.uniqueId}</span></div>
                            <div class="row"><span class="label">Installation Date:</span> <span>${new Date().toLocaleDateString()}</span></div>
                            <div class="row"><span class="label">VLT Status:</span> <span>${item.attributes?.vltForwarding ? 'Active & Forwarding' : 'Standalone'}</span></div>
                          </div>
                          <div class="signature">
                            <div>_______________________<br>Authorized Technician</div>
                            <div>_______________________<br>Client/Owner Signature</div>
                          </div>
                          <div class="footer">
                            <p>This certificate confirms that the vehicle described above has been fitted with an AIS140 compliant GPS Tracking unit and is successfully registered on the GeoSurePath platform.</p>
                          </div>
                          <script>window.print();</script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }}
                >
                  Generate RTO Certificate (PDF)
                </Button>
              </AccordionDetails>
            </Accordion>
          )}
          {item.id && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">{t('attributeDeviceImage')}</Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
                <MuiFileInput
                  placeholder={t('attributeDeviceImage')}
                  value={imageFile}
                  onChange={handleFileInput}
                  inputProps={{ accept: 'image/*' }}
                />
              </AccordionDetails>
            </Accordion>
          )}
          <EditAttributesAccordion
            attributes={item.attributes}
            setAttributes={(attributes) => setItem({ ...item, attributes })}
            definitions={{ ...commonDeviceAttributes, ...deviceAttributes }}
          />
        </>
      )}
      <QrCodeDialog open={showQr} onClose={() => setShowQr(false)} />
    </EditItemView>
  );
};

export default DevicePage;
