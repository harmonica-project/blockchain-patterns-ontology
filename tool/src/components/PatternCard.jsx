import React from 'react';
import { Grid, Typography, Card, Link, Chip } from '@mui/material';
import { makeStyles } from '@mui/styles';

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
    key,
    handlePatternAction, 
    cardSize = 4, 
    disableChips,
    disableLinks,
    patternSubtext = [],
    bgcolor = '#fff',
    isIndividual
}) {
  const classes = useStyles();

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

  const genTitle = () => {
    if (disableLinks) {
        return (
            <span>
                {pattern.label + (isIndividual ? ` (${pattern.paper.paper.replace('onto:','')})` : '')}
            </span>
        )
    } else {
        return (
            <Link 
                style={{cursor: 'pointer'}} 
                onClick={() => handlePatternAction((isIndividual ? 'linkedPatternClick' : 'patternClick'), pattern)}
            >
                {pattern.label + (isIndividual ? ` (${pattern.paper.paper.replace('onto:','')})` : '')}
            </Link>
        )
    }
  };

  return (
    <Grid item sm={cardSize} xs={12} className={classes.patternItem} key={key}>
        <Card className={classes.patternCard} style={{backgroundColor: bgcolor}}>
            <Grid container justifyContent="center">
                <Grid item sm={12} alignItems="center" display="flex" justifyContent="center">
                    <Typography>
                        { genTitle() }
                        {
                            patternSubtext.map(item => (
                                <Typography variant={item.variant} component={'p'}>
                                    {item.text}
                                </Typography>
                            ))
                        }
                    </Typography>
                </Grid>
                {disableChips || getClassChips(pattern)}
            </Grid>
        </Card>
    </Grid>
  )
}