import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  Switch,
  TableFooter,
  FormControlLabel,
  Chip,
  Paper,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LinkIcon from '@mui/icons-material/Link';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import GroupIcon from '@mui/icons-material/Group';
import { useCatch, useEffectAsync, useScrollToLoad, pageSize } from '../reactHelper';
import { useMemo } from 'react';
import { formatBoolean, formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import { useManager } from '../common/util/permissions';
import SearchHeader from './components/SearchHeader';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';

const UsersPage = () => {
  const { classes: settingsClasses } = useSettingsStyles();
  const navigate = useNavigate();
  const t = useTranslation();

  const manager = useManager();

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [temporary, setTemporary] = useState(false);

  const handleLogin = useCatch(async (userId) => {
    await fetchOrThrow(`/api/session/${userId}`);
    window.location.replace('/');
  });

  const actionLogin = {
    key: 'login',
    title: t('loginLogin'),
    icon: <LoginIcon fontSize="small" />,
    handler: handleLogin,
  };

  const actionConnections = {
    key: 'connections',
    title: t('sharedConnections'),
    icon: <LinkIcon fontSize="small" />,
    handler: (userId) => navigate(`/settings/user/${userId}/connections`),
  };

  const loadItems = async (offset) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ excludeAttributes: true, limit: pageSize, offset });
      if (searchKeyword) {
        query.append('keyword', searchKeyword);
      }
      const response = await fetchOrThrow(`/api/users?${query.toString()}`);
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

  const stats = useMemo(() => {
    if (!items.length) return null;
    return {
      total: items.length,
      admins: items.filter((i) => i.administrator).length,
      disabled: items.filter((i) => i.disabled).length,
    };
  }, [items]);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'settingsUsers']}>
      <div className={settingsClasses.container}>
        <div className={settingsClasses.containerMain}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, ml: 1 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(129, 140, 248, 0.2) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2,
              border: '1px solid rgba(56, 189, 248, 0.2)',
            }}>
              <PersonIcon sx={{ color: '#38bdf8', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>{t('settingsUsers')}</Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                Manage user accounts, administrative permissions, and system access levels.
              </Typography>
            </Box>
          </Box>

          {stats && !loading && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 4 }}>
              <div className={settingsClasses.statCard}>
                <PersonIcon sx={{ color: '#38bdf8', mb: 1 }} />
                <Typography className={settingsClasses.statLabel}>{t('sharedTotal')}</Typography>
                <Typography className={settingsClasses.statValue}>{stats.total}</Typography>
              </div>
              <div className={settingsClasses.statCard}>
                <AdminPanelSettingsIcon sx={{ color: '#818cf8', mb: 1 }} />
                <Typography className={settingsClasses.statLabel}>{t('userAdmin')}</Typography>
                <Typography className={settingsClasses.statValue}>{stats.admins}</Typography>
              </div>
              <div className={settingsClasses.statCard}>
                <EventBusyIcon sx={{ color: '#fb7185', mb: 1 }} />
                <Typography className={settingsClasses.statLabel}>{t('sharedDisabled')}</Typography>
                <Typography className={settingsClasses.statValue}>{stats.disabled}</Typography>
              </div>
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
          </Box>

          <Paper sx={{ 
            mx: 1, mb: 2, borderRadius: '20px', 
            background: 'rgba(30, 41, 59, 0.4)', 
            border: '1px solid rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            flex: 1, display: 'flex', flexDirection: 'column'
          }}>
            <Table className={settingsClasses.table} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'rgba(15, 23, 42, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}>{t('sharedName')}</TableCell>
                  <TableCell sx={{ backgroundColor: 'rgba(15, 23, 42, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}>{t('userEmail')}</TableCell>
                  <TableCell sx={{ backgroundColor: 'rgba(15, 23, 42, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}>{t('userAdmin')}</TableCell>
                  <TableCell sx={{ backgroundColor: 'rgba(15, 23, 42, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}>{t('sharedDisabled')}</TableCell>
                  <TableCell sx={{ backgroundColor: 'rgba(15, 23, 42, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}>{t('userExpirationTime')}</TableCell>
                  <TableCell sx={{ backgroundColor: 'rgba(15, 23, 42, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11, width: '1%' }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading ? (
                  items.length > 0 ? (
                    items
                      .filter((u) => temporary || !u.temporary)
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Typography sx={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>{item.email}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={item.administrator ? t('sharedYes') : t('sharedNo')} 
                              size="small"
                              sx={{ 
                                backgroundColor: item.administrator ? 'rgba(52, 211, 153, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                color: item.administrator ? '#34d399' : '#94a3b8',
                                fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={item.disabled ? t('sharedYes') : t('sharedNo')} 
                              size="small"
                              sx={{ 
                                backgroundColor: item.disabled ? 'rgba(251, 113, 133, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                color: item.disabled ? '#fb7185' : '#94a3b8',
                                fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>{formatTime(item.expirationTime, 'date') || '—'}</Typography>
                          </TableCell>
                          <TableCell className={settingsClasses.columnAction} padding="none">
                            <CollectionActions
                              itemId={item.id}
                              editPath="/settings/user"
                              endpoint="users"
                              setTimestamp={setTimestamp}
                              customActions={manager ? [actionLogin, actionConnections] : [actionConnections]}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <PersonIcon sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.05)' }} />
                          <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>No users found</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                ) : (
                  <TableShimmer columns={6} endAction />
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} align="right" sx={{ borderBottom: 'none', pt: 4 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={temporary}
                          onChange={(e) => setTemporary(e.target.checked)}
                          size="small"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#38bdf8' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#38bdf8' },
                          }}
                        />
                      }
                      label={<Typography sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('userTemporary')}</Typography>}
                      labelPlacement="start"
                    />
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
            {hasMore && <div ref={sentinelRef} />}
          </Paper>
        </div>
      </div>
      <CollectionFab editPath="/settings/user" />
    </PageLayout>
  );
};

export default UsersPage;
