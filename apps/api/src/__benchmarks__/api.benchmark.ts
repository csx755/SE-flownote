import { setTimeout as sleep } from 'node:timers/promises';
import { performance } from 'node:perf_hooks';

type BenchmarkMode = 'workflow' | 'sustained';
type JsonObject = Record<string, unknown>;

type BenchmarkConfig = {
  mode: BenchmarkMode;
  baseUrl: string;
  users: number;
  iterations: number;
  warmupIterations: number;
  targetQps: number;
  durationSeconds: number;
  seedItems: number;
  maxInflight: number;
  minRps: number;
  timeoutMs: number;
  cleanup: boolean;
};

type RequestSample = {
  name: string;
  status: number;
  ok: boolean;
  ms: number;
};

type CreatedIds = {
  notes: number[];
  pages: number[];
  tasks: number[];
};

type BenchUser = {
  index: number;
  token: string;
  created: CreatedIds;
};

const config: BenchmarkConfig = {
  mode: readModeEnv('BENCH_MODE', 'workflow'),
  baseUrl: readStringEnv('BENCH_BASE_URL', 'http://localhost:3000').replace(/\/$/, ''),
  users: readNumberEnv('BENCH_USERS', 4),
  iterations: readNumberEnv('BENCH_ITERATIONS', 25),
  warmupIterations: readNumberEnv('BENCH_WARMUP_ITERATIONS', 3),
  targetQps: readNumberEnv('BENCH_TARGET_QPS', 1000),
  durationSeconds: readNumberEnv('BENCH_DURATION_SECONDS', 60),
  seedItems: readNumberEnv('BENCH_SEED_ITEMS', 20),
  maxInflight: readNumberEnv('BENCH_MAX_INFLIGHT', 2000),
  minRps: readNumberEnv('BENCH_MIN_RPS', 0),
  timeoutMs: readNumberEnv('BENCH_TIMEOUT_MS', 10_000),
  cleanup: readBooleanEnv('BENCH_CLEANUP', false),
};

const samples: RequestSample[] = [];

async function main() {
  await assertApiIsReady();

  console.log('FlowNote API benchmark');
  console.log(`mode=${config.mode} baseUrl=${config.baseUrl}`);

  if (config.mode === 'sustained') {
    await runSustainedBenchmark();
    return;
  }

  await runWorkflowBenchmark();
}

async function runWorkflowBenchmark() {
  console.log(`users=${config.users} iterations/user=${config.iterations} warmup/user=${config.warmupIterations}`);
  console.log('');

  if (config.warmupIterations > 0) {
    await runWorkflowUsers(config.warmupIterations, false);
  }

  samples.length = 0;
  const startedAt = performance.now();
  await runWorkflowUsers(config.iterations, true);
  const elapsedMs = performance.now() - startedAt;

  printReport(elapsedMs);
}

async function runSustainedBenchmark() {
  console.log(
    `users=${config.users} seedItems/user=${config.seedItems} targetQps=${config.targetQps} duration=${config.durationSeconds}s maxInflight=${config.maxInflight}`,
  );
  console.log('');

  const users = await Promise.all(
    Array.from({ length: config.users }, (_, index) => setupBenchUser(index, config.seedItems)),
  );

  const warmupSeconds = Math.max(0, config.warmupIterations);
  if (warmupSeconds > 0) {
    console.log(`Warmup: ${warmupSeconds}s`);
    await runSustainedLoad(users, warmupSeconds, false);
  }

  samples.length = 0;
  const startedAt = performance.now();
  await runSustainedLoad(users, config.durationSeconds, true);
  const elapsedMs = performance.now() - startedAt;

  if (config.cleanup) {
    await Promise.allSettled(users.map((user) => cleanupCreated(user.token, user.created)));
  }

  printReport(elapsedMs);
}

async function runWorkflowUsers(iterations: number, keepSamples: boolean) {
  await Promise.all(
    Array.from({ length: config.users }, async (_, index) => {
      const user = await setupBenchUser(index, 0, keepSamples);

      try {
        for (let i = 0; i < iterations; i += 1) {
          await runKnowledgeTaskLoop(user.token, user.created, index, i, keepSamples);
        }
      } finally {
        if (config.cleanup) {
          await cleanupCreated(user.token, user.created);
        }
      }
    }),
  );
}

