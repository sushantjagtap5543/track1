import React from 'react';
import { Backdrop, CircularProgress, Box } from '@mui/material';

const Loader = () => {
  return (
    <Backdrop
      sx={{
        color: '#3b82f6',
        zIndex: (theme) => theme.zIndex.drawer + 1000,
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}
      open={true}
    >
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#3b82f6' }} />
        <CircularProgress
          variant="determinate"
          sx={{
            color: 'rgba(255, 255, 255, 0.05)',
            position: 'absolute',
            left: 0,
          }}
          size={60}
          thickness={4}
          value={100}
        />
      </Box>
    </Backdrop>
  );
};

export default Loader;

