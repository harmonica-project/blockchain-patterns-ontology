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
  console.log(pattern)
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
            {pattern.label.value}
          </Typography>
          <Typography id="modal-modal-title" variant="overline">
            Source - {pattern.paper.value}
          </Typography>
          <Divider/>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            <b>
              Context and problem
            </b>
          </Typography>
          <Typography id="modal-modal-description">
            {pattern.context.value || "No text provided."}
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            <b>
              Proposed solution
            </b>
          </Typography>
          <Typography id="modal-modal-description">
            {pattern.solution.value || "No text provided."}
          </Typography>
        </Box>
      </Modal>
    </div>
  );
}