import { AppAbility } from '../types/app-ability.type';

export interface PolicyHandler {
  handle(ability: AppAbility): boolean;
}
