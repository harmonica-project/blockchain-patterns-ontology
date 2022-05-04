import React, { useState, useEffect } from 'react';
import { Paper, Grid, Typography, Divider, List, ListItem, ListItemText, ListItemIcon, IconButton, Tooltip, Pagination, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { makeStyles } from '@mui/styles';
import ContentContainer from '../layouts/ContentContainer';
import HealthCheck from '../components/HealthCheck';
import { getPatternKnowledge, getClassTree } from '../libs/fuseki';
import ClassTabs from '../components/ClassTabs';
import RefreshIcon from '@mui/icons-material/Refresh';
import PatternModal from '../modals/PatternModal';
import { useSnackbar } from 'notistack';
import { 
    getFromLocalstorage, 
    setInLocalstorage, 
    storePatternInLocalstorage 
} from '../libs/localstorage';
import PatternCard from '../components/PatternCard';
import LoadingOverlay from '../components/LoadingOverlay';

const colorRange = [
    '#ec644f',
    '#F0884E',
    '#f3a64d',
    '#E8BB41',
    '#e1c73a',
    '#C3CA37',
    '#9ecd34',
    '#79BD2F',
    '#5baf2a'
];

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

export default function Explore({ setNbPatterns }) {
    const classes = useStyles();
    const [classTree, setClassTree] = useState({});
    const [patterns, setPatterns] = useState([])
    const [selectorStates, setSelectorStates] = useState({});
    const [open, setOpen] = useState(false);
    const [orderPattern, setOrderPattern] = useState('citation-desc');
    const [selectedPatterns, setSelectedPatterns] = useState({});
    const [filteredPatterns, setFilteredPatterns] = useState([]);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [modalStates, setModalStates] = useState({ 
        "pattern": {},
        open: false,
        selectedTab: {
            variant: 0,
            proposal: -1
        }
    });
    const { enqueueSnackbar } = useSnackbar();

    // pagination interval
    const INTERVAL = 20;
    
    useEffect(() => {
        setOpen(true);
        getPatternKnowledge()
            .then((results) => {
                setPatterns(results);
                console.log(results)
            })
            .finally(() => setOpen(false));

        getClassTree('owl:Thing')
            .then((results) => {
                setClassTree(results);
            })
    }, []);

    useEffect(() => {
        setFilteredPatterns(getFilteredPatterns());
    }, [patterns]);

    useEffect(() => {
        setPage(1);
        setFilteredPatterns(getFilteredPatterns());
    }, [search, selectorStates, orderPattern]);

    useEffect(() => {
        setNbPatterns(Object.keys(selectedPatterns).length);
    }, [selectedPatterns]);

    useEffect(() => {
        let patterns = getFromLocalstorage('patterns');
        if (patterns) setSelectedPatterns(patterns);
        else {
            enqueueSnackbar('Error while retrieving patterns.');
            setInLocalstorage('patterns', {});
        }
    }, [])

    const handlePatternClick = async (pattern, selectedTab = 0) => {
        setModalStates({
            open: true,
            selectedTab: {
                variant: selectedTab,
                proposal: -1
            },
            pattern
        })
    }

    const handleVariantRelationClick = (clickedVariant) => {
        Object.keys(patterns).forEach(pKey => {
            const pattern = patterns[pKey];
            Object.keys(pattern.variants).forEach((vKey, i) => {
                if (vKey === clickedVariant.variant.value) {
                    handlePatternClick(pattern, i);
                }
            }) 
        })
    };

    const storeLocalPattern = (proposal) => {
        storePatternInLocalstorage(proposal);

        setSelectedPatterns({
            ...selectedPatterns,
            [proposal.proposal]: proposal
        })
        enqueueSnackbar("Pattern successfully added.", { variant: 'success' });
    };

    const deleteLocalPattern = (proposal) => {
        let newSelectedPatterns = {...selectedPatterns};
        delete newSelectedPatterns[proposal.proposal];
        setSelectedPatterns(newSelectedPatterns);
        setInLocalstorage('patterns', newSelectedPatterns);
        enqueueSnackbar("Pattern successfully deleted.", { variant: 'success' });
    };

    const handlePatternAction = (action, individual) => {
        switch (action) {
            case 'linkedVariantClick':
                handleVariantRelationClick(individual);
                break;
            case 'patternClick':
                handlePatternClick(individual);
                break;
            case 'patternDelete':
                deleteLocalPattern(individual);
                break;
            case 'patternStore':
                storeLocalPattern(individual);
                break;
            default:
                console.error('No action defined for this handler.');
        }
    };

    const selectorStatesToArray = () => {
        let selectors = {...selectorStates};

        Object.keys(selectors).forEach(key => {
            if (selectors[selectors[key]]) delete selectors[key];
        });

        return Object.keys(selectors).map(key => selectors[key]);
    };

    const selectorInProposal = (selector, proposal) => {
        if (proposal.classes.includes(selector)) return true;
        else {
            if (classTree[selector].childrens.length) {
                for (let i in classTree[selector].childrens) {
                    if (selectorInProposal(classTree[selector].childrens[i], proposal)) return true;
                }

                return false;
            }
        }
    };

    const filterProposals = (key) => {
        let newPattern = structuredClone(patterns[key]);
        Object.keys(patterns[key].variants).forEach(variant => {
            Object.keys(patterns[key].variants[variant].proposals).forEach(proposal => {
                selectorStatesToArray().forEach(selector => {
                    if (!selectorInProposal(selector, patterns[key].variants[variant].proposals[proposal])) {
                        delete newPattern.variants[variant].proposals[proposal];
                    }
                });
            });
            
            if (!Object.keys(newPattern.variants[variant].proposals).length) {
                delete newPattern.variants[variant];
            }
        });

        return Object.keys(newPattern.variants).length ? [newPattern] : [];
    };

    const sortPatterns = (a, b) => {
        switch (orderPattern) {
            case 'alphabetical-asc':
                return a.label < b.label ? -1 : 1;

            case 'alphabetical-desc':
                return a.label > b.label ? -1 : 1;
                
            case 'citation-asc':
                if (a.citations < b.citations) return -1;
                if (a.citations > b.citations) return 1;
                return 0;

            case 'citation-desc':
                if (a.citations > b.citations) return -1;
                if (a.citations < b.citations) return 1;
                return 0;

            default:
                if (a.citations > b.citations) return -1;
                if (a.citations < b.citations) return 1;
                return 0;
        }
    }

    const getFilteredPatterns = () => {
        if (patterns) {
            return Object.keys(patterns)
                .filter(key => patterns[key].label.toLowerCase().includes(search.toLowerCase()))
                .flatMap(filterProposals)
                .sort(sortPatterns)
        }
    };

    const getPatternStats = (pattern) => {
        const nbVariants = Object.keys(pattern.variants).length;
        let nbProposals = 0;

        Object.keys(pattern.variants).forEach(key => {
            nbProposals += Object.keys(pattern.variants[key].proposals).length;
        });

        if (nbVariants) {
            if (nbProposals) {
                return `${nbVariants} variant${nbVariants > 1 ? 's' : ''} / ${nbProposals} proposal${nbProposals > 1 ? 's' : ''}`;
            }

            return `${nbVariants} variant${nbVariants > 1 ? 's' : ''} / No proposals.`;
        }

        return `No variants and proposals.`;
    }

    const displayPatterns = () => {
        if (Object.keys(patterns).length) {
            return (
                <Grid container className={classes.patternSpacing} spacing={1}>
                    <Grid item xs={9}>
                        <TextField
                            id="searchbar-textfield"
                            label="Search a specific pattern ..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Type the pattern name"
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={3} sx={{ textAlign: 'center' }}>
                        <FormControl variant="standard" sx={{ width: '90%'}} >
                            <InputLabel id="order-select-label">Order by</InputLabel>
                                <Select
                                    labelId="order-select-label"
                                    id="order-select"
                                    value={orderPattern}
                                    onChange={(e) => {
                                        console.log(e.target.value)
                                        setOrderPattern(e.target.value);
                                    }}
                                    label="Order by"
                                >
                                <MenuItem value={'alphabetical-asc'}>A-Z (asc.)</MenuItem>
                                <MenuItem value={'alphabetical-desc'}>A-Z (asc.)</MenuItem>
                                <MenuItem value={'citation-asc'}>Nb. of citations (asc.)</MenuItem>
                                <MenuItem value={'citation-desc'}>Nb. of citations (desc.)</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <Grid container>
                            {filteredPatterns
                                .slice((page - 1) * INTERVAL, page * INTERVAL)
                                .map(pattern => (
                                    <PatternCard 
                                        pattern={pattern} 
                                        handlePatternAction={handlePatternAction}
                                        cardSize={3}
                                        key={pattern.pattern}
                                        disableChips={true}
                                        color={getPatternColor(pattern.citations)}
                                        patternSubtext={[
                                            {
                                                text: pattern.citations ? `Cited ${pattern.citations} time${pattern.citations > 1 ? 's' : ''}` : 'Not cited',
                                                variant: 'overline'
                                            },
                                            {
                                                text: getPatternStats(pattern),
                                                variant: 'body2'
                                            }
                                        ]}
                                    />
                            ))}
                        </Grid>
                    </Grid>
                </Grid>
            )
        } else return <div/>;
    };

    // logarithmic display of color citations (to avoid having all cards in red if one paper is cited a lot!)
    const getPatternColor = (citations) => {
        const maxCitations = Math.max(...Object.keys(patterns).map(key => patterns[key].citations));
        const ratio = (colorRange.length - 1) / Math.log(maxCitations);
        return citations ? colorRange[parseInt(Math.log(citations) * ratio)] : colorRange[0];
    }

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
                                        primary={classTree[selectorStates[key]].label}
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
    };

    const deleteClassFromSelection = (classname) => {
        const newSelectorStates = {...selectorStates};
        const parent = Object.keys(selectorStates).find(key => selectorStates[key] === classname);
        delete newSelectorStates[parent];

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
                            <ClassTabs classTree={classTree} handleChangeSelect={handleChangeSelect} selectorStates={selectorStates} setSelectorStates={setSelectorStates} />
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
                                : (filteredPatterns.length ? `${filteredPatterns.length}/${Object.keys(patterns).length}` : "No") + " corresponding patterns for this selection"
                            }
                        </Typography>
                        {displayPatterns()}
                        <Pagination 
                            count={Math.ceil(filteredPatterns.length / INTERVAL)} 
                            size="large"
                            onChange={handlePageChange}
                            style={{display: (Object.keys(patterns).length ? 'block' : 'none')}}
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