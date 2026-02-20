export default function verifyEmail(currentYear: number, otpCode: string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Verify Your Account</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 20px;">
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden;">
      <tr>
        <td style="padding: 20px; text-align: center; background: #2d89ef; color: #fff;">
          <h2>Welcome to Wokit!</h2>
        </td>
      </tr>
      <tr>
        <td style="padding: 30px; color: #333;">
          <p>Hello <strong>{{name}}</strong>,</p>
          <p>Thanks for signing up! Please confirm your email address by using the otp code below:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a style="background: #2d89ef; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            ${otpCode}
            </a>
          </p>
          <p>If the button doesn’t work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2d89ef;">{{verificationUrl}}</p>
          <p>Cheers,<br/>The Wokit Team</p>
        </td>
      </tr>
      <tr>
        <td style="background: #f4f6f9; padding: 15px; text-align: center; font-size: 12px; color: #999;">
          &copy; ${currentYear}. Wokit. All rights reserved.
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}
