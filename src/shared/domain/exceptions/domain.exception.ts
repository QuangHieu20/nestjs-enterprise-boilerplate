import { HttpStatus } from '@nestjs/common';

/**
 * Base class for business-rule violations raised from the domain layer.
 *
 * `status` is what GlobalExceptionFilter maps to the HTTP response, keeping the
 * domain free of any transport concern beyond a plain numeric code.
 */
export class DomainException extends Error {
  constructor(
    message: string,
    public readonly status: number = HttpStatus.BAD_REQUEST,
    public readonly code: string = 'DOMAIN_ERROR',
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Resource does not exist. → 404 */
export class NotFoundException extends DomainException {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id "${id}" not found` : `${resource} not found`,
      HttpStatus.NOT_FOUND,
      'NOT_FOUND',
    );
  }
}

/** Action conflicts with current state (e.g. duplicate email). → 409 */
export class ConflictException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT, 'CONFLICT');
  }
}

/** Input is well-formed but violates a business rule. → 422 */
export class ValidationException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR');
  }
}
