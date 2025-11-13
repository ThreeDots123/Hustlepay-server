import { ConfigModule, ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import databaseConfig from "src/config/database.config";

ConfigModule.forRoot({ isGlobal: true });
const configService = new ConfigService();

export default new DataSource({ ...databaseConfig(configService) });
