import React, { useState, useEffect } from 'react';
import { Paper, Grid, Typography, Divider, List, ListItem, ListItemText, ListItemIcon, IconButton, Tooltip, Card, Link } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { makeStyles } from '@mui/styles';
import ContentContainer from '../layouts/ContentContainer';
import HealthCheck from '../components/HealthCheck';
import { getSubclasses, getPatterns } from '../libs/fuseki';
import ClassTabs from '../components/ClassTabs';
import RefreshIcon from '@mui/icons-material/Refresh';
import PatternModal from '../modals/PatternModal';
import { useSnackbar } from 'notistack';
import { getLocalStoragePatterns } from '../libs/helpers';
import PatternCard from '../components/PatternCard';

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
    }
}));

export default function Explore() {
    const classes = useStyles();
    const [ontologyClasses, setOntologyClasses] = useState([])
    const [patterns, setPatterns] = useState([])
    const [selectorStates, setSelectorStates] = useState({});
    const [modalStates, setModalStates] = useState({ "pattern": false });
    const [currentPattern, setCurrentPattern] = useState({});
    const [selectedPatterns, setSelectedPatterns] = useState({});
    const { enqueueSnackbar } = useSnackbar();

    const filterParents = (filterClasses) => {
        let keyClasses = Object.keys(filterClasses);
    
        for (let i in keyClasses) {
            let key = keyClasses[i]
            console.log(key, filterClasses[key], filterClasses[filterClasses[key]])
            if (filterClasses[filterClasses[key]]) {
                delete filterClasses[key];
            }
        }
    
        return filterClasses;
    }

    useEffect(() => {
        getPatterns(filterParents({...selectorStates}))
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
        let patterns = getLocalStoragePatterns();
        if (patterns) setSelectedPatterns(patterns);
        else {
            enqueueSnackbar('Error while retrieving patterns.');
            localStorage.setItem('patterns', {})
        }
    }, [])

    const handlePatternClick = (pattern) => {
        setCurrentPattern(pattern);
        setModalStates({
            "pattern": true
        })
    }

    const storeInLocalstorage = (pattern) => {
        let storedPatterns = localStorage.getItem('patterns');
        if (!storedPatterns) {
            localStorage.setItem('patterns', JSON.stringify({[pattern.individual.value]: pattern}));
        } else {
            localStorage.setItem('patterns', JSON.stringify({
                ...JSON.parse(storedPatterns),
                [pattern.individual.value]: pattern
            }));
        }

        setSelectedPatterns({
            ...selectedPatterns,
            [pattern.individual.value]: pattern
        })
        enqueueSnackbar("Pattern successfully added.", { variant: 'success' });
    };

    const deleteFromLocalstorage = (pattern) => {
        let newSelectedPatterns = {...selectedPatterns};
        delete newSelectedPatterns[pattern.individual.value];
        setSelectedPatterns(newSelectedPatterns);
        localStorage.setItem('patterns', JSON.stringify(newSelectedPatterns));
        enqueueSnackbar("Pattern successfully deleted.", { variant: 'success' });
    };

    const handlePatternAction = (action, pattern) => {
        switch (action) {
            case 'patternClick':
                handlePatternClick(pattern);
                break;
            case 'patternDelete':
                deleteFromLocalstorage(pattern);
                break;
            case 'patternStore':
                storeInLocalstorage(pattern);
                break;
            default:
                console.error('No action defined for this handler.');
        }
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
                        <PatternCard 
                            pattern={pattern} 
                            handlePatternAction={handlePatternAction} 
                            selectedPatterns={selectedPatterns}
                            cardSize={3}
                        />
                    ))}
                </Grid>
            )
        }
    };

    const getPatternLabelSafe = (key) => {
        if (ontologyClasses[key]["label"] && ontologyClasses[key]["label"]["value"]) return ontologyClasses[key]["label"]["value"];
        return false;
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
                                <ListItem key={key}>
                                    <ListItemIcon>
                                        <Tooltip title="Delete class filter">
                                            <IconButton onClick={() => deleteClassFromSelection(selectorStates[key])}>
                                                <ClearIcon/>
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={getPatternLabelSafe(key) || selectorStates[key]}
                                    />
                                </ListItem>
                            )
                        } else return <div/>
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
                        <Typography className={classes.marginBottomClass} variant="h6">Corresponding patterns proposed by papers</Typography>
                        {displayPatterns()}
                    </Paper>
                </Grid>
            </Grid>
            <PatternModal open={modalStates['pattern']} setOpen={(newOpen) => setModalStates({ ...modalStates, 'pattern': newOpen})} pattern={currentPattern} />
        </ContentContainer>
    );
}