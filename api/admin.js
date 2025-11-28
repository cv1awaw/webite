module.exports = (req, res) => {
    const { key } = req.query;
    const secretKey = 'admin123';

    if (key !== secretKey) {
        return res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Admin Login</title>
                <style>
                    body {
                        background-color: #121212;
                        color: #ffffff;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
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

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Admin Dashboard</title>
            <style>
                body { background-color: #121212; color: white; font-family: sans-serif; padding: 2rem; text-align: center; }
                h1 { color: #03dac6; }
            </style>
        </head>
        <body>
            <h1>Welcome to Admin Dashboard</h1>
            <p>System is ready. No logs yet.</p>
        </body>
        </html>
    `);
};