async function setupBenchUser(index: number, seedItems: number, keepSamples = false): Promise<BenchUser> {
  const runId = `${Date.now()}_${process.pid}_${index}_${Math.random().toString(16).slice(2)}`;
  const account = {
    username: `bench_${runId}`.slice(0, 50),
    email: `bench_${runId}@example.test`,
    password: 'Benchmark123',
  };
  const created: CreatedIds = { notes: [], pages: [], tasks: [] };

  const register = await request<{ token: string }>('setup.register', 'POST', '/api/v1/auth/register', {
    username: account.username,
    email: account.email,
    password: account.password,
  }, undefined, keepSamples);

  const login = await request<{ token: string }>('auth.login', 'POST', '/api/v1/auth/login', {
    email: account.email,
    password: account.password,
  }, undefined, keepSamples);

  const token = login.token || register.token;

  for (let i = 0; i < seedItems; i += 1) {
    const marker = `seed user-${index} item-${i} benchmark`;
    const [note, page, task] = await Promise.all([
      request<{ id: number }>('setup.note', 'POST', '/api/v1/notes', {
        content: `# ${marker}\n\n预置笔记，用于时间线、搜索和转换压力。`,
        contentType: 'MARKDOWN',
      }, token, false),
      request<{ id: number }>('setup.page', 'POST', '/api/v1/pages', {
        title: `Seed Page ${index}-${i}`,
        content: `# ${marker}\n\n预置知识页，用于列表、详情和全文搜索压力。`,
      }, token, false),
      request<{ id: number }>('setup.task', 'POST', '/api/v1/tasks', {
        title: `Seed Task ${index}-${i}`,
        description: `预置任务 ${marker}`,
        priority: i % 5 === 0 ? 'HIGH' : 'MEDIUM',
        dueDate: new Date(Date.now() + 86_400_000).toISOString(),
      }, token, false),
    ]);

    created.notes.push(note.id);
    created.pages.push(page.id);
    created.tasks.push(task.id);
  }

  return { index, token, created };
}

async function runKnowledgeTaskLoop(
  token: string,
  created: CreatedIds,
  userIndex: number,
  iteration: number,
  keepSamples: boolean,
) {
  const marker = `benchmark user-${userIndex} iteration-${iteration}`;
  const note = await request<{ id: number }>('note.capture', 'POST', '/api/v1/notes', {
    content: `# ${marker}\n\n会议记录、行动项和搜索关键字 benchmark。`,
    contentType: 'MARKDOWN',
  }, token, keepSamples);
  created.notes.push(note.id);

  if (iteration % 2 === 0) {
    const converted = await request<{ target: { id: number } }>(
      'note.convert.page',
      'POST',
      `/api/v1/notes/${note.id}/convert`,
      { targetType: 'KNOWLEDGE_PAGE', title: `Benchmark Page ${userIndex}-${iteration}` },
      token,
      keepSamples,
    );
    created.pages.push(converted.target.id);
  } else {
    const converted = await request<{ target: { id: number } }>(
      'note.convert.task',
      'POST',
      `/api/v1/notes/${note.id}/convert`,
      { targetType: 'TASK', title: `Benchmark Task From Note ${userIndex}-${iteration}` },
      token,
      keepSamples,
    );
    created.tasks.push(converted.target.id);
  }

  const task = await request<{ id: number }>('task.create', 'POST', '/api/v1/tasks', {
    title: `Follow up ${marker}`,
    description: '验证真实任务创建、列表、统计和状态推进路径。',
    priority: iteration % 5 === 0 ? 'HIGH' : 'MEDIUM',
    dueDate: new Date(Date.now() + 86_400_000).toISOString(),
  }, token, keepSamples);
  created.tasks.push(task.id);

  await request('task.move.in_progress', 'PATCH', `/api/v1/tasks/${task.id}`, {
    status: 'IN_PROGRESS',
  }, token, keepSamples);

  if (iteration % 3 === 0) {
    await request('task.move.done', 'PATCH', `/api/v1/tasks/${task.id}`, {
      status: 'DONE',
    }, token, keepSamples);
  }

  await request('notes.timeline', 'GET', '/api/v1/notes?page=1&pageSize=20&archived=false', undefined, token, keepSamples);
  await request('pages.list', 'GET', '/api/v1/pages?page=1&pageSize=20', undefined, token, keepSamples);
  await request('tasks.kanban.todo', 'GET', '/api/v1/tasks?status=TODO&page=1&pageSize=50', undefined, token, keepSamples);
  await request('tasks.stats', 'GET', '/api/v1/tasks/stats', undefined, token, keepSamples);
  await request('search.global', 'GET', '/api/v1/search?q=benchmark&type=all', undefined, token, keepSamples);
}

