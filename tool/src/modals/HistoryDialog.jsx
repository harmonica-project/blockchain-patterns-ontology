import * as React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

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

export default function HistoryDialog({open, setOpen, history}) {
    const parseAnswer = (answer) => {
        switch (answer) {
            case -1:
                return 'No';
            case 0:
                return 'Don\'t know';
            case 1:
                return 'Yes';
            default:
                return 'Unknown';
        }
    };

    return (
        <div>
            <BootstrapDialog
                aria-labelledby="history-dialog-title"
                open={open}
                onClose={() => setOpen(false)}
            >
                <BootstrapDialogTitle id="history-dialog-title">
                History
                </BootstrapDialogTitle>
                <DialogContent dividers>
                  {
                    history.length
                    ?
                      <ul>
                        {history.map(item => (
                            <li>
                                {item.question}: {parseAnswer(item.answer)} {item.prefilled ? '(Prefilled)': ''}
                            </li>
                        ))}
                      </ul>
                    : 
                      <div>No question answered yet.</div>
                  }
                </DialogContent>
            </BootstrapDialog>
        </div>
  );
}