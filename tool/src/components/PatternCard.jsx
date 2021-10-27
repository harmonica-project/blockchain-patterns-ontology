import React from 'react';
import { Grid, Typography, IconButton, Tooltip, Card, Link } from '@mui/material';
import { makeStyles } from '@mui/styles';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

const useStyles = makeStyles(() => ({
  patternItem: {
      padding: '10px'
  },
  patternCard: {
      padding: '10px',
      height: '80%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
  }
}));

export default function PatternCard({pattern, selectedPatterns, handlePatternAction, cardSize}) {
  const classes = useStyles();
  const patternInLocalState = (pattern) => {
    return (pattern && pattern['individual'] && selectedPatterns[pattern.individual.value]);
  };

  return (
    <Grid item xs={cardSize} className={classes.patternItem} key={pattern['individual']['value']}>
        <Card className={classes.patternCard}>
            <Grid container>
                <Grid item md={9} sm={12}>
                    <Typography>
                        <Link style={{cursor: 'pointer'}} onClick={() => handlePatternAction('patternClick', pattern)}>
                            {pattern.label.value}
                        </Link>
                    </Typography>
                    <Typography variant="overline">
                        {(pattern['paper'].value.split(':'))[1]}
                    </Typography>
                </Grid>
                <Grid item md={3} sm={12}>
                        {patternInLocalState(pattern) 
                            ? 
                                (
                                    <Tooltip title={"Delete pattern from my list"}>
                                        <IconButton onClick={() => handlePatternAction('patternDelete', pattern)}>
                                            <DeleteSweepIcon fontSize="large" />
                                        </IconButton>
                                    </Tooltip>
                                )
                            : 
                                (
                                    <Tooltip title={"Add pattern to my list"}>
                                        <IconButton onClick={() => handlePatternAction('patternStore', pattern)}>
                                            <PlaylistAddIcon fontSize="large" />
                                        </IconButton>
                                    </Tooltip>
                                )
                        } 
                </Grid>
            </Grid>
        </Card>
    </Grid>
  )
}