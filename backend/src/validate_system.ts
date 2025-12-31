import { query, initDB } from './db';
import { parseExpenseText } from './services/llm';

async function validateSystem() {
    console.log("=== Starting System Validation ===");

    try {
        // 1. Validate DB Connection
        console.log("\n[1] Checking Database Connection...");
        await initDB();
        console.log("✅ Database Connection: SUCCESS");

        // 2. Validate Schema (Audio Path)
        console.log("\n[2] Checking Database Schema...");
        const schemaRes = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'expenses' AND column_name = 'audio_path';
        `);

        if (schemaRes.rows.length > 0) {
            console.log("✅ Schema Check (audio_path): FOUND");
        } else {
            console.error("❌ Schema Check (audio_path): MISSING");
        }

        // 3. Test Write/Read
        console.log("\n[3] Testing Database Write/Read...");
        const userIdResult = await query("SELECT id FROM users LIMIT 1");
        let userId;

        if (userIdResult.rows.length === 0) {
            console.log("   -> Creating test user...");
            const newUser = await query("INSERT INTO users DEFAULT VALUES RETURNING id");
            userId = newUser.rows[0].id;
        } else {
            userId = userIdResult.rows[0].id;
        }

        const testAmount = 123.45;
        const insertRes = await query(`
            INSERT INTO expenses (user_id, amount, category, description, audio_path)
            VALUES ($1, $2, 'Test', 'Validation Script', '/audio/test.m4a')
            RETURNING id
        `, [userId, testAmount]);

        const expenseId = insertRes.rows[0].id;
        console.log(`   -> Inserted Test Expense ID: ${expenseId}`);

        const readRes = await query("SELECT * FROM expenses WHERE id = $1", [expenseId]);
        if (readRes.rows[0].amount == testAmount && readRes.rows[0].audio_path === '/audio/test.m4a') {
            console.log("✅ Database Write/Read: SUCCESS");
        } else {
            console.error("❌ Database Write/Read: DATA MISMATCH", readRes.rows[0]);
        }

        // Clean up
        await query("DELETE FROM expenses WHERE id = $1", [expenseId]);
        console.log("   -> Cleaned up test record.");


        // 4. Test LLM Logic (Mocked request)
        console.log("\n[4] Testing LLM integration...");
        // Validating that the function exists and we can call it (we won't make a real paid API call if we can avoid it, 
        // but the user wants to know if it works. Let's try a very short string if env is set).

        if (process.env.OPENAI_API_KEY) {
            console.log("   -> API Key detected. Sending test prompt...");
            try {
                const llmResult = await parseExpenseText("Coffee 5 dollars");
                if (llmResult.expenses && llmResult.expenses[0].amount === 5) {
                    console.log("✅ LLM Response: SUCCESS");
                    console.log("   -> Parsed:", JSON.stringify(llmResult.expenses[0]));
                } else {
                    console.error("❌ LLM Response: UNEXPECTED FORMAT", llmResult);
                }
            } catch (e: any) {
                console.error("❌ LLM Response: FAILED", e.message);
            }
        } else {
            console.warn("⚠️  Skipping LLM test (No OPENAI_API_KEY found in env)");
        }


    } catch (error) {
        console.error("\n❌ SYSTEM VALIDATION FAILED:", error);
    } finally {
        process.exit(0);
    }
}

validateSystem();
