import React, { useState, useEffect } from 'react';
import { Typography, Container, Paper, Button } from '@mui/material';
import ContentContainer from '../layouts/ContentContainer';
import { getClassTree } from '../libs/fuseki';
import { makeStyles } from '@mui/styles';
import Questions from '../components/Questions';

const useStyles = makeStyles(() => ({
  paper: {
    padding: "20px",
    marginTop: "20px"
  },
  title: {
    marginBottom: '10px'
  }
}));

export default function Recommendation() {
  const classes = useStyles();
  const [quizz, setQuizz] = useState({
    list: {},
    topQuestions: [], 
    currentQuestion: '',
    currentStep: -1
  });

  const getTopQuestions = (questionsList) => {
    const topQuestions = [];

    Object.keys(questionsList).map(key => {
      if (questionsList[key].parent === 'onto:Problem') 
        topQuestions.push(key);
    });

    return topQuestions;
  };

  useEffect(() => {
    getClassTree('onto:Problem')
      .then(subclasses => {
        setQuizz({
          ...quizz,
          list: subclasses,
          topQuestions: getTopQuestions(subclasses),
        });
      })
  }, [])

  const startQuizz = () => {
    setQuizz({
      ...quizz,
      currentStep: 0,
      currentQuestion: quizz.topQuestions[0]
    })
  }

  const setAnswerToQuestion = (question, answer) => {
    setQuizz({
      ...quizz,
      list: {
        ...quizz.list,
        [question]: {
          ...quizz.list[question],
          answer
        }
      },
      currentStep: quizz.currentStep + 1,
      currentQuestion: getNextQuestion({...quizz})
    });
  };

  const handleAnswer = (answer, skip = false) => {
    // if the user answer no or skip to a high level question, he'll obviously answer no/skip to questions
    // that are sub parts of the high level question so we can skip to the next question that do not have any link with it

    if (skip) {
      const newQuestions = fillSkipQuestion(quizz.currentQuestion, answer);
      let newQuizz = { 
        ...quizz, 
        list: { 
          ...quizz.list, 
          ...newQuestions,
          [quizz.currentQuestion]: {
            ...quizz.list[quizz.currentQuestion],
            answer
          }
        }, 
        currentStep: quizz.currentStep + Object.keys(newQuestions).length + 1
      };

      newQuizz.currentQuestion = getNextQuestion(newQuizz);
      setQuizz(newQuizz);
    } else {
      setAnswerToQuestion(quizz.currentQuestion, answer);
    }
  };

  const fillSkipQuestion  = (question, val) => {
    let newQuestions = {};

    for (let i in quizz.list[question].childrens) {
      let children = quizz.list[question].childrens[i];

      newQuestions = {
        ...newQuestions,
        ...fillSkipQuestion(children, val),
        [children]: {
          ...quizz.list[children],
          answer: val
        }
      };
    }

    return newQuestions;
  };

  const getNextQuestion = (newQuizz) => {
    for (let i in newQuizz.topQuestions) {
      let question = newQuizz.topQuestions[i];
      if (!('answer' in newQuizz.list[question]) && question !== newQuizz.currentQuestion) return question;
      else {
        let res = searchNonAnswered(question, newQuizz);
        if (res) return res;
      }
    };

    // if quizz is done return currentQuestion as this is the end
    return newQuizz.currentQuestion;
  };

  const searchNonAnswered = (question, newQuizz) => {
    for (let i in newQuizz.list[question].childrens) {
      let children = newQuizz.list[question].childrens[i];
      if (!('answer' in newQuizz.list[children]) && children !== newQuizz.currentQuestion) return children;
      else {
        let res = searchNonAnswered(children, newQuizz);
        if (res) return res;
      }
    }

    return false;
  }

  const getQuestionDisplay = () => {
    return (
      <Questions
        quizz={quizz}
        handleAnswer={handleAnswer}
      />
    )
  }
  const getHomeDisplay = () => {
    return (
      <>
        <Typography variant="h5" component="div" className={classes.title}>
          Get recommendation
        </Typography>
        <Typography variant="body1" gutterBottom>
          <p>In this subsection, you can obtain precise recommendation of patterns after answering some questions on design problems. When you are ready, you can click on the button below to start.</p>
          <p><i>Note: please avoid to refresh the page, as there is no local saving for the moment.</i></p>
        </Typography>
        <Button variant="contained" onClick={startQuizz}>Start</Button>
      </>
    )
  }

  const handleStepDisplay = () => {
    console.log(quizz.currentStep, Object.keys(quizz.list).length - 1)
    if (quizz.currentStep < 0) {
      return getHomeDisplay();
    } else {
      if (quizz.currentStep < Object.keys(quizz.list).length - 1) {
        return getQuestionDisplay();
      } else {
        return <span>Finished!</span>
      }
    }
  }

  return (
    <ContentContainer>
      <Container>
        <Paper className={classes.paper}>
          {handleStepDisplay()}
        </Paper>
      </Container>
    </ContentContainer>
  );
}