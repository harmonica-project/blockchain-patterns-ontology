import React from 'react';
import {
    Box,
    LinearProgress,
    Typography,
    Button,
    Divider
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import Stack from '@mui/material/Stack';
import QuestionsStepper from './QuestionsStepper';

const useStyles = makeStyles(() => ({
    title: {
      marginBottom: '10px',
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
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                Question #{quizz.currentStep + 1}
            </Typography>
            <Box className={classes.questionBox}>
                <Typography variant="body1">
                    {quizz.list[quizz.currentQuestion].description}
                </Typography>
                <Stack spacing={2} direction="row" className={classes.questionButtonBox}>
                    <Button variant="contained" color="success">
                        Yes
                    </Button>
                    <Button variant="contained" color="error">
                        No
                    </Button>
                    <Button variant="contained" color="info">
                        Skip
                    </Button>
                </Stack>
            </Box>
            <LinearProgressWithLabel value={quizz.currentStep * 100 / Object.keys(quizz.list).length} />
        </Box>
    )
}