import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography, Box, useMediaQuery, useTheme } from '@mui/material';
import ReportFilter from './components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import { useCatch } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import { formatTime } from '../common/util/formatter';
import { prefixString } from '../common/util/stringUtils';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { deviceEquality } from '../common/util/deviceEquality';

const CombinedReportPage = () => {
  const { classes, cx } = useReportStyles();
  const t = useTranslation();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const devices = useSelector((state) => state.devices.items, deviceEquality(['id', 'name']));

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const query = new URLSearchParams({ from, to });
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    groupIds.forEach((groupId) => query.append('groupId', groupId));
    setLoading(true);
    try {
      const response = await fetchOrThrow(`/api/reports/combined?${query.toString()}`);
      setItems(await response.json());
    } finally {
      setLoading(false);
    }
  });

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportCombined']}>
      <div className={classes.container}>
        <div className={classes.containerMain}>
          <div className={classes.header}>
            <ReportFilter onShow={onShow} deviceType="multiple" loading={loading} />
          </div>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Table className={classes.table} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>{t('sharedDevice')}</TableCell>
                  <TableCell>{t('positionFixTime')}</TableCell>
                  <TableCell>{t('sharedType')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading ? (
                  items.flatMap((item) =>
                    (item.events || []).map((event, index) => (
                      <TableRow key={event.id} className={classes.tableRow}>
                        <TableCell>
                          {!index && (
                            <Typography className={classes.deviceName}>
                              {devices[item.deviceId]?.name || t('sharedUnknown')}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography className={classes.eventText}>
                            {formatTime(event.eventTime, 'seconds')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                             <Typography 
                               sx={{ 
                                 color: '#f8fafc', // Unified color
                                 backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                                 padding: '2px 10px', 
                                 borderRadius: '2000px',
                                 fontSize: '0.7rem',
                                 fontWeight: 800,
                                 letterSpacing: '0.05em',
                                 textTransform: 'uppercase',
                                 border: '1px solid rgba(255, 255, 255, 0.1)',
                                 boxShadow: '0 0 10px rgba(255, 255, 255, 0.05)'
                               }}
                             >
                               {t(prefixString('event', event.type))}
                             </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )),
                  )
                ) : (
                  <TableShimmer columns={3} />
                )}
                {!loading && items.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={3} align="center">
                       <Typography sx={{ color: '#f8fafc', py: 8, fontSize: '0.9rem', fontWeight: 500 }}>
                         {t('sharedNoData')}
                       </Typography>
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

export default CombinedReportPage;
