import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { styled } from '@mui/material/styles';
import ContentContainer from '../layouts/ContentContainer';
import HealthCheck from '../components/HealthCheck';
import { useSnackbar } from 'notistack';
import { getLocalStoragePatterns, parseToLabel } from '../libs/helpers';
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
    const [patternClassTree, setPatternClassTree] = useState({});
    const [currentPattern, setCurrentPattern] = useState({});
    const [modalStates, setModalStates] = useState({ "pattern": false });
    const [classFilter, setClassFilter] = useState([]);
    const [open, setOpen] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const handlePatternModalAction = (action, pattern) => {
        switch (action) {
            case 'remove':
                deleteFromLocalstorage(pattern);
                setModalStates({ ...modalStates, 'pattern': false});
                break;
            default:
                console.error('No handler for this action.');
        }
    }

    useEffect(() => {
        setOpen(true);
        getClassTree("onto:Pattern")
            .then(classes => {
                setPatternClassTree(classes);
                getPatternsWithCat(classes);
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
        let patterns = getLocalStoragePatterns();
        if (patterns) setSelectedPatterns(addCatsToPatterns(patterns, classTree));
        else enqueueSnackbar('Error while retrieving patterns.');
    };

    const Input = styled('input')({
        display: 'none',
    });

    const exportToJSON = async () => {
        const json = JSON.stringify({...selectedPatterns});
        const blob = new Blob([json],{type:'application/json'});
        const href = await URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = "patterns.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const deleteAllLocalstorage = () => {
        localStorage.setItem('patterns', JSON.stringify({}));
        setSelectedPatterns({});
    };

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

    const importFromJSON = e => {
        e.preventDefault()
        const reader = new FileReader()
        reader.onload = async (e) => { 
            localStorage.clear();
            const text = (e.target.result)
            // must verify later that json provided is correct
            const jsonPatterns = JSON.parse(text);
            localStorage.setItem('patterns', JSON.stringify(jsonPatterns));
            setSelectedPatterns(jsonPatterns)
        };
        reader.readAsText(e.target.files[0])
    }

    const handlePatternClick = (pattern) => {
        getLinkedPatterns(pattern.individual.value)
            .then(links => {
                setCurrentPattern({
                    ...pattern,
                    'linkedPatterns': links
                });
                setModalStates({
                    "pattern": true
                })
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
                                    <Input accept="*.json" id="import-pattern-input" type="file" onChange={importFromJSON} />
                                    <Button fullWidth variant="contained" component="span">
                                        Import
                                    </Button>
                                </label>
                            </Grid>
                            <Grid item xs={6} style={{marginTop: '10px', paddingLeft: '5px'}}>
                                <Button fullWidth variant="contained" onClick={exportToJSON}>
                                    Export
                                </Button>
                            </Grid>
                            <Grid item xs={12} style={{marginTop: '10px'}}>
                                <Button variant="contained" color="error" fullWidth onClick={() => deleteAllLocalstorage()}>
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
                open={modalStates['pattern']} 
                setOpen={(newOpen) => setModalStates({ ...modalStates, 'pattern': newOpen})} 
                pattern={currentPattern} 
                selectedPatterns={selectedPatterns}
                handlePatternModalAction={handlePatternModalAction}
            />
            <LoadingOverlay open={open} />
        </ContentContainer>
    );
}