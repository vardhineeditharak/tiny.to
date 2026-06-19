import { NextResponse } from 'next/server';
import { redis } from '../../../../lib/redis';
import { logger } from '../../../../lib/logger';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!redis) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 503 });
  }

  // Security: Check for CRON_SECRET if configured in env
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('Authorization');
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get('secret');

    const isAuthorized = 
      (authHeader && authHeader === `Bearer ${cronSecret}`) || 
      (querySecret && querySecret === cronSecret);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
  }

  try {
    // 1. Get all user keys from Redis
    const userKeys = await redis.keys('user:*');
    if (!userKeys || userKeys.length === 0) {
      return NextResponse.json({ success: true, message: 'No users found.', usersEmailedCount: 0 });
    }

    let usersEmailedCount = 0;
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    const hasSmtpConfig = smtpHost && smtpUser && smtpPass;
    let transporter = null;

    if (hasSmtpConfig) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // 2. Loop through all users
    for (const key of userKeys) {
      const userJson = await redis.get(key);
      if (!userJson) continue;

      const user = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;

      // Only send if user has email analytics option enabled
      if (!user.emailAnalyticsEnabled) continue;

      // 3. Get user's links
      const linkCodes = await redis.smembers(`user_links:${user.userId}`);
      if (!linkCodes || linkCodes.length === 0) continue;

      const linksReportData = [];
      let totalClicksThisWeekAllLinks = 0;

      for (const code of linkCodes) {
        const originalUrl = await redis.get(`url:${code}`);
        if (!originalUrl) continue;

        const totalClicks = parseInt(await redis.get(`clicks:${code}`) || 0, 10);

        // Fetch click logs to calculate clicks in the last 7 days
        const logStrings = await redis.lrange(`analytics:${code}`, 0, -1) || [];
        let clicksThisWeek = 0;

        for (const logStr of logStrings) {
          try {
            const log = typeof logStr === 'string' ? JSON.parse(logStr) : logStr;
            if (log && log.timestamp && new Date(log.timestamp).getTime() > sevenDaysAgo) {
              clicksThisWeek++;
            }
          } catch (_) {
            // Ignore parse errors
          }
        }

        totalClicksThisWeekAllLinks += clicksThisWeek;
        linksReportData.push({
          shortCode: code,
          original: originalUrl,
          clicksThisWeek,
          totalClicks,
        });
      }

      // If they have no valid links, skip email
      if (linksReportData.length === 0) continue;

      // 4. Construct Email Template
      const shortDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN || 'tiny.to';
      const tableRowsHtml = linksReportData
        .map(
          (item) => `
        <tr>
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-family: monospace;">
            <a href="https://${shortDomain}/${item.shortCode}" style="color: #22c55e; text-decoration: none;">${shortDomain}/${item.shortCode}</a>
          </td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${item.original}
          </td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; font-weight: bold;">
            ${item.clicksThisWeek}
          </td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
            ${item.totalClicks}
          </td>
        </tr>
      `
        )
        .join('');

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #111;">
          <h2 style="color: #111; border-bottom: 2px solid #22c55e; padding-bottom: 10px; margin-bottom: 20px;">
            Weekly Link Analytics Summary
          </h2>
          <p>Hello ${user.name || 'User'},</p>
          <p>Here is your weekly summary of click analytics for your links on <strong>${shortDomain}</strong>.</p>
          
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
            <span style="font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 5px;">
              Total Redirects (Past 7 Days)
            </span>
            <strong style="font-size: 36px; color: #22c55e;">${totalClicksThisWeekAllLinks}</strong>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
            <thead>
              <tr style="background-color: #f3f4f6; text-align: left;">
                <th style="padding: 10px; border: 1px solid #e5e7eb;">Short Link</th>
                <th style="padding: 10px; border: 1px solid #e5e7eb;">Original URL</th>
                <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">New Clicks</th>
                <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">Total Clicks</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>

          <p>Keep sharing and tracking your links!</p>
          <p style="margin-top: 30px;">Best,<br/>The ${shortDomain} Team</p>
          
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>
          <p style="font-size: 11px; color: #9ca3af; text-align: center;">
            You received this automated report because you opted in under your Account Settings. 
            You can unsubscribe or change settings at any time in your dashboard settings.
          </p>
        </div>
      `;

      // 5. Send report email
      if (hasSmtpConfig && transporter) {
        try {
          await transporter.sendMail({
            from: smtpFrom,
            to: user.email,
            subject: `Weekly link analytics summary — ${shortDomain}`,
            html: emailHtml,
          });
          usersEmailedCount++;
        } catch (mailErr) {
          logger.error(`Failed to send weekly report email to ${user.email}:`, mailErr);
        }
      } else {
        // Fallback for local logging if SMTP is not configured
        console.log('\n==================================================');
        console.log(`[WEEKLY CRON REPORT FALLBACK] Sent to ${user.email}`);
        console.log(`Total weekly clicks: ${totalClicksThisWeekAllLinks}`);
        console.log('==================================================\n');
        usersEmailedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Weekly reports cron completed successfully.',
      usersEmailedCount,
    });
  } catch (error) {
    logger.error('Weekly reports cron job error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
