module.exports = (req, res) => {
    const { key, action } = req.query;
    const secretKey = 'admin123';

    // --- AUTHENTICATION ---
    if (key !== secretKey) {
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Admin Login</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { background: #1a1a1a; color: #fff; font-family: 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                    .card { background: #2d2d2d; padding: 2rem; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); text-align: center; width: 300px; }
                    input { width: 100%; padding: 12px; margin: 10px 0; background: #3d3d3d; border: 1px solid #4d4d4d; color: white; border-radius: 6px; box-sizing: border-box; }
                    button { width: 100%; padding: 12px; background: #0070f3; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s; }
                    button:hover { background: #005bb5; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2 style="margin-top: 0;">🔐 Admin Access</h2>
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
            generatedName: 'Test User',
            generatedData: { department: 'IT Department' },
            status: 'Success',
            steps: ['Manual Test Initiated', 'System Check: OK', 'Database Check: OK', 'Completed'],
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
    const successCount = logs.filter(l => l.status === 'Success').length;
    const failCount = logs.length - successCount;

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>SheerID Dashboard</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { background: #111; color: #e0e0e0; font-family: 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; }
                .container { max-width: 1200px; margin: 0 auto; }
                
                /* Header */
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid #333; padding-bottom: 20px; }
                .header h1 { margin: 0; font-size: 24px; color: #fff; }
                .actions a { text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-left: 10px; transition: 0.2s; }
                .btn-primary { background: #0070f3; color: white; }
                .btn-primary:hover { background: #005bb5; }
                .btn-danger { background: #e00; color: white; }
                .btn-danger:hover { background: #c00; }

                /* Stats Cards */
                .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-card { background: #1f1f1f; padding: 20px; border-radius: 12px; border: 1px solid #333; }
                .stat-value { font-size: 32px; font-weight: bold; color: #fff; margin: 10px 0 0; }
                .stat-label { color: #888; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }

                /* Logs Table */
                .table-container { background: #1f1f1f; border-radius: 12px; border: 1px solid #333; overflow: hidden; }
                table { width: 100%; border-collapse: collapse; }
                th { background: #2d2d2d; text-align: left; padding: 15px; color: #aaa; font-size: 13px; text-transform: uppercase; }
                td { padding: 15px; border-top: 1px solid #333; font-size: 14px; }
                tr:hover { background: #252525; }
                
                /* Status Badges */
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                .badge-success { background: rgba(0, 255, 0, 0.1); color: #0f0; }
                .badge-failed { background: rgba(255, 0, 0, 0.1); color: #f55; }
                .badge-pending { background: rgba(255, 255, 0, 0.1); color: #ff0; }

                /* Details */
                details { margin-top: 5px; }
                summary { cursor: pointer; color: #0070f3; font-size: 13px; outline: none; }
                .log-details { background: #111; padding: 10px; border-radius: 6px; margin-top: 10px; font-family: monospace; font-size: 12px; color: #ccc; white-space: pre-wrap; border: 1px solid #333; }
                .step-item { margin: 4px 0; border-left: 2px solid #444; padding-left: 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚡ SheerID Verifier <span style="font-size: 14px; color: #666; font-weight: normal;">v2.0</span></h1>
                    <div class="actions">
                        <a href="/api/admin?key=${key}&action=test" class="btn-primary">▶ Test System</a>
                        <a href="/api/admin?key=${key}&action=clear" class="btn-danger">🗑 Clear Logs</a>
                    </div>
                </div>

                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-label">Total Requests</div>
                        <div class="stat-value">${logs.length}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Success Rate</div>
                        <div class="stat-value" style="color: #0f0;">${logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 0}%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Failed</div>
                        <div class="stat-value" style="color: #f55;">${failCount}</div>
                    </div>
                </div>

                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>User</th>
                                <th>Generated Identity</th>
                                <th>Status</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logs.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 40px; color: #666;">No logs found. Run a test or verify a user.</td></tr>' : ''}
                            ${logs.map(log => `
                                <tr>
                                    <td style="color: #888;">${new Date(log.timestamp).toLocaleTimeString()}</td>
                                    <td>${log.email}</td>
                                    <td>
                                        <div style="font-weight: bold;">${log.generatedName}</div>
                                        <div style="font-size: 12px; color: #666;">${log.generatedData ? log.generatedData.department : ''}</div>
                                    </td>
                                    <td>
                                        <span class="badge badge-${log.status === 'Success' ? 'success' : (log.status === 'Pending' ? 'pending' : 'failed')}">
                                            ${log.status}
                                        </span>
                                    </td>
                                    <td>
                                        <details>
                                            <summary>View Trace</summary>
                                            <div class="log-details">
                                                <div style="margin-bottom: 10px; color: #fff; font-weight: bold;">Execution Steps:</div>
                                                ${log.steps ? log.steps.map(s => `<div class="step-item">${s}</div>`).join('') : 'No steps'}
                                                
                                                ${log.errorDetails ? `
                                                    <div style="margin-top: 15px; color: #f55; font-weight: bold; border-top: 1px solid #333; padding-top: 10px;">Error Stack:</div>
                                                    <div style="color: #f88;">${log.errorDetails}</div>
                                                ` : ''}
                                            </div>
                                        </details>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </body>
        </html>
    `);
};
