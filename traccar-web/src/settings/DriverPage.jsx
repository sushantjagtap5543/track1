import { useState } from 'react';
import TextField from '@mui/material/TextField';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import EditItemView from './components/EditItemView';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import { useTranslation } from '../common/components/LocalizationProvider';
import SettingsMenu from './components/SettingsMenu';
import useSettingsStyles from './common/useSettingsStyles';

const DriverPage = () => {
  const { classes: settingsClasses } = useSettingsStyles();
  const t = useTranslation();

  const [item, setItem] = useState();

  const validate = () => item && item.name && item.uniqueId;

  return (
    <EditItemView
      endpoint="drivers"
      item={item}
      setItem={setItem}
      validate={validate}
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'sharedDriver']}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, ml: 1 }}>
        <Box sx={{
          width: 48, height: 48, borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(129, 140, 248, 0.2) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2,
          border: '1px solid rgba(56, 189, 248, 0.2)',
        }}>
          <AssignmentIndIcon sx={{ color: '#38bdf8', fontSize: 28 }} />
        </Box>
        <Box>
          <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>{t('sharedDriver')}</Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
            Update driver profile information and identification tokens for personnel tracking.
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
                  value={item.name || ''}
                  onChange={(event) => setItem({ ...item, name: event.target.value })}
                  label={t('sharedName')}
                />
                <TextField
                  fullWidth
                  value={item.uniqueId || ''}
                  onChange={(event) => setItem({ ...item, uniqueId: event.target.value })}
                  label={t('deviceIdentifier')}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          <EditAttributesAccordion
            attributes={item.attributes}
            layout="grid"
            setAttributes={(attributes) => setItem({ ...item, attributes })}
            definitions={{}}
          />
        </>
      )}
    </EditItemView>
  );
};

export default DriverPage;
