import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// ─── Setup ───────────────────────────────────────────────────────────────────

const app = express();
const pool = new pg.Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const PORT = process.env['PORT'] || 3001;
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';

app.use(cors({
  origin: (origin, cb) => {
    // Allow any localhost origin (covers port bumps in dev) and the configured CLIENT_URL
    if (!origin || origin === CLIENT_URL || /^http:\/\/localhost:\d+$/.test(origin)) {
      cb(null, true);
    } else {
      cb(new Error('CORS: origin not allowed'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET ?? 'session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 10 * 60 * 1000 }, // 10 min — only needed for OAuth handshake
}));
app.use(passport.initialize());
app.use(passport.session());

// ─── Extend Request type ──────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
    }
    interface Request {
      jwtUser?: { userId: string };
    }
  }
}

// ─── Passport: serialization + Google strategy ────────────────────────────────

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user ?? false);
  } catch (err) {
    done(err);
  }
});

const GOOGLE_ENABLED =
  !!process.env.GOOGLE_CLIENT_ID &&
  !process.env.GOOGLE_CLIENT_ID.startsWith('your-');

if (GOOGLE_ENABLED) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env['SERVER_URL'] ?? `http://localhost:${PORT}`}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email returned from Google'));
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({ data: { email, passwordHash: '' } });
          await seedUserData(user.id);
        }
        return done(null, { id: user.id, email: user.email });
      } catch (err) {
        return done(err as Error);
      }
    }
  ));
}

// ─── Seed data (used on register) ────────────────────────────────────────────

type TopicSeed = { text: string; tag: string };
const t = (text: string, tag: string): TopicSeed => ({ text, tag });

