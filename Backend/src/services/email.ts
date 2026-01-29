import { Resend } from 'resend';
import { IUser, ISubscription, IEventLog } from '../models';
import { env } from '../config';

// Initialize Resend client
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const sendFailureNotification = async (
    user: IUser,
    subscription: ISubscription,
    event: IEventLog
) => {
    if (!resend) {
        console.log('📧 Email notifications disabled (RESEND_API_KEY not configured)');
        return;
    }

    try {
        await resend.emails.send({
            from: 'Contract Webhook API <noreply@cyberpunkinc.xyz>',
            to: user.email,
            subject: `⚠️ Webhook Delivery Failed - ${subscription.contractAddress.slice(0, 10)}...`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc2626;">Webhook Delivery Failed</h2>
                    <p>Hello ${user.name},</p>
                    <p>We were unable to deliver an event to your webhook after 5 retry attempts.</p>
                    
                    <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0 0 8px;"><strong>Event:</strong> ${event.eventName}</p>
                        <p style="margin: 0 0 8px;"><strong>Contract:</strong> ${subscription.contractAddress}</p>
                        <p style="margin: 0 0 8px;"><strong>Block:</strong> ${event.blockNumber}</p>
                        <p style="margin: 0 0 8px;"><strong>Webhook URL:</strong> ${subscription.webhookUrl}</p>
                        <p style="margin: 0;"><strong>Transaction:</strong> ${event.transactionHash}</p>
                    </div>
                    
                    <p>This event has been marked as failed and is available for manual replay in your dashboard.</p>
                    
                    <p><a href="${env.FRONTEND_URL}/dashboard" 
                          style="display: inline-block; background: #00bcd4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                        View Dashboard
                    </a></p>
                    
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                        You can disable these notifications in your dashboard settings.
                    </p>
                </div>
            `,
        });

        console.log(`📧 Failure notification sent to ${user.email}`);
    } catch (error) {
        console.error('Failed to send email notification:', error);
    }
};
