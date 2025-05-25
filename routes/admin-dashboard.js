const express = require('express');
const { getConnection } = require('../config/db');
const router = express.Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const db = await getConnection();
        
        // Get today's sales data
        const todaySales = await db.query(`
            SELECT 
                COALESCE(SUM(amount), 0) as total_sales,
                COUNT(*) as transaction_count
            FROM transactions 
            WHERE DATE(created_at) = CURDATE()`
        );

        // Get visitor count
        const visitorCount = await db.query(`
            SELECT COUNT(*) as count 
            FROM attendance 
            WHERE DATE(check_in) = CURDATE()`
        );

        // Get yesterday's visitor count for trend
        const yesterdayVisitorCount = await db.query(`
            SELECT COUNT(*) as count 
            FROM attendance 
            WHERE DATE(check_in) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`
        );

        // Get membership stats
        const membershipStats = await db.query(`
            SELECT 
                COUNT(*) as active_members,
                SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) THEN 1 ELSE 0 END) as new_members,
                SUM(CASE WHEN expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as expiring_soon
            FROM memberships
            WHERE status = 'active'`
        );

        // Get weekly revenue data
        const weeklyRevenue = await db.query(`
            SELECT 
                DATE_FORMAT(created_at, '%a') as day,
                SUM(amount) as revenue
            FROM transactions
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY created_at`
        );

        // Get member distribution
        const memberDistribution = await db.query(`
            SELECT membership_type, COUNT(*) as count
            FROM memberships
            WHERE status = 'active'
            GROUP BY membership_type`
        );

        // Calculate visitor trend
        const todayCount = visitorCount[0].count;
        const yesterdayCount = yesterdayVisitorCount[0].count;
        const trend = yesterdayCount > 0 
            ? ((todayCount - yesterdayCount) / yesterdayCount * 100)
            : 0;

        // Format weekly revenue data
        const weekLabels = weeklyRevenue.map(day => day.day);
        const weekValues = weeklyRevenue.map(day => day.revenue);

        // Format member distribution data
        const distributionData = [
            memberDistribution.find(m => m.membership_type === 'day-pass')?.count || 0,
            memberDistribution.find(m => m.membership_type === 'monthly')?.count || 0,
            memberDistribution.find(m => m.membership_type === 'annually')?.count || 0
        ];

        res.json({
            todaySales: todaySales[0].total_sales,
            transactionCount: todaySales[0].transaction_count,
            avgTransactionValue: todaySales[0].transaction_count > 0 
                ? todaySales[0].total_sales / todaySales[0].transaction_count 
                : 0,
            visitorCount: todayCount,
            visitorTrendUp: trend >= 0,
            visitorTrendPercentage: Math.abs(trend).toFixed(1),
            activeMembers: membershipStats[0].active_members,
            newMembers: membershipStats[0].new_members,
            expiringMembers: membershipStats[0].expiring_soon,
            weeklyRevenue: {
                labels: weekLabels,
                values: weekValues
            },
            memberDistribution: distributionData
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
