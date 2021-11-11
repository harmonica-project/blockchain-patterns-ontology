import * as React from 'react';
import { Typography, Container, Paper } from '@mui/material';
import { makeStyles } from '@mui/styles';
import HealthCheck from '../components/HealthCheck';
import ContentContainer from '../layouts/ContentContainer';

const useStyles = makeStyles(() => ({
  healthCheck: {
    fontSize: '120%'
  },
  paper: {
    padding: "20px",
    marginTop: "20px"
  }
}));

export default function Home() {
  const classes = useStyles();

  return (
    <ContentContainer>
      <Container>
        <HealthCheck className={classes.healthCheck} variant="overline" component="div" />
        <Paper className={classes.paper}>
          <Typography variant="h2" component="div">
            Welcome!
          </Typography>
          <Typography variant="body1" align="justify" gutterBottom>
            Through this tool, you will be able to explore our <i>Blockchain-based pattern ontology</i>, an ontology for the recommendation of blockchain-based patterns
            for the design of blockchain applications. You can either have a look on existing patterns for specific categories, or get recommendations using user stories
            to guide you in this process.
          </Typography>
          <br/>
          <Typography variant="body2" gutterBottom>
            Lastest ontology modification: November 10, 2021.
          </Typography>
        </Paper>
      </Container>
    </ContentContainer>
  );
}