import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Container,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from '../common/components/LocalizationProvider';
import BaseCommandView from './components/BaseCommandView';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import { useCatch } from '../reactHelper';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';

const CommandDevicePage = () => {
  const navigate = useNavigate();
  const { classes } = useSettingsStyles();
  const t = useTranslation();

  const { id } = useParams();

  const [savedId, setSavedId] = useState(0);
  const [item, setItem] = useState({});

  const handleSend = useCatch(async () => {
    let command;
    if (savedId) {
      const response = await fetchOrThrow(`/api/commands/${savedId}`);
      command = await response.json();
    } else {
      command = item;
    }

    command.deviceId = parseInt(id, 10);

    await fetchOrThrow('/api/commands/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    });
    navigate(-1);
  });

  const validate = () => savedId || (item && item.type);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'deviceCommand']}>
      <Container maxWidth="xs" className={classes.container}>
        <Accordion defaultExpanded sx={{ background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(10px)', borderRadius: '20px !important', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#38bdf8' }} />} sx={{ px: 3, py: 1 }}>
            <Typography sx={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('sharedRequired')}</Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.details} sx={{ px: 3, pb: 4, pt: 0, '& .MuiFormControl-root': { mb: 2 } }}>
            <BaseCommandView
              deviceId={id}
              item={item}
              setItem={setItem}
              includeSaved
              savedId={savedId}
              setSavedId={setSavedId}
            />
          </AccordionDetails>
        </Accordion>
        <div className={classes.buttons}>
          <Button type="button" color="primary" variant="outlined" onClick={() => navigate(-1)}>
            {t('sharedCancel')}
          </Button>
          <Button
            type="button"
            color="primary"
            variant="contained"
            onClick={handleSend}
            disabled={!validate()}
          >
            {t('commandSend')}
          </Button>
        </div>
      </Container>
    </PageLayout>
  );
};

export default CommandDevicePage;
