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

export default function ClassTabs({categories, handleChangeSelect, selected}) {
    const [value, setValue] = React.useState(0);

    const handleChangeTab = (event, newValue) => {
        setValue(newValue);
    };

    const findSelected = (category) => {
        for (let key in selected) {
            if (selected[key].parent.subject.value === category.subject.value) return true;
        }

        return false;
    };

    const getSelectsWithChildrens = (category) => {
        let subCatKeys = Object.keys(category.childrens);
        let alreadySelected = findSelected(category);

        return (
            <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">{category.label.value}</InputLabel>
                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    label={category.label.value}
                    onChange={handleChangeSelect}
                    defaultValue={0}
                    disabled={alreadySelected}
                >
                    <MenuItem value={0} key="default" disabled>Select a subclass ...</MenuItem>
                    {subCatKeys.map((subCatKey, i) => {
                        let subCat = category['childrens'][subCatKey]
                        return <MenuItem value={{...subCat, "parent": category}} key={`${subCatKey}-${i}`}>{subCat.label.value}</MenuItem>    
                    })}
                </Select>
            </FormControl>
        )
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChangeTab} aria-label="Classes as tabs" scrollButtons="auto" variant="scrollable">
                    {Object.keys(categories).map((key, i) => (
                        <Tab label={categories[key].label.value} key={key} {...a11yProps(i, key)} />
                    ))}
                </Tabs>
            </Box>
            {Object.keys(categories).map((key, i) => (
                <TabPanel value={value} index={i} key={key}>
                    {getSelectsWithChildrens(categories[key])}
                </TabPanel>
            ))}
        </Box>
    );
}