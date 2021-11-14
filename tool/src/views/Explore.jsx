import React, { useState, useEffect } from 'react';
import { Paper, Grid, Typography, Divider, List, ListItem, ListItemText, ListItemIcon, IconButton, Tooltip, Pagination, TextField } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { makeStyles } from '@mui/styles';
import ContentContainer from '../layouts/ContentContainer';
import HealthCheck from '../components/HealthCheck';
import { getSubclasses, getPatterns, getLinkedPatterns } from '../libs/fuseki';
import ClassTabs from '../components/ClassTabs';
import RefreshIcon from '@mui/icons-material/Refresh';
import PatternModal from '../modals/PatternModal';
import { useSnackbar } from 'notistack';
import { 
    getLocalstoragePatterns, 
    setPatternsInLocalstorage, 
    storePatternInLocalstorage 
} from '../libs/localstorage';
import {
    parseToLabel
} from '../libs/helpers';
import PatternCard from '../components/PatternCard';
import LoadingOverlay from '../components/LoadingOverlay';

const useStyles = makeStyles(() => ({
    section: {
        padding: '20px'
    },
    healthCheck: {
        fontSize: '120%',
    },
    marginBottomClass: {
        marginBottom: '25px'
    },
    smallMarginTopClass: {
        marginTop: '5px'
    },
    bigMarginTopClass: {
        marginTop: '25px'
    },
    patternSpacing: {
        marginTop: '25px',
        marginBottom: '30px'
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
    const [modalStates, setModalStates] = useState({ "pattern": {}, open: false });
    const [open, setOpen] = useState(false);
    const [selectedPatterns, setSelectedPatterns] = useState({});
    const [nbPatterns, setNbPatterns] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const { enqueueSnackbar } = useSnackbar();

    // pagination interval
    const INTERVAL = 20;

    const filterParents = (filterClasses) => {
        let keyClasses = Object.keys(filterClasses);
    
        for (let i in keyClasses) {
            let key = keyClasses[i]
            if (filterClasses[filterClasses[key]]) {
                delete filterClasses[key];
            }
        }
    
        return filterClasses;
    }

    useEffect(() => {
        setOpen(true);

        // not a big deal if loading is finished before displaying the number of patterns
        getPatterns()
        .then((results) => {
            setNbPatterns(results.length)
        })

        getPatterns(filterParents({...selectorStates}))
            .then((results) => {
                setPatterns(results);
            })
            .finally(() => setOpen(false));
    }, [selectorStates]);

    useEffect(() => {
        setPage(1);
    }, [search, selectorStates]);

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
        let patterns = getLocalstoragePatterns();
        if (patterns) setSelectedPatterns(patterns);
        else {
            enqueueSnackbar('Error while retrieving patterns.');
            setPatternsInLocalstorage({});
        }
    }, [])

    const handlePatternClick = (pattern) => {
        getLinkedPatterns(pattern.individual.value)
            .then(links => {
                setModalStates({
                    open: true,
                    pattern: {
                      ...pattern,
                      linkedPatterns: links
                    }
                })
            })
    }

    const storeLocalPattern = (pattern) => {
        storePatternInLocalstorage(pattern);

        setSelectedPatterns({
            ...selectedPatterns,
            [pattern.individual.value]: pattern
        })
        enqueueSnackbar("Pattern successfully added.", { variant: 'success' });
    };

    const deleteLocalPattern = (pattern) => {
        let newSelectedPatterns = {...selectedPatterns};
        delete newSelectedPatterns[pattern.individual.value];
        setSelectedPatterns(newSelectedPatterns);
        setPatternsInLocalstorage(newSelectedPatterns);
        enqueueSnackbar("Pattern successfully deleted.", { variant: 'success' });
    };

    const handlePatternAction = (action, pattern) => {
        switch (action) {
            case 'patternClick':
                handlePatternClick(pattern);
                break;
            case 'patternDelete':
                deleteLocalPattern(pattern);
                break;
            case 'patternStore':
                storeLocalPattern(pattern);
                break;
            default:
                console.error('No action defined for this handler.');
        }
    };

    const getFilteredPatterns = () => {
        return patterns
            .filter(
                p => p.label.value
                    .toLowerCase()
                    .includes(search.toLowerCase()));
    };

    const displayPatterns = () => {
        if (patterns.length) {
            return (
                <Grid container className={classes.patternSpacing}>
                    <TextField
                        id="searchbar-textfield"
                        label="Search a specific pattern ..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Type the pattern name"
                        fullWidth
                    />
                    <br/>
                    {getFilteredPatterns()
                        .slice((page - 1) * INTERVAL, page * INTERVAL)
                        .map(pattern => (
                            <PatternCard 
                                pattern={pattern} 
                                handlePatternAction={handlePatternAction} 
                                selectedPatterns={selectedPatterns}
                                cardSize={3}
                                key={pattern.individual.value}
                                disableChips={true}
                                patternSubtext={[{
                                    text: parseToLabel(pattern.paper.value),
                                    variant: 'body2'
                                }]}
                            />
                    ))}
                </Grid>
            )
        } else return <div/>;
    };

    const getPatternLabelSafe = (key) => {
        if (ontologyClasses[key]["label"] && ontologyClasses[key]["label"]["value"]) return ontologyClasses[key]["label"]["value"];
        return false;
    };

    const displaySelectedClasses = () => {
        if (Object.keys(selectorStates).length === 0) {
            return (
                <Typography variant="h6" className={classes.bigMarginTopClass}>
                    No filters selected yet.
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

    const handlePageChange = (e, page) => {
        setPage(page);
    }
    return (
        <ContentContainer>
            <HealthCheck className={classes.healthCheck} variant="overline" component="div" />
            <Grid container spacing={2} className={classes.smallMarginTopClass}>
                <Grid item md={4} xs={12}>
                    <Grid item className={classes.marginBottomClass} md={12}>
                        <Paper className={classes.section}>
                            <div className={classes.classTitleContainer}>
                                <Typography className={classes.classTitle} variant="h5">Filters selection</Typography>
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
                            <Typography className={classes.marginBottomClass} variant="h5">Selected filters</Typography>
                            <Divider />
                            {displaySelectedClasses()}
                        </Paper>
                    </Grid>
                </Grid>
                <Grid item md={8} xs={12}>
                    <Paper className={classes.section}>
                        <Typography variant="h5">
                            {
                                open 
                                ? "Loading patterns ..."
                                : (patterns.length ? `${patterns.length}/${nbPatterns}` : "No") + " corresponding patterns for this selection"
                            }
                        </Typography>
                        {displayPatterns()}
                        <Pagination 
                            count={Math.ceil(getFilteredPatterns().length / INTERVAL)} 
                            size="large"
                            onChange={handlePageChange}
                            style={{display: (patterns.length ? 'block' : 'none')}}
                            page={page}
                        />
                    </Paper>
                </Grid>
            </Grid>
            <PatternModal 
                modalStates={modalStates}
                setModalStates={setModalStates}
                selectedPatterns={selectedPatterns}
                handlePatternModalAction={handlePatternAction}
            />
            <LoadingOverlay open={open}/>
        </ContentContainer>
    );
}