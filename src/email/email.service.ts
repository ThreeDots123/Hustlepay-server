import { Injectable, Logger } from "@nestjs/common";
import Mailjet from "node-mailjet";
import userWelcomeMail from "./texts/welcome";
// import passwordReset from './email-texts/password-reset';
import verifyEmail from "./texts/verify-account";
import { ConfigService } from "@nestjs/config";
import {
  MAILJET_API_KEY,
  MAILJET_NOREPLY_ADDRESS,
  MAILJET_SECRET_KEY,
} from "src/config/env";
import passwordReset from "./texts/password-reset";

export interface EmailConfig {
  apiKey: string;
  secretKey: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  textContent?: string;
  htmlContent?: string;
  templateId?: number;
  variables?: Record<string, any>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private mailjet: any;
  private config: EmailConfig;

  constructor(private configService: ConfigService) {
    const apiKey = configService.getOrThrow<string>(MAILJET_API_KEY);
    const secretKey = configService.getOrThrow<string>(MAILJET_SECRET_KEY);
    const noReplyAddress = configService.getOrThrow<string>(
      MAILJET_NOREPLY_ADDRESS,
    );

    this.config = {
      apiKey: apiKey,
      secretKey: secretKey,
      fromEmail: noReplyAddress,
      fromName: "HustlePay",
    };

    this.mailjet = (Mailjet as any).apiConnect(
      this.config.apiKey,
      this.config.secretKey,
    );
  }

  private async sendTemplateEmail(options: EmailOptions) {
    try {
      const recipients = Array.isArray(options.to)
        ? options.to.map((email) => ({ Email: email }))
        : [{ Email: options.to }];

      const emailData: any = {
        Messages: [
          {
            From: {
              Email: this.config.fromEmail,
              Name: this.config.fromName,
            },
            To: recipients,
            Subject: options.subject,
          },
        ],
      };

      if (options.htmlContent) {
        emailData.Messages[0].HTMLPart = options.htmlContent;
      }

      await this.mailjet.post("send", { version: "v3.1" }).request(emailData);
      this.logger.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  async sendUserWelcomeEmail(
    userName: string,
    email: string,
    subject: string,
    currentYear: number,
  ) {
    await this.sendTemplateEmail({
      htmlContent: userWelcomeMail(userName, currentYear),
      to: email,
      subject,
    });
  }

  async sendPasswordReset(
    details: {
      fullName: string;
      otpCode: string;
    },
    email: string,
    subject: string,
  ) {
    await this.sendTemplateEmail({
      to: email,
      subject,
      htmlContent: passwordReset(details.fullName, details.otpCode),
    });
  }

  async verifyEmail(
    details: {
      otpCode: string;
      currentYear: number;
    },
    email: string,
    subject: string,
  ) {
    // await this.sendTemplateEmail({
    //   to: email,
    //   subject,
    //   htmlContent: verifyEmail(details.currentYear, details.otpCode),
    // });
  }

  //   async passwordlessLogin(
  //     details: {
  //       logoUrl: string;
  //       otpCode: string;
  //       currentYear: number;
  //       companyName: string;
  //     },
  //     email: string,
  //     subject: string,
  //   ) {
  //     await this.sendTemplateEmail({
  //       to: email,
  //       subject,
  //       htmlContent: sendPasswordlessEmailToken(
  //         details.logoUrl,
  //         details.otpCode,
  //         details.currentYear,
  //         details.companyName,
  //       ),
  //     });
  //   }
}
