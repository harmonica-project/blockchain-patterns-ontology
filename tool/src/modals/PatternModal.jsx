import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { Divider } from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: "60%",
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export default function PatternModal({open, setOpen, pattern}) {
  const handleClose = () => setOpen(false);
  
  const getPropertySafe = (prop) => {
    if (pattern[prop] && pattern[prop]['value']) return pattern[prop]['value'];
    return false;
  };

  return (
    <div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h1">
            {getPropertySafe('label')}
          </Typography>
          <Typography id="modal-modal-title" variant="overline">
            Source - {getPropertySafe('paper')}
          </Typography>
          <Divider/>
          <Typography id="modal-pattern-context-title" sx={{ mt: 2 }}>
            <b>
              Context and problem
            </b>
          </Typography>
          <Typography id="modal-pattern-context-text">
            {getPropertySafe('context') || "No text provided."}
          </Typography>
          <Typography id="modal-pattern-solution-title" sx={{ mt: 2 }}>
            <b>
              Proposed solution
            </b>
          </Typography>
          <Typography id="modal-pattern-solution-text">
            {getPropertySafe('solution') || "No text provided."}
          </Typography>
        </Box>
      </Modal>
    </div>
  );
}