const WEEK_TEMPLATES = [
  {
    weekNumber: 1, title: 'AWS Core Services', days: 7,
    topics: [
      t('IAM users, roles, and policies',              'IAM'),
      t('EC2 instance types and AMIs',                 'Compute'),
      t('VPC subnets, security groups, and NACLs',     'Security'),
      t('S3 buckets, versioning, and lifecycle rules', 'Database'),
      t('AWS CLI and SDK setup',                       'DevOps'),
      t('Enroll in AWS Skill Builder',                 'DevOps'),
    ],
  },
  {
    weekNumber: 2, title: 'Serverless & Lambda', days: 7,
    topics: [
      t('Lambda triggers, execution model, cold starts, and concurrency', 'Serverless'),
      t('API Gateway REST vs HTTP vs WebSocket and authorization',         'Serverless'),
      t('Lambda layers, environment variables, and deployment packages',  'Serverless'),
      t('SAM template structure',                                          'Serverless'),
      t('Build a Lambda triggered by API Gateway',                         'Serverless'),
    ],
  },
  {
    weekNumber: 3, title: 'DynamoDB & Databases', days: 7,
    topics: [
      t('Partition keys, sort keys, GSIs, and LSIs',              'Database'),
      t('Read/write capacity: on-demand vs provisioned',          'Database'),
      t('DynamoDB Streams, TTL, and conditional writes',          'Database'),
      t('ElastiCache Redis vs Memcached caching patterns',        'Database'),
      t('RDS Multi-AZ and Read Replicas',                         'Database'),
      t('Single-table design practice',                           'Database'),
    ],
  },
  {
    weekNumber: 4, title: 'Messaging & Event-Driven', days: 7,
    topics: [
      t('SQS standard vs FIFO, visibility timeout, and DLQ',     'Messaging'),
      t('SNS topics, subscriptions, and fan-out pattern',         'Messaging'),
      t('EventBridge event buses, rules, and targets',            'Messaging'),
      t('Kinesis Data Streams shards, producers, and consumers',  'Messaging'),
      t('Decoupled architecture patterns',                        'Messaging'),
    ],
  },
  {
    weekNumber: 5, title: 'Security Deep Dive', days: 7,
    topics: [
      t('IAM roles for services, resource-based vs identity policies', 'IAM'),
      t('Cognito User Pools vs Identity Pools',                        'Security'),
      t('KMS envelope encryption and CMKs',                            'Security'),
      t('Secrets Manager vs Parameter Store',                          'Security'),
      t('STS assume role and cross-account access',                    'IAM'),
      t('Build a Cognito-protected API Gateway endpoint',              'Security'),
    ],
  },
  {
    weekNumber: 6, title: 'CI/CD & IaC', days: 7,
    topics: [
      t('CodeCommit repos and branching strategies',                            'DevOps'),
      t('CodeBuild buildspec.yml and phases',                                   'DevOps'),
      t('CodeDeploy in-place vs blue/green deployment',                         'DevOps'),
      t('CodePipeline stages and actions',                                      'DevOps'),
      t('Elastic Beanstalk deployment modes: all-at-once, rolling, immutable',  'DevOps'),
      t('CloudFormation templates, stacks, and change sets',                    'DevOps'),
    ],
  },
  {
    weekNumber: 7, title: 'Monitoring & Observability', days: 7,
    topics: [
      t('CloudWatch metrics, alarms, and dashboards',                'Monitoring'),
      t('CloudWatch Logs: log groups, metric filters, and Insights',  'Monitoring'),
      t('X-Ray tracing, sampling, and service maps',                 'Monitoring'),
      t('CloudTrail API logging and event history',                   'Monitoring'),
      t('Instrument Lambda with X-Ray',                               'Monitoring'),
    ],
  },
  {
    weekNumber: 8, title: 'Containers', days: 7,
    topics: [
      t('ECS task definitions, services, Fargate vs EC2 launch type', 'Compute'),
      t('ECR image pushing and lifecycle policies',                    'Compute'),
      t('EKS basics — exam-level familiarity',                         'Compute'),
      t('App Runner vs ECS vs Lambda decision framework',              'Compute'),
      t('Container security and IAM task roles',                       'Security'),
    ],
  },
  {
    weekNumber: 9, title: 'Practice Exam Blitz', days: 7,
    topics: [
      t('AWS official practice set — timed',            'DevOps'),
      t('Identify weak domains from score breakdown',    'Monitoring'),
      t('Review every wrong answer with explanations',   'Monitoring'),
      t('Tutorials Dojo practice exam 1',                'DevOps'),
      t('Re-drill weak areas with flashcards',           'Monitoring'),
    ],
  },
  {
    weekNumber: 10, title: 'Final Review & Exam Day', days: 7,
    topics: [
      t('Tutorials Dojo practice exam 2 — target 85%+', 'DevOps'),
      t('Review anti-patterns and common distractors',   'Monitoring'),
      t('Skim service limits cheat sheet',               'DevOps'),
      t('Book the exam on Pearson VUE',                  'DevOps'),
      t('Exam day strategy and logistics',               'DevOps'),
    ],
  },
];

const SCORE_TEMPLATES = [
  { examName: 'AWS Official Practice Set',   passingScore: 72 },
  { examName: 'Tutorials Dojo Exam #1',      passingScore: 72 },
  { examName: 'Tutorials Dojo Exam #2',      passingScore: 72 },
  { examName: 'Tutorials Dojo Exam #3',      passingScore: 72 },
  { examName: 'Tutorials Dojo Final Review', passingScore: 72 },
];

