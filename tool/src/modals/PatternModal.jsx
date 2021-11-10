import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { Divider, Button, Grid, List, ListItem, ListItemText, Card } from '@mui/material';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(() => ({
  containerStyle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: "80%",
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0px 2px 1px -1px rgb(0 0 0 / 40%), 0px 1px 1px 0px rgb(0 0 0 / 80%), 0px 1px 3px 0px rgb(0 0 0 / 80%);',
    p: 4,
  },
  paperInfo: {
    lineHeight: '1'
  }
}));

export default function PatternModal({open, setOpen, pattern, selectedPatterns, handlePatternModalAction}) {
  const handleClose = () => setOpen(false);
  const classes = useStyles();
  const areLinks = (pattern['linkedPatterns'] && pattern['linkedPatterns']['length'] ? true : false);
  const patternInLocalState = (pattern) => {
    return (pattern && pattern['individual'] && selectedPatterns[pattern.individual.value]);
  };

  const getPropertySafe = (prop) => {
    if (pattern[prop] && pattern[prop]['value']) return pattern[prop]['value'];
    return false;
  };

  const getSource = () => {
    const prop = getPropertySafe('identifier');
    const type = getPropertySafe('identifiertype');

    if (type === 'DOI') {
      return <a href={'https://doi.org/' + prop}>{prop}</a>
    } else if (type === 'Arxiv') {
      return <a href={'https://arxiv.org/' + prop}>{prop}</a>
    } else {
      return <span>{prop}</span>;
    }
  };

  const getRelationLabel = (relation) => {
    switch(relation) {
      case 'onto:variantOf':
        return `A ${getPropertySafe('label')} pattern variant.`;

      case 'onto:requires':
        return `Required: it must be used with the ${getPropertySafe('label')} pattern.`;

      case 'onto:createdFrom':
        return `${getPropertySafe('label')} is directly inspired from this pattern.`;

      case 'onto:benefitsTo':
        return `Using this pattern along the ${getPropertySafe('label')} pattern is beneficial.`;      

      case 'onto:relatedTo':
        return `This pattern is related to the ${getPropertySafe('label')} pattern.`;  

      default:
        return `This pattern is related to the ${getPropertySafe('label')} pattern.`;  
    }
  };

  return (
    <div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="pattern-modal-title"
        aria-describedby="pattern-modal-description"
      >
        <Grid container className={classes.containerStyle}>
          <Grid item md={areLinks ? 8 : 12} sm={12} style={{paddingRight: '40px'}}>
            <Typography id="pattern-modal-title" variant="h6" component="h1">
              {getPropertySafe('label')}
            </Typography>
            <Typography variant="overline" component="div">
              <p className={classes.paperInfo}>Paper: {getPropertySafe('title')}</p>
              <p className={classes.paperInfo}>Source: {getSource()}</p>
            </Typography>
            <Divider/>
            <Typography sx={{ mt: 2 }}>
              <b>
                Context and problem
              </b>
            </Typography>
            <Typography>
              {getPropertySafe('context') || "No text provided."}
            </Typography>
            <Typography sx={{ mt: 2 }}>
              <b>
                Proposed solution
              </b>
            </Typography>
            <Typography>
              {getPropertySafe('solution') || "No text provided."}
            </Typography>
            <Box style={{marginTop: '20px'}}>
              {patternInLocalState(pattern) 
                    ? 
                        (
                          <Button 
                            variant="contained"
                            onClick={() => handlePatternModalAction('remove', pattern)}
                          >
                            Remove from my list
                          </Button>
                        )
                    : 
                        (
                          <Button 
                            variant="contained"
                            onClick={() => handlePatternModalAction('add', pattern)}
                          >
                            Add to my list
                          </Button>
                        )
                } 
            </Box>
          </Grid>
          {
            areLinks
            && (
              <Grid item md={4} sm={12}>
                <Card style={{ padding: '20px' }}>
                  <Typography id="modal-modal-title" variant="h6" component="h1">
                    Linked patterns
                  </Typography>
                  <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {
                      pattern['linkedPatterns'].map(linkedPattern => (
                        <ListItem alignItems="flex-start" key={linkedPattern.individual.value}>
                          <ListItemText
                            primary={linkedPattern.pattern.label.value}
                            secondary={getRelationLabel(linkedPattern.relation.value)}
                          />
                        </ListItem>
                      ))
                    }
                  </List>
                </Card>
              </Grid>
            )
          }
        </Grid>
      </Modal>
    </div>
  );
}