const emailVerifiedTemplate = (username: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          padding: 20px;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: auto;
          background: white;
          padding: 20px;
          border-radius: 10px;
        }
        h2 {
          color: #2c3e50;
        }
        .message {
          font-size: 16px;
          color: #333;
        }
        .footer {
          margin-top: 20px;
          font-size: 14px;
          color: #888;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Email Verified Successfully!</h2>
        <p class="message">Hi ${username},</p>
        <p class="message">Your email address has been successfully verified. You can now start using our URL shortener service.</p>
        <p>If you need any assistance, feel free to contact us.</p>
        <div class="footer">- URL Shortener Support Team</div>
      </div>
    </body>
    </html>
  `;
};

export default emailVerifiedTemplate; 