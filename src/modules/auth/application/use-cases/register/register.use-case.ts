import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { IUseCase } from '@shared/application/use-case.interface';
import { RegisterDto } from '../../dtos/register.dto';
import {
  USER_REPOSITORY,
  PASSWORD_HASHER,
} from '@modules/user/application/ports/tokens';
import { type IUserRepository } from '@modules/user/application/ports/user.repository.interface';
import { type IPasswordHasher } from '@modules/user/application/ports/password-hasher.interface';
import { User } from '@modules/user/domain/entities/user.entity';
import {
  OUTBOX_REPOSITORY,
  TRANSACTION_RUNNER,
} from '@modules/message-queue/application/ports/tokens';
import { type IOutboxRepository } from '@modules/message-queue/application/ports/outbox.repository.interface';
import { type ITransactionRunner } from '@modules/message-queue/application/ports/transaction-runner.interface';
import { MessagePatterns } from '@modules/message-queue/domain/constants/message-queue.constants';

@Injectable()
export class RegisterUseCase implements IUseCase<RegisterDto, any> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(TRANSACTION_RUNNER)
    private readonly transaction: ITransactionRunner,
    @Inject(OUTBOX_REPOSITORY)
    private readonly outbox: IOutboxRepository,
  ) {}

  async execute(
    dto: RegisterDto,
  ): Promise<{ id: string; email: string; displayName: string }> {
    // 1. Check if email already exists
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('auth.register.email_taken');
    }

    // 2. Hash password
    const hashedPassword = await this.passwordHasher.hash(dto.password);

    // 3. Create new entity
    const newUser = new User({
      email: dto.email,
      password: hashedPassword,
      displayName: dto.displayName,
    });

    // 4. Save user and persist outbox event in the same transaction
    const savedUser = await this.transaction.run(async (manager) => {
      const saved = await this.userRepository.save(newUser, manager);
      await this.outbox.enqueue(manager, {
        pattern: MessagePatterns.USER_REGISTERED,
        payload: {
          userId: saved.id,
          email: saved.email,
          fullName: saved.displayName,
        },
      });
      return saved;
    });

    // Return user info without password
    return {
      id: savedUser.id,
      email: savedUser.email,
      displayName: savedUser.displayName,
    };
  }
}
