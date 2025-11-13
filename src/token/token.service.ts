import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import BaseService from "src/interface/service/base.service";
import { Otp as OtpEntity, OtpPurpose } from "src/model/otp.entity";
import { EntityManager, Repository } from "typeorm";

@Injectable()
export class TokenService extends BaseService {
  constructor(
    @InjectRepository(OtpEntity)
    private otpRepository: Repository<OtpEntity>,
  ) {
    super();
  }

  async createOtp(
    data: {
      userId: string;
      purpose: OtpPurpose;
      expiresInMinutes?: number;
      maxAttempts?: number;
    },
    transactionalEntity?: EntityManager,
  ) {
    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() + (data.expiresInMinutes || 10),
    ); // Default 10 minutes

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    console.log("OTP:", data.purpose, "- ", code);

    const otpInstance = this.otpRepository.create({
      userId: data.userId,
      code,
      purpose: data.purpose,
      expiresAt,
      maxAttempts: data.maxAttempts || 3, // Default 3 attempts
      used: false,
    });

    return this.performEntityOps<OtpEntity, OtpEntity>({
      repositoryManager: this.otpRepository,
      transactionalEntity,
      action: "save",
      opsArgs: [otpInstance],
    });
  }

  async verifyOtp(
    data: {
      userId: string;
      code: string;
      purpose: OtpPurpose;
    },
    transactionalEntity?: EntityManager,
  ) {
    // Find the most recent otp for that particular purpose
    const otp = await this.performEntityOps<OtpEntity, OtpEntity>({
      repositoryManager: this.otpRepository,
      transactionalEntity,
      action: "findOne",
      opsArgs: [
        OtpEntity,
        {
          where: {
            userId: data.userId,
            purpose: data.purpose,
            used: false,
          },
          order: { createdAt: "DESC" },
        },
      ],
    });

    if (!otp || otp.isExpired())
      return { isValid: false, message: "Invalid or expired OTP" };

    if (otp.isMaxAttemptsReached())
      return {
        isValid: false,
        message: "Maximum attempts reached. Generate a new otp.",
      };

    otp.incrementAttempts();

    if (otp.code !== data.code) {
      // Save Attempt increment
      await this.performEntityOps<OtpEntity, OtpEntity>({
        repositoryManager: this.otpRepository,
        transactionalEntity,
        action: "save",
        opsArgs: [otp],
      });

      return {
        isValid: false,
        message: `Invalid OTP. ${otp.maxAttempts - otp.attempts} attempts remaining`,
      };
    }

    otp.used = true;

    // Save used status
    await this.performEntityOps<OtpEntity, OtpEntity>({
      repositoryManager: this.otpRepository,
      transactionalEntity,
      action: "save",
      opsArgs: [otp],
    });

    // Delete all other unused instance of this purpose
    await this.performEntityOps<OtpEntity, OtpEntity>({
      repositoryManager: this.otpRepository,
      transactionalEntity,
      action: "delete",
      opsArgs: [
        OtpEntity,
        {
          userId: data.userId,
          purpose: data.purpose,
          used: false,
        },
      ],
    });

    return { isValid: true, message: "OTP verified successfully" };
  }
}
