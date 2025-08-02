import nodemailer from 'nodemailer';
import logger from '../utils/logger/logger';
import passwordResetTemplate from '../utils/templates/passwordResetTemplate';
import verificationEmailTemplate from '../utils/templates/verificationEmailTemplate';
import welcomeEmailTemplate from '../utils/templates/welcomeEmailTemplate';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env['EMAIL_USER'] || "sujalkareliya27@gmail.com",
        pass: process.env['EMAIL_PASS'] || "bdsl zvti oxtj yhxs",
      },
    });
  }

  async sendPasswordResetOTP(to: string, otp: number): Promise<void> {
    const mailOptions = {
      from: `"URL Shortener Support"`,
      to,
      subject: 'Password Reset OTP',
      html: passwordResetTemplate(otp),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Reset OTP sent to ${to}`);
    } catch (error) {
      console.log(error);
      logger.error(`Failed to send OTP to ${to}:`, error);
      throw new Error('Failed to send OTP email');
    }
  }

  async sendVerificationEmail(to: string, token: string) {
    const mailOptions = {
      from: `"URL Shortener Support" <${process.env['EMAIL_USER']}>`,
      to,
      subject: 'Verify your email address',
      html: verificationEmailTemplate(token),
    };
    await this.transporter.sendMail(mailOptions);
  }

  async sendWelcomeEmail(to: string, username: string) {
    const mailOptions = {
      from: `"URL Shortener Support" <${process.env['EMAIL_USER']}>`,
      to,
      subject: 'Welcome to URL Shortener!',
      html: welcomeEmailTemplate(username),
    };
    await this.transporter.sendMail(mailOptions);
  }
}

export default new EmailService(); 