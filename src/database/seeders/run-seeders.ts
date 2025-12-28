import { DataSource } from "typeorm";
import { seedProposals } from "./proposal.seeder";
import { ConfigModule, ConfigService } from "@nestjs/config";
import databaseConfig from "src/config/database.config";

async function runSeeders() {
  ConfigModule.forRoot({ isGlobal: true });
  const configService = new ConfigService();

  const dataSource = new DataSource({ ...databaseConfig(configService) });

  try {
    await dataSource.initialize();
    console.log("✅ Data Source initialized");

    // Run all your seeders here
    await seedProposals(dataSource);

    console.log("🎉 All seeders completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runSeeders();
