import type { Request, Response, NextFunction } from "express";
import { OtpRequestSchema, OtpVerifySchema } from "@app/shared-types";
import { validateBody } from "../validators/validate.js";
import * as otpService from "../services/otp.service.js";
import { setRefreshCookie } from "./auth.controller.js";

export async function requestOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = OtpRequestSchema.parse(req.body);
    const result = await otpService.requestOtp(input);
    res.status(200).json(result);
  } catch (err: unknown) {
    next(err);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = OtpVerifySchema.parse(req.body);
    const { accessToken, refreshToken, refreshTokenMaxAgeMs, user } = await otpService.verifyOtp(input);
    setRefreshCookie(res, refreshToken, refreshTokenMaxAgeMs);
    res.status(200).json({ accessToken, user });
  } catch (err: unknown) {
    next(err);
  }
}
