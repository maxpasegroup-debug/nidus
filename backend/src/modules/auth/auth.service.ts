import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { Role, type User } from "../../generated/prisma/client.js";

type AuthUser = Pick<
  User,
  "id" | "name" | "email" | "mobile" | "role" | "emailVerified" | "mobileVerified" | "createdAt" | "updatedAt"
>;

type RegisterInput = {
  name: string;
  email: string;
  mobile: string;
  password: string;
  role?: Role;
};

type LoginInput = {
  identifier: string;
  password: string;
};

type OtpType = "LOGIN" | "FORGOT_PASSWORD" | "SIGNUP";

const OTP_EXPIRY_MINUTES = 5;
const JWT_EXPIRES_IN = "8h";
const RESET_TOKEN_EXPIRES_IN = "10m";

const mailer = nodemailer.createTransport({
  jsonTransport: true
});

function sanitizeUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    emailVerified: user.emailVerified,
    mobileVerified: user.mobileVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function signAuthToken(user: Pick<User, "id" | "role">) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

function signResetToken(user: Pick<User, "id">) {
  return jwt.sign({ sub: user.id, purpose: "reset-password" }, env.JWT_SECRET, {
    expiresIn: RESET_TOKEN_EXPIRES_IN
  });
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpPlaceholder(identifier: string, otp: string, type: OtpType) {
  await mailer.sendMail({
    from: "no-reply@nidus.local",
    to: identifier.includes("@") ? identifier : "mobile-placeholder@nidus.local",
    subject: `NIDUS ${type} OTP`,
    text: `Your OTP is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`
  });

  console.log(`[OTP:${type}] ${identifier} -> ${otp}`);
}

async function createOtp(identifier: string, type: OtpType) {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otp.create({
    data: {
      identifier,
      otp,
      type,
      expiresAt
    }
  });

  await sendOtpPlaceholder(identifier, otp, type);
}

async function verifyOtpRecord(identifier: string, otp: string, type: OtpType) {
  const record = await prisma.otp.findFirst({
    where: {
      identifier,
      otp,
      type,
      expiresAt: {
        gt: new Date()
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  if (!record) {
    throw new Error("Invalid or expired OTP");
  }

  await prisma.otp.delete({ where: { id: record.id } });
}

export const authService = {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { mobile: input.mobile }]
      }
    });

    if (existingUser) {
      throw new Error("Email or mobile already registered");
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        mobile: input.mobile,
        password: hashedPassword,
        role: input.role ?? Role.STUDENT
      }
    });

    await createOtp(input.email, "SIGNUP");

    return {
      token: signAuthToken(user),
      user: sanitizeUser(user)
    };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.identifier }, { mobile: input.identifier }]
      }
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    return {
      token: signAuthToken(user),
      user: sanitizeUser(user)
    };
  },

  async sendMobileOtp(mobile: string) {
    const user = await prisma.user.findUnique({ where: { mobile } });

    if (!user) {
      throw new Error("Mobile number is not registered");
    }

    await createOtp(mobile, "LOGIN");
    return { message: "OTP sent successfully" };
  },

  async verifyMobileOtp(mobile: string, otp: string) {
    await verifyOtpRecord(mobile, otp, "LOGIN");

    const user = await prisma.user.update({
      where: { mobile },
      data: { mobileVerified: true }
    });

    return {
      token: signAuthToken(user),
      user: sanitizeUser(user)
    };
  },

  async sendForgotPasswordOtp(identifier: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { mobile: identifier }]
      }
    });

    if (!user) {
      throw new Error("User not found");
    }

    await createOtp(identifier, "FORGOT_PASSWORD");
    return { message: "Password reset OTP sent successfully" };
  },

  async verifyForgotPasswordOtp(identifier: string, otp: string) {
    await verifyOtpRecord(identifier, otp, "FORGOT_PASSWORD");

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { mobile: identifier }]
      }
    });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      resetToken: signResetToken(user)
    };
  },

  async resetPassword(resetToken: string, password: string) {
    const payload = jwt.verify(resetToken, env.JWT_SECRET);

    if (typeof payload !== "object" || payload.purpose !== "reset-password" || !payload.sub) {
      throw new Error("Invalid reset token");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: payload.sub },
      data: { password: hashedPassword }
    });

    return { message: "Password reset successfully" };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error("User not found");
    }

    return sanitizeUser(user);
  }
};
