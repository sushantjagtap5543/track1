import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Table, TableRow, TableCell, TableHead, TableBody, Paper, Button, Avatar } from '@mui/material';
import PublishIcon from '@mui/icons-material/Publish';
import AddIcon from '@mui/icons-material/Add';
import { useEffectAsync, useScrollToLoad, pageSize } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import { prefixString } from '../common/util/stringUtils';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader from './components/SearchHeader';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';

const CommandsPage = () => {
  const { classes: settingsClasses } = useSettingsStyles();
  const t = useTranslation();
  const navigate = useNavigate();

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const loadItems = async (offset) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ limit: pageSize, offset });
      if (searchKeyword) {
        query.append('keyword', searchKeyword);
      }
      const response = await fetchOrThrow(`/api/commands?${query.toString()}`);
      const data = await response.json();
      setItems((previous) => (offset ? [...previous, ...data] : data));
      setHasMore(data.length >= pageSize);
    } finally {
      setLoading(false);
    }
  };

  const { sentinelRef, hasMore, setHasMore } = useScrollToLoad(() => loadItems(items.length));

  useEffectAsync(async () => {
    setItems([]);
    await loadItems(0);
  }, [timestamp, searchKeyword]);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'sharedSavedCommands']}>
      <div className={settingsClasses.container}>
        <div className={settingsClasses.containerMain}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, px: 2, pt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{
                width: 48, height: 48, borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(248, 113, 113, 0.2) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2,
                border: '1px solid rgba(239, 68, 68, 0.2)',
                }}>
                <PublishIcon sx={{ color: '#ef4444', fontSize: 28 }} />
                </Box>
                <Box>
                <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>{t('sharedSavedCommands')}</Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    Configure pre-defined commands for remote device control and automation.
                </Typography>
                </Box>
            </Box>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/settings/command')}
                sx={{ 
                    borderRadius: '12px', fontWeight: 900, px: 3, py: 1.2,
                    background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                    boxShadow: '0 8px 16px rgba(239, 68, 68, 0.25)',
                    textTransform: 'none',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                        boxShadow: '0 10px 20px rgba(239, 68, 68, 0.4)'
                    }
                }}
            >
                {t('sharedAdd')}
            </Button>
          </Box>

          {/* Search Header */}
          <Box sx={{ mb: 2, px: 2 }}>
            <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
          </Box>

          <Paper sx={{ 
            mx: 2, mb: 2, borderRadius: '20px', 
            background: 'rgba(30, 41, 59, 0.4)', 
            border: '1px solid rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)'
          }}>
            <Table sx={{ '& .MuiTableCell-root': { borderColor: 'rgba(255,255,255,0.05)', py: 2 } }}>
              <TableHead sx={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sharedDescription')}</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sharedType')}</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }} align="right">{t('sharedActions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading ? (
                    items.length > 0 ? (
                        items.map((item) => (
                        <TableRow key={item.id} hover sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.02) !important' } }}>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ 
                                        width: 32, height: 32, borderRadius: '8px',
                                        background: 'rgba(239, 68, 68, 0.1)', 
                                        color: '#ef4444', fontSize: '0.8rem', fontWeight: 800,
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {item.description?.charAt(0).toUpperCase() || 'C'}
                                    </Box>
                                    <Typography sx={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem' }}>{item.description}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>{t(prefixString('command', item.type))}</TableCell>
                            <TableCell align="right">
                            <CollectionActions
                                endpoint="commands"
                                itemId={item.id}
                                refreshEndpoint="commands"
                                editPath="/settings/command"
                            />
                            </TableCell>
                        </TableRow>
                    ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={3} align="center">
                            <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <PublishIcon sx={{ fontSize: 52, color: 'rgba(239, 68, 68, 0.2)' }} />
                            <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>No Commands Found</Typography>
                            </Box>
                        </TableCell>
                        </TableRow>
                    )
                ) : (
                  <TableShimmer columns={3} endAction />
                )}
              </TableBody>
            </Table>
            {hasMore && <div ref={sentinelRef} />}
          </Paper>
        </div>
      </div>
      <CollectionFab editPath="/settings/command" />
    </PageLayout>
  );
};

export default CommandsPage;
