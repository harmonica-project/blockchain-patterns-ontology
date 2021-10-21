import React, { useState, useEffect } from 'react';
import { Paper, Grid, Typography, Divider, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { makeStyles } from '@mui/styles';
import ContentContainer from '../layouts/ContentContainer';
import HealthCheck from '../components/HealthCheck';
import { getSubclasses, getPatterns } from '../requests/fuseki';
import ClassTabs from '../components/ClassTabs';

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
  deleteIcon: {
    cursor: "pointer"
  },
  smallMarginTopClass: {
      marginTop: "5px"
  },
  bigMarginTopClass: {
    marginTop: "20px"
},
}));

export default function Explore() {
    const classes = useStyles();
    const [categories, setCategories] = useState({})
    const [selected, setSelected] = useState({})
    const [patterns, setPatterns] = useState([])

    useEffect(() => {
        getPatterns(selected)
            .then((results) => {
                setPatterns(results)
            })
    }, [selected]);

    useEffect(() => {
        getSubclasses('owl:Thing')
        .then(resClasses => {
            // simplifying notation
            resClasses = resClasses['owl:Thing']['childrens']
            let subclasses = []
            Object.keys(resClasses).forEach(key => {
            subclasses.push(getSubclasses(resClasses[key].subject.value))
            })
            Promise.all(subclasses)
            .then(resSubclass => {
                resSubclass.forEach(res => {
                let key = Object.keys(res)[0]
                resClasses[key] = {
                    ...resClasses[key],
                    "childrens": res[key].childrens
                }
                })

                // temporary, must be not hardcoded
                delete resClasses['onto:Paper']
                setCategories(resClasses);
            }) 
        })
    }, [])

    const displayPatterns = () => {
        if (!patterns.length) {
            return (
                <Typography variant="h6" className={classes.bigMarginTopClass}>
                    No patterns found for this query.
                </Typography>
            )
        } else {
            return (
                <List dense>
                    {patterns.map(pattern => (
                    <ListItem>
                        <ListItemText
                            primary={pattern.entity.value}
                        />
                    </ListItem>
                    ))}
                </List>
            )
        }
    };

    const displaySelectedClasses = () => {
        if (!patterns.length) {
            return (
                <Typography variant="h6" className={classes.bigMarginTopClass}>
                    No classes selected yet.
                </Typography>
            )
        } else {
            return (
                <List>
                    {Object.keys(selected).map(key => (
                    <ListItem>
                        <ListItemIcon>
                            <ClearIcon className={classes.deleteIcon} onClick={() => deleteClassFromSelection(key)} />
                        </ListItemIcon>
                        <ListItemText
                            primary={`${selected[key].label.value} (Parent: ${selected[key].parent.label.value})`}
                        />
                    </ListItem>
                    ))}
                </List>
            )
        }
    };

    const handleChangeSelect = (e) => {
        setSelected({
        ...selected,
        [e.target.value.subject.value]: e.target.value
        })
    };

    const deleteClassFromSelection = (classname) => {
        const newSelected = {...selected};
        delete newSelected[classname];
        setSelected(newSelected);
    }

    return (
        <ContentContainer>
        <HealthCheck className={classes.healthCheck} variant="overline" component="div" />
        <Grid container spacing={2} className={classes.smallMarginTopClass}>
            <Grid item md={5} xs={12}>
            <Grid item className={classes.marginBottomClass} md={12}>
                <Paper className={classes.section}>
                    <Typography className={classes.marginBottomClass} variant="h6">Class selection</Typography>
                    <Divider />
                    <ClassTabs categories={categories} handleChangeSelect={handleChangeSelect} selected={selected} />
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
                    <Divider />
                    {displayPatterns()}
                </Paper>
            </Grid>
        </Grid>
        </ContentContainer>
    );
}