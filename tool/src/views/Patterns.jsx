import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { styled } from '@mui/material/styles';
import ContentContainer from '../layouts/ContentContainer';
import HealthCheck from '../components/HealthCheck';
import { useSnackbar } from 'notistack';
import { getLocalStoragePatterns } from '../libs/helpers';
import { getPatternClasses } from '../libs/fuseki';

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
}));

export default function Patterns() {
    const classes = useStyles();
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
        let patterns = getLocalStoragePatterns();
        if (patterns) setSelectedPatterns(patterns);
        else enqueueSnackbar('Error while retrieving patterns.')
        orderPatternsByCat()
    }, [])
    
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

    const deleteFromLocalstorage = (pattern) => {
        let newSelectedPatterns = {...selectedPatterns};
        delete newSelectedPatterns[pattern.individual.value];
        setSelectedPatterns(newSelectedPatterns);
        localStorage.setItem('patterns', JSON.stringify(newSelectedPatterns));
        enqueueSnackbar("Pattern successfully deleted.", { variant: 'success' });
    };

    const deleteAllLocalstorage = () => {
        localStorage.setItem('patterns', {});
        setSelectedPatterns({});
    };

    const patternInLocalState = (pattern) => {
        return (pattern && pattern['individual'] && selectedPatterns[pattern.individual.value]);
    };

    const orderPatternsByCat = () => {
        getPatternClasses()
        const orderedPatterns = {}
        Object.keys(selectedPatterns).forEach(key => {
            orderedPatterns[selectedPatterns[key].classuri.value] = selectedPatterns[key];
        })

        // console.log(orderedPatterns)
    }

    const importFromJSON = e => {
        e.preventDefault()
        const reader = new FileReader()
        reader.onload = async (e) => { 
            localStorage.clear();
            const text = (e.target.result)
            // must verify later that json provided is correct
            const jsonPatterns = JSON.parse(text);
            Object.keys(jsonPatterns).forEach(key => {
                localStorage.setItem(key, JSON.stringify(jsonPatterns[key]));
            });
            setSelectedPatterns(jsonPatterns)
        };
        reader.readAsText(e.target.files[0])
    }

    return (
        <ContentContainer>
            <HealthCheck className={classes.healthCheck} variant="overline" component="div" />
            <Paper className={classes.content}>
                <Grid container>
                    <Grid container>
                        <Grid item xs={4}>
                            <Typography variant="h6" >
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
                    <Grid container>
                        <ul>
                            {
                                Object.keys(selectedPatterns).map(key => (
                                    <li key={selectedPatterns[key]['individual']['value']}>{selectedPatterns[key]['label']['value']}</li>
                                ))
                            }
                        </ul>
                    </Grid>
                </Grid>
            </Paper>
        </ContentContainer>
    );
}