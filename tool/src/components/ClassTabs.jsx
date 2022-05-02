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

export default function ClassTabs({classTree, handleChangeSelect, selectorStates}) {
    const [value, setValue] = React.useState(0);

    const handleChangeTab = (event, newValue) => {
        setValue(newValue);
    };

    const getInitialClasses = () => {
      if (classTree['owl:Thing']) {
        // filtering unwanted filters
        return classTree['owl:Thing']
          .childrens
          .filter(key => !['onto:Problem', 'onto:Paper', 'onto:Proposal', 'onto:Variant'].includes(key))
      } else {
        return [];
      }
    }

    const isOptionSelected = (ontologyClass) => {
      if (selectorStates[ontologyClass]) {
        return [true, selectorStates[ontologyClass]];
      } else {
        return [false];
      }
    };

    const areChildrensDefined = (ontologyClass) => {
      if (classTree[ontologyClass] && classTree[ontologyClass]['childrens'] && classTree[ontologyClass]['childrens'].length) {
        let childrens = classTree[ontologyClass]['childrens'];
        for (let i in childrens) {
          if (!classTree[childrens[i]]) return false;
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
                    <InputLabel id={`${ontologyClass}-select-label`}>{classTree[ontologyClass].label}</InputLabel>
                    <Select
                        labelId={`${ontologyClass}-select-label`}
                        id={`${ontologyClass}-select`}
                        label={classTree[ontologyClass].label}
                        onChange={(e) => handleChangeSelect(e, ontologyClass)}
                        value={selectorStates[ontologyClass] || "prompt"}
                        disabled={isAlreadySelected}
                    >
                        <MenuItem value={"prompt"} key="default" disabled>Filter by ...</MenuItem>
                        {classTree[ontologyClass]['childrens'].map((childrenClass, i) => {
                            return <MenuItem value={childrenClass} key={`${childrenClass}-${i}`}>{classTree[childrenClass].label}</MenuItem>    
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
    
    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChangeTab} aria-label="Classes as tabs" scrollButtons="auto" variant="scrollable">
                    {getInitialClasses().map((initialClassKey, i) => (
                        <Tab label={classTree[initialClassKey].label} key={initialClassKey} {...a11yProps(i, classTree[initialClassKey].label)} />
                    ))}
                </Tabs>
            </Box>
            {getInitialClasses().map((initialClassKey, i) => (
              <TabPanel value={value} index={i} key={initialClassKey}>
                {getSelectsWithChildrens(initialClassKey)}
              </TabPanel>
            ))}
        </Box>
    );
}