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

  const handleAnswer = (answer) => {
    setQuizz({
      ...quizz,
      list: {
        ...quizz.list,
        [quizz.currentQuestion]: {
          ...quizz.list[quizz.currentQuestion],
          answer
        }
      },
      currentStep: quizz.currentStep + 1,
      currentQuestion: getNextQuestion(quizz.currentQuestion)
    })

    console.log(quizz)
  };

  const getNextQuestion = () => {
    for (let i in quizz.topQuestions) {
      let question = quizz.topQuestions[i];
      console.log(quizz.list[question], quizz.currentQuestion)
      if (!('answer' in quizz.list[question]) && question !== quizz.currentQuestion) return question;
      else {
        let res = searchNonAnswered(question);
        if (res) return res;
      }
    };

    // if quizz is done return currentQuestion as this is the end
    return quizz.currentQuestion;
  };

  const searchNonAnswered = (question) => {
    for (let i in quizz.list[question].childrens) {
      let children = quizz.list[question].childrens[i];
      if (!('answer' in quizz.list[children]) && children !== quizz.currentQuestion) return children;
      else {
        let res = searchNonAnswered(children);
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