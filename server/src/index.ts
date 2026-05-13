import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';

const app = express();
const dbUrl = process.env['DATABASE_URL'] ?? `file:${path.resolve(__dirname, '../dev.db')}`;
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

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

// ─── Week routes ─────────────────────────────────────────────────────────────

app.get('/api/weeks', async (_req, res) => {
  const weeks = await prisma.week.findMany({
    orderBy: { weekNumber: 'asc' },
    include: { topics: { orderBy: { id: 'asc' } }, note: true },
  });
  res.json(weeks.map(mapWeek));
});

app.put('/api/weeks/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { notes, topics, isOpen } = req.body;

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
  if (!updated) { res.status(404).json({ error: 'Week not found' }); return; }
  res.json(mapWeek(updated));
});

// ─── Topic routes ─────────────────────────────────────────────────────────────

app.patch('/api/topics/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { isChecked } = req.body;

  try {
    const updated = await prisma.topic.update({
      where: { id },
      data: { isChecked: Boolean(isChecked) },
    });
    res.json({ id: updated.id, label: updated.text, tag: updated.tag, completed: updated.isChecked });
  } catch {
    res.status(404).json({ error: 'Topic not found' });
  }
});

// ─── Notes routes ─────────────────────────────────────────────────────────────

app.post('/api/notes', async (req, res) => {
  const { weekId, content } = req.body;
  if (!weekId) { res.status(400).json({ error: 'weekId is required' }); return; }

  const note = await prisma.note.upsert({
    where: { weekId: Number(weekId) },
    create: { weekId: Number(weekId), content: content ?? '' },
    update: { content: content ?? '' },
  });
  res.json(note);
});

// ─── Practice score routes ────────────────────────────────────────────────────

app.get('/api/practice-scores', async (_req, res) => {
  const scores = await prisma.practiceScore.findMany({ orderBy: { id: 'asc' } });
  res.json(scores.map(s => ({
    id: s.id,
    examName: s.examName,
    score: s.score,
    passingScore: s.passingScore,
    takenAt: s.takenAt ? s.takenAt.toISOString().split('T')[0] : null,
  })));
});

app.put('/api/practice-scores/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { score } = req.body;
  if (score === undefined || score === null) {
    res.status(400).json({ error: 'score is required' }); return;
  }
  const updated = await prisma.practiceScore.update({
    where: { id },
    data: { score: parseFloat(score), takenAt: new Date() },
  });
  res.json({
    id: updated.id, examName: updated.examName, score: updated.score,
    passingScore: updated.passingScore,
    takenAt: updated.takenAt ? updated.takenAt.toISOString().split('T')[0] : null,
  });
});

// ─── Study log routes ─────────────────────────────────────────────────────────

app.get('/api/study-log', async (_req, res) => {
  const entries = await prisma.studyLog.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(entries);
});

app.post('/api/study-log', async (req, res) => {
  const { text, duration } = req.body;
  if (!text?.trim()) { res.status(400).json({ error: 'text is required' }); return; }
  const entry = await prisma.studyLog.create({
    data: { text: text.trim(), duration: duration?.trim() || null },
  });
  res.status(201).json(entry);
});

app.delete('/api/study-log/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    await prisma.studyLog.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Entry not found' });
  }
});

// ─── Export route ─────────────────────────────────────────────────────────────

app.get('/api/export', async (_req, res) => {
  const [weeks, studyLog, practiceScores] = await Promise.all([
    prisma.week.findMany({
      orderBy: { weekNumber: 'asc' },
      include: { topics: { orderBy: { id: 'asc' } }, note: true },
    }),
    prisma.studyLog.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.practiceScore.findMany({ orderBy: { id: 'asc' } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    weeks: weeks.map(mapWeek),
    studyLog,
    practiceScores: practiceScores.map(s => ({
      id: s.id,
      examName: s.examName,
      score: s.score,
      passingScore: s.passingScore,
      takenAt: s.takenAt ? s.takenAt.toISOString().split('T')[0] : null,
    })),
  };

  res.setHeader('Content-Disposition', 'attachment; filename="certtracker-export.json"');
  res.setHeader('Content-Type', 'application/json');
  res.json(payload);
});

app.listen(PORT, () => console.log(`DVA-C02 Tracker server on http://localhost:${PORT}`));
