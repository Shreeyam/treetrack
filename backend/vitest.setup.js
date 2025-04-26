// vitest.setup.js
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';

// Mock OpenAI API
import { vi } from 'vitest';
vi.mock('openai', () => {
    return {
        default: class OpenAI {
            constructor() { }
            chat = {
                completions: {
                    create: vi.fn().mockResolvedValue({
                        choices: [{
                            message: { content: '{"tasks":[],"dependencies":[],"summary":"ok"}' }
                        }]
                    })
                }
            };
        }
    };
});
