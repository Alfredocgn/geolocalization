import {
  BadRequestException,
  Controller,
  Logger,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import type { Request } from 'express';

@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly uploadService: UploadService) {}

  @Post('csv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ) {
    this.logger.log(
      `Incoming upload: content-type=${req.headers['content-type']}; field="file"; hasFile=${!!file}`,
    );

    if (!file) {
      this.logger.error(
        'No file received. Ensure Body is form-data and key name is "file".',
      );
      throw new BadRequestException(
        'Field "file" missing. Use form-data with key "file" and a CSV file.',
      );
    }

    this.logger.log(
      `Received file name=${file.originalname} size=${file.size} mime=${file.mimetype}`,
    );

    return await this.uploadService.processCsv(file);
  }
}
