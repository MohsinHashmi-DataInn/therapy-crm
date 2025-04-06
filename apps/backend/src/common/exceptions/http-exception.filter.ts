import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP exception filter that handles all HTTP exceptions
 * Standardizes error responses and adds logging
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();

    // Extract message and error details
    const errorMessage = 
      typeof errorResponse === 'object' && 'message' in errorResponse
        ? errorResponse['message']
        : exception.message;
    
    // Log the error with appropriate level based on status code
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${status}: ${errorMessage}`,
        exception.stack,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `[${request.method}] ${request.url} - ${status}: ${errorMessage}`,
      );
    }

    // Return standardized error response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: typeof errorResponse === 'object' 
        ? errorResponse 
        : { message: errorMessage },
    });
  }
}
