import { useNavigate, useParams } from 'react-router-dom';
import {
  Skeleton,
  Typography,
  TextField,
  Box,
  Button,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { useCatch, useEffectAsync } from '../../reactHelper';
import { useTranslation } from '../../common/components/LocalizationProvider';
import PageLayout from '../../common/components/PageLayout';
import useSettingsStyles from '../common/useSettingsStyles';
import fetchOrThrow from '../../common/util/fetchOrThrow';

const EditItemView = ({
  children,
  endpoint,
  item,
  setItem,
  defaultItem,
  validate,
  onItemSaved,
  menu,
  breadcrumbs,
}) => {
  const navigate = useNavigate();
  const { classes } = useSettingsStyles();
  const t = useTranslation();

  const { id } = useParams();

  useEffectAsync(async () => {
    if (!item) {
      if (id) {
        const response = await fetchOrThrow(`/api/${endpoint}/${id}`);
        setItem(await response.json());
      } else {
        setItem(defaultItem || {});
      }
    }
  }, [id, item, defaultItem]);

  const handleSave = useCatch(async () => {
    let url = `/api/${endpoint}`;
    if (id) {
      url += `/${id}`;
    }

    const response = await fetchOrThrow(url, {
      method: !id ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });

    if (onItemSaved) {
      onItemSaved(await response.json());
    }
    navigate(-1);
  });

  return (
    <PageLayout menu={menu} breadcrumbs={breadcrumbs}>
      <div className={classes.container}>
        <div className={classes.containerMain}>
          <Box maxWidth="md" sx={{ width: '100%', mx: 'auto', p: { xs: 2, md: 4 } }}>
            {item ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {children}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Skeleton variant="rectangular" height={60} sx={{ borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
              </Box>
            )}
            
            <Box sx={{ 
              display: 'flex', gap: 2, mt: 6, pt: 4, 
              borderTop: '1px solid rgba(255,255,255,0.06)',
              position: 'sticky', bottom: 0, 
              background: 'rgba(15, 23, 42, 0.01)', 
              backdropFilter: 'blur(5px)' 
            }}>
              <Button 
                fullWidth
                variant="outlined"
                startIcon={<CloseIcon />}
                disabled={!item}
                sx={{ py: 1.8 }}
                onClick={() => navigate(-1)}
              >
                {t('sharedCancel')}
              </Button>
              <Button 
                fullWidth
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={!item || (validate && !validate())}
                sx={{ py: 1.8 }}
                onClick={handleSave}
              >
                {t('sharedSave')}
              </Button>
            </Box>
          </Box>
        </div>
      </div>
    </PageLayout>
  );
};

export default EditItemView;
