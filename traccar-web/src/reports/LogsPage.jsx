import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  IconButton,
  Tooltip,
  Typography,
  Box,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';
import DevicesIcon from '@mui/icons-material/Devices';
import WifiTetheringIcon from '@mui/icons-material/WifiTethering';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import useReportStyles from './common/useReportStyles';
import { sessionActions } from '../store';

const LogsPage = () => {
  const { classes } = useReportStyles();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();

  useEffect(() => {
    dispatch(sessionActions.enableLogs(true));
    return () => dispatch(sessionActions.enableLogs(false));
  }, [dispatch]);

  const items = useSelector((state) => state.session.logs);
  const knownCount = items.filter((i) => i.deviceId).length;
  const unknownCount = items.length - knownCount;

  const registerDevice = (uniqueId) => {
    const query = new URLSearchParams({ uniqueId });
    navigate(`/settings/device?${query.toString()}`);
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'sharedLogs']}>
      <div className={classes.container}>
        <div className={classes.containerMain}>

          {/* Page Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 4,
              pb: 3,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(56,189,248,0.2) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(52,211,153,0.25)',
              }}
            >
              <WifiTetheringIcon sx={{ color: '#34d399', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}
              >
                {t('sharedLogs')}
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.82rem', mt: 0.3 }}>
                Live device connection feed — {items.length} {items.length === 1 ? 'entry' : 'entries'}
              </Typography>
            </Box>
          </Box>

          {/* Stat Cards */}
          {items.length > 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2.5, mb: 4 }}>
              <div className={classes.statCard}>
                <WifiTetheringIcon className={classes.statIcon} />
                <Typography className={classes.statLabel}>Total Messages</Typography>
                <Typography className={classes.statValue}>{items.length}</Typography>
              </div>
              <div className={classes.statCard}>
                <DevicesIcon sx={{ color: '#34d399', mb: 1 }} />
                <Typography className={classes.statLabel}>Known Devices</Typography>
                <Typography className={classes.statValue}>{knownCount}</Typography>
              </div>
              <div className={classes.statCard}>
                <HelpOutlineIcon sx={{ color: '#fb7185', mb: 1 }} />
                <Typography className={classes.statLabel}>Unknown Devices</Typography>
                <Typography className={classes.statValue}>{unknownCount}</Typography>
              </div>
            </Box>
          )}

          {/* Table */}
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Table className={classes.table} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    className={classes.columnAction}
                    sx={{ backgroundColor: 'rgba(30, 41, 59, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}
                  />
                  <TableCell sx={{ backgroundColor: 'rgba(30, 41, 59, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}>
                    {t('deviceIdentifier')}
                  </TableCell>
                  <TableCell sx={{ backgroundColor: 'rgba(30, 41, 59, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}>
                    {t('positionProtocol')}
                  </TableCell>
                  <TableCell sx={{ backgroundColor: 'rgba(30, 41, 59, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}>
                    {t('commandData')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length > 0 ? (
                  items.map((item, index) => (
                    <TableRow key={index} className={classes.tableRow}>
                      <TableCell className={classes.columnAction} padding="none">
                        <div className={classes.columnActionContainer}>
                          {item.deviceId ? (
                            <IconButton size="small" disabled sx={{ color: '#34d399 !important' }}>
                              <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          ) : (
                            <Tooltip title={t('loginRegister')}>
                              <IconButton
                                size="small"
                                onClick={() => registerDevice(item.uniqueId)}
                                sx={{ color: '#fb7185', '&:hover': { backgroundColor: 'rgba(251,113,133,0.1)' } }}
                              >
                                <HelpOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Typography className={item.deviceId ? classes.deviceName : classes.eventText}>
                          {item.uniqueId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            color: '#818cf8',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            backgroundColor: 'rgba(129,140,248,0.1)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            display: 'inline-block',
                          }}
                        >
                          {item.protocol}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          className={classes.eventText}
                          sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#94a3b8', wordBreak: 'break-all' }}
                        >
                          {item.data}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <WifiTetheringIcon sx={{ fontSize: 52, color: 'rgba(52, 211, 153, 0.2)' }} />
                        <Typography sx={{ color: '#475569', fontWeight: 600, fontSize: '1rem' }}>
                          Waiting for Device Messages
                        </Typography>
                        <Typography sx={{ color: '#334155', fontSize: '0.85rem', maxWidth: 340, textAlign: 'center' }}>
                          Device communication logs will appear here in real time as devices connect to the platform.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </div>
      </div>
    </PageLayout>
  );
};

export default LogsPage;
