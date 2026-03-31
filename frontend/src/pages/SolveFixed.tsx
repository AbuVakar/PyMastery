import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, LoadingPage } from '../components/ui';
import { getPracticeProblemById, LearningProblem } from '../services/learningContent';
import { fixedApiService } from '../services/fixedApi';

interface CodeExecutionServiceStatus {
  configured?: boolean;
  available?: boolean;
  execution_enabled?: boolean;
  fallback_enabled?: boolean;
  mode?: string;
  message?: string;
}

interface CodeExecutionResultPayload {
  result?: {
    stdout?: string;
    stderr?: string;
    compile_output?: string;
    status?: string;
    time?: string;
    memory?: string;
  };
  status?: string;
}

type CodeExecutionResultData = NonNullable<CodeExecutionResultPayload['result']>;
type ExecutionDisplayMode = 'live' | 'demo' | 'disabled';

const getExecutionDisplayMode = (status: CodeExecutionServiceStatus): ExecutionDisplayMode => {
  if (status.fallback_enabled) {
    return 'demo';
  }

  if (
    status.execution_enabled === false ||
    status.configured === false ||
    status.available === false
  ) {
    return 'disabled';
  }

  return 'live';
};

const getExecutionStatusMessage = (
  status: CodeExecutionServiceStatus,
  isCheckingExecutionService: boolean
): string => {
  if (isCheckingExecutionService) {
    return '';
  }

  const displayMode = getExecutionDisplayMode(status);
  if (displayMode === 'demo') {
    return 'Demo Mode execution is active in this environment.';
  }

  if (displayMode === 'disabled') {
    return 'Code execution is unavailable in this environment.';
  }

  return '';
};

