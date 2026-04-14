import assert from 'assert';
import sinon from 'sinon';
import traccarService from '../../services/traccar.js';

describe('Traccar Service', () => {
    let fetchStub;

    beforeEach(() => {
        // Mock global fetch if it exists
        if (typeof fetch !== 'undefined') {
            fetchStub = sinon.stub(global, 'fetch');
        }
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('getDevices()', () => {
        it('should return mock data when MOCK_TRACCAR is true', async () => {
            process.env.MOCK_TRACCAR = 'true';
            const devices = await traccarService.getDevices();
            assert.ok(Array.isArray(devices));
            assert.strictEqual(devices[0].id, 1);
        });

        it('should call Traccar API when MOCK_TRACCAR is false', async () => {
            process.env.MOCK_TRACCAR = 'false';
            process.env.TRACCAR_URL = 'http://localhost:8082';
            
            const mockResponse = {
                ok: true,
                status: 200,
                json: async () => [{ id: 10, name: 'Real Device' }]
            };

            if (fetchStub) {
                fetchStub.resolves(mockResponse);
                const devices = await traccarService.getDevices();
                assert.ok(fetchStub.calledOnce);
                assert.strictEqual(devices[0].id, 10);
            }
        });
    });

    describe('createUser()', () => {
        it('should send correct POST request to Traccar', async () => {
            process.env.MOCK_TRACCAR = 'false';
            const mockResponse = {
                ok: true,
                status: 200,
                json: async () => ({ id: 5, name: 'New User' })
            };

            if (fetchStub) {
                fetchStub.resolves(mockResponse);
                const user = await traccarService.createUser('New User', 'new@example.com', 'pass123');
                assert.ok(fetchStub.calledWith(sinon.match('/api/users'), sinon.match({
                    method: 'POST',
                    body: sinon.match.string
                })));
                assert.strictEqual(user.id, 5);
            }
        });

        it('should throw error when Traccar API returns non-ok response', async () => {
            process.env.MOCK_TRACCAR = 'false';
            const mockResponse = {
                ok: false,
                status: 400,
                text: async () => 'Error detail'
            };

            if (fetchStub) {
                fetchStub.resolves(mockResponse);
                try {
                    await traccarService.createUser('Test', 'test@example.com', 'pass');
                    assert.fail('Should have thrown an error');
                } catch (err) {
                    assert.strictEqual(err.status, 400);
                    assert.ok(err.message.includes('createUser failed'));
                }
            }
        });
    });
});
