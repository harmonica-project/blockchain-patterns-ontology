import * as React from 'react';
import { Typography, Container, Paper } from '@mui/material';
import ContentContainer from '../layouts/ContentContainer';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(() => ({
  paper: {
    padding: "20px",
    marginTop: "20px"
  }
}));

export default function Recommendation() {
  const classes = useStyles();

  return (
    <ContentContainer>
      <Container>
        <Paper className={classes.paper}>
          <Typography variant="h2" component="div">
            In construction 🚧
          </Typography>
          <Typography variant="body1" gutterBottom>
            This part of our ontology explorer is still in construction.
            Please come back later!
          </Typography>
        </Paper>
      </Container>
    </ContentContainer>
  );
}