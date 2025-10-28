import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SignUpDto } from './dto/signup.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signUp(dto: SignUpDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      return { ok: false as const, error: 'Email already in use' };
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    // Cast to any to avoid type mismatch before Prisma client is regenerated
    const user = await this.prisma.user.create({
      data: ({
        email: dto.email,
        name: dto.name ?? null,
        passwordHash,
      } as any),
      select: { id: true, email: true, name: true },
    });
    return { ok: true as const, data: user };
  }
}
