import React, { useCallback, useEffect, useState } from 'react';
import { Brain, CheckCircle, Clock, Target, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getQuizQuestions, QuizDifficulty, QuizQuestion, quizCategoryOptions } from '../services/learningContent';

const QUESTION_TIME_LIMITS: Record<QuizDifficulty, number> = {
  easy: 7 * 60,
  medium: 10 * 60,
  hard: 13 * 60
};

const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<'setup' | 'quiz' | 'result'>('setup');
  const [selectedCategory, setSelectedCategory] = useState('python');
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuizDifficulty>('medium');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMITS.medium);
  const [startTime, setStartTime] = useState(0);
  const [finalTimeSpent, setFinalTimeSpent] = useState(0);

  const getElapsedTime = useCallback(() => {
    if (!startTime) {
      return 0;
    }

    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const configuredLimit = QUESTION_TIME_LIMITS[selectedDifficulty];
    return Math.min(configuredLimit, Math.max(0, elapsedSeconds));
  }, [selectedDifficulty, startTime]);

  useEffect(() => {
    if (view !== 'quiz') {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previousValue) => {
        if (previousValue <= 1) {
          clearInterval(timer);
          setFinalTimeSpent(getElapsedTime());
          setView('result');
          return 0;
        }

        return previousValue - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [getElapsedTime, view]);

  const startQuiz = () => {
    const nextQuestions = getQuizQuestions(selectedCategory, selectedDifficulty);
    const nextTimeLimit = QUESTION_TIME_LIMITS[selectedDifficulty];

    setQuestions(nextQuestions);
    setSelectedAnswers([]);
    setCurrentQuestionIndex(0);
    setTimeLeft(nextTimeLimit);
    setStartTime(Date.now());
    setFinalTimeSpent(0);
    setView('quiz');
  };

  const finishQuiz = () => {
    setFinalTimeSpent(getElapsedTime());
    setView('result');
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswers((previousValue) => {
      const nextAnswers = [...previousValue];
      nextAnswers[currentQuestionIndex] = answerIndex;
      return nextAnswers;
    });
  };

  const resetQuiz = () => {
    setView('setup');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setTimeLeft(QUESTION_TIME_LIMITS.medium);
    setStartTime(0);
    setFinalTimeSpent(0);
  };

  const correctAnswers = selectedAnswers.reduce((count, answer, index) => count + (answer === questions[index]?.correctAnswer ? 1 : 0), 0);
  const score = questions.length ? Math.round((correctAnswers / questions.length) * 100) : 0;
  const currentQuestion = questions[currentQuestionIndex];

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  if (view === 'setup') {
    const estimatedTime = QUESTION_TIME_LIMITS[selectedDifficulty];

    return (
      <div className="bg-gray-50 px-4 py-10 dark:bg-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-lg dark:bg-slate-800">
          <div className="mb-10 text-center">
            <Brain className="mx-auto mb-4 h-16 w-16 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Programming Quiz</h1>
            <p className="mt-3 text-lg text-gray-600 dark:text-slate-400">Pick a category and test your understanding in a timed format.</p>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Category</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {quizCategoryOptions.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      selectedCategory === category.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">{category.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Difficulty</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                  <button
                    key={difficulty}
                    onClick={() => setSelectedDifficulty(difficulty)}
                    className={`rounded-2xl border p-4 text-center capitalize transition-colors ${
                      selectedDifficulty === difficulty
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">{difficulty}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 rounded-2xl bg-gray-50 p-5 text-center dark:bg-slate-700 md:grid-cols-3">
              <div>
                <div className="text-sm text-gray-500 dark:text-slate-400">Questions</div>
                <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{getQuizQuestions(selectedCategory, selectedDifficulty).length}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-slate-400">Estimated time</div>
                <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{formatTime(estimatedTime)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-slate-400">Focus</div>
                <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {quizCategoryOptions.find((category) => category.id === selectedCategory)?.name}
                </div>
              </div>
            </div>

            <div className="text-center">
              <button onClick={startQuiz} className="rounded-2xl bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700">
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'quiz' && currentQuestion) {
    return (
      <div className="bg-gray-50 px-4 py-10 dark:bg-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-lg dark:bg-slate-800">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {quizCategoryOptions.find((category) => category.id === selectedCategory)?.name} quiz
                </h2>
                <p className="text-sm capitalize text-gray-600 dark:text-slate-400">{selectedDifficulty} difficulty</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400">
                <span>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="inline-flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-slate-700">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }} />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-lg dark:bg-slate-800">
            <h3 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">{currentQuestion.question}</h3>
            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => {
                const selected = selectedAnswers[currentQuestionIndex] === index;

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                      selected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="font-medium text-gray-900 dark:text-white">{option}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setCurrentQuestionIndex((previousValue) => Math.max(0, previousValue - 1))}
                disabled={currentQuestionIndex === 0}
                className="rounded-2xl border border-gray-300 px-5 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  if (currentQuestionIndex === questions.length - 1) {
                    finishQuiz();
                  } else {
                    setCurrentQuestionIndex((previousValue) => previousValue + 1);
                  }
                }}
                className="rounded-2xl bg-blue-600 px-5 py-2 font-medium text-white transition-colors hover:bg-blue-700"
              >
                {currentQuestionIndex === questions.length - 1 ? 'Submit' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 px-4 py-10 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-lg dark:bg-slate-800">
        <div className="mb-8 text-center">
          {score >= 70 ? <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" /> : <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Quiz Complete</h2>
          <div className="mt-3 text-6xl font-bold text-blue-600 dark:text-blue-400">{score}%</div>
          <p className="mt-2 text-gray-600 dark:text-slate-400">
            {correctAnswers} of {questions.length} correct in {formatTime(finalTimeSpent)}
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-gray-50 p-5 text-center dark:bg-slate-700">
            <Target className="mx-auto mb-2 h-6 w-6 text-blue-600" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{correctAnswers}</div>
            <div className="text-sm text-gray-600 dark:text-slate-400">Correct answers</div>
          </div>
          <div className="rounded-2xl bg-gray-50 p-5 text-center dark:bg-slate-700">
            <Clock className="mx-auto mb-2 h-6 w-6 text-blue-600" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatTime(finalTimeSpent)}</div>
            <div className="text-sm text-gray-600 dark:text-slate-400">Time spent</div>
          </div>
          <div className="rounded-2xl bg-gray-50 p-5 text-center dark:bg-slate-700">
            <Brain className="mx-auto mb-2 h-6 w-6 text-blue-600" />
            <div className="text-2xl font-bold capitalize text-gray-900 dark:text-white">{selectedDifficulty}</div>
            <div className="text-sm text-gray-600 dark:text-slate-400">Difficulty</div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <button onClick={resetQuiz} className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700">
            Take Another Quiz
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-2xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