async function seedUserData(userId: string) {
  for (const w of WEEK_TEMPLATES) {
    await prisma.week.create({
      data: {
        userId,
        weekNumber: w.weekNumber,
        title: w.title,
        days: w.days,
        topics: { create: w.topics },
      },
    });
  }
  for (const s of SCORE_TEMPLATES) {
    await prisma.practiceScore.create({ data: { userId, ...s } });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type WeekStatus = 'not-started' | 'in-progress' | 'complete';

function computeStatus(topics: { isChecked: boolean }[]): WeekStatus {
  if (topics.length === 0) return 'not-started';
  const done = topics.filter(t => t.isChecked).length;
  if (done === 0) return 'not-started';
  if (done === topics.length) return 'complete';
  return 'in-progress';
}

function mapWeek(week: {
  id: number; weekNumber: number; title: string; days: number; isOpen: boolean; createdAt: Date;
  topics: { id: number; text: string; tag: string; isChecked: boolean }[];
  note: { content: string } | null;
}) {
  return {
    id: week.id,
    weekNumber: week.weekNumber,
    title: week.title,
    days: week.days,
    isOpen: week.isOpen,
    status: computeStatus(week.topics) as WeekStatus,
    notes: week.note?.content ?? '',
    topics: week.topics.map(t => ({
      id: t.id,
      label: t.text,
      tag: t.tag,
      completed: t.isChecked,
    })),
  };
}

function mapScore(s: { id: number; examName: string; score: number | null; passingScore: number; takenAt: Date | null }) {
  return {
    id: s.id,
    examName: s.examName,
    score: s.score,
    passingScore: s.passingScore,
    takenAt: s.takenAt ? s.takenAt.toISOString().split('T')[0] : null,
  };
}

// ─── Auth middleware ──────────────────────────────────────────────────────────

function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed token' });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.jwtUser = { userId: payload.userId };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── Auth routes ─────────────────────────────────────────────────────────────

// Google OAuth
app.get('/api/auth/google', (req, res, next) => {
  if (!GOOGLE_ENABLED) {
    res.redirect(`${CLIENT_URL}?error=Google+OAuth+is+not+configured+on+this+server`);
    return;
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

app.get('/api/auth/google/callback',
  (req, res, next) => {
    passport.authenticate('google', {
      failureRedirect: `${CLIENT_URL}?error=Google+sign-in+failed`,
    })(req, res, next);
  },
  (req, res) => {
    const user = req.user as Express.User;
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    // Redirect to frontend with token — AppShell picks it up from URL params
    res.redirect(`${CLIENT_URL}?token=${encodeURIComponent(token)}`);
  }
);

// Email / password
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password) {
    res.status(400).json({ error: 'email and password are required' }); return;
  }
  const existing = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (existing) {
    res.status(409).json({ error: 'An account with that email already exists' }); return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email: email.trim(), passwordHash },
  });
  await seedUserData(user.id);
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, email: user.email } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password) {
    res.status(400).json({ error: 'email and password are required' }); return;
  }
  const user = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' }); return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password' }); return;
  }
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email } });
});

// ─── Week routes ─────────────────────────────────────────────────────────────

app.get('/api/weeks', verifyToken, async (req, res) => {
  const { userId } = req.jwtUser!;
  const weeks = await prisma.week.findMany({
    where: { userId },
    orderBy: { weekNumber: 'asc' },
    include: { topics: { orderBy: { id: 'asc' } }, note: true },
  });
  res.json(weeks.map(mapWeek));
});

app.put('/api/weeks/:id', verifyToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { userId } = req.jwtUser!;
  const { notes, topics, isOpen } = req.body;

  const week = await prisma.week.findFirst({ where: { id, userId } });
  if (!week) { res.status(404).json({ error: 'Week not found' }); return; }

  if (notes !== undefined) {
    await prisma.note.upsert({
      where: { weekId: id },
      create: { weekId: id, content: notes },
      update: { content: notes },
    });
  }
  if (isOpen !== undefined) {
    await prisma.week.update({ where: { id }, data: { isOpen } });
  }
  if (Array.isArray(topics)) {
    await Promise.all(
      topics.map((t: { id: number; completed: boolean }) =>
        prisma.topic.update({ where: { id: t.id }, data: { isChecked: t.completed } })
      )
    );
  }

  const updated = await prisma.week.findUnique({
    where: { id },
    include: { topics: { orderBy: { id: 'asc' } }, note: true },
  });
  res.json(mapWeek(updated!));
});

// ─── Topic routes ─────────────────────────────────────────────────────────────

