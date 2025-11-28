module.exports = (req, res) => {
    const { key, action } = req.query;
    const secretKey = 'admin123';

    // --- AUTHENTICATION ---
    if (key !== secretKey) {
        return res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Admin Login</title>
                <style>
                    body { background-color: #121212; color: #ffffff; font-family: 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                    .login-container { background-color: #1e1e1e; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3); text-align: center; width: 100%; max-width: 350px; }
                    h2 { margin-bottom: 1.5rem; color: #bb86fc; }
                    input { width: 100%; padding: 10px; margin-bottom: 1rem; border: 1px solid #333; border-radius: 4px; background-color: #2c2c2c; color: white; box-sizing: border-box; }
                    button { width: 100%; padding: 10px; background-color: #bb86fc; color: #000; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; transition: background-color 0.3s; }
                    button:hover { background-color: #9965f4; }
                </style>
            </head>
            <body>
                <div class="login-container">
                    <h2>🔐 Admin Access</h2>
                    <form action="/api/admin" method="get">
                        <input type="password" name="key" placeholder="Enter Secret Key" required>
                        <button type="submit">Login</button>
                    </form>
                </div>
            </body>
            </html>
        `);
    }

    // --- ACTIONS ---
    if (action === 'test') {
        global.adminLogs = global.adminLogs || [];
        global.adminLogs.unshift({
            timestamp: new Date().toISOString(),
            email: 'test_user@example.com',
            url: 'http://test-url.com',
            generatedName: 'Test Teacher',
            status: 'Success',
            steps: ['Started', 'Generated PDF', 'Filled Form', 'Uploaded', 'Success'],
            errorDetails: null
        });
        return res.redirect(`/api/admin?key=${key}`);
    }

    if (action === 'clear') {
        global.adminLogs = [];
        return res.redirect(`/api/admin?key=${key}`);
    }

    // --- DASHBOARD ---
    const logs = global.adminLogs || [];
    const totalLogs = logs.length;
    const successLogs = logs.filter(l => l.status === 'Success').length;
    const failedLogs = logs.filter(l => l.status === 'Failed').length;

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin Dashboard</title>
            <style>
                body { background-color: #121212; color: #e0e0e0; font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; }
                .container { max-width: 1200px; margin: 0 auto; }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid #333; padding-bottom: 20px; }
                h1 { color: #bb86fc; margin: 0; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-card { background-color: #1e1e1e; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
                .stat-value { font-size: 2.5rem; font-weight: bold; margin: 10px 0; }
                .stat-label { color: #aaa; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
                .actions { margin-bottom: 20px; display: flex; gap: 10px; }
                .btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; text-decoration: none; display: inline-block; }
                .btn-primary { background-color: #03dac6; color: #000; }
                .btn-danger { background-color: #cf6679; color: #000; }
                table { width: 100%; border-collapse: collapse; background-color: #1e1e1e; border-radius: 8px; overflow: hidden; }
                th, td { padding: 15px; text-align: left; border-bottom: 1px solid #333; }
                th { background-color: #2c2c2c; color: #bb86fc; font-weight: 600; }
                tr:hover { background-color: #252525; }
                .status-badge { padding: 5px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: bold; }
                .status-success { background-color: rgba(3, 218, 198, 0.2); color: #03dac6; }
                .status-failed { background-color: rgba(207, 102, 121, 0.2); color: #cf6679; }
                .status-pending { background-color: rgba(187, 134, 252, 0.2); color: #bb86fc; }
                .trace-link { color: #bb86fc; text-decoration: none; border: 1px solid #bb86fc; padding: 5px 10px; border-radius: 4px; transition: 0.2s; }
                .trace-link:hover { background: #bb86fc; color: #000; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚀 Verification Control Center</h1>
                    <div>
                        <span style="color: #03dac6;">● System Online</span>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value" style="color: #fff;">${totalLogs}</div>
                        <div class="stat-label">Total Requests</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" style="color: #03dac6;">${successLogs}</div>
                        <div class="stat-label">Successful</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" style="color: #cf6679;">${failedLogs}</div>
                        <div class="stat-label">Failed</div>
                    </div>
                </div>

                <div class="actions">
                    <a href="/api/admin?key=${key}&action=test" class="btn btn-primary">⚡ Generate Test Log</a>
                    <a href="/api/admin?key=${key}&action=clear" class="btn btn-danger">🗑️ Clear All Logs</a>
                    <a href="/api/admin?key=${key}" class="btn" style="background: #333; color: #fff;">🔄 Refresh</a>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Email</th>
                            <th>Identity</th>
                            <th>Status</th>
                            <th>Trace</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map((log, i) => `
                            <tr>
                                <td>${new Date(log.timestamp).toLocaleTimeString()}</td>
                                <td>${log.email}</td>
                                <td>${log.generatedName || '-'}</td>
                                <td>
                                    <span class="status-badge status-${log.status.toLowerCase()}">
                                        ${log.status}
                                    </span>
                                </td>
                                <td>
                                    <a href="/api/trace?key=${key}&index=${i}" class="trace-link">
                                        View Trace 📄
                                    </a>
                                </td>
                            </tr>
                        `).join('')}
                        ${logs.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 30px; color: #666;">No verification logs found yet.</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `);
};
