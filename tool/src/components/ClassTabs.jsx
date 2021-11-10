import * as React from 'react';
import PropTypes from 'prop-types';
import { FormControl, InputLabel, Select, MenuItem, Box, Tab, Tabs } from '@mui/material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index, key) {
  return {
    id: `${key}-${index}`,
    'aria-controls': `${key}-panel-${index}`,
  };
}

export default function ClassTabs({ontologyClasses, handleChangeSelect, selectorStates}) {
    const [value, setValue] = React.useState(0);

    const handleChangeTab = (event, newValue) => {
        setValue(newValue);
    };

    const getInitialClasses = () => {
      let initialClasses = {};

      for (let ontologyClassKey in ontologyClasses) {
        if (ontologyClasses[ontologyClassKey]['initial'] && ontologyClasses[ontologyClassKey]['childrens'].length) initialClasses[ontologyClassKey] = ontologyClasses[ontologyClassKey];
      }

      return initialClasses;
    }

    const isOptionSelected = (ontologyClass) => {
      if (selectorStates[ontologyClass] && selectorStates[ontologyClass] !== "prompt") {
        return [true, selectorStates[ontologyClass]];
      } else {
        return [false];
      }
    };

    const areChildrensDefined = (ontologyClass) => {
      if (ontologyClasses[ontologyClass] && ontologyClasses[ontologyClass]['childrens'] && ontologyClasses[ontologyClass]['childrens'].length) {
        let childrens = ontologyClasses[ontologyClass]['childrens'];
        for (let i in childrens) {
          if (!ontologyClasses[childrens[i]]) return false;
        }
        return true;
      } else {
        return false;
      }
    };

    const getSelectsWithChildrens = (ontologyClass) => {
        if (areChildrensDefined(ontologyClass)) {
            let [isAlreadySelected, selectedClass] = isOptionSelected(ontologyClass);
            return (
              <>
                <FormControl fullWidth style={{marginTop: '20px'}}>
                    <InputLabel id={`${ontologyClass}-select-label`}>{ontologyClasses[ontologyClass].label.value}</InputLabel>
                    <Select
                        labelId={`${ontologyClass}-select-label`}
                        id={`${ontologyClass}-select`}
                        label={ontologyClasses[ontologyClass].label.value}
                        onChange={(e) => handleChangeSelect(e, ontologyClass)}
                        value={selectorStates[ontologyClass] || "prompt"}
                        disabled={isAlreadySelected}
                    >
                        <MenuItem value={"prompt"} key="default" disabled>Filter by ...</MenuItem>
                        {ontologyClasses[ontologyClass]['childrens'].map((childrenClass, i) => {
                            return <MenuItem value={ontologyClasses[childrenClass].subject.value} key={`${ontologyClasses[childrenClass].subject.value}-${i}`}>{ontologyClasses[childrenClass].label.value}</MenuItem>    
                        })}
                    </Select>
                </FormControl>
                {isAlreadySelected ? getSelectsWithChildrens(selectedClass) : <div/>}
            </>
            )
        } else {
          return <div/>
        }
    }

    // removing Problem from explorer for now
    let initialClassesKeys = Object.keys(getInitialClasses()).filter(key => key !== 'onto:Problem');
    
    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChangeTab} aria-label="Classes as tabs" scrollButtons="auto" variant="scrollable">
                    {initialClassesKeys.map((initialClassKey, i) => (
                        <Tab label={ontologyClasses[initialClassKey].label.value} key={initialClassKey} {...a11yProps(i, ontologyClasses[initialClassKey].label.value)} />
                    ))}
                </Tabs>
            </Box>
            {initialClassesKeys.map((initialClassKey, i) => (
              <TabPanel value={value} index={i} key={initialClassKey}>
                {getSelectsWithChildrens(initialClassKey)}
              </TabPanel>
            ))}
        </Box>
    );
}