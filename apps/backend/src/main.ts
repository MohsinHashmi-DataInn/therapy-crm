import { NestFactory } from '@nestjs/core';
import { ValidationPipe, HttpException, HttpStatus, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Custom exception filter class
class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    
    // Log the error for debugging
    console.error('Global exception filter caught error:', exception);
    
    // Default to internal server error
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    
    // If it's an HttpException, use its status and message
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (exception.message?.includes('Email already exists')) {
      // Special handling for email conflict errors
      status = HttpStatus.CONFLICT;
      message = 'Email already in use';
    } else if (exception.message?.includes('Missing required fields')) {
      // Special handling for validation errors
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
    }
    
    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Enable all log levels for better debugging
  });
  
  app.setGlobalPrefix('api');
  
  // Enhanced CORS configuration to fix fetch issues
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type,Accept,Authorization',
    preflightContinue: false,
    optionsSuccessStatus: 204
  });
  
  // Global exception filter for better error handling
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        console.log('Validation errors:', errors);
        const messages = errors.map(error => 
          Object.values(error.constraints || {}).join(', ')
        ).join('; ');
        
        return new HttpException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Validation failed: ${messages}`,
          errors: errors,
        }, HttpStatus.BAD_REQUEST);
      }
    }),
  );
  
  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Therapy CRM API')
    .setDescription('The Therapy CRM API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = process.env.PORT || 5000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