async function runSustainedLoad(users: BenchUser[], durationSeconds: number, keepSamples: boolean) {
  const startedAt = performance.now();
  const deadline = startedAt + durationSeconds * 1000;
  const intervalMs = 1000 / config.targetQps;
  const inflight = new Set<Promise<void>>();
  let nextDispatchAt = performance.now();

  while (performance.now() < deadline) {
    const now = performance.now();

    while (nextDispatchAt <= now && inflight.size < config.maxInflight) {
      const user = users[randomInt(users.length)];
      const task = runSustainedOperation(user, keepSamples)
        .catch((error) => {
          if (keepSamples) {
            samples.push({ name: 'client.error', status: 0, ok: false, ms: 0 });
          }
          if (readBooleanEnv('BENCH_LOG_ERRORS', false)) {
            console.error(error);
          }
        })
        .finally(() => {
          inflight.delete(task);
        });

      inflight.add(task);
      nextDispatchAt += intervalMs;
    }

    if (inflight.size >= config.maxInflight) {
      await Promise.race(inflight);
      continue;
    }

    await sleep(Math.max(0, Math.min(nextDispatchAt - performance.now(), 10)));
  }

  await Promise.allSettled(inflight);
}

async function runSustainedOperation(user: BenchUser, keepSamples: boolean) {
  const pick = Math.random() * 100;

  if (pick < 20) {
    await request('notes.timeline', 'GET', '/api/v1/notes?page=1&pageSize=20&archived=false', undefined, user.token, keepSamples);
    return;
  }
  if (pick < 40) {
    await request('tasks.kanban.todo', 'GET', '/api/v1/tasks?status=TODO&page=1&pageSize=50', undefined, user.token, keepSamples);
    return;
  }
  if (pick < 52) {
    await request('pages.list', 'GET', '/api/v1/pages?page=1&pageSize=20', undefined, user.token, keepSamples);
    return;
  }
  if (pick < 62) {
    await request('tasks.stats', 'GET', '/api/v1/tasks/stats', undefined, user.token, keepSamples);
    return;
  }
  if (pick < 70) {
    await request('search.global', 'GET', '/api/v1/search?q=benchmark&type=all', undefined, user.token, keepSamples);
    return;
  }
  if (pick < 78) {
    const taskId = randomFrom(user.created.tasks);
    await request('task.detail', 'GET', `/api/v1/tasks/${taskId}`, undefined, user.token, keepSamples);
    return;
  }
  if (pick < 83) {
    const pageId = randomFrom(user.created.pages);
    await request('page.detail', 'GET', `/api/v1/pages/${pageId}`, undefined, user.token, keepSamples);
    return;
  }
  if (pick < 90) {
    const taskId = randomFrom(user.created.tasks);
    const status = randomFrom(['TODO', 'IN_PROGRESS', 'DONE']);
    await request('task.move', 'PATCH', `/api/v1/tasks/${taskId}`, { status }, user.token, keepSamples);
    return;
  }
  if (pick < 95) {
    const note = await request<{ id: number }>('note.capture', 'POST', '/api/v1/notes', {
      content: `# live benchmark ${Date.now()}\n\n真实使用中的快速捕获 benchmark。`,
      contentType: 'MARKDOWN',
    }, user.token, keepSamples);
    user.created.notes.push(note.id);
    return;
  }
  if (pick < 98) {
    const task = await request<{ id: number }>('task.create', 'POST', '/api/v1/tasks', {
      title: `Live Task ${Date.now()}`,
      description: '高压测试期间创建的真实任务。',
      priority: Math.random() < 0.2 ? 'HIGH' : 'MEDIUM',
      dueDate: new Date(Date.now() + 86_400_000).toISOString(),
    }, user.token, keepSamples);
    user.created.tasks.push(task.id);
    return;
  }

  const noteId = randomFrom(user.created.notes);
  if (Math.random() < 0.5) {
    const converted = await request<{ target: { id: number } }>('note.convert.page', 'POST', `/api/v1/notes/${noteId}/convert`, {
      targetType: 'KNOWLEDGE_PAGE',
      title: `Converted Page ${Date.now()}`,
    }, user.token, keepSamples);
    user.created.pages.push(converted.target.id);
  } else {
    const converted = await request<{ target: { id: number } }>('note.convert.task', 'POST', `/api/v1/notes/${noteId}/convert`, {
      targetType: 'TASK',
      title: `Converted Task ${Date.now()}`,
    }, user.token, keepSamples);
    user.created.tasks.push(converted.target.id);
  }
}

