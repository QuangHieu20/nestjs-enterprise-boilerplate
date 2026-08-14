import { MessagePatterns } from '@modules/message-queue/domain/constants/message-queue.constants';

/**
 * Strongly-typed payload for each message pattern.
 * Publisher and consumer both import this map so the contract stays in sync.
 */
export interface MessagePayloads {
  [MessagePatterns.USER_REGISTERED]: {
    userId: string;
    email: string;
    fullName?: string;
  };
  [MessagePatterns.USER_PASSWORD_RESET_REQUESTED]: {
    userId: string;
    email: string;
    resetToken: string;
  };
}
