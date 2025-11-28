module.exports = (req, res) => {
    const { key, index } = req.query;
    const secretKey = 'admin123';

    if (key !== secretKey) return res.status(401).send('Unauthorized');

    const logs = global.adminLogs || [];
    const logIndex = parseInt(index);
    const log = logs[logIndex];

    if (!log) return res.send('Log not found or expired.');

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Execution Trace - ${log.email}</title>
            <style>
                body { background: #0d1117; color: #c9d1d9; font-family: 'Consolas', 'Monaco', monospace; padding: 20px; line-height: 1.5; }
                .container { max-width: 1000px; margin: 0 auto; }
                .header { border-bottom: 1px solid #30363d; padding-bottom: 20px; margin-bottom: 20px; }
                .meta { color: #8b949e; font-size: 14px; margin-bottom: 10px; }
                .step { padding: 8px 0; border-bottom: 1px solid #21262d; display: flex; }
                .time { color: #8b949e; min-width: 100px; }
                .msg { color: #e6edf3; }
                .error { color: #f85149; background: rgba(248,81,73,0.1); padding: 10px; border-radius: 6px; margin-top: 20px; }
                .back-btn { display: inline-block; margin-bottom: 20px; color: #58a6ff; text-decoration: none; }
                .back-btn:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/api/admin?key=${key}" class="back-btn">← Back to Dashboard</a>
                
                <div class="header">
                    <h1 style="margin: 0;">Execution Trace</h1>
                    <div class="meta">User: ${log.email}</div>
                    <div class="meta">Identity: ${log.generatedName}</div>
                    <div class="meta">Status: <span style="color: ${log.status === 'Success' ? '#3fb950' : '#f85149'}">${log.status}</span></div>
                </div>

                <div class="logs">
                    ${log.steps.map(step => {
        const [time, ...msgParts] = step.split(' - ');
        const msg = msgParts.join(' - ');
        return `
                            <div class="step">
                                <span class="time">${time}</span>
                                <span class="msg">${msg}</span>
                            </div>
                        `;
    }).join('')}
                </div>

                ${log.errorDetails ? `
                    <div class="error">
                        <strong>Error Stack Trace:</strong><br>
                        <pre style="overflow-x: auto;">${log.errorDetails}</pre>
                    </div>
                ` : ''}
            </div>
        </body>
        </html>
    `);
};
