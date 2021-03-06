import * as React from 'react';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import IndividualTabs from '../components/IndividualTabs';

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
  }
}));

export default function PatternModal({modalStates, setModalStates, selectedPatterns, handlePatternModalAction, disableLinks}) {
  const pattern = modalStates.pattern;
  const classes = useStyles();

  const selectedTab = modalStates.selectedTab;
  const setSelectedTab = (i) => setModalStates({ ...modalStates, selectedTab: i});

  const handleClose = () => {
    setModalStates({
      ...modalStates,
      open: false
    })
  };

  return (
    <div>
      <Modal
        open={modalStates.open}
        onClose={handleClose}
        aria-labelledby="pattern-modal-title"
        aria-describedby="pattern-modal-description"
      >
        <Grid container className={classes.containerStyle}>
          <Typography id="pattern-modal-title" variant="h4" component="h1">
            {pattern.label}
          </Typography>
          <IndividualTabs 
            individuals={pattern.individuals} 
            handlePatternModalAction={handlePatternModalAction}
            selectedPatterns={selectedPatterns}
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
            disableLinks={disableLinks}
          />
        </Grid>
      </Modal>
    </div>
  );
}