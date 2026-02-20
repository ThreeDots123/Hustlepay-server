import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./user.entity";
import { BaseEntity } from "src/interface/model/base.entity";
import { resolveDbType } from "src/utils/db-parse-column";

export enum OtpPurpose {
  EMAIL_VERIFICATION = "email_verification",
  PASSWORD_RESET = "password_reset",
  PASSWORDLESS_LOGIN = "passwordless_login",
}

@Entity("otp")
export class Otp extends BaseEntity {
  id_prefix = "otp";

  @Column({ name: "user_id" })
  userId: string;

  @Column()
  code: string;

  @Column({ nullable: true, unique: true })
  token?: string;

  @Column({
    type: "enum",
    enum: OtpPurpose,
    nullable: false,
  })
  purpose: OtpPurpose;

  @Column({ type: resolveDbType("timestamptz"), name: "expires_at" })
  expiresAt: Date;

  @Column({ default: false })
  used: boolean;

  @Column({ default: 0 })
  attempts: number;

  @Column({ name: "max_attempts", default: 3 })
  maxAttempts: number;

  @ManyToOne(() => User, {
    cascade: ["insert"],
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  isExpired(): boolean {
    return new Date() > new Date(this.expiresAt);
  }

  isMaxAttemptsReached(): boolean {
    return this.attempts >= this.maxAttempts;
  }

  incrementAttempts(): void {
    this.attempts += 1;
  }
}
