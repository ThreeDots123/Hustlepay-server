import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseTransformerInterceptor } from './interceptors/response.interceptor';
import { ExceptionFilter } from './interceptors/exception-filter.interceptor';
import { PORT } from './config/env';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enabling validation globally with dto files
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Setting up swagger docs tool
  const config = new DocumentBuilder()
    .setTitle('Hustle pay')
    .setDescription('A freelancing platform for Nigerians.')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  //* Register the response interceptor
  app.useGlobalInterceptors(new ResponseTransformerInterceptor());

  //* Handle Exceptions
  app.useGlobalFilters(new ExceptionFilter());

  await app.listen(configService.getOrThrow<number>(PORT));
}
bootstrap();
