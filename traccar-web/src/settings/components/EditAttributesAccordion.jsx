import { useState } from 'react';

import {
  Button,
  Checkbox,
  OutlinedInput,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Accordion,
  AccordionSummary,
  Typography,
  AccordionDetails,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddAttributeDialog from './AddAttributeDialog';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAttributePreference } from '../../common/util/preferences';
import {
  distanceFromMeters,
  distanceToMeters,
  distanceUnitString,
  speedFromKnots,
  speedToKnots,
  speedUnitString,
  volumeFromLiters,
  volumeToLiters,
  volumeUnitString,
} from '../../common/util/converter';
import useFeatures from '../../common/util/useFeatures';
import useSettingsStyles from '../common/useSettingsStyles';
import fetchOrThrow from '../../common/util/fetchOrThrow';

const EditAttributesAccordion = ({
  attribute,
  attributes,
  setAttributes,
  definitions,
  focusAttribute,
  layout,
}) => {
  const { classes: settingsClasses } = useSettingsStyles();
  const t = useTranslation();

  const features = useFeatures();

  const speedUnit = useAttributePreference('speedUnit');
  const distanceUnit = useAttributePreference('distanceUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

  const [addDialogShown, setAddDialogShown] = useState(false);

  const updateAttribute = (key, value, type, subtype) => {
    const updatedAttributes = { ...attributes };
    switch (subtype) {
      case 'speed':
        updatedAttributes[key] = speedToKnots(Number(value), speedUnit);
        break;
      case 'distance':
        updatedAttributes[key] = distanceToMeters(Number(value), distanceUnit);
        break;
      case 'volume':
        updatedAttributes[key] = volumeToLiters(Number(value), volumeUnit);
        break;
      default:
        updatedAttributes[key] = type === 'number' ? Number(value) : value;
        break;
    }
    setAttributes(updatedAttributes);
  };

  const deleteAttribute = (key) => {
    const updatedAttributes = { ...attributes };
    delete updatedAttributes[key];
    setAttributes(updatedAttributes);
  };

  const getAttributeName = (key, subtype) => {
    const definition = definitions[key];
    const name = definition ? definition.name : key;
    switch (subtype) {
      case 'speed':
        return `${name} (${speedUnitString(speedUnit, t)})`;
      case 'distance':
        return `${name} (${distanceUnitString(distanceUnit, t)})`;
      case 'volume':
        return `${name} (${volumeUnitString(volumeUnit, t)})`;
      default:
        return name;
    }
  };

  const getAttributeType = (value) => {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'string';
  };

  const getAttributeSubtype = (key) => {
    const definition = definitions[key];
    return definition && definition.subtype;
  };

  const getDisplayValue = (value, subtype) => {
    if (value) {
      switch (subtype) {
        case 'speed':
          return speedFromKnots(value, speedUnit);
        case 'distance':
          return distanceFromMeters(value, distanceUnit);
        case 'volume':
          return volumeFromLiters(value, volumeUnit);
        default:
          return value;
      }
    }
    return '';
  };

  const convertToList = (attributes) => {
    const booleanList = [];
    const otherList = [];
    const excludeAttributes = [
      'speedUnit',
      'distanceUnit',
      'altitudeUnit',
      'volumeUnit',
      'timezone',
    ];
    Object.keys(attributes || [])
      .filter((key) => !excludeAttributes.includes(key))
      .forEach((key) => {
        const value = attributes[key];
        const type = getAttributeType(value);
        const subtype = getAttributeSubtype(key);
        if (type === 'boolean') {
          booleanList.push({ key, value, type, subtype });
        } else {
          otherList.push({ key, value, type, subtype });
        }
      });
    return [...otherList, ...booleanList];
  };

  const handleAddResult = (definition) => {
    setAddDialogShown(false);
    if (definition) {
      switch (definition.type) {
        case 'number':
          updateAttribute(definition.key, 0);
          break;
        case 'boolean':
          updateAttribute(definition.key, false);
          break;
        default:
          updateAttribute(definition.key, '');
          break;
      }
    }
  };

  return features.disableAttributes ? (
    ''
  ) : (
    <Accordion sx={{ background: 'transparent', boxShadow: 'none', '&:before': { display: 'none' } }} defaultExpanded={!!attribute}>
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />} sx={{ px: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ListAltIcon sx={{ mr: 1.5, color: '#38bdf8', fontSize: 20 }} />
          <Typography sx={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sharedAttributes')}</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails className={settingsClasses.details}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: layout === 'grid' ? { xs: '1fr', md: '1fr 1fr' } : '1fr', 
          gap: 3 
        }}>
          {convertToList(attributes).map(({ key, value, type, subtype }) => {
            if (type === 'boolean') {
              return (
                <Box key={key} sx={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  p: 1.5, px: 2, background: 'rgba(255,255,255,0.03)', borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <FormControlLabel
                    sx={{ color: '#f8fafc', mr: 0, '& .MuiCheckbox-root': { color: '#334155', '&.Mui-checked': { color: '#38bdf8' } } }}
                    control={
                      <Checkbox
                        checked={value}
                        onChange={(e) => updateAttribute(key, e.target.checked)}
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{getAttributeName(key, subtype)}</Typography>}
                  />
                  <IconButton
                    size="small"
                    onClick={() => deleteAttribute(key)}
                    sx={{ color: '#fb7185', '&:hover': { backgroundColor: 'rgba(251, 113, 133, 0.1)' } }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              );
            }
            return (
              <FormControl key={key} fullWidth>
                <InputLabel>{getAttributeName(key, subtype)}</InputLabel>
                <OutlinedInput
                  label={getAttributeName(key, subtype)}
                  type={type === 'number' ? 'number' : 'text'}
                  value={getDisplayValue(value, subtype)}
                  onChange={(e) => updateAttribute(key, e.target.value, type, subtype)}
                  autoFocus={focusAttribute === key}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton size="small" edge="end" onClick={() => deleteAttribute(key)} sx={{ color: '#fb7185', '&:hover': { backgroundColor: 'rgba(251, 113, 133, 0.1)' } }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </FormControl>
            );
          })}
        </Box>
        <Button
          variant="contained"
          onClick={() => setAddDialogShown(true)}
          startIcon={<AddIcon />}
          sx={{ 
            borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', 
            border: '1px solid rgba(56, 189, 248, 0.2)', textTransform: 'none', fontWeight: 700, mt: 1,
            '&:hover': { background: '#38bdf8', color: '#fff' }
          }}
        >
          {t('sharedAdd')}
        </Button>
        <AddAttributeDialog
          open={addDialogShown}
          onResult={handleAddResult}
          definitions={definitions}
        />
      </AccordionDetails>
    </Accordion>
  );
};

export default EditAttributesAccordion;
