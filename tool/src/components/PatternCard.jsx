import React from 'react';
import { Grid, Typography, Card, Link, Chip } from '@mui/material';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(() => ({
  patternItem: {
      padding: '10px',
      marginTop: '10px'
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
    handleButtonAction,
    cardSize = 4, 
    disableChips,
    disableLinks,
    patternSubtext = [],
    color = '',
    isIndividual,
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
                            style={{ margin: '2px', width: 'auto', maxWidth: '100%' }} 
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
                {pattern.label}
            </span>
        )
    } else {
        return (
            <Link 
                style={{cursor: 'pointer'}} 
                onClick={() => handlePatternAction((isIndividual ? 'proposalClick' : 'patternClick'), pattern)}
            >
                {pattern.label}
            </Link>
        )
    }
  };

  const genBorder = (color) => {
      if (color) {
        return {
            borderTop: `6px solid ${color}`,
            borderLeft: `1px solid ${color}`,
            borderRight: `1px solid ${color}`,
            borderBottom: `1px solid ${color}`,
            boxShadow: ''
        }
      }
  }
  return (
    <Grid item sm={cardSize} xs={12} className={classes.patternItem} key={key}>
        <Card className={classes.patternCard} style={genBorder(color)}>
            <Grid container justifyContent="center">
                {
                    handleButtonAction && (
                        <Grid item xs={12} sx={{ paddingRight: '5px' }} display="flex" justifyContent="right">
                            <Link sx={{ cursor: 'pointer' }} onClick={() => handleButtonAction(pattern)}>(?)</Link>
                        </Grid>
                    )
                }
                <Grid item sm={12} alignItems="center" display="flex" justifyContent="center">
                    <Typography maxWidth={handleButtonAction ? '80%' : '100%'}>
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