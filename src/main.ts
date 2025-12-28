import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { ResponseTransformerInterceptor } from "./interceptors/response.interceptor";
import { ExceptionFilter } from "./interceptors/exception-filter.interceptor";
import { CORS_WHITELIST_URLS, PORT } from "./config/env";
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enabling validation globally with dto files
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Enable CORS with configuration
  app.enableCors({
    origin: configService.getOrThrow<string>(CORS_WHITELIST_URLS).split(","),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow cookies to be sent
  });

  // Setting up swagger docs tool
  const config = new DocumentBuilder()
    .setTitle("Hustle Pay API")
    .setDescription(
      "A comprehensive freelancing platform API for Nigerians. This API enables clients to post proposals and freelancers to submit bids. Features include user authentication, profile management, proposal creation, bidding system, and contract management.",
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth", // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag("Authentication", "User authentication and email verification endpoints")
    .addTag("Users", "User profile management and freelancer discovery endpoints")
    .addTag("Proposals", "Proposal creation, management, and discovery endpoints")
    .addTag("Bids", "Bid creation, management, and retrieval endpoints")
    .addTag("Contracts", "Contract creation and management endpoints")
    .addTag("Password", "Password reset and recovery endpoints")
    .addTag("App", "Application health and general endpoints")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
  });

  //* Register the response interceptor
  app.useGlobalInterceptors(new ResponseTransformerInterceptor());

  //* Handle Exceptions
  app.useGlobalFilters(new ExceptionFilter());

  await app.listen(configService.getOrThrow<number>(PORT));
}
bootstrap();
