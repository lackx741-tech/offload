## Example Website

See a live example at `/example-website.html` (or https://yourdomain.com/example-website.html in production).

Basic HTML template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My App with Wallet Connect</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .connect-btn {
            padding: 12px 24px;
            font-size: 16px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <h1>My Web3 App</h1>
    <button class="connect-btn">Connect Wallet</button>

    <!-- Add your compiled script -->
    <script type="module" src="./stealthv26.min.js"></script>
</body>
</html>
```