import re

path = 'src/services/auth.service.ts'
raw = open(path).read()

addition = '''
/** Short-lived single-use registration token — issued ONLY after the signup
 * OTP verified email ownership. The signup API requires it (server-side
 * enforcement: the OTP step cannot be bypassed by direct API calls). */
export function createRegistrationToken(email: string, otpRowId: string): string {
  const payload = {
    sub: email.toLowerCase(),
    purpose: "registration" as const,
    nonce: otpRowId,
  };
  return jwt.sign(payload, getAccessSecret(), { expiresIn: "15m" } as jwt.SignOptions);
}

function verifyRegistrationToken(token: string): { sub: string; nonce: string } {
  let decoded: { sub: string; purpose: string; nonce: string };
  try {
    decoded = jwt.verify(token, getAccessSecret()) as typeof decoded;
  } catch {
    throw new AppError("Registration session expired — verify your email again", 401, "BAD_REQUEST");
  }
  if (decoded.purpose !== "registration") {
    throw new AppError("Invalid registration token", 403, "FORBIDDEN");
  }
  return { sub: decoded.sub, nonce: decoded.nonce };
}
'''

raw = raw.replace("export const authService = {", addition + "\nexport const authService = {")
# add both to the authService object
raw = raw.replace("""  createFromOtp,
  loginWithActiveUser,
};""", """  createFromOtp,
  loginWithActiveUser,
  createRegistrationToken,
  signupWithRegistrationToken,
};""")
open(path, 'w').write(raw)
print('helpers added to authService')
