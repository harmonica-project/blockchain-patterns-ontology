import * as React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

const BootstrapDialogTitle = (props) => {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  );
};

BootstrapDialogTitle.propTypes = {
  children: PropTypes.node,
  onClose: PropTypes.func.isRequired,
};

export default function RationaleDialog({open, setOpen}) {
  return (
    <div>
      <BootstrapDialog
        aria-labelledby="rationale-dialog-title"
        open={open}
        onClose={() => setOpen(false)}
      >
        <BootstrapDialogTitle id="rationale-dialog-title">
          Scoring rationale
        </BootstrapDialogTitle>
        <DialogContent dividers>
            <Typography variant="body1" gutterBottom>
                The rationale behind the score is the following: by answering questions on your goals, each problem has been assigned a score of -1 (No), 0 (Not sure), or 1(Yes).
                As problems are forming a tree (for instance, the design pattern problem is split in two problems), it is possible to get a score summing the score of all problems on a branch and normalizing it (longer branches do not have a higher score).
            </Typography>
            <Typography variant="body1" gutterBottom>
                Also, patterns are attached to branch leaves, they are assigned that normalized score and ranked between 1 (all problems on the branch of the pattern has been given a score of 1) to 0 (same rationale).
                When a problem is assigned a score of -1, all the branch is discarded.
                A dynamic rationale system on this score is currently in development, and will be displayed along patterns when ready.
            </Typography>
        </DialogContent>
      </BootstrapDialog>
    </div>
  );
}