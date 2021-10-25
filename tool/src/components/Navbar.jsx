import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { NavLink } from 'react-router-dom';

export default function ButtonAppBar() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Blockchain-based pattern ontology
          </Typography>
          <Button component={NavLink} to={'/'} color="inherit">Home</Button>
          <Button component={NavLink} to={'/explore'} color="inherit">Explore</Button>
          <Button component={NavLink} to={'/recommendation'} color="inherit">Get recommendation</Button>
          <Button component={NavLink} to={'/patterns'} color="inherit">My patterns</Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
}