import React from 'react';
import { Grid, Typography, IconButton, Tooltip, Card, Link, Chip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

const useStyles = makeStyles(() => ({
  patternItem: {
      padding: '10px'
  },
  patternCard: {
      padding: '10px',
      height: '90%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
  },
  chipGrid: {
      marginTop: '10px',
      marginBottom: '10px'
  }
}));

export default function PatternCard({
    pattern, 
    selectedPatterns, 
    handlePatternAction, 
    cardSize, 
    disableButtons, 
    disableChips
}) {
  const classes = useStyles();
  const patternInLocalState = (pattern) => {
    return (pattern && pattern['individual'] && selectedPatterns[pattern.individual.value]);
  };

  const getClassChips = (pattern) => {
    if (pattern['classtree']) {
        return (
            <Grid item md={12} className={classes.chipGrid}>
                {pattern['classtree'].map(singleClass => 
                    (
                        <Chip 
                            label={singleClass} 
                            style={{margin: '2px'}} 
                            key={singleClass}
                        />)
                    )
                }
            </Grid>
        )
    } else {
        return <div/>
    }
  };

  return (
    <Grid item sm={cardSize} xs={12} className={classes.patternItem} key={pattern['individual']['value']}>
        <Card className={classes.patternCard}>
            <Grid container justifyContent="center">
                <Grid item md={disableButtons ? 12 : 9} sm={12} alignItems="center" display="flex" justifyContent="center">
                    <Typography>
                        <Link style={{cursor: 'pointer'}} onClick={() => handlePatternAction('patternClick', pattern)}>
                            {pattern.label.value}
                        </Link>
                    </Typography>
                </Grid>
                { disableButtons || (
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
                )}
                {disableChips || getClassChips(pattern)}
            </Grid>
        </Card>
    </Grid>
  )
}