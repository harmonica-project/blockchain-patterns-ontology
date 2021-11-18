import * as React from 'react';
import { Grid, Box, Toolbar, Typography, Button, AppBar, Badge } from '@mui/material';
import { styled } from '@mui/material/styles';
import { NavLink } from 'react-router-dom';

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -6,
    top: 0,
    border: `2px solid #1976d2`,
    padding: '0 6px',
    backgroundColor: '#00148f',
    color: 'white'
  },
}));

export default function Navbar({nbPatterns}) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Grid container>
            <Typography variant="h6" component="div">
              Blockchain-based pattern ontology
            </Typography>
          </Grid>
          <Grid container style={{justifyContent: 'flex-end', flexShrink: '1'}}>
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
              <Button component={NavLink} to={'/patterns'} color="inherit">
                <StyledBadge badgeContent={nbPatterns}>
                  My patterns
                </StyledBadge>
              </Button>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
    </Box>
  );
}