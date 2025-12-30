import { Router, Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { query } from '../db';
import { checkSubscription } from '../middleware/auth';

const router = Router();

router.get('/export/excel', checkSubscription, async (req: Request, res: Response): Promise<void> => {
    try {
        const { user_id } = req.query;

        if (!user_id || typeof user_id !== 'string') {
            res.status(400).json({ error: 'Missing user_id' });
            return;
        }

        // 1. Fetch Data
        const result = await query(
            `SELECT description as title, amount, category, date, created_at, id 
       FROM expenses 
       WHERE user_id = $1 
       ORDER BY date DESC`,
            [user_id]
        );

        const expenses = result.rows;

        // 2. Create Workbook
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Expenses');

        // 3. Define Columns (Left Side)
        sheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Time', key: 'time', width: 12 },
            { header: 'Category', key: 'category', width: 15 },
            { header: 'Title', key: 'title', width: 25 },
            { header: 'Amount', key: 'amount', width: 12 },
            { header: 'Currency', key: 'currency', width: 10 },
            { header: '', key: 'gap', width: 5 }, // Gap
        ];

        // 4. Populate Left Data
        expenses.forEach((e, index) => {
            const d = new Date(e.date || e.created_at);
            sheet.addRow({
                date: d.toLocaleDateString(),
                time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                category: e.category,
                title: e.title,
                amount: parseFloat(e.amount),
                currency: 'USD',
            });
        });

        // 5. Build Summary Statistics (Right Side)
        // Group by Month -> Category -> Total
        const summaryData: Record<string, Record<string, number>> = {};

        expenses.forEach(e => {
            const d = new Date(e.date || e.created_at);
            const monthKey = d.toLocaleString('default', { month: 'long', year: 'numeric' }); // e.g., "September 2025"

            if (!summaryData[monthKey]) summaryData[monthKey] = {};

            const cat = e.category || 'Misc';
            const amt = parseFloat(e.amount);

            if (!summaryData[monthKey][cat]) summaryData[monthKey][cat] = 0;
            summaryData[monthKey][cat] += amt;
        });

        // 6. Write Summary Blocks (Starting at Column H / 8)
        let summaryRow = 2; // Start row
        const summaryCol = 8; // Column H

        Object.keys(summaryData).forEach(month => {
            // Month Header
            sheet.getCell(summaryRow, summaryCol).value = month;
            sheet.getCell(summaryRow, summaryCol).font = { bold: true, size: 12 };
            summaryRow++;

            // Categories
            Object.entries(summaryData[month]).forEach(([cat, total]) => {
                sheet.getCell(summaryRow, summaryCol).value = cat;
                sheet.getCell(summaryRow, summaryCol + 1).value = total;
                summaryRow++;
            });

            // Add spacing between months
            summaryRow += 2;
        });

        // 7. Styling Polish (Basic)
        sheet.getRow(1).font = { bold: true };

        // 8. Stream Response
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=' + 'tem_expenses.xlsx'
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Export failed:', error);
        res.status(500).json({ error: 'Export failed' });
    }
});

export default router;
