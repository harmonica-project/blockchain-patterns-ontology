import React, { useState, useEffect } from 'react';
import { Typography, Container, Paper, Button, Grid, Pagination } from '@mui/material';
import ContentContainer from '../layouts/ContentContainer';
import { 
  getClassTree, 
  getPatternsByProblem,
  getLinkedPatterns
 } from '../libs/fuseki';
import { makeStyles } from '@mui/styles';
import { useSnackbar } from 'notistack';
import Questions from '../components/Questions';
import PatternCard from '../components/PatternCard';
import LoadingOverlay from '../components/LoadingOverlay';
import PatternModal from '../modals/PatternModal';
import { parseToLabel } from '../libs/helpers';
import { 
  getLocalstoragePatterns,
  setPatternsInLocalstorage,
  storePatternInLocalstorage
 } from '../libs/localstorage';
import RationaleDialog from '../components/RationaleDialog';

const scoreLabels = [
  'Not recommended',
  'Slightly recommended',
  'Recommended',
  'Highly recommended',
  'Extremely recommended'
];

const useStyles = makeStyles(() => ({
  paper: {
    padding: "20px",
    marginTop: "20px"
  },
  title: {
    marginBottom: '20px'
  },
  homeBlock: {
    textAlign: "center"
  },
  patternSpacing: {
    marginTop: '20px',
    marginBottom: '30px'
  },
  displayRankingInfoLink: {
    color: 'dodgerblue',
    textDecoration: 'underline dodgerblue',
    cursor: 'pointer',
    "&:hover": {
      color: 'mediumblue',
      textDecoration: 'underline mediumblue',
    }
  }
}));

