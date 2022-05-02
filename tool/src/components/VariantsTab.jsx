import React, { useState, useEffect  } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { makeStyles } from '@mui/styles';
import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import { getVariantRelations } from '../libs/fuseki';
import { Divider, List, ListItem, ListItemText } from '@mui/material';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';

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
    },
    variantPadding: {
        padding: '20px'
    },
    relation: {
        border: '1px solid lightgrey',
        borderRadius: '5px',
        marginBottom: '10px'
    }
}));

const Accordion = styled((props) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
  ))(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    '&:not(:last-child)': {
      borderBottom: 0,
    },
    '&:before': {
      display: 'none',
    },
  }));
  
const AccordionSummary = styled((props) => (
    <MuiAccordionSummary
      expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
      {...props}
    />
  ))(({ theme }) => ({
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, .05)'
        : 'rgba(0, 0, 0, .03)',
    flexDirection: 'row-reverse',
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      transform: 'rotate(90deg)',
    },
    '& .MuiAccordionSummary-content': {
      marginLeft: theme.spacing(1),
    },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
    padding: theme.spacing(2),
    borderTop: '1px solid rgba(0, 0, 0, .125)',
}));

export default function VariantsTab({variants, handlePatternModalAction, selectedPatterns, selectedTab, setSelectedTab, disableLinks}) {
    const classes = useStyles();
    const [variantRelations, setVariantRelations] = useState([]);

    useEffect(() => {
        if (selectedTab.variant !== -1) {
            const variant = Object.keys(variants)[selectedTab.variant];
            getVariantRelations(variant)
                .then(result => setVariantRelations(result));
        }
    }, [selectedTab]);

    const handleChange = (type, i) => {
        if (i === selectedTab[type]) setSelectedTab({ ...selectedTab, [type]: -1 });
        else setSelectedTab({ ...selectedTab, [type]: i });
    };

    const getPatternStats = () => {
        const nbVariants = Object.keys(variants).length;
        let nbProposals = 0;

        Object.keys(variants).forEach(key => {
            nbProposals += Object.keys(variants[key].proposals).length;
        });

        if (nbVariants) {
            if (nbProposals) {
                return `${nbVariants} variant${nbVariants > 1 ? 's' : ''} and ${nbProposals} proposal${nbProposals > 1 ? 's' : ''} have been found in our corpus of papers based on your filter selection.`;
            }

            return `${nbVariants} variant${nbVariants > 1 ? 's' : ''} ha${nbVariants > 1 ? 've' : 's'} been found in our corpus of papers based on your filter selection.`;
        }

        return `No variants and proposals have been found in our corpus of papers based on your filter selection..`;
    }

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

    const getRelationLabel = (variant) => {
        switch(variant.relation.value) {
          case 'onto:variantOf':
            return {
                'primary': 'Variant of',
                'secondary': `Variant of ${variant.variant_label.value}.`
            };
    
          case 'onto:requires':
            return {
                'primary': 'Requires',
                'secondary': `Required: it must be used with the ${variant.variant_label.value} variant.`
            };
    
          case 'onto:createdFrom':
            return {
                'primary': 'Created from',
                'secondary': `${variant.variant_label.value} is directly inspired from this variant.`
            };
    
          case 'onto:benefitsTo':
            return {
                'primary': 'Benefits to',
                'secondary': `Using this variant along the ${variant.variant_label.value} variant is beneficial.`
            };      
    
          case 'onto:relatedTo':
            return {
                'primary': 'Related to',
                'secondary': `This variant is related to the ${variant.variant_label.value} variant.`
            };  
    
          default:
            return {
                'primary': 'Related to',
                'secondary': `This variant is related to the ${variant.variant_label.value} variant.`
            }; 
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1" className={classes.marginBottomClass} gutterBottom>
                    {getPatternStats()}
                </Typography>
            </Box>
            {Object.keys(variants).map((vKey, i) => (
                <Accordion expanded={selectedTab.variant === i} key={`variant${i}-accordion`} onChange={() => handleChange('variant', i)}>
                    <AccordionSummary
                        aria-controls={`variant${i}-accordion-summary`}
                    >
                        <Typography id="variant-title" variant="h5" component="h1">
                            {variants[vKey].label}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={2} className={classes.variantPadding}>
                            <Grid item xs={12} sm={4}>
                                <Typography id="relations-title" variant="h6" component="h1" className={classes.marginBottomClass}>
                                    Linked variants (inferred)
                                </Typography>
                                {
                                    variantRelations.length 
                                    ?
                                        <List>
                                            {
                                                variantRelations.map(r => (
                                                    <ListItem className={classes.relation}>
                                                        <ListItemText
                                                            primary={getRelationLabel(r).primary}
                                                            secondary={getRelationLabel(r).secondary}
                                                        />
                                                    </ListItem>
                                                ))
                                            }
                                        </List>
                                    : 
                                    <Typography id="relations-title" variant="body1" component="h1">
                                        No linked variants found.
                                    </Typography>
                                }
                            </Grid> 
                            <Grid item xs={12} sm={8}>
                                <Typography id="relations-title" variant="h6" component="h1" className={classes.marginBottomClass}>
                                    Proposals
                                </Typography>
                                {
                                    Object.keys(variants[vKey].proposals).map((pKey, j) => (
                                        <Accordion expanded={selectedTab.proposal === j} key={`proposal${j}-accordion`} onChange={() => handleChange('proposal', j)}>
                                            <AccordionSummary
                                                aria-controls={`proposal${j}-accordion-summary`}
                                            >
                                                <Typography id="proposal-title" variant="body1" component="h1">
                                                    {variants[vKey].proposals[pKey].label}
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Typography className={classes.marginBottomClass} variant="overline" component="div">
                                                    <p className={classes.paperInfo}>Paper: {variants[vKey].proposals[pKey].paper.title}</p>
                                                    <p className={classes.paperInfo}>Source: {getSource(variants[vKey].proposals[pKey].paper)}</p>
                                                    <p className={classes.paperInfo}>Authors: {variants[vKey].proposals[pKey].paper.authors}</p>
                                                </Typography>
                                                <Divider className={classes.marginBottomClass} />
                                                <Box className={classes.marginTopClass}>
                                                    <Typography sx={{ mt: 2 }}>
                                                        <b>
                                                            Context and problem
                                                        </b>
                                                    </Typography>
                                                    <Typography align="justify">
                                                        {variants[vKey].proposals[pKey].context || "No text provided."}
                                                    </Typography>
                                                    <Typography sx={{ mt: 2 }}>
                                                        <b>
                                                            Proposed solution
                                                        </b>
                                                    </Typography>
                                                    <Typography align="justify">
                                                        {variants[vKey].proposals[pKey].solution || "No text provided."}
                                                    </Typography>
                                                </Box>
                                            </AccordionDetails>
                                        </Accordion>
                                    ))
                                }
                            </Grid>
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            ))}
        </Box>
    );
}