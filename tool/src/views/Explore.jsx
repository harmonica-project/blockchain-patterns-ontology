import React, { useState, useEffect } from 'react';
import { Paper, Grid, Typography, Divider, List, ListItem, ListItemText, ListItemIcon, IconButton, Tooltip, Card } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { makeStyles } from '@mui/styles';
import ContentContainer from '../layouts/ContentContainer';
import HealthCheck from '../components/HealthCheck';
import { getSubclasses, getPatterns } from '../requests/fuseki';
import ClassTabs from '../components/ClassTabs';
import RefreshIcon from '@mui/icons-material/Refresh';

const useStyles = makeStyles(() => ({
    section: {
        padding: '20px'
    },
    healthCheck: {
        fontSize: '120%',
    },
    marginBottomClass: {
        marginBottom: '20px'
    },
    smallMarginTopClass: {
        marginTop: '5px'
    },
    bigMarginTopClass: {
        marginTop: '20px'
    },
    classTitleContainer: {
        width: '100%',
        textAlign: 'center',
        height: '50px',
    },
    classTitle: {
        float: 'left'
    },
    classTitleBtn: {
        float: 'right',
        display: 'inline-block',
        height: '32px'
    },
    patternItem: {
        padding: '10px'
    },
    patternCard: {
        padding: '10px',
        height: '80%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
    }
}));

export default function Explore() {
    const classes = useStyles();
    const [ontologyClasses, setOntologyClasses] = useState([])
    const [patterns, setPatterns] = useState([])
    const [selectorStates, setSelectorStates] = useState({});

    useEffect(() => {
        getPatterns(selectorStates)
            .then((results) => {
                setPatterns(results)
            })
    }, [selectorStates]);

    const getInitialSubclasses = async () => {
        let resClasses = await getSubclasses('owl:Thing');
        let newOntologyClasses = {...resClasses};
        for (let resClassKey in newOntologyClasses) {
            newOntologyClasses[resClassKey]['initial'] = true;
            newOntologyClasses[resClassKey]['childrens'] = [];
            let resSubclasses = await getSubclasses(resClassKey)
            for (let resSubclassKey in resSubclasses) {
                newOntologyClasses[resSubclassKey] = resSubclasses[resSubclassKey]
                newOntologyClasses[resSubclassKey]['parent'] = resClassKey;
                newOntologyClasses[resClassKey]['childrens'].push(resSubclassKey);
            }
        }
        setOntologyClasses(newOntologyClasses);
    };

    useEffect(() => {
        getInitialSubclasses();
    }, [])

    const getPattern = (pattern) => {
        let text = `${pattern.label.value} (from: ${(pattern['hasPaper'].value.split(':'))[1]})`;

        return (
            <Card className={classes.patternCard}>
                <Typography>
                    {text}
                </Typography>
            </Card>
            );
    };

    const displayPatterns = () => {
        if (!patterns.length) {
            return (
                <Typography variant="h6" className={classes.bigMarginTopClass}>
                    No patterns found for this query.
                </Typography>
            )
        } else {
            return (
                <Grid container>
                    {patterns.map(pattern => (
                        <Grid item xs={3} className={classes.patternItem}>
                            {getPattern(pattern)}
                        </Grid>
                    ))}
                </Grid>
            )
        }
    };

    const displaySelectedClasses = () => {
        if (Object.keys(selectorStates).length === 0) {
            return (
                <Typography variant="h6" className={classes.bigMarginTopClass}>
                    No classes selected yet.
                </Typography>
            )
        } else {
            return (
                <List>
                    {Object.keys(selectorStates).map(key => {
                        if (selectorStates[key] !== "prompt") {
                            return (
                                <ListItem>
                                    <ListItemIcon>
                                        <Tooltip title="Delete class filter">
                                            <IconButton onClick={() => deleteClassFromSelection(selectorStates[key])}>
                                                <ClearIcon/>
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={`${selectorStates[key]}`}
                                    />
                                </ListItem>
                            )
                        }
                    })}
                </List>
            )
        }
    };

    const resetSelection = () => {
        setSelectorStates({});
    };

    const handleChangeSelect = (e, parentClass) => {
        setSelectorStates({
            ...selectorStates,
            [parentClass]: e.target.value
        });

        getSubclasses(e.target.value)
            .then(result => {
                let newOntologyClasses = {...ontologyClasses}
                Object.keys(result).forEach(resKey => {
                    newOntologyClasses = {...newOntologyClasses, [resKey]: {
                        ...result[resKey],
                        parent: e.target.value
                    }}
                })
                newOntologyClasses[e.target.value]['childrens'] = Object.keys(result)
                setOntologyClasses(newOntologyClasses);
            })
    };

    const deleteClassFromSelection = (classname) => {
        const newSelectorStates = {...selectorStates}
        newSelectorStates[ontologyClasses[classname].parent] = "prompt";

        // we cannot delete directly the class, we also need to delete its childrens as they cannot be selected anymore
        while (newSelectorStates[classname]) {
            let newClassname = newSelectorStates[classname];
            delete newSelectorStates[classname];
            classname = newClassname
        }
        
        setSelectorStates(newSelectorStates);
    }

    return (
        <ContentContainer>
            <HealthCheck className={classes.healthCheck} variant="overline" component="div" />
            <Grid container spacing={2} className={classes.smallMarginTopClass}>
                <Grid item md={5} xs={12}>
                <Grid item className={classes.marginBottomClass} md={12}>
                    <Paper className={classes.section}>
                        <div className={classes.classTitleContainer}>
                            <Typography className={classes.classTitle} variant="h6">Class selection</Typography>
                            <div className={classes.classTitleBtn}>
                                <Tooltip title="Reset filters">
                                    <IconButton onClick={resetSelection}>
                                        <RefreshIcon/> 
                                    </IconButton>
                                </Tooltip>
                            </div>
                        </div>
                        <Divider />
                        <ClassTabs ontologyClasses={ontologyClasses} handleChangeSelect={handleChangeSelect} selectorStates={selectorStates} setSelectorStates={setSelectorStates} />
                    </Paper>
                </Grid>
                <Grid item md={12}>
                    <Paper className={classes.section}>
                        <Typography className={classes.marginBottomClass} variant="h6">Selected classes</Typography>
                        <Divider />
                        {displaySelectedClasses()}
                    </Paper>
                </Grid>
                </Grid>
                <Grid item md={7} xs={12}>
                    <Paper className={classes.section}>
                        <Typography className={classes.marginBottomClass} variant="h6">Corresponding patterns</Typography>
                        {displayPatterns()}
                    </Paper>
                </Grid>
            </Grid>
        </ContentContainer>
    );
}