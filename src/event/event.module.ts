import { Module } from "@nestjs/common";
import { EventService } from "./event.service";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { UserCreatedEventSubscriber } from "./subscribers/user/user-created.subscriber";
import { EmailModule } from "src/email/email.module";
import { TokenModule } from "src/token/token.module";

@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Event emitter options (optional)
      wildcard: false,
      delimiter: ".",
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
    EmailModule,
    TokenModule,
  ],
  providers: [EventService, UserCreatedEventSubscriber],
  exports: [EventEmitterModule, EventService],
})
export class EventModule {}
