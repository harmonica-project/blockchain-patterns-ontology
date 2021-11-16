import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import { makeStyles } from '@mui/styles';
import PatternCard from '../components/PatternCard';

const useStyles = makeStyles(() => ({
    paperInfo: {
        lineHeight: '1'
    },
    marginTopClass: {
        marginTop: '15px'
    },
    marginBottomClass : {
        marginBottom: '15px'
    },
    marginClass: {
        marginTop: '15px',
        marginBottom: '15px'
    }
}));

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`individual-tabpanel-${index}`}
      aria-labelledby={`individual-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `individual-tab-${index}`,
    'aria-controls': `individual-tabpanel-${index}`,
  };
}

export default function IndividualTabs({individuals, handlePatternModalAction, selectedPatterns, selectedTab, setSelectedTab, disableLinks}) {
    const classes = useStyles();

    const patternInLocalState = (individual) => {
        return (individual && individual.individual && selectedPatterns[individual.individual]);
    };

    const handleChange = (_, newValue) => {
        setSelectedTab(newValue);
    };

    const getSource = (paper) => {
        const prop = paper.identifier;
        const type = paper.identifiertype;

        if (type === 'DOI') {
            return <a href={'https://doi.org/' + prop}>{prop}</a>
        } else if (type === 'Arxiv') {
            return <a href={'https://arxiv.org/' + prop}>{prop}</a>
        } else {
            return <span>{prop}</span>;
        }
    };

    const getRelationLabel = (individual) => {
        switch(individual.relation) {
          case 'onto:variantOf':
            return `A ${individual.label} pattern variant.`;
    
          case 'onto:requires':
            return `Required: it must be used with the ${individual.label} pattern.`;
    
          case 'onto:createdFrom':
            return `${individual.label} is directly inspired from this pattern.`;
    
          case 'onto:benefitsTo':
            return `Using this pattern along the ${individual.label} pattern is beneficial.`;      
    
          case 'onto:relatedTo':
            return `This pattern is related to the ${individual.label} pattern.`;  
    
          default:
            return `This pattern is related to the ${individual.label} pattern.`;  
        }
    };

    console.log(individuals)
    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1" className={classes.marginBottomClass} gutterBottom>
                    This pattern has been proposed {individuals.length > 1 ? individuals.length + ' times' : 'once'} in our corpus of papers.
                </Typography>
                <Divider />
                <Tabs value={selectedTab} onChange={handleChange} aria-label="Individuals tabs" centered>
                    {individuals.map((_, i) => (
                        <Tab label={`Proposal ${i+1}`} {...a11yProps(i)} />
                    ))}
                </Tabs>
            </Box>
            {individuals.map((individual, i) => (
                <TabPanel value={selectedTab} index={i}>
                    <Box>
                        <Box display="flex">
                            <Box flexGrow="1">
                                <Typography id="pattern-modal-title" variant="h6" component="h1">
                                {individual.label}
                                </Typography>
                                <Typography className={classes.marginBottomClass} variant="overline" component="div">
                                    <p className={classes.paperInfo}>Paper: {individual.paper.title}</p>
                                    <p className={classes.paperInfo}>Source: {getSource(individual.paper)}</p>
                                    <p className={classes.paperInfo}>Authors: {individual.paper.authors}</p>
                                </Typography>
                            </Box>
                            <Box display="flex" justifyContent="right">
                                <Box>
                                    {patternInLocalState(individual) 
                                        ? 
                                            (
                                            <Button 
                                                variant="contained"
                                                onClick={() => handlePatternModalAction('patternDelete', individual)}
                                            >
                                                Remove from my list
                                            </Button>
                                            )
                                        : 
                                            (
                                            <Button 
                                                variant="contained"
                                                onClick={() => handlePatternModalAction('patternStore', individual)}
                                            >
                                                Add to my list
                                            </Button>
                                            )
                                    }
                                </Box> 
                            </Box>
                        </Box>
                        <Divider />
                        <Box className={classes.marginTopClass}>
                            <Typography sx={{ mt: 2 }}>
                                <b>
                                    Context and problem
                                </b>
                            </Typography>
                            <Typography align="justify">
                                {individual.context || "No text provided."}
                            </Typography>
                            <Typography sx={{ mt: 2 }}>
                                <b>
                                    Proposed solution
                                </b>
                            </Typography>
                            <Typography align="justify">
                                {individual.solution || "No text provided."}
                            </Typography>
                        </Box>
                        <Box>
                            {
                                individual.linkedPatterns.length > 0 && (
                                    <>
                                        <Typography className={classes.marginClass} id="modal-modal-title">
                                            <b>
                                                Linked proposals
                                            </b>
                                        </Typography>
                                        <Grid container>
                                            {
                                                individual.linkedPatterns.map(linkedPattern => (
                                                    <PatternCard 
                                                        pattern={linkedPattern}
                                                        selectedPatterns={selectedPatterns}
                                                        handlePatternAction={handlePatternModalAction}
                                                        patternSubtext={[{
                                                            text: getRelationLabel(linkedPattern),
                                                            variant: 'body2'
                                                        }]}
                                                        cardSize={4}
                                                        disableChips
                                                        disableLinks={disableLinks}
                                                        isLinkedPattern
                                                        isIndividual
                                                    />
                                                ))
                                            }
                                        </Grid>
                                    </>
                                )
                            }
                        </Box>
                    </Box>
                </TabPanel>
            ))}
        </Box>
    );
}