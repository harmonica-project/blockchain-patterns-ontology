import React, { useState, useEffect } from 'react';
import { Typography, Container, Paper, Button, Grid, Pagination, TextField, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
import ContentContainer from '../layouts/ContentContainer';
import { 
  getClassTree, 
  getPatternsByProblem,
  getLinkedPatterns,
  getPatterns
 } from '../libs/fuseki';
import { makeStyles } from '@mui/styles';
import { useSnackbar } from 'notistack';
import Questions from '../components/Questions';
import PatternCard from '../components/PatternCard';
import LoadingOverlay from '../components/LoadingOverlay';
import PatternModal from '../modals/PatternModal';
import { exportToJSON, parseToLabel } from '../libs/helpers';
import { 
  getFromLocalstorage,
  setInLocalstorage,
  storePatternInLocalstorage,
  getJSONFileContent
 } from '../libs/localstorage';
import RationaleDialog from '../modals/RationaleDialog';

const scoreDisplay = [
  {
    label: 'Not recommended',
    color: '#ec644f'
  },
  {
    label: 'Slightly recommended',
    color: '#f3a64d'
  },
  {
    label: 'Recommended',
    color: '#e1c73a'
  },
  {
    label: 'Highly recommended',
    color: '#9ecd34'
  },
  {
    label: 'Extremely recommended',
    color: '#5baf2a'
  }
];

const Input = styled('input')({
  display: 'none',
});

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
  },
  exportBtn: {
    marginLeft: '10px',
    marginRight: '10px',
    display: 'flex',
  },
  optionBtnContainer: {
    display: 'flex',
    justifyContent: 'center'
  }
}));

