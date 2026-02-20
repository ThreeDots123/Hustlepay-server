export default function userWelcomeMail(name: string, currentYear: number) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Welcome to Wokit</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 20px;">
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden;">
      <tr>
        <td style="padding: 20px; text-align: center; background: #4caf50; color: #fff;">
          <h2>Welcome Aboard, ${name}! 🎉</h2>
        </td>
      </tr>
      <tr>
        <td style="padding: 30px; color: #333;">
          <p>We’re excited to have you on <strong>Wokit</strong>!</p>
          <p>Here’s what you can do right away:</p>
          <ul>
            <li>👉 Complete your profile</li>
            <li>👉 Browse projects or gigs</li>
            <li>👉 Start connecting with clients and freelancers</li>
          </ul>
          <p style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background: #4caf50; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Go to Dashboard
            </a>
          </p>
          <p>If you need help, our support team is just a click away.</p>
          <p>Happy working!<br/>The Wokit Team</p>
        </td>
      </tr>
      <tr>
        <td style="background: #f4f6f9; padding: 15px; text-align: center; font-size: 12px; color: #999;">
          &copy; ${currentYear} Wokit. All rights reserved.
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}
