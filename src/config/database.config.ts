import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from 'src/user/user.entities';

export default function databaseConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: configService.getOrThrow<string>('DB_HOST'),
    port: parseInt(configService.getOrThrow<string>('DB_PORT')),
    username: configService.getOrThrow<string>('DB_USERNAME'),
    password: configService.getOrThrow<string>('DB_PASSWORD'),
    database: configService.getOrThrow<string>('DB_NAME'),
    autoLoadEntities: true,
    synchronize: true,
    entities: [User],

    migrationsTableName: 'migration',

    migrations: ['dist/migrations/*.js'],

    ...(configService.getOrThrow<string>('NODE_ENV') === 'production' && {
      ssl: {
        rejectUnauthorized: false, // This will allow self-signed certificates
      },
    }),
  };
}
