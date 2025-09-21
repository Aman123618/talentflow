import Dexie from 'dexie';

// Database schema
export const db = new Dexie('TalentFlowDB');

db.version(1).stores({
  jobs: '++id, title, slug, status, tags, order, createdAt',
  candidates: '++id, name, email, stage, jobId, createdAt',
  candidateTimeline: '++id, candidateId, stage, timestamp, notes',
  assessments: '++id, jobId, title, sections, createdAt',
  assessmentResponses: '++id, assessmentId, candidateId, responses, submittedAt'
});

// Seed data
const seedData = {
  jobs: [
    {
      id: 1,
      title: "Senior Frontend Developer",
      slug: "senior-frontend-developer",
      status: "active",
      tags: ["React", "TypeScript", "CSS"],
      order: 1,
      createdAt: new Date('2024-01-15')
    },
    {
      id: 2,
      title: "Full Stack Engineer",
      slug: "full-stack-engineer",
      status: "active",
      tags: ["Node.js", "React", "PostgreSQL"],
      order: 2,
      createdAt: new Date('2024-01-20')
    },
    {
      id: 3,
      title: "UI/UX Designer",
      slug: "ui-ux-designer",
      status: "active",
      tags: ["Figma", "Design Systems", "User Research"],
      order: 3,
      createdAt: new Date('2024-02-01')
    },
    {
      id: 4,
      title: "DevOps Engineer",
      slug: "devops-engineer",
      status: "archived",
      tags: ["AWS", "Docker", "Kubernetes"],
      order: 4,
      createdAt: new Date('2024-01-10')
    },
    {
      id: 5,
      title: "Product Manager",
      slug: "product-manager",
      status: "active",
      tags: ["Strategy", "Analytics", "Leadership"],
      order: 5,
      createdAt: new Date('2024-02-10')
    }
  ],

  candidates: [],

  assessments: [
    {
      id: 1,
      jobId: 1,
      title: "Frontend Developer Assessment",
      sections: [
        {
          id: 1,
          title: "Technical Knowledge",
          questions: [
            {
              id: 1,
              type: "single-choice",
              question: "Which React hook is used for side effects?",
              options: ["useState", "useEffect", "useMemo", "useCallback"],
              required: true
            },
            {
              id: 2,
              type: "multi-choice",
              question: "Select all valid CSS display values:",
              options: ["block", "inline", "flex", "grid", "table"],
              required: true
            },
            {
              id: 3,
              type: "short-text",
              question: "What is your experience with TypeScript?",
              maxLength: 200,
              required: true
            }
          ]
        },
        {
          id: 2,
          title: "Problem Solving",
          questions: [
            {
              id: 4,
              type: "long-text",
              question: "Describe how you would optimize a React application's performance.",
              maxLength: 1000,
              required: true
            },
            {
              id: 5,
              type: "numeric",
              question: "How many years of React experience do you have?",
              min: 0,
              max: 20,
              required: true
            }
          ]
        }
      ],
      createdAt: new Date('2024-01-15')
    },
    {
      id: 2,
      jobId: 2,
      title: "Full Stack Assessment",
      sections: [
        {
          id: 1,
          title: "Backend Knowledge",
          questions: [
            {
              id: 1,
              type: "single-choice",
              question: "Which is NOT a HTTP method?",
              options: ["GET", "POST", "FETCH", "DELETE"],
              required: true
            },
            {
              id: 2,
              type: "short-text",
              question: "Explain REST API principles briefly:",
              maxLength: 300,
              required: true
            }
          ]
        }
      ],
      createdAt: new Date('2024-01-20')
    }
  ]
};

// Generate random candidates
const generateCandidates = () => {
  const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Tom', 'Anna'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const stages = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];
  const candidates = [];

  for (let i = 1; i <= 1000; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const jobId = Math.floor(Math.random() * 5) + 1;
    const stage = stages[Math.floor(Math.random() * stages.length)];
    
    candidates.push({
      id: i,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
      stage,
      jobId,
      createdAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
    });
  }

  return candidates;
};

// Generate candidate timelines
const generateCandidateTimelines = (candidates) => {
  const timelines = [];
  let timelineId = 1;

  candidates.forEach(candidate => {
    // Initial application
    timelines.push({
      id: timelineId++,
      candidateId: candidate.id,
      stage: 'applied',
      timestamp: candidate.createdAt,
      notes: 'Application submitted'
    });

    // Random progression
    const stages = ['screen', 'tech', 'offer', 'hired', 'rejected'];
    const currentStageIndex = stages.indexOf(candidate.stage);
    
    if (currentStageIndex >= 0) {
      for (let i = 0; i <= currentStageIndex; i++) {
        const stageDate = new Date(candidate.createdAt);
        stageDate.setDate(stageDate.getDate() + (i + 1) * 7); // Weekly progression
        
        timelines.push({
          id: timelineId++,
          candidateId: candidate.id,
          stage: stages[i],
          timestamp: stageDate,
          notes: `Moved to ${stages[i]} stage`
        });
      }
    }
  });

  return timelines;
};

export const initializeDatabase = async () => {
  try {
    await db.open();
    
    // Check if data already exists
    const jobCount = await db.jobs.count();
    
    if (jobCount === 0) {
      console.log('Seeding database...');
      
      // Seed jobs
      await db.jobs.bulkAdd(seedData.jobs);
      
      // Generate and seed candidates
      const candidates = generateCandidates();
      seedData.candidates = candidates;
      await db.candidates.bulkAdd(candidates);
      
      // Generate and seed candidate timelines
      const timelines = generateCandidateTimelines(candidates);
      await db.candidateTimeline.bulkAdd(timelines);
      
      // Seed assessments
      await db.assessments.bulkAdd(seedData.assessments);
      
      console.log('Database seeded successfully');
    }
    
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

export default db;