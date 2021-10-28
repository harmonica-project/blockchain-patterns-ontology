import * as React from 'react';
import Box from '@mui/material/Box';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Chip from '@mui/material/Chip';

export default function ClassChipSelector({ classes, classFilter, setClassFilter }) {
  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    setClassFilter(
      // On autofill we get a the stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  return (
    <div>
      <FormControl sx={{ width: '100%' }}>
        <InputLabel id="class-filter-label">Classes</InputLabel>
        <Select
          labelId="class-filter-label"
          id="class-filter-chip-select"
          multiple
          value={classFilter}
          onChange={handleChange}
          input={<OutlinedInput id="class-filter-chip-select-input" label="Classes" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} />
              ))}
            </Box>
          )}
        >
          {classes.map((singleClass) => (
            <MenuItem
              key={singleClass}
              value={singleClass}
            >
              {singleClass}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}