export default function Recommendation({ setNbPatterns }) {
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();
  const [loadingOpen, setLoadingOpen] = useState(false);
  const [rationaleOpen, setRationaleOpen] = useState(false);
  const [modalStates, setModalStates] = useState({ "pattern": {}, open: false });
  const [selectedPatterns, setSelectedPatterns] = useState({});
  const [quizzState, setQuizzState] = useState(0);
  const [search, setSearch] = useState('');
  const [quizz, setQuizz] = useState({
    list: {},
    topQuestions: [], 
    currentQuestion: '',
    currentStep: 1,
    history: []
  });
  const [page, setPage] = useState(1);
  const [patterns, setPatterns] = useState({});
  const [chosenPatterns, setChosenPatterns] = useState({});

  const INTERVAL = 18;

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

    getPatterns()
      .then((results) => {
          setPatterns(results);
      })
  }, [])

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setNbPatterns(Object.keys(selectedPatterns).length);
  }, [selectedPatterns]);

  useEffect(() => {
    if (quizzState === 2) {
      getRecommendedPatterns();
    }
  }, [quizzState]);

  const addCatsToPatterns = (patterns, classTree) => {
    const patternsKeys = Object.keys(patterns);
    patternsKeys.forEach(key => {
        let patternClass = patterns[key].pattern;
        let patternClassTree = [];

        while(classTree[patternClass] && classTree[patternClass]['parent']) {
            patternClassTree.push(parseToLabel(patternClass));
            patternClass = classTree[patternClass]['parent'];
        }

        patterns[key]['classtree'] = patternClassTree;
    });

    return patterns;
  }

  const handleIndividualClick = (individual) => {
    Object.keys(patterns).forEach(key => {
        const pattern = patterns[key];
        pattern.individuals.forEach((pIndividual, i) => {
            if (individual.individual === pIndividual.individual) {
                handlePatternClick(pattern, i);
            }
        }) 
    })
  };

  const handlePatternAction = (action, pattern) => {
    switch (action) {
        case 'linkedPatternClick':
            handleIndividualClick(pattern);
            break;
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
    let patterns = getFromLocalstorage('patterns');
    if (patterns) setSelectedPatterns(addCatsToPatterns(patterns, classTree));
    else {
      enqueueSnackbar('Error while retrieving patterns.');
      setInLocalstorage('patterns', {});
    }
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
      .then(patterns => setChosenPatterns(patterns))
  };

  const startQuizz = () => {
    setQuizz({
      ...quizz,
      currentQuestion: quizz.topQuestions[0]
    });
    setQuizzState(1);
  }

  const setAnswerToQuestion = (question, answer) => {
    const newQuizz = {
      ...quizz,
      list: {
        ...quizz.list,
        [question]: {
          ...quizz.list[question],
          answer
        }
      },
      currentStep: quizz.currentStep + 1,
      currentQuestion: getNextQuestion({...quizz}),
      history: [
        ...quizz.history,
        {
          question: quizz.list[question].label,
          answer,
          prefilled: false
        }]
    };

    setQuizz(newQuizz);
    return newQuizz;
  };

  const handleAnswer = (answer, skip = false) => {
    // if the user answer no or skip to a high level question, he'll obviously answer no/skip to questions
    // that are sub parts of the high level question so we can skip to the next question that do not have any link with it
    let newQuizzState = 1;
    let newQuizz = {};

    if (skip) {
      const newQuestions = fillSkipQuestion(quizz.currentQuestion, answer);
      newQuizz = { 
        ...quizz, 
        list: { 
          ...quizz.list, 
          ...newQuestions,
          [quizz.currentQuestion]: {
            ...quizz.list[quizz.currentQuestion],
            answer
          }
        }, 
        currentStep: quizz.currentStep + Object.keys(newQuestions).length + 1,
        history: [
          ...quizz.history,
          ...Object.keys(newQuestions).map(key => ({
            question: quizz.list[key].label,
            answer,
            prefilled: true
          })),
          {
            question: quizz.list[quizz.currentQuestion].label,
            answer,
            prefilled: false
          }
        ]
      };

      newQuizz.currentQuestion = getNextQuestion(newQuizz);
      setQuizz(newQuizz);
    } else {
      newQuizz = setAnswerToQuestion(quizz.currentQuestion, answer);
    }

    if (quizz.currentStep === Object.keys(quizz.list).length - 1) {
      newQuizzState = 2;
      setQuizzState(newQuizzState);
    }

    saveCurrentQuizz(newQuizz, newQuizzState);
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

  const resumeRecommendationFromFile = async (e) => {
    const file = e.target.files[0];
    const newQuizz = await getJSONFileContent(file);
    setQuizz(newQuizz);
    setQuizzState(2);
  };

  const saveCurrentQuizz = (newQuizz, newQuizzState) => {
    setInLocalstorage('recommendation', {
      quizzState: newQuizzState,
      quizz: newQuizz
    })
  };

  const checkForResume = () => {
    const recommendation = getFromLocalstorage('recommendation');
    if (!recommendation || !recommendation.quizz) return false;
    return true;
  };

  const resumeQuizz = () => {
    const recommendation = getFromLocalstorage('recommendation');
    setQuizz(recommendation.quizz);
    setQuizzState(recommendation.quizzState);
  };

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
        <Stack direction="row" spacing={2} justifyContent="center">
          <div>
            <label htmlFor="import-recommendation-input">
              <Input 
                  accept="*.json" 
                  id="import-recommendation-input" 
                  type="file" 
                  onChange={resumeRecommendationFromFile} />
              <Button variant="contained" component="span">
                  Import
              </Button>
            </label>
          </div>
          <div>
            <Button variant="contained" size="large" onClick={startQuizz}>Start</Button>
          </div>
          <div hidden={!checkForResume()}>
            <Button variant="contained" onClick={resumeQuizz}>Resume</Button>
          </div>
        </Stack>
      </div>
    )
  }

  const deleteLocalPattern = (pattern) => {
    let newSelectedPatterns = {...selectedPatterns};
    delete newSelectedPatterns[pattern.individual];
    setSelectedPatterns(newSelectedPatterns);
    setInLocalstorage('patterns', newSelectedPatterns);
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

  const handlePatternClick = async (pattern, selectedTab = 0) => {
    for (let i in pattern.individuals) {
        let linkedPatterns = await getLinkedPatterns(pattern.individuals[i].individual);
        pattern.individuals[i] = {
           ...pattern.individuals[i],
           linkedPatterns
        }
    }

    setModalStates({
        open: true,
        selectedTab,
        pattern
    })
  }

  const sortPatterns = (fKey, sKey) => {
    return chosenPatterns[sKey]['score'] - chosenPatterns[fKey]['score'];
  };

  const displayRankingInfo = () => {
    setRationaleOpen(true);
  };

  const getScoreDisplay = (score) => {
    return scoreDisplay[Math.floor(score*4)];
  };

  const getFilteredChosenPatterns = () => {
    return Object.keys(chosenPatterns)
      .filter(
        key => chosenPatterns[key].label
        .toLowerCase()
        .includes(search.toLowerCase()));
  };

  const displayPatternGrid = () => {
    return (
      <Grid container className={classes.patternSpacing}>
        {getFilteredChosenPatterns()
          .sort(sortPatterns)
          .slice((page - 1) * INTERVAL, page * INTERVAL)
          .map(key => 
            <PatternCard 
              pattern={chosenPatterns[key]}
              selectedPatterns={selectedPatterns}
              handlePatternAction={handlePatternAction}
              patternSubtext={[
                {
                  text: getScoreDisplay(chosenPatterns[key].score).label,
                  variant: 'overline'
                }
              ]}
              color={getScoreDisplay(chosenPatterns[key].score).color}
              isIndividual
            />)
          }
      </Grid>
    )
  }
  const getRecommendedPatternsDisplay = () => {
    return (
      <>
        <Typography variant="h5">Recommended patterns</Typography>
        <Typography variant="body1">
          Please find below the recommended patterns in your case. 
          If you want more information on rankings, <span className={classes.displayRankingInfoLink} onClick={displayRankingInfo}>click me</span> to display a rationale.
        </Typography>
        <br/>
        <Grid container>
          <Grid item sm={10} xs={12}>
            <TextField
              id="searchbar-textfield"
              label="Search a specific pattern ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type the pattern name"
              fullWidth
            />
          </Grid>
          <Grid item sm={2} xs={12} className={classes.optionBtnContainer}>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth 
              className={classes.exportBtn}
              onClick={exportToJSON.bind(this, {...quizz}, 'recommendations.json')}
            >
                Export
            </Button>
          </Grid>
        </Grid>
        {displayPatternGrid()}
        <Pagination 
          count={Math.ceil(getFilteredChosenPatterns().length / INTERVAL)} 
          size="large"
          onChange={(e, page) => setPage(page)}
          style={{display: (Object.keys(patterns).length ? 'block' : 'none')}}
          page={page}
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
        if (getFilteredChosenPatterns().length)
          return getRecommendedPatternsDisplay();
        else
          return (
            <> 
              <Typography variant="h5">No patterns were found for your answers.</Typography>
            </>
            // add reset here
          );
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
      <RationaleDialog open={rationaleOpen} setOpen={setRationaleOpen} />
    </ContentContainer>
  );
}