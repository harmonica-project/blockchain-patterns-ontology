import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { styled } from '@mui/material/styles';
import ContentContainer from '../layouts/ContentContainer';
import HealthCheck from '../components/HealthCheck';
import { useSnackbar } from 'notistack';
import { getLocalStoragePatterns, parseToLabel } from '../libs/helpers';
import { getPatternClasses } from '../libs/fuseki';
import PatternCard from '../components/PatternCard';
import PatternModal from '../modals/PatternModal';

const useStyles = makeStyles(() => ({
    healthCheck: {
        fontSize: '120%',
    },
    content: {
        padding: '20px'
    },
    controlBtns: {
        textAlign: "right",
        "& button": {
            marginLeft: '10px'
        }
    },
    containerPatterns: {
        marginTop: '20px'
    }
}));

export default function Patterns() {
    const classes = useStyles();
    const [selectedPatterns, setSelectedPatterns] = useState({});
    const [patternClassTree, setPatternClassTree] = useState({});
    const [currentPattern, setCurrentPattern] = useState({});
    const [modalStates, setModalStates] = useState({ "pattern": false });

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
        getPatternClasses()
            .then(classes => {
                setPatternClassTree(classes);
                getPatternsWithCat(classes);
            })
    }, [])
    
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
            let patternClass = patterns[key].classuri.value;
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

    return (
        <ContentContainer>
            <HealthCheck className={classes.healthCheck} variant="overline" component="div" />
            <Paper className={classes.content}>
                <Grid container>
                    <Grid container>
                        <Grid item xs={4}>
                            <Typography variant="h5" >
                                My patterns
                            </Typography>
                        </Grid>
                        <Grid item xs={8} className={classes.controlBtns}>
                            <label htmlFor="import-pattern-input">
                                <Input accept="*.json" id="import-pattern-input" type="file" onChange={importFromJSON} />
                                <Button variant="contained" component="span">
                                    Import
                                </Button>
                            </label>
                            <Button variant="contained" onClick={exportToJSON}>
                                Export
                            </Button>
                            <Button variant="contained" color="error" onClick={() => deleteAllLocalstorage()}>
                                Delete all patterns
                            </Button>
                        </Grid>
                    </Grid>
                    <Grid container className={classes.containerPatterns}>
                        {
                            Object.keys(selectedPatterns).length
                            ? (
                                Object.keys(selectedPatterns).map(key => (
                                    <PatternCard 
                                        pattern={selectedPatterns[key]} 
                                        selectedPatterns={selectedPatterns} 
                                        handlePatternAction={handlePatternAction}
                                        cardSize={3} 
                                        disableButtons={true}
                                        key={key}
                                    />
                                ))
                            )
                            : (
                                <Typography variant="h6" className={classes.bigMarginTopClass}>
                                    No patterns yet in this list. You can add some in the <i>Explore</i> or <i>Get recommendation</i> section.
                                </Typography>
                            )
                        }
                    </Grid>
                </Grid>
            </Paper>
            <PatternModal 
                open={modalStates['pattern']} 
                setOpen={(newOpen) => setModalStates({ ...modalStates, 'pattern': newOpen})} 
                pattern={currentPattern} 
                selectedPatterns={selectedPatterns}
                handlePatternModalAction={handlePatternModalAction}
            />
        </ContentContainer>
    );
}