import { userRepository, authRepository } from "../repositories/index.js";
import { NotFoundError } from "../utils/errors.js";

export class UserService {
  async getById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  async getByEmail(email: string) {
    return userRepository.findByEmail(email);
  }
}

export class AuthService {
  async revokeSession(refreshTokenHash: string) {
    const token = await authRepository.findRefreshToken(refreshTokenHash);
    if (token) {
      await authRepository.revokeRefreshToken(token.id);
    }
  }
}

export const userService = new UserService();
export const authService = new AuthService();
