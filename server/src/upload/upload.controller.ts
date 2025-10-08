import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Param,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly uploadService: UploadService) {}

  @Post('csv')
  @UseInterceptors(FileInterceptor('file'))
  uploadCsv(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      this.logger.error('No file received in upload request');
      throw new BadRequestException(
        'Field "file" missing. Use form-data with key "file" and a CSV file.',
      );
    }

    this.logger.log(
      `Received file: name=${file.originalname} size=${file.size} mime=${file.mimetype}`,
    );

    return this.uploadService.processCsv(file);
  }

  @Get('progress/:uploadId')
  getUploadProgress(@Param('uploadId') uploadId: string) {
    const progress = this.uploadService.getUploadProgress(uploadId);

    if (!progress) {
      throw new BadRequestException(`Upload ${uploadId} not found`);
    }

    return progress;
  }

  @Get('progress')
  async getGeocodingProgress() {
    return await this.uploadService.getGeocodingProgress();
  }
}
