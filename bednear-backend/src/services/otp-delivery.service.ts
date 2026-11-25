
export async function deliverOtp(
  phone: string,
  code: string
): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SMS provider is not configured. OTP delivery is unavailable."
    );
  }

  // Development testing only. The OTP appears in the backend terminal.
  console.info(`[BedNear DEV OTP] ${phone}: ${code}`);
}
