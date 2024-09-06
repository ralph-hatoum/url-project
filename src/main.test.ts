import request from 'supertest';
import { app } from './main';
import { pgClient } from './main';

beforeAll(done => {
  app.on('ready', () => {
    done(); // Continue with tests when app is ready
  });
});

afterAll(async () => {
  pgClient.end()
})

describe('GET /health', () => {
  it('should return 200 and \'Service up!\' message', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('health');
    expect(res.body.health).toBe('Service up !');
  });
});

describe('GET /:id to get an existing short link', () => {
  it('should return 302 redirection code', async () => {
    const linkId = 'aHR0cDovL3d3dy5nb29nbGUuY29t';
    const res = await request(app).get(`/${linkId}`);
    expect(res.statusCode).toBe(302);
  });
});

describe('GET /:id to get a non existing short link', () => {
  it('should return 404 not found', async () => {
    const linkId = 'hey';
    const res = await request(app).get(`/${linkId}`);
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /link to add a link', () => {
  it('should return json response with id', async () => {
    const payload = {link: "http://reddit.com"}
    const res = await request(app).post('/link').send(payload).expect('Content-Type', /json/).expect(201);
    expect(res.body).toHaveProperty('id')
  });
});

describe('POST /link to add a link with wrong payload', () => {
  it('should return bad request error', async () => {
    const payload = {lik: "http://reddit.com"}
    const res = await request(app).post('/link').send(payload);
    expect(res.status).toBe(400)
  });
});

describe('POST /link to add a link that has already been added', () => {
  it('should return json response with id', async () => {
    const payload = {link: "http://reddit.com"}
    const res = await request(app).post('/link').send(payload).expect('Content-Type', /json/).expect(201);
    expect(res.body).toHaveProperty('id')
  });
});

