import { rest } from 'msw';
import db from '../services/database';

// Add artificial latency and error simulation
const delay = () => new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 200));
const shouldError = (writeOperation = false) => {
  const errorRate = writeOperation ? 0.1 : 0.05; // 10% for writes, 5% for reads
  return Math.random() < errorRate;
};

export const handlers = [
  // Jobs endpoints
  rest.get('/api/jobs', async (req, res, ctx) => {
    await delay();
    
    if (shouldError()) {
      return res(ctx.status(500), ctx.json({ error: 'Server error' }));
    }

    try {
      const url = new URL(req.url);
      const search = url.searchParams.get('search') || '';
      const status = url.searchParams.get('status') || '';
      const page = parseInt(url.searchParams.get('page')) || 1;
      const pageSize = parseInt(url.searchParams.get('pageSize')) || 10;
      const sort = url.searchParams.get('sort') || 'order';

      let jobs = await db.jobs.orderBy(sort).toArray();

      // Apply filters
      if (search) {
        jobs = jobs.filter(job => 
          job.title.toLowerCase().includes(search.toLowerCase()) ||
          job.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
        );
      }

      if (status) {
        jobs = jobs.filter(job => job.status === status);
      }

      // Apply pagination
      const total = jobs.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedJobs = jobs.slice(startIndex, endIndex);

      return res(
        ctx.json({
          jobs: paginatedJobs,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        })
      );
    } catch (error) {
      return res(ctx.status(500), ctx.json({ error: error.message }));
    }
  }),

  rest.post('/api/jobs', async (req, res, ctx) => {
    await delay();
    
    if (shouldError(true)) {
      return res(ctx.status(500), ctx.json({ error: 'Failed to create job' }));
    }

    try {
      const jobData = await req.json();
      const maxOrder = await db.jobs.orderBy('order').last();
      
      const job = {
        ...jobData,
        id: Date.now(),
        order: (maxOrder?.order || 0) + 1,
        createdAt: new Date()
      };

      await db.jobs.add(job);
      return res(ctx.json(job));
    } catch (error) {
      return res(ctx.status(400), ctx.json({ error: error.message }));
    }
  }),

  rest.patch('/api/jobs/:id', async (req, res, ctx) => {
    await delay();
    
    if (shouldError(true)) {
      return res(ctx.status(500), ctx.json({ error: 'Failed to update job' }));
    }

    try {
      const { id } = req.params;
      const updates = await req.json();
      
      await db.jobs.update(parseInt(id), updates);
      const updatedJob = await db.jobs.get(parseInt(id));
      
      return res(ctx.json(updatedJob));
    } catch (error) {
      return res(ctx.status(400), ctx.json({ error: error.message }));
    }
  }),

  rest.patch('/api/jobs/:id/reorder', async (req, res, ctx) => {
    await delay();
    
    if (shouldError(true)) {
      return res(ctx.status(500), ctx.json({ error: 'Reorder failed' }));
    }

    try {
      const { id } = req.params;
      const { fromOrder, toOrder } = await req.json();
      
      // Simulate reordering logic
      const jobs = await db.jobs.orderBy('order').toArray();
      const jobToMove = jobs.find(j => j.id === parseInt(id));
      
      if (!jobToMove) {
        return res(ctx.status(404), ctx.json({ error: 'Job not found' }));
      }

      // Update order for affected jobs
      if (fromOrder < toOrder) {
        // Moving down
        await db.jobs.where('order').between(fromOrder + 1, toOrder, true, true).modify(job => {
          job.order -= 1;
        });
      } else {
        // Moving up
        await db.jobs.where('order').between(toOrder, fromOrder - 1, true, true).modify(job => {
          job.order += 1;
        });
      }

      // Update the moved job
      await db.jobs.update(parseInt(id), { order: toOrder });
      
      return res(ctx.json({ success: true }));
    } catch (error) {
      return res(ctx.status(400), ctx.json({ error: error.message }));
    }
  }),

  // Candidates endpoints
  rest.get('/api/candidates', async (req, res, ctx) => {
    await delay();
    
    if (shouldError()) {
      return res(ctx.status(500), ctx.json({ error: 'Server error' }));
    }

    try {
      const url = new URL(req.url);
      const search = url.searchParams.get('search') || '';
      const stage = url.searchParams.get('stage') || '';
      const page = parseInt(url.searchParams.get('page')) || 1;
      const pageSize = parseInt(url.searchParams.get('pageSize')) || 50;

      let candidates = await db.candidates.toArray();

      // Apply filters
      if (search) {
        candidates = candidates.filter(candidate => 
          candidate.name.toLowerCase().includes(search.toLowerCase()) ||
          candidate.email.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (stage) {
        candidates = candidates.filter(candidate => candidate.stage === stage);
      }

      // Apply pagination
      const total = candidates.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedCandidates = candidates.slice(startIndex, endIndex);

      return res(
        ctx.json({
          candidates: paginatedCandidates,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        })
      );
    } catch (error) {
      return res(ctx.status(500), ctx.json({ error: error.message }));
    }
  }),

  rest.patch('/api/candidates/:id', async (req, res, ctx) => {
    await delay();
    
    if (shouldError(true)) {
      return res(ctx.status(500), ctx.json({ error: 'Failed to update candidate' }));
    }

    try {
      const { id } = req.params;
      const updates = await req.json();
      
      await db.candidates.update(parseInt(id), updates);
      
      // Add timeline entry if stage changed
      if (updates.stage) {
        await db.candidateTimeline.add({
          candidateId: parseInt(id),
          stage: updates.stage,
          timestamp: new Date(),
          notes: updates.notes || `Moved to ${updates.stage} stage`
        });
      }
      
      const updatedCandidate = await db.candidates.get(parseInt(id));
      return res(ctx.json(updatedCandidate));
    } catch (error) {
      return res(ctx.status(400), ctx.json({ error: error.message }));
    }
  }),

  rest.get('/api/candidates/:id/timeline', async (req, res, ctx) => {
    await delay();
    
    if (shouldError()) {
      return res(ctx.status(500), ctx.json({ error: 'Server error' }));
    }

    try {
      const { id } = req.params;
      const timeline = await db.candidateTimeline
        .where('candidateId')
        .equals(parseInt(id))
        .orderBy('timestamp')
        .toArray();
      
      return res(ctx.json(timeline));
    } catch (error) {
      return res(ctx.status(500), ctx.json({ error: error.message }));
    }
  }),

  // Assessments endpoints
  rest.get('/api/assessments/:jobId', async (req, res, ctx) => {
    await delay();
    
    if (shouldError()) {
      return res(ctx.status(500), ctx.json({ error: 'Server error' }));
    }

    try {
      const { jobId } = req.params;
      const assessment = await db.assessments
        .where('jobId')
        .equals(parseInt(jobId))
        .first();
      
      return res(ctx.json(assessment || null));
    } catch (error) {
      return res(ctx.status(500), ctx.json({ error: error.message }));
    }
  }),

  rest.put('/api/assessments/:jobId', async (req, res, ctx) => {
    await delay();
    
    if (shouldError(true)) {
      return res(ctx.status(500), ctx.json({ error: 'Failed to save assessment' }));
    }

    try {
      const { jobId } = req.params;
      const assessmentData = await req.json();
      
      const existingAssessment = await db.assessments
        .where('jobId')
        .equals(parseInt(jobId))
        .first();
      
      if (existingAssessment) {
        await db.assessments.update(existingAssessment.id, assessmentData);
        const updated = await db.assessments.get(existingAssessment.id);
        return res(ctx.json(updated));
      } else {
        const assessment = {
          ...assessmentData,
          jobId: parseInt(jobId),
          id: Date.now(),
          createdAt: new Date()
        };
        await db.assessments.add(assessment);
        return res(ctx.json(assessment));
      }
    } catch (error) {
      return res(ctx.status(400), ctx.json({ error: error.message }));
    }
  }),

  rest.post('/api/assessments/:jobId/submit', async (req, res, ctx) => {
    await delay();
    
    if (shouldError(true)) {
      return res(ctx.status(500), ctx.json({ error: 'Failed to submit assessment' }));
    }

    try {
      const { jobId } = req.params;
      const { candidateId, responses } = await req.json();
      
      const submission = {
        id: Date.now(),
        assessmentId: parseInt(jobId),
        candidateId,
        responses,
        submittedAt: new Date()
      };
      
      await db.assessmentResponses.add(submission);
      return res(ctx.json({ success: true, submissionId: submission.id }));
    } catch (error) {
      return res(ctx.status(400), ctx.json({ error: error.message }));
    }
  })
];