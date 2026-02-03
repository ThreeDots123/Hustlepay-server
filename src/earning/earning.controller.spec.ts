import { Test, TestingModule } from '@nestjs/testing';
import { EarningController } from './earning.controller';

describe('EarningController', () => {
  let controller: EarningController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EarningController],
    }).compile();

    controller = module.get<EarningController>(EarningController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
