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
                        height: 100vh;
                        margin: 0;
                    }
                    .login-container {
                        background-color: #1e1e1e;
                        padding: 2rem;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                        text-align: center;
                        width: 100%;
                        max-width: 350px;
                    }
                    h2 { margin-bottom: 1.5rem; color: #bb86fc; }
                    input {
                        width: 100%;
                        padding: 10px;
                        margin-bottom: 1rem;
                        border: 1px solid #333;
                        border-radius: 4px;
                        background-color: #2c2c2c;
                        color: white;
                        box-sizing: border-box;
                    }
                    button {
                        width: 100%;
                        padding: 10px;
                        background-color: #bb86fc;
                        color: #000;
                        border: none;
                        border-radius: 4px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: background-color 0.3s;
                    }
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
