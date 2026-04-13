import { useState } from 'react';
import { useSelector } from 'react-redux';

import {
  Typography,
  Container,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffectAsync } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PositionValue from '../common/components/PositionValue';
import usePositionAttributes from '../common/attributes/usePositionAttributes';
import BackIcon from '../common/components/BackIcon';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0f172a', // Deep slate background
    color: '#f8fafc',
    // Global UI Scaling for extreme high-density dashboard feel
    '& > *': {
       zoom: '0.8',
    }
  },
  content: {
    overflow: 'auto',
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
  appBar: {
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    color: '#f8fafc',
  },
  paper: {
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  },
  tableCell: {
    color: '#f8fafc',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  tableHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    fontWeight: 700,
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    letterSpacing: '0.05em',
  },
}));

const PositionPage = () => {
  const { classes, cx } = useStyles();
  const navigate = useNavigate();
  const t = useTranslation();

  const positionAttributes = usePositionAttributes(t);

  const { id } = useParams();

  const [item, setItem] = useState();

  useEffectAsync(async () => {
    if (id) {
      const response = await fetchOrThrow(`/api/positions?id=${id}`);
      const positions = await response.json();
      if (positions.length > 0) {
        setItem(positions[0]);
      }
    }
  }, [id]);

  const deviceName = useSelector((state) => {
    if (item) {
      const device = state.devices.items[item.deviceId];
      if (device) {
        return device.name;
      }
    }
    return null;
  });

  return (
    <div className={classes.root}>
      <AppBar position="sticky" elevation={0} className={classes.appBar}>
        <Toolbar>
          <IconButton color="inherit" edge="start" sx={{ mr: 2 }} onClick={() => navigate(-1)}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{deviceName || t('sharedDetails')}</Typography>
        </Toolbar>
      </AppBar>
      <div className={classes.content}>
        <Container maxWidth="sm">
          <Paper elevation={0} className={classes.paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className={cx(classes.tableCell, classes.tableHeader)}>{t('stateName')}</TableCell>
                  <TableCell className={cx(classes.tableCell, classes.tableHeader)}>{t('sharedName')}</TableCell>
                  <TableCell className={cx(classes.tableCell, classes.tableHeader)}>{t('stateValue')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {item &&
                  Object.getOwnPropertyNames(item)
                    .filter((it) => it !== 'attributes')
                    .map((property) => (
                      <TableRow key={property}>
                        <TableCell className={classes.tableCell}>{property}</TableCell>
                        <TableCell className={classes.tableCell}>
                          <strong>{positionAttributes[property]?.name}</strong>
                        </TableCell>
                        <TableCell className={classes.tableCell}>
                          <PositionValue position={item} property={property} />
                        </TableCell>
                      </TableRow>
                    ))}
                {item &&
                  Object.getOwnPropertyNames(item.attributes).map((attribute) => (
                    <TableRow key={attribute}>
                      <TableCell className={classes.tableCell}>{attribute}</TableCell>
                      <TableCell className={classes.tableCell}>
                        <strong>{positionAttributes[attribute]?.name}</strong>
                      </TableCell>
                      <TableCell className={classes.tableCell}>
                        <PositionValue position={item} attribute={attribute} />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Paper>
        </Container>
      </div>
    </div>
  );
};

export default PositionPage;