const SolveFixed: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<LearningProblem | null>(null);
  const [code, setCode] = useState('');
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('');
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingExecutionService, setIsCheckingExecutionService] = useState(true);
  const [executionServiceStatus, setExecutionServiceStatus] = useState<CodeExecutionServiceStatus>({
    configured: true,
    available: true,
    execution_enabled: true,
    fallback_enabled: false,
    message: ''
  });

  useEffect(() => {
    let mounted = true;

    const loadProblem = async () => {
      try {
        const nextProblem = await getPracticeProblemById(id);
        if (!mounted) {
          return;
        }

        setProblem(nextProblem);
        setCode(nextProblem.starterCode);
        setOutput('');
        setRunStatus('idle');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    setIsLoading(true);
    void loadProblem();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;

    const loadExecutionServiceStatus = async () => {
      try {
        const payload = (await fixedApiService.codeExecution.getServiceStatus()) as CodeExecutionServiceStatus;

        if (!mounted) {
          return;
        }

        setExecutionServiceStatus({
          configured: payload.configured ?? true,
          available: payload.available ?? true,
          execution_enabled: payload.execution_enabled ?? payload.available ?? true,
          fallback_enabled: payload.fallback_enabled ?? false,
          mode: payload.mode,
          message: payload.message || ''
        });
      } catch (error) {
        if (!mounted) {
          return;
        }

        setExecutionServiceStatus({
          configured: false,
          available: false,
          execution_enabled: false,
          fallback_enabled: false,
          message: error instanceof Error ? error.message : 'Service status unavailable.'
        });
      } finally {
        if (mounted) {
          setIsCheckingExecutionService(false);
        }
      }
    };

    void loadExecutionServiceStatus();

    return () => {
      mounted = false;
    };
  }, []);

  const executionDisplayMode = getExecutionDisplayMode(executionServiceStatus);
  const executionStatusMessage = getExecutionStatusMessage(
    executionServiceStatus,
    isCheckingExecutionService
  );
  const executionUnavailableMessage = executionDisplayMode === 'disabled' ? executionStatusMessage : '';

  const handleRun = async () => {
    if (runStatus === 'running' || !problem) {
      return;
    }

    if (executionUnavailableMessage) {
      setRunStatus('error');
      setOutput(executionUnavailableMessage);
      return;
    }

    setRunStatus('running');
    setOutput(
      executionDisplayMode === 'demo'
        ? 'Running your code in Demo Mode...'
        : 'Submitting your code for execution...'
    );

    try {
      const data = (await fixedApiService.codeExecution.execute({
        source_code: code,
        language: 'python',
        stdin,
        time_limit: 5,
        memory_limit: 128
      })) as CodeExecutionResultPayload;

      const execResult = (data.result ?? data) as CodeExecutionResultData;
      const stdout = execResult?.stdout ?? '';
      const stderr = execResult?.stderr ?? '';
      const compileOut = execResult?.compile_output ?? '';
      const status = execResult?.status ?? data.status ?? 'Unknown';
      const time = execResult?.time ?? '';
      const memory = execResult?.memory ?? '';

      const lines: string[] = [];
      lines.push(`Status: ${status}`);
      if (time) {
        lines.push(`Time:   ${time}s`);
      }
      if (memory) {
        lines.push(`Memory: ${memory} KB`);
      }
      lines.push('');

      if (compileOut) {
        lines.push('--- Compile Output ---');
        lines.push(compileOut);
        lines.push('');
      }
      if (stdout) {
        lines.push('--- Output ---');
        lines.push(stdout);
      }
      if (stderr) {
        lines.push('--- Errors ---');
        lines.push(stderr);
      }
      if (!stdout && !stderr && !compileOut) {
        lines.push('(no output)');
      }

      const isSuccessful = /^(success|accepted)$/i.test(status);
      setRunStatus(isSuccessful ? 'success' : 'error');
      setOutput(lines.join('\n'));
    } catch {
      const message = executionDisplayMode === 'demo'
        ? 'Demo Mode execution could not complete right now. Please try again.'
        : 'Code execution is unavailable in this environment.';
      setRunStatus('error');
      setOutput(message);
    }
  };

  const handleSubmit = () => {
    if (!problem) {
      return;
    }

    navigate('/problems');
  };

  if (isLoading || !problem) {
    return <LoadingPage message="Loading problem workspace..." />;
  }

  const statusIcon =
    runStatus === 'success' ? (
      <CheckCircle className="h-4 w-4 text-green-400" />
    ) : runStatus === 'error' ? (
      <XCircle className="h-4 w-4 text-red-400" />
    ) : null;

  return (
    <div className="bg-slate-950 text-white">
      <div className="border-b border-white/10 bg-slate-900 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link to="/problems" className="text-gray-400 transition-colors hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold">
                Problem #{problem.id}: {problem.title}
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                {problem.category} | {problem.difficulty} | +{problem.xp} XP
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-300 hover:text-white"
              onClick={() => {
                setCode(problem.starterCode);
                setOutput('');
                setRunStatus('idle');
              }}
            >
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleRun}
              isLoading={runStatus === 'running'}
              disabled={runStatus === 'running' || isCheckingExecutionService || Boolean(executionUnavailableMessage)}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCheckingExecutionService
                ? 'Checking...'
                : executionDisplayMode === 'disabled'
                ? 'Execution Unavailable'
                : executionDisplayMode === 'demo'
                  ? 'Run Demo'
                  : 'Run Code'}
            </Button>
            <Button size="sm" onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              Submit
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid min-h-[70vh] max-w-7xl gap-0 lg:grid-cols-[2fr_1fr]">
        <section className="flex flex-col border-r border-white/10">
          <div className="border-b border-white/10 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            editor.py
          </div>
          <textarea
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="min-h-[28rem] flex-1 resize-none bg-slate-950 p-6 font-mono text-sm text-cyan-300 outline-none"
            spellCheck={false}
          />

          <div className="border-t border-white/10">
            <div className="border-b border-white/10 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              stdin (optional)
            </div>
            <textarea
              value={stdin}
              onChange={(event) => setStdin(event.target.value)}
              placeholder="Provide standard input here..."
              className="h-20 w-full resize-none bg-slate-900 p-3 font-mono text-xs text-gray-300 outline-none placeholder-slate-600"
            />
          </div>
        </section>

        <aside className="flex flex-col bg-slate-900">
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {problem.dataSource === 'demo' && (
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100">
                <p className="font-semibold text-blue-50">Sample Data</p>
                <p className="mt-1 text-blue-100/90">
                  {problem.dataMessage || 'This problem is being shown from Sample Data because live problem data is unavailable right now.'}
                </p>
              </div>
            )}
            {isCheckingExecutionService && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <p className="font-semibold text-white">Checking execution availability</p>
                <p className="mt-1 text-slate-300">
                  PyMastery is verifying whether code execution is available in this environment.
                </p>
              </div>
            )}
            {executionUnavailableMessage && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                <p className="font-semibold text-amber-50">Code execution unavailable</p>
                <p className="mt-1 text-amber-100/90">{executionUnavailableMessage}</p>
              </div>
            )}
            {executionDisplayMode === 'demo' && (
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100">
                <p className="font-semibold text-blue-50">Demo Mode execution</p>
                <p className="mt-1 text-blue-100/90">
                  This environment is using the built-in demo executor for code runs.
                </p>
              </div>
            )}
            <div>
              <h2 className="mb-2 text-lg font-semibold">Problem Description</h2>
              <p className="text-sm leading-relaxed text-gray-300">{problem.description}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Constraints</h3>
              <ul className="list-disc space-y-2 pl-4 text-xs text-gray-300">
                {problem.constraints.map((constraint) => (
                  <li key={constraint}>{constraint}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 bg-slate-950">
            <div className="flex items-center gap-2 border-b border-white/10 bg-slate-900/70 px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Console Output</span>
              {statusIcon}
            </div>
            <pre className="min-h-[14rem] max-h-[32rem] overflow-y-auto whitespace-pre-wrap break-words p-4 font-mono text-xs text-gray-300">
              {output || (
                isCheckingExecutionService
                  ? 'Checking execution availability...'
                  : executionDisplayMode === 'disabled'
                  ? 'Code execution is unavailable in this environment.'
                  : executionDisplayMode === 'demo'
                    ? 'Demo Mode execution results will appear here.'
                    : 'Run the code to see output here.'
              )}
            </pre>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SolveFixed;
