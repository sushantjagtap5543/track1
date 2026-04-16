import { useState, useEffect, useRef } from 'react';
import { TextField } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTranslation } from '../../common/components/LocalizationProvider';

const useStyles = makeStyles()((theme) => ({
  header: {
    position: 'sticky',
    left: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: theme.spacing(0, 0, 3),
    marginBottom: theme.spacing(1),
  },
  textField: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(30, 41, 59, 0.4)',
      backdropFilter: 'var(--glass-blur)',
      borderRadius: 'var(--premium-radius)',
      border: '1px solid var(--glass-border)',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderColor: 'rgba(56, 189, 248, 0.2)',
      },
      '&.Mui-focused': {
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderColor: '#38bdf8',
        boxShadow: 'var(--primary-glow)',
      },
    },
    '& .MuiOutlinedInput-input': {
      color: '#f8fafc',
      padding: theme.spacing(1.5, 2),
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
  },
}));

const SearchHeader = ({ keyword, setKeyword }) => {
  const { classes } = useStyles();
  const t = useTranslation();

  const [input, setInput] = useState(keyword);
  const timerRef = useRef();

  useEffect(() => {
    timerRef.current = setTimeout(() => setKeyword(input), 500);
    return () => clearTimeout(timerRef.current);
  }, [input, setKeyword]);

  return (
    <div className={classes.header}>
      <TextField
        className={classes.textField}
        variant="outlined"
        placeholder={t('sharedSearch')}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
    </div>
  );
};

export default SearchHeader;
