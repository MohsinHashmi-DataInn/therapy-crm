import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract user information from request object
 * Use with @GetUser() or @GetUser('id') to get specific user properties
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    // Return the entire user object if no specific property requested
    if (!data) {
      return request.user;
    }
    
    // Return the specified property from the user object
    return request.user?.[data];
  },
);
