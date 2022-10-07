import * as React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { Typography } from '@mui/material';

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

export default function ScoreDialog({ open, setOpen, proposal, ratio, totalScore, questionScore, maxCitations }) {
    return (
        <div>
            <BootstrapDialog
                aria-labelledby="pattern-dialog-title"
                open={open}
                onClose={() => setOpen(false)}
            >
                <BootstrapDialogTitle id="pattern-dialog-title">
                    Score rationale of: {proposal.label}
                </BootstrapDialogTitle>
                <DialogContent dividers>
                    <Typography variant='body1' sx={{ padding: '10px'}}>
                        The score of a pattern is expressed between 0 (not recommended) and 1 (highly recommended).
                        It is displayed as a percentage based on this score (from 0 to 100%).
                    </Typography>
                    <Typography variant='body1' sx={{ padding: '10px'}}>
                        The computation of this score is made by multiplying the question score S<sup>q</sup> with a citation ratio C<sub>r</sub>.
                        The question score S<sup>q</sup> is computed by summing 1 for each question that concerns the proposal where a <i>Yes</i> answer has been given, then dividing this sum by the number of questions that concerns the proposal.
                        The citation ratio C<sub>r</sub> is the division between the logarithm of the citation number of the proposal P<sub>c</sub> and the logarithm of the citation number of the most-cited proposal M<sub>c</sub>. 
                    </Typography>
                    <Typography variant='body2' sx={{ padding: '10px', textAlign: 'center', border: '1px solid black', borderRadius: '10px', marginTop: '10px', marginBottom: '10px' }}>
                        S<sup>q</sup> * (log(P<sub>c</sub>)/log(M<sub>c</sub>))
                    </Typography>
                    <Typography variant='body1' sx={{ padding: '10px'}}>
                        For this proposal, these values are:
                        <ul>
                            <li>Question score: {questionScore}</li>
                            <li>Number of citations: {proposal ? proposal.citations : 0}</li>
                            <li>Most-cited proposal citations: {maxCitations}</li>
                            <li>Ratio: {ratio}</li>
                            <li>Total score: {totalScore}</li>
                        </ul> 
                    </Typography>
                </DialogContent>
            </BootstrapDialog>
        </div>
  );
}