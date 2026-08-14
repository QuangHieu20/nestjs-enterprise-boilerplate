import { validate } from 'class-validator';
import { getMetadataStorage } from 'class-validator';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';
import { GoogleAuthDto } from './google-auth.dto';

/**
 * i18nValidationMessage() only produces literal catalog text inside a real
 * HTTP request — it needs I18nContext.current(), which does not exist here.
 * Outside a request (per nestjs-i18n's util.js), invoking the message
 * factory yields the raw string `${key}|${JSON.stringify({value, constraints, ...args})}`,
 * which I18nValidationExceptionFilter later parses and translates. These
 * tests assert the link that matters at this layer: that each decorator's
 * `message` factory embeds the *correct* catalog key (and, for
 * `min_length`, the *correct* constraint value) — not the final rendered
 * text, which is main.ts's / the filter's responsibility.
 */
function extractKeyAndArgs(raw: string): {
  key: string;
  args: Record<string, unknown>;
} {
  const separatorIndex = raw.indexOf('|');
  if (separatorIndex === -1) {
    return { key: raw, args: {} };
  }
  return {
    key: raw.slice(0, separatorIndex),
    args: JSON.parse(raw.slice(separatorIndex + 1)) as Record<string, unknown>,
  };
}

describe('Auth DTO validation messages carry i18n keys', () => {
  describe('LoginDto', () => {
    it('reports every violated rule when both fields are invalid at once', async () => {
      const dto = new LoginDto();
      dto.email = '';
      dto.password = '';

      const errors = await validate(dto);
      const byProperty = Object.fromEntries(errors.map((e) => [e.property, e]));

      expect(Object.keys(byProperty).sort()).toEqual(['email', 'password']);

      // Each field fails two rules simultaneously — proves multi-rule
      // payloads surface every reason, none silently dropped.
      expect(Object.keys(byProperty.email.constraints ?? {}).sort()).toEqual(
        ['isEmail', 'isNotEmpty'].sort(),
      );
      expect(Object.keys(byProperty.password.constraints ?? {}).sort()).toEqual(
        ['isNotEmpty', 'minLength'].sort(),
      );

      expect(
        extractKeyAndArgs(byProperty.email.constraints!.isNotEmpty).key,
      ).toBe('validation.email.required');
      expect(extractKeyAndArgs(byProperty.email.constraints!.isEmail).key).toBe(
        'validation.email.invalid',
      );
      expect(
        extractKeyAndArgs(byProperty.password.constraints!.isNotEmpty).key,
      ).toBe('validation.password.required');
      expect(
        extractKeyAndArgs(byProperty.password.constraints!.minLength).key,
      ).toBe('validation.password.min_length');
    });

    it('validation.password.min_length carries the real @MinLength constraint, not a hardcoded number', async () => {
      // Derived from the decorator itself (not a number typed into this
      // test) — if login.dto.ts's @MinLength(6) ever changes, this still
      // proves the rendered arg tracks the rule rather than drifting from it.
      const metadatas = getMetadataStorage().getTargetValidationMetadatas(
        LoginDto,
        '',
        true,
        false,
      );
      const minLengthMeta = metadatas.find(
        (m) => m.propertyName === 'password' && m.name === 'minLength',
      );
      expect(minLengthMeta).toBeDefined();
      const expectedMinLength = minLengthMeta!.constraints[0] as number;
      expect(expectedMinLength).toBeGreaterThan(0);

      const dto = new LoginDto();
      dto.email = 'valid@example.com';
      dto.password = 'a'.repeat(expectedMinLength - 1); // one short of the real minimum

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();

      const { key, args } = extractKeyAndArgs(
        passwordError!.constraints!.minLength,
      );
      expect(key).toBe('validation.password.min_length');
      // class-validator passes @MinLength(6)'s constraints array (`[6]`)
      // straight through to the message factory as `args.constraints`.
      expect(args.constraints).toEqual([expectedMinLength]);
    });
  });

  describe('RegisterDto', () => {
    it('reports every violated rule across three fields at once', async () => {
      const dto = new RegisterDto();
      dto.email = 'not-an-email';
      dto.password = '123'; // non-empty but under the minimum
      dto.displayName = '';

      const errors = await validate(dto);
      const byProperty = Object.fromEntries(errors.map((e) => [e.property, e]));

      expect(Object.keys(byProperty).sort()).toEqual(
        ['displayName', 'email', 'password'].sort(),
      );

      expect(extractKeyAndArgs(byProperty.email.constraints!.isEmail).key).toBe(
        'validation.email.invalid',
      );
      expect(
        extractKeyAndArgs(byProperty.password.constraints!.minLength).key,
      ).toBe('validation.password.min_length');
      expect(
        extractKeyAndArgs(byProperty.displayName.constraints!.isNotEmpty).key,
      ).toBe('validation.display_name.required');
    });
  });

  describe('GoogleAuthDto', () => {
    it('reports the credential-required key when credential is blank', async () => {
      const dto = new GoogleAuthDto();
      dto.credential = '';

      const errors = await validate(dto);
      const credentialError = errors.find((e) => e.property === 'credential');
      expect(credentialError).toBeDefined();

      expect(
        extractKeyAndArgs(credentialError!.constraints!.isNotEmpty).key,
      ).toBe('validation.credential.required');
    });
  });
});
