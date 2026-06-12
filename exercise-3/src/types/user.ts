/**
 * Represents a persisted user.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

/**
 * Request payload for user registration.
 */
export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}
