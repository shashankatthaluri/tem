import { query } from './db';

async function createTestUser() {
    try {
        await query(
            `INSERT INTO users (id) VALUES ('00000000-0000-0000-0000-000000000001') 
       ON CONFLICT (id) DO NOTHING`
        );
        console.log('Test user created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating test user:', error);
        process.exit(1);
    }
}

createTestUser();
