import React, { useState, useEffect } from 'react';
import { Paper, Grid, Typography, Divider, List, ListItem, ListItemText, ListItemIcon, IconButton, Tooltip, Card, Link } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { makeStyles } from '@mui/styles';
import ContentContainer from '../layouts/ContentContainer';
import HealthCheck from '../components/HealthCheck';
import { getSubclasses, getPatterns } from '../requests/fuseki';
import ClassTabs from '../components/ClassTabs';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import PatternModal from '../modals/PatternModal';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { useSnackbar } from 'notistack';
import { getLocalStoragePatterns } from '../requests/helpers';

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
        setSelectedPatterns(getLocalStoragePatterns())
    }, [])

    const handlePatternClick = (pattern) => {
        setCurrentPattern(pattern);
        setModalStates({
            "pattern": true
        })
    }

    const storeInLocalstorage = (pattern) => {
        localStorage.setItem(pattern.individual.value, JSON.stringify(pattern));
        setSelectedPatterns({
            ...selectedPatterns,
            [pattern.individual.value]: pattern
        })
        enqueueSnackbar("Pattern successfully added.", { variant: 'success' });
    };

    const deleteFromLocalstorage = (pattern) => {
        localStorage.removeItem(pattern.individual.value);
        let newSelectedPatterns = {...selectedPatterns};
        delete newSelectedPatterns[pattern.individual.value];
        setSelectedPatterns(newSelectedPatterns);
        enqueueSnackbar("Pattern successfully deleted.", { variant: 'success' });
    };

    const patternInLocalstorage = (pattern) => {
        return (pattern && pattern['individual'] && selectedPatterns[pattern.individual.value]);
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
                        <Grid item xs={4} className={classes.patternItem} key={pattern['individual']['value']}>
                            <Card className={classes.patternCard}>
                                <Grid container>
                                    <Grid item md={9} sm={12}>
                                        <Typography>
                                            <Link style={{cursor: 'pointer'}} onClick={() => handlePatternClick(pattern)}>
                                                {pattern.label.value}
                                            </Link>
                                        </Typography>
                                        <Typography variant="overline">
                                            {(pattern['paper'].value.split(':'))[1]}
                                        </Typography>
                                    </Grid>
                                    <Grid item md={3} sm={12}>
                                            {patternInLocalstorage(pattern) 
                                                ? 
                                                    (
                                                        <Tooltip title={"Delete pattern from my list"}>
                                                            <IconButton onClick={() => deleteFromLocalstorage(pattern)}>
                                                                <DeleteSweepIcon fontSize="large" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )
                                                : 
                                                    (
                                                        <Tooltip title={"Add pattern to my list"}>
                                                            <IconButton onClick={() => storeInLocalstorage(pattern)}>
                                                                <PlaylistAddIcon fontSize="large" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )
                                            } 
                                    </Grid>
                                </Grid>
                            </Card>
                        </Grid>
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