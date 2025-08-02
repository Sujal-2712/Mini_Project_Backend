const urlCreatedEmailTemplate = (originalUrl: string, shortUrl: string): string => {
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
        <h2>URL Shortened Successfully!</h2>
        <p class="message">Your URL has been successfully shortened. Here are the details:</p>
        <p class="message">Original URL: <a href="${originalUrl}">${originalUrl}</a></p>
        <p class="message">Shortened URL: <a href="${shortUrl}">${shortUrl}</a></p>
        <p class="message">You can now share this short URL with others.</p>
        <div class="footer">- URL Shortener Support Team</div>
      </div>
    </body>
    </html>
  `;
};

export default urlCreatedEmailTemplate; 