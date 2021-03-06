import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { styled } from '@mui/material/styles';
import ContentContainer from '../layouts/ContentContainer';
import HealthCheck from '../components/HealthCheck';
import { useSnackbar } from 'notistack';
import { 
    getFromLocalstorage, 
    storePatternInLocalstorage, 
    setInLocalstorage, 
    setPatternsFromJSON,
    deleteAllLocalstoragePatterns
} from '../libs/localstorage';
import { parseToLabel, exportToJSON } from '../libs/helpers';
import { getClassTree, getLinkedPatterns, getPatterns } from '../libs/fuseki';
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

const Input = styled('input')({
    display: 'none',
});

export default function Patterns({ setNbPatterns }) {
    const classes = useStyles();
    const [selectedPatterns, setSelectedPatterns] = useState({});
    const [modalStates, setModalStates] = useState({ "pattern": {}, open: false });
    const [classFilter, setClassFilter] = useState([]);
    const [open, setOpen] = useState(false);
    const [patterns, setPatterns] = useState([])
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
        setNbPatterns(Object.keys(selectedPatterns).length);
    }, [selectedPatterns]);

    useEffect(() => {
        getStoredPatterns();
    
        getPatterns()
            .then((results) => {
                setPatterns(results);
            })
            .finally(() => setOpen(false));
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
        let patterns = getFromLocalstorage('patterns');
        if (patterns) setSelectedPatterns(addCatsToPatterns(patterns, classTree));
        else {
            enqueueSnackbar('Error while retrieving patterns.');
            setInLocalstorage('patterns', {});
        }
    };

    const addCatsToPatterns = (patterns, classTree) => {
        const patternsKeys = Object.keys(patterns);
        patternsKeys.forEach(key => {
            let patternClass = patterns[key].pattern;
            let patternClassTree = [];

            while(classTree[patternClass] && classTree[patternClass]['parent']) {
                patternClassTree.push(parseToLabel(patternClass));
                patternClass = classTree[patternClass]['parent'];
            }

            patterns[key]['classtree'] = patternClassTree;
        });

        return patterns;
    }

    const handlePatternClick = async (pattern, selectedTab = 0) => {
        for (let i in pattern.individuals) {
            let linkedPatterns = await getLinkedPatterns(pattern.individuals[i].individual);
            pattern.individuals[i] = {
               ...pattern.individuals[i],
               linkedPatterns
            }
        }

        setModalStates({
            open: true,
            selectedTab,
            pattern
        })
    }

    const handleIndividualClick = (individual) => {
        Object.keys(patterns).forEach(key => {
            const pattern = patterns[key];
            pattern.individuals.forEach((pIndividual, i) => {
                if (individual.individual === pIndividual.individual) {
                    handlePatternClick(pattern, i);
                }
            }) 
        })
    };

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
        delete newSelectedPatterns[pattern.individual];
        setSelectedPatterns(newSelectedPatterns);
        setInLocalstorage('patterns', newSelectedPatterns);
        enqueueSnackbar("Pattern successfully deleted.", { variant: 'success' });
    };

    const handlePatternAction = (action, pattern) => {
        switch (action) {
            case 'linkedPatternClick':
                handleIndividualClick(pattern);
                break;
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

    const importJSONPatterns = async (e) => {
        e.preventDefault();
        const newPatterns = await setPatternsFromJSON(e.target.files[0]);
        setSelectedPatterns(newPatterns);
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
                                        onChange={importJSONPatterns} />
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
                            {Object.keys(selectedPatterns).length ? Object.keys(selectedPatterns).length : "No"} proposed pattern{Object.keys(selectedPatterns).length > 1 ? 's' : ''} in my list
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
                                            isIndividual
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