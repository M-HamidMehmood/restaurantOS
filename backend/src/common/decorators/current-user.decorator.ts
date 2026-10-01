import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface SupabaseUser {
  id: string;
  email?: string;
  role?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
}

export const CurrentUser = createParamDecorator(
  (data: keyof SupabaseUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as SupabaseUser;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
