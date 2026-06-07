import { NextResponse } from 'next/server';
import { redis } from '../../../../lib/redis';
import { logger } from '../../../../lib/logger';
import { hashPassword } from '../../../../lib/auth';
import nodemailer from 'nodemailer';

export async function POST(request) {
  if (!redis) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  }

  try {
    const { action, email, token, password } = await request.json();

    if (action === 'request') {
      if (!email) {
        return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const userJson = await redis.get(`user:${normalizedEmail}`);
      
      if (!userJson) {
        // Return success for security to avoid email enumeration
        return NextResponse.json({ success: true, message: 'If this email is registered, recovery instructions have been sent.' });
      }

      const recoveryToken = crypto.randomUUID();
      await redis.set(`recovery:${recoveryToken}`, normalizedEmail, { ex: 60 * 30 }); // 30 mins

      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login?token=${recoveryToken}`;

      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT || 587;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpFrom = process.env.SMTP_FROM || smtpUser;

      if (smtpHost && smtpUser && smtpPass) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: Number(smtpPort),
            secure: Number(smtpPort) === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          });

          await transporter.sendMail({
            from: smtpFrom,
            to: normalizedEmail,
            subject: 'Reset your password — tiny.to',
            text: `Hello,\n\nPlease click the link below to reset your password:\n\n${resetLink}\n\nThis link will expire in 30 minutes.\n\nBest,\ntiny.to team`,
            html: `<p>Hello,</p><p>Please click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link will expire in 30 minutes.</p><p>Best,<br>tiny.to team</p>`,
          });
        } catch (mailErr) {
          logger.error('Failed to send recovery email:', mailErr);
          return NextResponse.json({ error: 'Failed to send recovery email. Please try again later.' }, { status: 500 });
        }
      } else {
        // Logging fallback for local testing without SMTP configured
        console.log('\n==================================================');
        console.log(`[PASSWORD RECOVERY] Reset Link for ${normalizedEmail}:`);
        console.log(resetLink);
        console.log('==================================================\n');
      }

      return NextResponse.json({
        success: true,
        message: 'Recovery instructions have been sent.'
      });
    }

    if (action === 'reset') {
      if (!token) {
        return NextResponse.json({ error: 'Token is required.' }, { status: 400 });
      }
      if (!password || password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
      }

      const email = await redis.get(`recovery:${token}`);
      if (!email) {
        return NextResponse.json({ error: 'Invalid or expired recovery token.' }, { status: 400 });
      }

      const userJson = await redis.get(`user:${email}`);
      if (!userJson) {
        return NextResponse.json({ error: 'User no longer exists.' }, { status: 404 });
      }

      const user = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
      user.passwordHash = await hashPassword(password);

      await redis.set(`user:${email}`, JSON.stringify(user));
      await redis.del(`recovery:${token}`);

      return NextResponse.json({ success: true, message: 'Password has been reset successfully.' });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    logger.error('Recovery error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
