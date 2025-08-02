const passwordResetTemplate = (otp: number): string => {
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
        .otp {
          font-size: 24px;
          color: #e74c3c;
          font-weight: bold;
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
        <h2>Password Reset Request</h2>
        <p>Your one-time password (OTP) to reset your password is:</p>
        <div class="otp">${otp}</div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <div class="footer">- URL Shortener Support Team</div>
      </div>
    </body>
    </html>
  `;
};

export default passwordResetTemplate; 