app.patch('/api/topics/:id', verifyToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { userId } = req.jwtUser!;
  const { isChecked } = req.body;

  const topic = await prisma.topic.findFirst({
    where: { id, week: { userId } },
  });
  if (!topic) { res.status(404).json({ error: 'Topic not found' }); return; }

  const updated = await prisma.topic.update({
    where: { id },
    data: { isChecked: Boolean(isChecked) },
  });
  res.json({ id: updated.id, label: updated.text, tag: updated.tag, completed: updated.isChecked });
});

// ─── Notes routes ─────────────────────────────────────────────────────────────

app.post('/api/notes', verifyToken, async (req, res) => {
  const { weekId, content } = req.body;
  const { userId } = req.jwtUser!;
  if (!weekId) { res.status(400).json({ error: 'weekId is required' }); return; }

  const week = await prisma.week.findFirst({ where: { id: Number(weekId), userId } });
  if (!week) { res.status(404).json({ error: 'Week not found' }); return; }

  const note = await prisma.note.upsert({
    where: { weekId: Number(weekId) },
    create: { weekId: Number(weekId), content: content ?? '' },
    update: { content: content ?? '' },
  });
  res.json(note);
});

// ─── Practice score routes ────────────────────────────────────────────────────

app.get('/api/practice-scores', verifyToken, async (req, res) => {
  const { userId } = req.jwtUser!;
  const scores = await prisma.practiceScore.findMany({
    where: { userId },
    orderBy: { id: 'asc' },
  });
  res.json(scores.map(mapScore));
});

app.put('/api/practice-scores/:id', verifyToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { userId } = req.jwtUser!;
  const { score } = req.body;

  if (score === undefined || score === null) {
    res.status(400).json({ error: 'score is required' }); return;
  }
  const existing = await prisma.practiceScore.findFirst({ where: { id, userId } });
  if (!existing) { res.status(404).json({ error: 'Score not found' }); return; }

  const updated = await prisma.practiceScore.update({
    where: { id },
    data: { score: parseFloat(score), takenAt: new Date() },
  });
  res.json(mapScore(updated));
});

// ─── Study log routes ─────────────────────────────────────────────────────────

app.get('/api/study-log', verifyToken, async (req, res) => {
  const { userId } = req.jwtUser!;
  const entries = await prisma.studyLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(entries);
});

app.post('/api/study-log', verifyToken, async (req, res) => {
  const { text, duration } = req.body;
  const { userId } = req.jwtUser!;
  if (!text?.trim()) { res.status(400).json({ error: 'text is required' }); return; }
  const entry = await prisma.studyLog.create({
    data: { userId, text: text.trim(), duration: duration?.trim() || null },
  });
  res.status(201).json(entry);
});

app.delete('/api/study-log/:id', verifyToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { userId } = req.jwtUser!;
  try {
    await prisma.studyLog.delete({ where: { id, userId } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Entry not found' });
  }
});

// ─── Export route ─────────────────────────────────────────────────────────────

app.get('/api/export', verifyToken, async (req, res) => {
  const { userId } = req.jwtUser!;
  const [weeks, studyLog, practiceScores] = await Promise.all([
    prisma.week.findMany({
      where: { userId },
      orderBy: { weekNumber: 'asc' },
      include: { topics: { orderBy: { id: 'asc' } }, note: true },
    }),
    prisma.studyLog.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.practiceScore.findMany({ where: { userId }, orderBy: { id: 'asc' } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    weeks: weeks.map(mapWeek),
    studyLog,
    practiceScores: practiceScores.map(mapScore),
  };

  res.setHeader('Content-Disposition', 'attachment; filename="certtracker-export.json"');
  res.setHeader('Content-Type', 'application/json');
  res.json(payload);
});

if (process.env['NODE_ENV'] !== 'production') {
  app.listen(PORT, () => console.log(`DVA-C02 Tracker server on http://localhost:${PORT}`));
}

export default app;

