import * as React from 'react';
import { Paper, Container, Divider, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import HealthCheck from '../../components/HealthCheck/HealthCheck';

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: '20px'
  },
  mainContent: {
    padding: '20px'
  },
  title: {
    marginTop: '10px',
  },
  healthCheck: {
    fontSize: '120%'
  }
}));

export default function Home() {
  const classes = useStyles();

  return (
    <Container className={classes.container}>
      <Paper className={classes.mainContent}>
        <HealthCheck className={classes.healthCheck} variant="overline" component="div" />
        <Typography className={classes.title} variant="h2" component="div">
          Welcome!
        </Typography>
        <Typography variant="body1" gutterBottom>
          Through this tool, you will be able to explore our <i>Blockchain-based pattern ontology</i>, an ontology for the recommendation of blockchain-based patterns
          for the design of blockchain applications. You can either have a look on existing patterns for specific categories, or get recommendations using user stories
          to guide you in this process.
        </Typography>
      </Paper>
    </Container>
  );
}