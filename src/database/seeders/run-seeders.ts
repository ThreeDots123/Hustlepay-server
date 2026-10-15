import { DataSource } from "typeorm";
import { seedUsers } from "./user.seeder";
import { seedProposals } from "./proposal.seeder";
import { seedBids } from "./bid.seeder";
import { seedContracts } from "./contract.seeder";
import { seedPayments } from "./payment.seeder";
import { seedMessages } from "./message.seeder";
import { ConfigModule, ConfigService } from "@nestjs/config";
import databaseConfig from "src/config/database.config";

async function runSeeders() {
  ConfigModule.forRoot({ isGlobal: true });
  const configService = new ConfigService();

  const dataSource = new DataSource({ ...databaseConfig(configService) });

  try {
    await dataSource.initialize();
    console.log("✅ Data Source initialized");

    // Order matters: each seeder below builds on records created by the
    // previous one (users -> proposals -> bids -> contracts -> payments -> messages).
    await seedUsers(dataSource);
    await seedProposals(dataSource);
    await seedBids(dataSource);
    await seedContracts(dataSource);
    await seedPayments(dataSource);
    await seedMessages(dataSource);

    console.log("🎉 All seeders completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runSeeders();
