import { PartialType } from '@nestjs/mapped-types';
import { CreateClientDto } from './create-client.dto';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class UpdateClientDto extends PartialType(CreateClientDto) {}
