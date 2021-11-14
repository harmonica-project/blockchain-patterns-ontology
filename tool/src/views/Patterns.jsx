import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { styled } from '@mui/material/styles';
import ContentContainer from '../layouts/ContentContainer';
import HealthCheck from '../components/HealthCheck';
import { useSnackbar } from 'notistack';
import { 
    getLocalstoragePatterns, 
    storePatternInLocalstorage, 
    setPatternsInLocalstorage, 
    setPatternsFromJSON,
    deleteAllLocalstoragePatterns
} from '../libs/localstorage';
import { parseToLabel, exportToJSON } from '../libs/helpers';
import { getClassTree, getLinkedPatterns } from '../libs/fuseki';
import PatternCard from '../components/PatternCard';
import PatternModal from '../modals/PatternModal';
import ClassChipSelector from '../components/ClassChipSelector';
import LoadingOverlay from '../components/LoadingOverlay';

const useStyles = makeStyles(() => ({
    healthCheck: {
        fontSize: '120%',
    },
    paperContent: {
        padding: '20px',
        margin: '5px'
    },
    controlBtns: {
        textAlign: "right",
        "& button": {
            marginLeft: '10px'
        }
    },
    marginTop: {
        marginTop: '20px'
    },
}));

export default function Patterns() {
    const classes = useStyles();
    const [selectedPatterns, setSelectedPatterns] = useState({});
    const [modalStates, setModalStates] = useState({ "pattern": {}, open: false });
    const [classFilter, setClassFilter] = useState([]);
    const [open, setOpen] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const getStoredPatterns = () => {
        setOpen(true);
        getClassTree("onto:Pattern")
            .then(classes => {
                getPatternsWithCat(classes);
            })
            .finally(() => setOpen(false));
    };

    useEffect(() => {
        getStoredPatterns();
    }, []);

    const getAllClassesFromTrees = () => {
        let classes = [];
        let foundClasses = {};

        Object.keys(selectedPatterns).forEach(key => {
            if (selectedPatterns[key]['classtree']) {
                selectedPatterns[key]['classtree'].forEach(singleClass => {
                    if (!foundClasses[singleClass]) {
                        classes.push(singleClass);
                        foundClasses[singleClass] = true;
                    }
                })
            }
        });

        return classes;
    };

    const getPatternsWithCat = (classTree) => {
        let patterns = getLocalstoragePatterns();
        if (patterns) setSelectedPatterns(addCatsToPatterns(patterns, classTree));
        else {
            enqueueSnackbar('Error while retrieving patterns.');
            setPatternsInLocalstorage({});
        }
    };

    const Input = styled('input')({
        display: 'none',
    });

    const addCatsToPatterns = (patterns, classTree) => {
        const patternsKeys = Object.keys(patterns);
        patternsKeys.forEach(key => {
            let patternClass = patterns[key].patternclass.value;
            let patternClassTree = [];

            while(classTree[patternClass] && classTree[patternClass]['parent']) {
                patternClassTree.push(parseToLabel(patternClass));
                patternClass = classTree[patternClass]['parent'];
            }

            patterns[key]['classtree'] = patternClassTree;
        });

        return patterns;
    }

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
                getStoredPatterns();
                break;
            default:
                console.error('No action defined for this handler.');
        }
    };

    const genDisplayedPatterns = (patterns) => {
        if (!classFilter.length) return patterns;

        const displayedPatterns = {};

        Object.keys(patterns).forEach(key => {
            let pattern = patterns[key];
            if (pattern && pattern['classtree']) {
                let isIncluded = true;

                for (let i in classFilter) {
                    if (!pattern['classtree'].includes(classFilter[i])) {
                        isIncluded = false;
                        break;
                    }
                };

                if (isIncluded) displayedPatterns[key] = pattern;
            }
        });

        return displayedPatterns;
    };

    return (
        <ContentContainer>
            <HealthCheck className={classes.healthCheck} variant="overline" component="div" />
            <Grid container>
                <Grid item sm={3} xs={12}>
                    <Paper className={classes.paperContent}>
                        <Typography variant="h5" >
                            Filters
                        </Typography>
                        <Grid container className={classes.marginTop}>
                            <Grid item xs={12}>
                                <ClassChipSelector
                                    classes={getAllClassesFromTrees(selectedPatterns)}
                                    classFilter={classFilter}
                                    setClassFilter={setClassFilter}
                                />
                            </Grid>
                            <Grid item xs={6} style={{marginTop: '10px', paddingRight: '5px'}}>
                                <label htmlFor="import-pattern-input">
                                    <Input 
                                        accept="*.json" 
                                        id="import-pattern-input" 
                                        type="file" 
                                        onChange={async e => {
                                            const newSelectedPatterns = await setPatternsFromJSON(e);
                                            setSelectedPatterns(newSelectedPatterns);
                                        }} />
                                    <Button fullWidth variant="contained" component="span">
                                        Import
                                    </Button>
                                </label>
                            </Grid>
                            <Grid item xs={6} style={{marginTop: '10px', paddingLeft: '5px'}}>
                                <Button fullWidth variant="contained" onClick={exportToJSON.bind(this, {...selectedPatterns}, 'patterns.json')}>
                                    Export
                                </Button>
                            </Grid>
                            <Grid item xs={12} style={{marginTop: '10px'}}>
                                <Button 
                                    variant="contained" 
                                    color="error" 
                                    fullWidth 
                                    onClick={() => {
                                        deleteAllLocalstoragePatterns();
                                        setSelectedPatterns({})
                                    }
                                }>
                                    Delete all patterns
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={9}>
                    <Paper className={classes.paperContent}>
                        <Typography variant="h5" >
                            {Object.keys(selectedPatterns).length ? Object.keys(selectedPatterns).length : "No"} patterns in my list
                        </Typography>
                        <Grid container className={classes.marginTop}>
                            {
                                Object.keys(selectedPatterns).length
                                ? (
                                    Object.keys(genDisplayedPatterns(selectedPatterns)).map(key => (
                                        <PatternCard 
                                            pattern={selectedPatterns[key]} 
                                            selectedPatterns={selectedPatterns} 
                                            handlePatternAction={handlePatternAction}
                                            cardSize={4} 
                                            disableButtons={true}
                                            key={key}
                                        />
                                    ))
                                )
                                : (
                                    <Typography variant="h6" className={classes.bigMarginTopClass}>
                                        You can select some patterns in the Explore section.
                                        They will then be displayed in this section.
                                    </Typography>
                                )
                            }
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
            <PatternModal 
                modalStates={modalStates}
                setModalStates={setModalStates}
                selectedPatterns={selectedPatterns}
                handlePatternModalAction={handlePatternAction}
            />
            <LoadingOverlay open={open} />
        </ContentContainer>
    );
}