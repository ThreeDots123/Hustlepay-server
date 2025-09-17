import { ConfigService } from "@nestjs/config";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USERNAME,
  NODE_ENV,
} from "./env";

export default function databaseConfig(
  configService: ConfigService,
): PostgresConnectionOptions {
  return {
    type: "postgres",
    host: configService.getOrThrow(DB_HOST),
    port: parseInt(configService.getOrThrow(DB_PORT)),
    username: configService.getOrThrow(DB_USERNAME),
    password: configService.getOrThrow(DB_PASSWORD),
    database: configService.getOrThrow(DB_NAME),

    entities: ["dist/model/*.entity.js"],

    migrationsTableName: "migration",

    migrations: ["dist/migrations/*.js"],

    ...(configService.getOrThrow<string>(NODE_ENV) === "production" && {
      ssl: {
        rejectUnauthorized: false, // This will allow self-signed certificates
      },
    }),
  };
}
