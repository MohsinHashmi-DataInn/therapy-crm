import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom exception class for telehealth-related errors
 */
export class TelehealthException extends HttpException {
  /**
   * Create a new TelehealthException instance
   * @param message Error message
   * @param statusCode HTTP status code
   */
  constructor(message: string, statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR) {
    super(message, statusCode);
  }

  /**
   * Exception for when report generation fails
   * @param errorMessage Specific error message
   * @returns TelehealthException
   */
  static reportGenerationFailed(errorMessage: string): TelehealthException {
    return new TelehealthException(
      `Failed to generate telehealth report: ${errorMessage}`,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  /**
   * Exception for when telehealth session creation fails
   * @param errorMessage Specific error message
   * @returns TelehealthException
   */
  static sessionCreationFailed(errorMessage: string): TelehealthException {
    return new TelehealthException(
      `Failed to create telehealth session: ${errorMessage}`,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
