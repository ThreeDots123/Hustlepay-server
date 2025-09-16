import { ApiProperty } from '@nestjs/swagger';

export class ErrorMessageDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  error: string;

  @ApiProperty()
  statusCode: number;
}
