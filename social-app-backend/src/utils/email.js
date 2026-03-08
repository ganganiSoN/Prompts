const nodemailer = require('nodemailer');

// In a real production environment, you would use a service like SendGrid, AWS SES, or Mailgun
// For this application, we will use a test/mock setup or standard SMTP if provided in .env
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: process.env.SMTP_PORT || 587,
        auth: {
            user: process.env.SMTP_USER || 'ethereal_user',
            pass: process.env.SMTP_PASS || 'ethereal_pass'
        }
    });
};

const sendDataExportEmail = async (toEmail, userName, jsonString, csvString, pdfBuffer) => {
    try {
        const transporter = createTransporter();

        const attachments = [
            {
                filename: `social_app_export_${Date.now()}.json`,
                content: jsonString,
                contentType: 'application/json'
            },
            {
                filename: `social_app_export_${Date.now()}.csv`,
                content: csvString,
                contentType: 'text/csv'
            }
        ];

        let pdfNotice = '';
        if (pdfBuffer) {
            attachments.push({
                filename: `social_app_export_${Date.now()}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            });
            pdfNotice = ' a PDF printed summary,';
        }

        const mailOptions = {
            from: '"Social App Data Protection" <noreply@socialapp.local>',
            to: toEmail,
            subject: 'Your Requested Data Export',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h2 style="color: #4f46e5;">Data Export Complete</h2>
                    <p>Hello ${userName},</p>
                    <p>We have finished processing your request for a copy of your personal data.</p>
                    <p>Attached to this email, you will find${pdfNotice} a JSON formatted file (suitable for developers or importing to other systems) and a CSV formatted file (suitable for spreadsheet applications like Excel).</p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <strong>Security Notice:</strong>
                        <p style="margin-bottom: 0;">These files contain your personal information, activity logs, and messages. Keep them secure and do not share them publicly.</p>
                    </div>

                    <p>If you did not request this export, please secure your account immediately by changing your password.</p>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                    <p style="font-size: 12px; color: #6b7280; text-align: center;">
                        This is an automated message from the Social App privacy team.
                    </p>
                </div>
            `,
            attachments: attachments
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Data export email sent: %s', info.messageId);

        // Return true if successful
        return true;
    } catch (error) {
        console.error('Email dispatch failed:', error);
        return false;
    }
};

module.exports = {
    sendDataExportEmail
};
