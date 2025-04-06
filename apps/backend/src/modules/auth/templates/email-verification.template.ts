/**
 * Template for email verification emails
 * @param firstName - User's first name
 * @param verificationLink - Link for verifying email
 * @returns HTML content for email
 */
export const emailVerificationTemplate = (firstName: string, verificationLink: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #e4e4e4;
      border-radius: 5px;
    }
    .header {
      background-color: #3b82f6;
      color: white;
      padding: 15px;
      text-align: center;
      border-radius: 4px 4px 0 0;
    }
    .content {
      padding: 20px;
    }
    .button {
      display: inline-block;
      background-color: #3b82f6;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      margin: 20px 0;
      border-radius: 4px;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #666;
      text-align: center;
      border-top: 1px solid #e4e4e4;
      padding-top: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Verify Your Email Address</h2>
    </div>
    <div class="content">
      <p>Hello ${firstName},</p>
      <p>Thank you for registering with Therapy CRM. To complete your registration and verify your email address, please click the button below:</p>
      <p><a href="${verificationLink}" class="button">Verify Email</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p>${verificationLink}</p>
      <p>This link will expire in 24 hours.</p>
      <p>Thank you,<br>The Therapy CRM Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;
