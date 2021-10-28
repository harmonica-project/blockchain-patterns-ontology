import * as React from 'react';
import { Grid, Box, Toolbar, Typography, Button, AppBar } from '@mui/material';
import { NavLink } from 'react-router-dom';

export default function ButtonAppBar() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Grid container>
            <Typography variant="h6" component="div">
              Blockchain-based pattern ontology
            </Typography>
          </Grid>
          <Grid container style={{justifyContent: 'end', flexShrink: '1'}}>
            <Grid item>
              <Button component={NavLink} to={'/'} color="inherit">Home</Button>
            </Grid>
            <Grid item>
              <Button component={NavLink} to={'/explore'} color="inherit">Explore</Button>
            </Grid>
            <Grid item>
              <Button component={NavLink} to={'/recommendation'} color="inherit">Get recommendation</Button>
            </Grid>
            <Grid item>
              <Button component={NavLink} to={'/patterns'} color="inherit">My patterns</Button>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
    </Box>
  );
}