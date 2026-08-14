import { of } from 'rxjs';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { ResponseInterceptor } from './response.interceptor';
import type { ITranslator } from '@modules/i18n/application/ports/translator.interface';

function buildContext(): ExecutionContext {
  return {} as ExecutionContext;
}

function buildHandler(payload: unknown): CallHandler {
  return { handle: () => of(payload) };
}

describe('ResponseInterceptor message translation', () => {
  it('translates the default fallback when the handler returns no message', (done) => {
    const translator: jest.Mocked<ITranslator> = {
      translate: jest.fn().mockReturnValue('Operation successful'),
    };
    const interceptor = new ResponseInterceptor(translator);

    interceptor
      .intercept(buildContext(), buildHandler({ id: 1 }))
      .subscribe((result) => {
        expect(translator.translate).toHaveBeenCalledWith(
          'common.operation_successful',
          'en',
        );
        expect(result.message).toBe('Operation successful');
        done();
      });
  });

  it('treats a handler-supplied message as a catalog key and translates it — not a raw key', (done) => {
    const translator: jest.Mocked<ITranslator> = {
      translate: jest.fn().mockReturnValue('Logout successful'),
    };
    const interceptor = new ResponseInterceptor(translator);

    interceptor
      .intercept(
        buildContext(),
        buildHandler({ message: 'common.logout_successful' }),
      )
      .subscribe((result) => {
        expect(translator.translate).toHaveBeenCalledWith(
          'common.logout_successful',
          'en',
        );
        expect(result.message).toBe('Logout successful');
        expect(result.message).not.toBe('common.logout_successful');
        done();
      });
  });
});
