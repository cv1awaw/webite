module.exports = (req, res) => {
    const { key } = req.query;
    const secretKey = 'admin123'; // Change this to a strong secret

    // If no key or wrong key, show Login Page
    if (key !== secretKey) {
        return res.send(`
            <html>
            <head>
                <title>Admin Login</title>
                <style>
                    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f2f5; }
                    .login-box { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
                    input { padding: 10px; margin: 10px 0; width: 100%; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
                    button { padding: 10px 20px; background-color: #0070f3; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
                    button:hover { background-color: #005bb5; }
                </style>
            </head>
            <body>
                <div class="login-box">
                    <h2>Admin Login</h2>
                    <form action="/api/admin" method="get">
                        <input type="password" name="key" placeholder="Enter Admin Key" required>
                        <button type="submit">Login</button>
                    </form>
                </div>
            </body>
            </html>
        `);
    }

    const logs = global.adminLogs || [];

    let html = `
    <html>
    <head>
        <title>Verification Admin</title>
        <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .success { color: green; }
            .failed { color: red; }
        </style>
    </head>
    <body>
        <h1>Verification Logs</h1>
        <p>Total Logs: ${logs.length}</p>
        <table>
            <tr>
                <th>Timestamp</th>
                <th>User Email</th>
                <th>Generated Name</th>
                <th>Department</th>
                <th>Status</th>
            </tr>
    `;

    logs.forEach(log => {
        const statusClass = log.status === 'Success' ? 'success' : 'failed';
        html += `
            <tr>
                <td>${log.timestamp}</td>
                <td>${log.email}</td>
                <td>${log.generatedName}</td>
                <td>${log.generatedData ? log.generatedData.department : '-'}</td>
                <td class="${statusClass}">${log.status}</td>
            </tr>
        `;
    });

    html += `
        </table>
    </body>
    </html>
    `;

    res.send(html);
};
