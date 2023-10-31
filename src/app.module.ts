import { Module } from '@nestjs/common';
import { CarsController } from './cars.controller';

@Module({
  imports: [],
  controllers: [CarsController],
  providers: [],
})
export class AppModule {}
