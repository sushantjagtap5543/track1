import { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  createFilterOptions,
  Autocomplete,
  Button,
  Snackbar,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CodeIcon from '@mui/icons-material/Code';
import EditItemView from './components/EditItemView';
import { useTranslation } from '../common/components/LocalizationProvider';
import usePositionAttributes from '../common/attributes/usePositionAttributes';
import SettingsMenu from './components/SettingsMenu';
import SelectField from '../common/components/SelectField';
import { useCatch } from '../reactHelper';
import { snackBarDurationLongMs } from '../common/util/duration';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';

const allowedProperties = [
  'valid',
  'latitude',
  'longitude',
  'altitude',
  'speed',
  'course',
  'address',
  'accuracy',
];

const ComputedAttributePage = () => {
  const { classes: settingsClasses } = useSettingsStyles();
  const t = useTranslation();

  const positionAttributes = usePositionAttributes(t);

  const [item, setItem] = useState();
  const [deviceId, setDeviceId] = useState();
  const [result, setResult] = useState();

  const options = Object.entries(positionAttributes)
    .filter(([key, value]) => !value.property || allowedProperties.includes(key))
    .map(([key, value]) => ({
      key,
      name: value.name,
      type: value.type,
    }));

  const filter = createFilterOptions({
    stringify: (option) => option.name,
  });

  const testAttribute = useCatch(async () => {
    const query = new URLSearchParams({ deviceId });
    const url = `/api/attributes/computed/test?${query.toString()}`;
    const response = await fetchOrThrow(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    setResult(await response.text());
  });

  const validate = () => item && item.description && item.expression;

  return (
    <EditItemView
      endpoint="attributes/computed"
      item={item}
      setItem={setItem}
      validate={validate}
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'sharedComputedAttribute']}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, ml: 1 }}>
        <Box sx={{
          width: 48, height: 48, borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(129, 140, 248, 0.2) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2,
          border: '1px solid rgba(56, 189, 248, 0.2)',
        }}>
          <CodeIcon sx={{ color: '#38bdf8', fontSize: 28 }} />
        </Box>
        <Box>
          <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>{t('sharedComputedAttribute')}</Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Configure logic and expressions for dynamic attribute calculation.
          </Typography>
        </Box>
      </Box>

      {item && (
        <>
          <Accordion defaultExpanded sx={{ background: 'transparent', boxShadow: 'none', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />} sx={{ px: 1 }}>
              <Typography sx={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sharedRequired')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={settingsClasses.details}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  fullWidth
                  value={item.description || ''}
                  onChange={(e) => setItem({ ...item, description: e.target.value })}
                  label={t('sharedDescription')}
                />
                <Autocomplete
                  freeSolo
                  fullWidth
                  value={
                    options.find((option) => option.key === item.attribute) || item.attribute || null
                  }
                  onChange={(_, option) => {
                    const attribute = option ? option.key || option.inputValue || option : null;
                    if (option && (option.type || option.inputValue)) {
                      setItem({ ...item, attribute, type: option.type });
                    } else {
                      setItem({ ...item, attribute });
                    }
                  }}
                  filterOptions={(options, params) => {
                    const filtered = filter(options, params);
                    if (
                      params.inputValue &&
                      !options.some((x) => (typeof x === 'object' ? x.key : x) === params.inputValue)
                    ) {
                      filtered.push({
                        inputValue: params.inputValue,
                        name: `${t('sharedAdd')} "${params.inputValue}"`,
                      });
                    }
                    return filtered;
                  }}
                  options={options}
                  getOptionLabel={(option) =>
                    typeof option === 'object' ? option.inputValue || option.name : option
                  }
                  renderOption={(props, option) => <li {...props}>{option.name || option}</li>}
                  renderInput={(params) => <TextField {...params} label={t('sharedAttribute')} />}
                />
              </Box>
              <TextField
                fullWidth
                value={item.expression || ''}
                onChange={(e) => setItem({ ...item, expression: e.target.value })}
                label={t('sharedExpression')}
                multiline
                rows={4}
                sx={{ mt: 3 }}
              />
              <FormControl fullWidth sx={{ mt: 3 }} disabled={item.attribute in positionAttributes}>
                <InputLabel>{t('sharedType')}</InputLabel>
                <Select
                  label={t('sharedType')}
                  value={item.type || ''}
                  onChange={(e) => setItem({ ...item, type: e.target.value })}
                >
                  <MenuItem value="string">{t('sharedTypeString')}</MenuItem>
                  <MenuItem value="number">{t('sharedTypeNumber')}</MenuItem>
                  <MenuItem value="boolean">{t('sharedTypeBoolean')}</MenuItem>
                </Select>
              </FormControl>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'transparent', boxShadow: 'none', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />} sx={{ px: 1 }}>
              <Typography sx={{ color: '#818cf8', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sharedExtra')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={settingsClasses.details}>
              <TextField
                fullWidth
                type="number"
                value={item.priority || 0}
                onChange={(e) => setItem({ ...item, priority: Number(e.target.value) })}
                label={t('sharedPriority')}
              />
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'transparent', boxShadow: 'none', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />} sx={{ px: 1 }}>
              <Typography sx={{ color: '#22c55e', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sharedTest')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={settingsClasses.details}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 150px' }, gap: 3, alignItems: 'center' }}>
                <SelectField
                  value={deviceId}
                  onChange={(e) => setDeviceId(Number(e.target.value))}
                  endpoint="/api/devices"
                  label={t('sharedDevice')}
                />
                <Button
                  variant="contained"
                  onClick={testAttribute}
                  disabled={!deviceId}
                  sx={{ 
                    height: '56px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                    }
                  }}
                >
                  {t('sharedTestExpression')}
                </Button>
              </Box>
              <Snackbar
                open={!!result}
                onClose={() => setResult(null)}
                autoHideDuration={snackBarDurationLongMs}
                message={result}
              />
            </AccordionDetails>
          </Accordion>
        </>
      )}
    </EditItemView>
  );
};

export default ComputedAttributePage;
