import * as React from 'react';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(() => ({
  container: {
    padding: '20px'
  },
}));

export default function ContentContainer({children}) {
  const classes = useStyles();

  return (
    <div className={classes.container}>
        {children}
    </div>
  );
}