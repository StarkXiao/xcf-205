import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { WorkOrdersModule } from './workorders/workorders.module';
import { StatisticsModule } from './statistics/statistics.module';
import { RolesModule } from './roles/roles.module';
import { InspectionsModule } from './inspections/inspections.module';
import { NotificationsModule } from './notifications/notifications.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { PerformanceModule } from './performance/performance.module';
import { ApprovalsModule } from './approvals/approvals.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/smart-city'),
    JwtModule.register({
      global: true,
      secret: 'smart-city-secret-key-2024',
      signOptions: { expiresIn: '24h' },
    }),
    AuthModule,
    UsersModule,
    EventsModule,
    WorkOrdersModule,
    StatisticsModule,
    RolesModule,
    InspectionsModule,
    NotificationsModule,
    KnowledgeModule,
    PerformanceModule,
    ApprovalsModule,
  ],
})
export class AppModule {}
