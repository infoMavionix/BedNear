
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured in .env");
  }

  return secret;
};

export async function registerOwner(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  businessName?: string;
}) {
  const email = input.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw Object.assign(new Error("Email already registered."), {
      statusCode: 409,
    });
  }

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash: await bcrypt.hash(input.password, 12),
      phone: input.phone,
      businessName: input.businessName,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      businessName: true,
    },
  });

  const token = jwt.sign({}, getJwtSecret(), {
    subject: user.id,
    expiresIn: "7d",
  });

  return { user, token };
}

export async function loginOwner(input: {
  email: string;
  password: string;
}) {
  const email = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw Object.assign(new Error("Email or password is incorrect."), {
      statusCode: 401,
    });
  }

  const { passwordHash: _passwordHash, ...safeUser } = user;

  const token = jwt.sign({}, getJwtSecret(), {
    subject: user.id,
    expiresIn: "7d",
  });

  return { user: safeUser, token };
}

export async function getCurrentOwner(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      businessName: true,
    },
  });

  if (!user) {
    throw Object.assign(new Error("User not found."), {
      statusCode: 404,
    });
  }

  return { user };
}
