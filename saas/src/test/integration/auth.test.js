import request from 'supertest';
import { expect } from 'chai';

const API_URL = process.env.TEST_API_URL || 'http://localhost:3001';

describe('Authentication Integration Tests (Architectural QA)', () => {
  it('should reject registration with malformed email', async () => {
    const res = await request(API_URL)
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        password: 'Password123!',
        name: 'Test User'
      });
    
    expect(res.status).to.equal(400);
    expect(res.body.message).to.contain('Validation failed');
  });

  it('should return 401 for invalid login credentials', async () => {
    const res = await request(API_URL)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      });
    
    expect(res.status).to.equal(401);
  });
});
