import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { LoginUseCase } from '@modules/auth/application/use-cases/login/login.use-case';
import { RegisterUseCase } from '@modules/auth/application/use-cases/register/register.use-case';
import { GoogleRegisterUseCase } from '@modules/auth/application/use-cases/google-register/google-register.use-case';
import { GoogleLoginUseCase } from '@modules/auth/application/use-cases/google-login/google-login.use-case';
import { RefreshUseCase } from '@modules/auth/application/use-cases/refresh/refresh.use-case';
import { LogoutUseCase } from '@modules/auth/application/use-cases/logout/logout.use-case';
import { MeUseCase } from '@modules/auth/application/use-cases/me/me.use-case';
import { LoginDto } from '@modules/auth/application/dtos/login.dto';
import { RegisterDto } from '@modules/auth/application/dtos/register.dto';
import { GoogleAuthDto } from '@modules/auth/application/dtos/google-auth.dto';
import { GoogleAuthGuard } from '@modules/auth/presentation/guards/google-auth.guard';
import { SocialUser } from '@modules/auth/presentation/decorators/social-user.decorator';
import type { GoogleVerifiedProfile } from '@modules/auth/domain/types/social-profile.type';
import { USER_REPOSITORY } from '@modules/user/application/ports/tokens';
import { type IUserRepository } from '@modules/user/application/ports/user.repository.interface';
import { AuthGuard } from '@modules/auth/presentation/guards/auth.guard';
import type { User } from '@modules/user/domain/entities/user.entity';
import { CheckPolicies } from '@modules/access-control/presentation/decorators/check-policies.decorator';
import { Action } from '@modules/access-control/domain/enums/action.enum';
import { AppSubject } from '@modules/access-control/domain/types/app-subject.type';
import { Public } from '@modules/auth/presentation/decorators/public.decorator';

/** Credential-guessing endpoints get a tighter budget than the global default. */
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly googleRegisterUseCase: GoogleRegisterUseCase,
    private readonly googleLoginUseCase: GoogleLoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly meUseCase: MeUseCase,
    @Inject(USER_REPOSITORY)
    private readonly userService: IUserRepository,
  ) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('/login')
  @ApiOperation({ summary: 'Standard Login' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.loginUseCase.execute(loginDto, response);
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Post('/google/login')
  @ApiOperation({ summary: 'Login with Google' })
  @ApiResponse({ status: 200 })
  async googleLogin(
    @Body() _googleAuthDto: GoogleAuthDto,
    @SocialUser() socialUser: GoogleVerifiedProfile,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.googleLoginUseCase.execute(socialUser, response);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('/register')
  @ApiOperation({ summary: 'User Registration' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  async register(@Body() registerDto: RegisterDto) {
    return this.registerUseCase.execute(registerDto);
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Post('/google/register')
  @ApiOperation({ summary: 'Register with Google' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  async googleRegister(
    @Body() _googleAuthDto: GoogleAuthDto,
    @SocialUser() socialUser: GoogleVerifiedProfile,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.googleRegisterUseCase.execute(socialUser, response);
  }

  // The refresh cookie is itself the credential here. Requiring a live access
  // token would make the 7-day refresh token unusable the moment it is needed.
  @Public()
  @Post('/refresh')
  @ApiOperation({ summary: 'User refresh token' })
  @ApiResponse({ status: 200, description: 'User refresh token' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.refreshUseCase.execute({ request, response });
  }

  @Post('/logout')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'User logout' })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = request.user as User;
    await this.logoutUseCase.execute({ user, request, response });
    // NOTE: this is a catalog key, not text. ResponseInterceptor currently
    // uses a handler-supplied `message` verbatim (only its own fallback goes
    // through TRANSLATOR) — see the i18n module's ResponseInterceptor for the
    // known gap this depends on being closed.
    return { message: 'common.logout_successful' };
  }

  @Get('/me')
  @ApiOperation({ summary: 'User Information' })
  @ApiResponse({ status: 200 })
  async me(@Req() req: Request) {
    return this.meUseCase.execute({ user: req.user! });
  }

  @Get('/permission')
  @CheckPolicies(Action.READ, AppSubject.ROLE)
  @ApiOperation({ summary: 'Check Permission' })
  @ApiResponse({ status: 200 })
  permission() {
    return { message: 'Permission granted' };
  }
}
