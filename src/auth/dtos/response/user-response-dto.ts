import { Role } from '@prisma/client';

export class UserResponse {
  id: string;
  email: string;
  role: Role;
  createdAt: Date;

  constructor(user: {
    id: string;
    email: string;
    role: Role;
    createdAt: Date;
  }) {
    this.id = user.id;
    this.email = user.email;
    this.role = user.role;
    this.createdAt = user.createdAt;
  }
}