export default function Recommendation() {
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();
  const [loadingOpen, setLoadingOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modalStates, setModalStates] = useState({ "pattern": {}, open: false });
  const [selectedPatterns, setSelectedPatterns] = useState({});
  const [quizzState, setQuizzState] = useState(0);
  const [quizz, setQuizz] = useState({
    list: {},
    topQuestions: [], 
    currentQuestion: '',
    currentStep: 1
  });
  const [pagination, setPagination] = useState({
    interval: 18,
    page: 1 
  });
  const [patterns, setPatterns] = useState({});

  const getTopQuestions = (questionsList) => {
    const topQuestions = [];

    Object.keys(questionsList).forEach(key => {
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
      });

    getStoredPatterns();
  }, [])

  const addCatsToPatterns = (patterns, classTree) => {
    const patternsKeys = Object.keys(patterns);
    patternsKeys.forEach(key => {
        let patternClass = patterns[key].patternclass.value;
        let patternClassTree = [];

        while(classTree[patternClass] && classTree[patternClass]['parent']) {
            patternClassTree.push(parseToLabel(patternClass));
            patternClass = classTree[patternClass]['parent'];
        }

        patterns[key]['classtree'] = patternClassTree;
    });

    return patterns;
  }

  const handlePatternAction = (action, pattern) => {
    switch (action) {
        case 'patternClick':
            handlePatternClick(pattern);
            break;
        case 'patternDelete':
            deleteLocalPattern(pattern);
            break;
        case 'patternStore':
            storeLocalPattern(pattern);
            getStoredPatterns();
            break;
        default:
            console.error('No action defined for this handler.');
    }
  };

  const getStoredPatterns = () => {
    setLoadingOpen(true);
    getClassTree("onto:Pattern")
        .then(classes => {
            getPatternsWithCat(classes);
        })
        .finally(() => setLoadingOpen(false));
  };

  const getPatternsWithCat = (classTree) => {
    let patterns = getLocalstoragePatterns();
    if (patterns) setSelectedPatterns(addCatsToPatterns(patterns, classTree));
    else enqueueSnackbar('Error while retrieving patterns.');
  };

  const calculatePatternScore = (key) => {
    const getBranchSize = (key) => {
      if (key !== 'onto:Problem') return 1 + getBranchSize(quizz.list[key]['parent']);
      return 0;
    };

    const getBranchPoints = (key) => {
      let answer = (key !== "onto:Problem" ? quizz.list[key].answer : 0);
      if (quizz.list[key]['parent']) return answer + getBranchPoints(quizz.list[key].parent);
      else return answer;
    }

    return (getBranchPoints(key)/getBranchSize(key));
  }

  const getRecommendedPatterns = async () => {
    const wantedProblems = {};

    Object.keys(quizz.list).forEach(key => {
      if (quizz.list[key].childrens.length === 0 && quizz.list[key]['answer'] >= 0) {
        quizz.list[key]['score'] = calculatePatternScore(key);
        wantedProblems[key] = quizz.list[key];
      }
    });
    
    getPatternsByProblem(wantedProblems)
      .then(patterns => setPatterns(patterns))
  };

  useEffect(() => {
    if (quizzState === 2) {
      getRecommendedPatterns();
    }
  }, [quizzState]);

  const startQuizz = () => {
    setQuizz({
      ...quizz,
      currentQuestion: quizz.topQuestions[0]
    });
    setQuizzState(1);
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

    if (quizz.currentStep === Object.keys(quizz.list).length - 1) {
      setQuizzState(2);
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
      <div className={classes.homeBlock}>
        <Typography variant="h5" component="div" className={classes.title}>
          Get recommendation
        </Typography>
        <Typography variant="body1" gutterBottom>
          In this subsection, you can obtain precise recommendation of patterns after answering some questions on design problems. When you are ready, you can click on the button below to start.
        </Typography>
        <Typography variant="body1" gutterBottom>
          <i>Note: please avoid to refresh the page, as there is no local saving for the moment.</i>
        </Typography>
        <br/>
        <Button variant="contained" onClick={startQuizz}>Start</Button>
      </div>
    )
  }

  const deleteLocalPattern = (pattern) => {
    let newSelectedPatterns = {...selectedPatterns};
    delete newSelectedPatterns[pattern.individual.value];
    setSelectedPatterns(newSelectedPatterns);
    setPatternsInLocalstorage(newSelectedPatterns);
    enqueueSnackbar("Pattern successfully deleted.", { variant: 'success' });
  };

  const storeLocalPattern = (pattern) => {
      storePatternInLocalstorage(pattern);

      setSelectedPatterns({
          ...selectedPatterns,
          [pattern.individual.value]: pattern
      })
      enqueueSnackbar("Pattern successfully added.", { variant: 'success' });
  };

  const handlePatternClick = (pattern) => {
    getLinkedPatterns(pattern.individual.value)
        .then(links => {
            setModalStates({
                open: true,
                pattern: {
                  ...pattern,
                  linkedPatterns: links
                }
            })
        })
  };

  const sortPatterns = (fKey, sKey) => {
    return patterns[sKey]['score'] - patterns[fKey]['score'];
  };

  const displayRankingInfo = () => {
    console.log('clicked')
    setDialogOpen(true);
  };

  const getLabelFromScore = (score) => {
    return scoreLabels[Math.floor(score*4)];
  };

  const displayPatternGrid = () => {
    if (Object.keys(patterns).length) {
      return (
        <Grid container className={classes.patternSpacing}>
          {Object.keys(patterns)
            .sort(sortPatterns)
            .slice((pagination.page - 1) * pagination.interval, pagination.page * pagination.interval)
            .map(key => 
              <PatternCard 
                pattern={patterns[key]}
                selectedPatterns={selectedPatterns}
                handlePatternAction={handlePatternAction}
                patternSubtext={getLabelFromScore(patterns[key].score)}
                bgcolor={`rgba(${255 * (1 - patterns[key].score)}, 200, ${255 * (1 - patterns[key].score)}, 0.6)`}
              />)
            }
        </Grid>
      )
    } else {
      return <div />
    }
  }
  const getRecommendedPatternsDisplay = () => {
    return (
      <>
        <Typography variant="h5">Recommended patterns</Typography>
        <Typography variant="body1">
          Please find below the recommended patterns in your case. 
          If you want more information on rankings, <span className={classes.displayRankingInfoLink} onClick={displayRankingInfo}>click me</span> to display a rationale.
        </Typography>
        {displayPatternGrid()}
        <Pagination 
          count={Math.ceil(Object.keys(patterns).length / pagination.interval)} 
          size="large"
          onChange={(e, page) => setPagination({...pagination, page})}
          style={{display: (Object.keys(patterns).length ? 'block' : 'none')}}
        />
      </>
    )
  };

  const handleStepDisplay = () => {
    switch(quizzState) {
      case 0:
        return getHomeDisplay();
      case 1:
        return getQuestionDisplay();
      case 2:
        return getRecommendedPatternsDisplay();
      default:
        return getHomeDisplay();
    }
  }

  return (
    <ContentContainer>
      <Container>
        <Paper className={classes.paper}>
          {handleStepDisplay()}
        </Paper>
      </Container>
      <LoadingOverlay open={loadingOpen} />
      <PatternModal 
        modalStates={modalStates}
        setModalStates={setModalStates}
        selectedPatterns={selectedPatterns}
        handlePatternModalAction={handlePatternAction}
      />
      <RationaleDialog open={dialogOpen} setOpen={setDialogOpen} />
    </ContentContainer>
  );
}