import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom exception class for telehealth-specific errors
 * Provides specialized error types and consistent error formatting for telehealth operations
 */
export class TelehealthException extends HttpException {
  /**
   * Create a new telehealth exception
   * 
   * @param message Error message
   * @param errorCode Optional error code for client identification
   * @param status HTTP status code (defaults to BAD_REQUEST)
   */
  constructor(
    message: string, 
    private readonly errorCode?: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST
  ) {
    super(
      {
        message,
        errorCode,
        timestamp: new Date().toISOString(),
        error: 'Telehealth Error'
      }, 
      status
    );
  }

  /**
   * Provider not found or invalid
   * 
   * @param providerId The ID of the provider
   * @returns A new TelehealthException
   */
  static providerNotFound(providerId: string | number | bigint): TelehealthException {
    return new TelehealthException(
      `Telehealth provider with ID ${providerId} not found`,
      'TELEHEALTH_PROVIDER_NOT_FOUND',
      HttpStatus.NOT_FOUND
    );
  }

  /**
   * Session not found
   * 
   * @param sessionId The ID of the virtual session
   * @returns A new TelehealthException
   */
  static sessionNotFound(sessionId: string | number | bigint): TelehealthException {
    return new TelehealthException(
      `Virtual session with ID ${sessionId} not found`,
      'VIRTUAL_SESSION_NOT_FOUND',
      HttpStatus.NOT_FOUND
    );
  }

  /**
   * Participant not found
   * 
   * @param participantId The participant ID
   * @param sessionId The session ID
   * @returns A new TelehealthException
   */
  static participantNotFound(participantId: string | number | bigint, sessionId: string | number | bigint): TelehealthException {
    return new TelehealthException(
      `Participant with ID ${participantId} not found for session ${sessionId}`,
      'PARTICIPANT_NOT_FOUND',
      HttpStatus.NOT_FOUND
    );
  }

  /**
   * Client not found
   * 
   * @param clientId The client ID
   * @returns A new TelehealthException
   */
  static clientNotFound(clientId: string | number | bigint): TelehealthException {
    return new TelehealthException(
      `Client with ID ${clientId} not found`,
      'CLIENT_NOT_FOUND',
      HttpStatus.NOT_FOUND
    );
  }

  /**
   * User not found
   * 
   * @param userId The user ID
   * @returns A new TelehealthException
   */
  static userNotFound(userId: string | number | bigint): TelehealthException {
    return new TelehealthException(
      `User with ID ${userId} not found`,
      'USER_NOT_FOUND',
      HttpStatus.NOT_FOUND
    );
  }

  /**
   * Invalid session status for the requested operation
   * 
   * @param sessionId The session ID
   * @param currentStatus The current session status
   * @param operation The operation being attempted
   * @returns A new TelehealthException
   */
  static invalidSessionStatus(sessionId: string | number | bigint, currentStatus: string, operation: string): TelehealthException {
    return new TelehealthException(
      `Session ${sessionId} is not in a valid state for ${operation}. Current status: ${currentStatus}`,
      'INVALID_SESSION_STATUS',
      HttpStatus.BAD_REQUEST
    );
  }

  /**
   * User doesn't have permission for the requested telehealth operation
   * 
   * @param userId The user ID
   * @param operation The operation being attempted
   * @returns A new TelehealthException
   */
  static insufficientPermission(userId: string | number | bigint, operation: string): TelehealthException {
    return new TelehealthException(
      `User ${userId} does not have permission to ${operation}`,
      'INSUFFICIENT_PERMISSION',
      HttpStatus.FORBIDDEN
    );
  }
}
