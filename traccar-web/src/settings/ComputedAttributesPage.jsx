import { useState } from 'react';
import {
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  Button,
  Box,
  Typography,
  Avatar,
  Paper,
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import AddIcon from '@mui/icons-material/Add';
import { useEffectAsync, useScrollToLoad, pageSize } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader from './components/SearchHeader';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';
import CollectionFab from './components/CollectionFab';

import { useNavigate } from 'react-router-dom';

const ComputedAttributesPage = () => {
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
      const response = await fetchOrThrow(`/api/attributes/computed?${query.toString()}`);
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
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'sharedComputedAttributes']}>
      <div className={settingsClasses.container}>
        <div className={settingsClasses.containerMain}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, px: 2, pt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{
                width: 48, height: 48, borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(129, 140, 248, 0.2) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2,
                border: '1px solid rgba(56, 189, 248, 0.2)',
                }}>
                <CodeIcon sx={{ color: '#38bdf8', fontSize: 28 }} />
                </Box>
                <Box>
                <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>{t('sharedComputedAttributes')}</Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                    Extend platform functionality with custom logic and dynamic data transformations.
                </Typography>
                </Box>
            </Box>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/settings/attribute')}
                sx={{ 
                    borderRadius: '12px', fontWeight: 900, px: 3, py: 1.2,
                    background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                    boxShadow: '0 8px 16px rgba(56, 189, 248, 0.25)',
                    textTransform: 'none',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                        boxShadow: '0 10px 20px rgba(56, 189, 248, 0.4)'
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
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sharedAttribute')}</TableCell>
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
                                        background: 'rgba(56, 189, 248, 0.1)', 
                                        color: '#38bdf8', fontSize: '0.8rem', fontWeight: 800,
                                        border: '1px solid rgba(56, 189, 248, 0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {item.description?.charAt(0).toUpperCase() || 'A'}
                                    </Box>
                                    <Typography sx={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem' }}>{item.description}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell sx={{ color: '#cbd5e1', fontFamily: 'monospace' }}>{item.attribute}</TableCell>
                            <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>{item.type}</TableCell>
                            <TableCell align="right">
                            <CollectionActions
                                endpoint="attributes/computed"
                                itemId={item.id}
                                refreshEndpoint="attributes/computed"
                                editPath="/settings/attribute"
                            />
                            </TableCell>
                        </TableRow>
                    ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={4} align="center">
                            <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <CodeIcon sx={{ fontSize: 52, color: 'rgba(56, 189, 248, 0.2)' }} />
                            <Typography sx={{ color: '#475569', fontWeight: 600 }}>No Computed Attributes Found</Typography>
                            </Box>
                        </TableCell>
                        </TableRow>
                    )
                ) : (
                  <TableShimmer columns={4} endAction />
                )}
              </TableBody>
            </Table>
            {hasMore && <div ref={sentinelRef} />}
          </Paper>
        </div>
      </div>
      <CollectionFab editPath="/settings/attribute" />
    </PageLayout>
  );
};

export default ComputedAttributesPage;