async function cleanupCreated(token: string, created: CreatedIds) {
  await Promise.allSettled(created.notes.map((id) => request('cleanup.note', 'DELETE', `/api/v1/notes/${id}`, undefined, token, false)));
  await Promise.allSettled(created.pages.map((id) => request('cleanup.page', 'DELETE', `/api/v1/pages/${id}`, undefined, token, false)));
  await Promise.allSettled(created.tasks.map((id) => request('cleanup.task', 'DELETE', `/api/v1/tasks/${id}`, undefined, token, false)));
}

async function request<T extends JsonObject = JsonObject>(
  name: string,
  method: string,
  path: string,
  body?: JsonObject,
  token?: string,
  keepSample = true,
): Promise<T> {
  const startedAt = performance.now();
  const response = await fetch(`${config.baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  const ms = performance.now() - startedAt;

  if (keepSample) {
    samples.push({ name, status: response.status, ok: response.ok, ms });
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`${name} failed with ${response.status}: ${text.slice(0, 500)}`);
  }

  return data as T;
}

async function assertApiIsReady() {
  try {
    const response = await fetch(`${config.baseUrl}/health`, {
      signal: AbortSignal.timeout(config.timeoutMs),
    });
    if (!response.ok) {
      throw new Error(`health returned ${response.status}`);
    }
  } catch (error) {
    throw new Error(
      `API is not reachable at ${config.baseUrl}. Start it with "pnpm --filter @flownote/api dev" before running the benchmark.\n${String(error)}`,
    );
  }
}

function printReport(elapsedMs: number) {
  const okSamples = samples.filter((sample) => sample.ok);
  const failedSamples = samples.filter((sample) => !sample.ok);
  const totalRequests = samples.length;
  const requestsPerSecond = totalRequests / (elapsedMs / 1000);

  console.log('Overall');
  console.log(`  requests: ${totalRequests}`);
  console.log(`  failures: ${failedSamples.length}`);
  console.log(`  elapsed:  ${formatMs(elapsedMs)}`);
  console.log(`  rps:      ${requestsPerSecond.toFixed(2)}`);
  if (config.minRps > 0) {
    console.log(`  min rps:  ${config.minRps}`);
  }
  console.log('');

  const grouped = new Map<string, RequestSample[]>();
  for (const sample of okSamples) {
    const group = grouped.get(sample.name) || [];
    group.push(sample);
    grouped.set(sample.name, group);
  }

  console.log('Latency by operation');
  console.log('operation             count   avg     p50     p90     p95     p99     max');
  console.log('--------------------  ------  ------  ------  ------  ------  ------  ------');

  for (const [name, group] of [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const latencies = group.map((sample) => sample.ms).sort((a, b) => a - b);
    const row = [
      name.padEnd(20),
      String(group.length).padStart(6),
      formatMs(mean(latencies)).padStart(6),
      formatMs(percentile(latencies, 50)).padStart(6),
      formatMs(percentile(latencies, 90)).padStart(6),
      formatMs(percentile(latencies, 95)).padStart(6),
      formatMs(percentile(latencies, 99)).padStart(6),
      formatMs(latencies[latencies.length - 1] || 0).padStart(6),
    ];
    console.log(row.join('  '));
  }

  if (failedSamples.length > 0) {
    console.log('');
    console.log('Failures by status');
    const failures = new Map<string, number>();
    for (const sample of failedSamples) {
      const key = `${sample.name} ${sample.status}`;
      failures.set(key, (failures.get(key) || 0) + 1);
    }
    for (const [key, count] of [...failures.entries()].sort()) {
      console.log(`  ${key}: ${count}`);
    }
  }

  if (failedSamples.length > 0 || (config.minRps > 0 && requestsPerSecond < config.minRps)) {
    process.exitCode = 1;
  }
}

function mean(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(sortedValues: number[], p: number) {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}

function formatMs(ms: number) {
  return `${ms.toFixed(1)}ms`;
}

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function randomFrom<T>(values: T[]) {
  return values[randomInt(values.length)];
}

function readModeEnv(name: string, fallback: BenchmarkMode): BenchmarkMode {
  const raw = process.env[name];
  if (!raw) return fallback;
  if (raw === 'workflow' || raw === 'sustained') return raw;
  throw new Error(`${name} must be "workflow" or "sustained"`);
}

function readStringEnv(name: string, fallback: string) {
  return process.env[name] || fallback;
}

function readNumberEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return Math.floor(parsed);
}

function readBooleanEnv(name: string, fallback: boolean) {
  const raw = process.env[name];
  if (!raw) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
