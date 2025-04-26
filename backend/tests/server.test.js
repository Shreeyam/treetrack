import request from 'supertest';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import app from '../server';
import fs from 'fs';

describe('API (Vitest + Supertest)', () => {
    let agent;

    beforeAll(() => {
        agent = request.agent(app);
    });

    afterAll(() => {
        // clean up file‐based DB if you used one
        const dbPath = process.env.DATABASE_PATH;
        if (dbPath && dbPath !== ':memory:' && fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
        }
    });

    it('registers a user and sets a session cookie', async () => {
        const res = await agent
            .post('/api/register')
            .send({ username: 'bob', password: 'hunter2' })
            .expect(200);
        expect(res.body).toHaveProperty('id');
        expect(res.body.username).toBe('bob');
    });

    it('rejects fetching /api/me when logged out', async () => {
        await agent.post('/api/logout').expect(200);
        await agent.get('/api/me').expect(401);
    });

    it('allows login with correct credentials', async () => {
        // first register anew so we know creds exist
        await agent.post('/api/register').send({ username: 'jane', password: 'pw' });
        const res = await agent.post('/api/login').send({ username: 'jane', password: 'pw' }).expect(200);
        expect(res.body).toMatchObject({ username: 'jane', premium: false });
    });
});
