const verificationEmailTemplate = (token: string): string => {
  const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:8000';
  return `
    <div style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; color: #333;">
      <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 10px;">
        <h2 style="color: #2c3e50;">Verify your email address</h2>
        <p>Thank you for registering! Please verify your email address by clicking the link below:</p>
        <a href="${frontendUrl}/api/auth/verify-email?token=${token}" style="display: inline-block; padding: 10px 20px; background: #2c3e50; color: #fff; border-radius: 5px; text-decoration: none;">Verify Email</a>
        <p style="margin-top: 20px;">If you did not create an account, you can safely ignore this email.</p>
        <div style="margin-top: 20px; font-size: 14px; color: #888;">- URL Shortener Support Team</div>
      </div>
    </div>
  `;
};

export default verificationEmailTemplate; 