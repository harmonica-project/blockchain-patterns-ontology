import React, { useState } from 'react';
import {
    Box,
    LinearProgress,
    Typography,
    Button,
    Divider,
    Stack,
    IconButton,
    Tooltip
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import QuestionsStepper from './QuestionsStepper';
import HistoryDialog from '../modals/HistoryDialog';
import HistoryIcon from '@mui/icons-material/History';

const useStyles = makeStyles(() => ({
    title: {
      textAlign: 'center'
    },
    breadcrumb: {
        marginBottom: '15px',
        textAlign: 'center'
      },
    divider: {
        marginTop: '20px',
        marginBottom: '20px'
    },
    questionBox: {
        textAlign: 'center',
        marginBottom: '30px',
    },
    questionButtonBox: {
        justifyContent: 'center',
        marginTop: '20px'
    }
  }));
  

function LinearProgressWithLabel(props) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', flexGrow:'1' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary">{`${Math.round(
            props.value,
          )}%`}</Typography>
        </Box>
      </Box>
    );
}

export default function Questions({quizz, handleAnswer}) {
    const classes = useStyles();
    const [historyOpen, setHistoryOpen] = useState(false);

    const getProblemBreadcrumb = (question) => {
        const breadcrumb = [];

        while (question !== "onto:Problem") {
          breadcrumb.push(quizz.list[question].label);
          question = quizz.list[question].parent;
        }
    
        return breadcrumb.reverse().join(' > ');
    };

    const getCurrentTopQuestion = (question) => {
        if (quizz.list[question].parent === 'onto:Problem') return question;
        else return getCurrentTopQuestion(quizz.list[question].parent);
    };

    const getSteps = () => {
        return {
            list: quizz.topQuestions.map(key => quizz.list[key].label),
            currentStep: quizz.topQuestions.indexOf(getCurrentTopQuestion(quizz.currentQuestion))
        }
    };

    return (
        <Box>
            <QuestionsStepper steps={getSteps()} />
            <Divider className={classes.divider} />
            <Typography variant="h5" component="div" className={classes.title}>
                Question {quizz.currentStep}/{Object.keys(quizz.list).length - 1}
            </Typography>
            <Typography variant="overline" component="div" className={classes.breadcrumb}>
                {getProblemBreadcrumb(quizz.currentQuestion)}
            </Typography>
            <Box className={classes.questionBox}>
                <Typography variant="body1">
                    {quizz.list[quizz.currentQuestion].description}
                </Typography>
                <Stack spacing={2} direction="row" className={classes.questionButtonBox}>
                    <Button variant="contained" color="success" onClick={() => handleAnswer(1)}>
                        Yes
                    </Button>
                    <Button variant="contained" color="info" onClick={() => handleAnswer(0)}>
                        I don't know
                    </Button>
                    <Button variant="contained" color="error" onClick={() => handleAnswer(-1, true)}>
                        No
                    </Button>
                </Stack>
            </Box>
            <Box display="flex">
                <Box>
                <Tooltip title="Display history">
                    <IconButton 
                        size="large" 
                        style={{color: '#2d3032', marginRight: '15px'}} 
                        aria-label="Display history" 
                        onClick={() => setHistoryOpen(true)}
                    >
                        <HistoryIcon fontSize="inherit" />
                    </IconButton>
                </Tooltip>
                </Box>
                <LinearProgressWithLabel value={quizz.currentStep * 100 / Object.keys(quizz.list).length} />
            </Box>
            <HistoryDialog open={historyOpen} setOpen={setHistoryOpen} history={quizz.history} />
        </Box>
    )
}