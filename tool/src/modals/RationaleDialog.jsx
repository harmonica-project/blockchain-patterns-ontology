import * as React from 'react';
import PropTypes from 'prop-types';
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
                In this tool, each question you answered is mapped to a specific problem. 
                Those problems form a tree, where each problem may have a parent (subsuming the child problem), and some children. 
                By answering those questions, each linked problem has been assigned a score of -1 (No), 0 (Not sure), or 1(Yes). 
                As problems are forming a tree, it is possible to get a score summing the score of all problems on a branch and normalizing it (longer branches should have a higher score than shorter branches). 
            </Typography>
            <Typography variant="body1" gutterBottom>
                Another notable aspect is that each problem is closely related to the blockchain pattern taxonomy. 
                Thus, the leaves of the problem tree are the same than the leaves of the taxonomy, and where patterns are grouped under those leaves, they can also be mapped to a leaf problem. 
                Therefore, a pattern are assigned the score from its respective branch. 
            </Typography>
            <Typography variant="body1" gutterBottom>
                This score ranges from 0 to 1. 
                For the sake of understandability, this interval has been sliced into 5 sub intervals and assigned a label, as follows:
                [0, 0.2] Not recommended, [0.2, 0.4] Slightly recommended, [0.4, 0.6] Recommended, [0.6,0.8] Highly recommended, [0.8, 1] Extremely recommended.
            </Typography>
            <Typography variant="body1" gutterBottom>
                A dynamic rationale system on this score is currently in development, and will be displayed along patterns when ready. 
                Also, recommendations will be more precise in the future with the addition of domain, language, and blockchain in the selection.
            </Typography>
        </DialogContent>
      </BootstrapDialog>
    </div>
  );
}