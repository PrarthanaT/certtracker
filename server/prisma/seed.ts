import path from 'path';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';

const dbUrl = `file:${path.resolve(__dirname, '../dev.db')}`;
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

type T = { text: string; tag: string };
const t = (text: string, tag: string): T => ({ text, tag });

const weeks = [
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
      t('SQS standard vs FIFO, visibility timeout, and DLQ',          'Messaging'),
      t('SNS topics, subscriptions, and fan-out pattern',              'Messaging'),
      t('EventBridge event buses, rules, and targets',                 'Messaging'),
      t('Kinesis Data Streams shards, producers, and consumers',       'Messaging'),
      t('Decoupled architecture patterns',                             'Messaging'),
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
      t('CodeCommit repos and branching strategies',                       'DevOps'),
      t('CodeBuild buildspec.yml and phases',                              'DevOps'),
      t('CodeDeploy in-place vs blue/green deployment',                    'DevOps'),
      t('CodePipeline stages and actions',                                 'DevOps'),
      t('Elastic Beanstalk deployment modes: all-at-once, rolling, immutable', 'DevOps'),
      t('CloudFormation templates, stacks, and change sets',               'DevOps'),
    ],
  },
  {
    weekNumber: 7, title: 'Monitoring & Observability', days: 7,
    topics: [
      t('CloudWatch metrics, alarms, and dashboards',               'Monitoring'),
      t('CloudWatch Logs: log groups, metric filters, and Insights', 'Monitoring'),
      t('X-Ray tracing, sampling, and service maps',                'Monitoring'),
      t('CloudTrail API logging and event history',                  'Monitoring'),
      t('Instrument Lambda with X-Ray',                              'Monitoring'),
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
      t('AWS official practice set — timed',               'DevOps'),
      t('Identify weak domains from score breakdown',       'Monitoring'),
      t('Review every wrong answer with explanations',      'Monitoring'),
      t('Tutorials Dojo practice exam 1',                   'DevOps'),
      t('Re-drill weak areas with flashcards',              'Monitoring'),
    ],
  },
  {
    weekNumber: 10, title: 'Final Review & Exam Day', days: 7,
    topics: [
      t('Tutorials Dojo practice exam 2 — target 85%+',    'DevOps'),
      t('Review anti-patterns and common distractors',      'Monitoring'),
      t('Skim service limits cheat sheet',                  'DevOps'),
      t('Book the exam on Pearson VUE',                     'DevOps'),
      t('Exam day strategy and logistics',                  'DevOps'),
    ],
  },
];

const practiceScores = [
  { examName: 'AWS Official Practice Set',  passingScore: 72 },
  { examName: 'Tutorials Dojo Exam #1',     passingScore: 72 },
  { examName: 'Tutorials Dojo Exam #2',     passingScore: 72 },
  { examName: 'Tutorials Dojo Exam #3',     passingScore: 72 },
  { examName: 'Tutorials Dojo Final Review',passingScore: 72 },
];

async function main() {
  console.log('Seeding database...');
  await prisma.topic.deleteMany();
  await prisma.note.deleteMany();
  await prisma.week.deleteMany();
  await prisma.studyLog.deleteMany();
  await prisma.practiceScore.deleteMany();

  for (const w of weeks) {
    await prisma.week.create({
      data: { weekNumber: w.weekNumber, title: w.title, days: w.days, topics: { create: w.topics } },
    });
  }
  for (const ps of practiceScores) {
    await prisma.practiceScore.create({ data: ps });
  }
  console.log(`Seeded ${weeks.length} weeks and ${practiceScores.length} practice score slots.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
