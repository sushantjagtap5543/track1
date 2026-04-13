import { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditItemView from './components/EditItemView';
import { useTranslation } from '../common/components/LocalizationProvider';
import BaseCommandView from './components/BaseCommandView';
import SettingsMenu from './components/SettingsMenu';
import useSettingsStyles from './common/useSettingsStyles';

const CommandPage = () => {
  const { classes: settingsClasses } = useSettingsStyles();
  const t = useTranslation();

  const [item, setItem] = useState();

  const validate = () => item && item.type;

  return (
    <EditItemView
      endpoint="commands"
      item={item}
      setItem={setItem}
      validate={validate}
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'sharedSavedCommand']}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, ml: 1 }}>
        <Box sx={{
          width: 48, height: 48, borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(248, 113, 113, 0.2) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2,
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }}>
          <PublishIcon sx={{ color: '#ef4444', fontSize: 28 }} />
        </Box>
        <Box>
          <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>{t('sharedSavedCommand')}</Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
            Configure pre-defined commands for remote device control and automation.
          </Typography>
        </Box>
      </Box>

      {item && (
        <Accordion defaultExpanded sx={{ background: 'transparent', boxShadow: 'none', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#94a3b8' }} />} sx={{ px: 1 }}>
            <Typography sx={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sharedRequired')}</Typography>
          </AccordionSummary>
          <AccordionDetails className={settingsClasses.details}>
            <TextField
              fullWidth
              value={item.description || ''}
              onChange={(event) => setItem({ ...item, description: event.target.value })}
              label={t('sharedDescription')}
              sx={{ mb: 3 }}
            />
            <BaseCommandView item={item} setItem={setItem} />
          </AccordionDetails>
        </Accordion>
      )}
    </EditItemView>
  );
};

export default CommandPage;
