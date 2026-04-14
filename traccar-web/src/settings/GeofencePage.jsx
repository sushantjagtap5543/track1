import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExploreIcon from '@mui/icons-material/Explore';
import EditItemView from './components/EditItemView';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import { useTranslation } from '../common/components/LocalizationProvider';
import useGeofenceAttributes from '../common/attributes/useGeofenceAttributes';
import SettingsMenu from './components/SettingsMenu';
import SelectField from '../common/components/SelectField';
import { geofencesActions } from '../store';
import useSettingsStyles from './common/useSettingsStyles';

const GeofencePage = () => {
  const { classes: settingsClasses } = useSettingsStyles();
  const dispatch = useDispatch();
  const t = useTranslation();

  const geofenceAttributes = useGeofenceAttributes(t);

  const [item, setItem] = useState();

  const onItemSaved = (result) => {
    dispatch(geofencesActions.update([result]));
  };

  const validate = () => item && item.name;

  return (
    <EditItemView
      endpoint="geofences"
      item={item}
      setItem={setItem}
      validate={validate}
      onItemSaved={onItemSaved}
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'sharedGeofence']}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, ml: 1 }}>
        <Box sx={{
          width: 48, height: 48, borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(129, 140, 248, 0.2) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2,
          border: '1px solid rgba(56, 189, 248, 0.2)',
        }}>
          <ExploreIcon sx={{ color: '#38bdf8', fontSize: 28 }} />
        </Box>
        <Box>
          <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>{t('sharedGeofence')}</Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Define geographic boundaries, security zones, and exclusion areas for automated operational logic.
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
              <TextField
                fullWidth
                value={item.name || ''}
                onChange={(event) => setItem({ ...item, name: event.target.value })}
                label={t('sharedName')}
              />
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'transparent', boxShadow: 'none', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />} sx={{ px: 1 }}>
              <Typography sx={{ color: '#818cf8', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sharedExtra')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={settingsClasses.details}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  fullWidth
                  value={item.description || ''}
                  onChange={(event) => setItem({ ...item, description: event.target.value })}
                  label={t('sharedDescription')}
                />
                <SelectField
                  value={item.calendarId}
                  onChange={(event) => setItem({ ...item, calendarId: Number(event.target.value) })}
                  endpoint="/api/calendars"
                  label={t('sharedCalendar')}
                />
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={item.attributes.hide}
                    onChange={(e) =>
                      setItem({
                        ...item,
                        attributes: { ...item.attributes, hide: e.target.checked },
                      })
                    }
                    sx={{ color: '#334155', '&.Mui-checked': { color: '#38bdf8' } }}
                  />
                }
                label={<Typography sx={{ fontSize: '0.9rem', color: '#f8fafc' }}>{t('sharedFilterMap')}</Typography>}
              />
            </AccordionDetails>
          </Accordion>

          <EditAttributesAccordion
            attributes={item.attributes}
            layout="grid"
            setAttributes={(attributes) => setItem({ ...item, attributes })}
            definitions={geofenceAttributes}
          />
        </>
      )}
    </EditItemView>
  );
};

export default GeofencePage;
