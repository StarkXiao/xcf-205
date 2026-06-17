import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { AuthGuard } from '@nestjs/passport';
import { AttachmentType } from '../schemas/attachment.schema';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Response } from 'express';

const storage = diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    const typeDir = join(uploadDir, req.body.type || 'other');
    if (!existsSync(typeDir)) {
      mkdirSync(typeDir, { recursive: true });
    }
    cb(null, typeDir);
  },
  filename: (req, file, cb) => {
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    cb(null, `${Date.now()}-${randomName}${extname(file.originalname)}`);
  },
});

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
  'application/x-rar-compressed',
];

@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Query() query: any) {
    return this.attachmentsService.findAll(query);
  }

  @Get('statistics')
  @UseGuards(AuthGuard('jwt'))
  async getStatistics() {
    return this.attachmentsService.getStatistics();
  }

  @Get('related/:relatedId')
  @UseGuards(AuthGuard('jwt'))
  async findByRelated(
    @Param('relatedId') relatedId: string,
    @Query('relatedModel') relatedModel?: string,
    @Query('type') type?: AttachmentType,
  ) {
    return this.attachmentsService.findByRelated(relatedId, relatedModel, type);
  }

  @Get('preview/:id')
  async preview(@Param('id') id: string, @Res() res: Response) {
    const attachment = await this.attachmentsService.findOne(id);
    const filePath = join(process.cwd(), attachment.filePath);
    if (existsSync(filePath)) {
      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.originalName)}"`);
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: '文件不存在' });
    }
  }

  @Get('download/:id')
  @UseGuards(AuthGuard('jwt'))
  async download(@Param('id') id: string, @Res() res: Response) {
    const attachment = await this.attachmentsService.findOne(id);
    const filePath = join(process.cwd(), attachment.filePath);
    if (existsSync(filePath)) {
      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.originalName)}"`);
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: '文件不存在' });
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string) {
    return this.attachmentsService.findOne(id);
  }

  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file', {
    storage,
    fileFilter: (req, file, cb) => {
      if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('不支持的文件类型'), false);
      }
    },
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
  }))
  async upload(
    @UploadedFile() file: any,
    @Body() body: any,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    const relativePath = file.path.replace(process.cwd(), '').replace(/^\//, '').replace(/^\\/, '');

    return this.attachmentsService.create({
      originalName: file.originalname,
      fileName: file.filename,
      filePath: relativePath,
      fileSize: file.size,
      mimeType: file.mimetype,
      type: body.type as AttachmentType || AttachmentType.OTHER,
      relatedId: body.relatedId,
      relatedModel: body.relatedModel,
      relatedNo: body.relatedNo,
      description: body.description,
      tags: body.tags ? body.tags.split(',') : [],
      uploadedBy: req.user?._id,
      uploadedByName: req.user?.realName,
    });
  }

  @Post('upload-multiple')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FilesInterceptor('files', 20, {
    storage,
    fileFilter: (req, file, cb) => {
      if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('不支持的文件类型: ' + file.originalname), false);
      }
    },
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
  }))
  async uploadMultiple(
    @UploadedFiles() files: any[],
    @Body() body: any,
    @Request() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('请上传文件');
    }

    const attachments = files.map((file) => {
      const relativePath = file.path.replace(process.cwd(), '').replace(/^\//, '').replace(/^\\/, '');
      return {
        originalName: file.originalname,
        fileName: file.filename,
        filePath: relativePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        type: body.type as AttachmentType || AttachmentType.OTHER,
        relatedId: body.relatedId,
        relatedModel: body.relatedModel,
        relatedNo: body.relatedNo,
        description: body.description,
        tags: body.tags ? body.tags.split(',') : [],
        uploadedBy: req.user?._id,
        uploadedByName: req.user?.realName,
      };
    });

    return this.attachmentsService.batchCreate(attachments);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() body: {
      originalName?: string;
      description?: string;
      tags?: string[];
      type?: AttachmentType;
    },
  ) {
    return this.attachmentsService.update(id, body);
  }

  @Put(':id/archive')
  @UseGuards(AuthGuard('jwt'))
  async archive(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.attachmentsService.archive(id, req.user?._id, req.user?.realName);
  }

  @Put('batch-archive')
  @UseGuards(AuthGuard('jwt'))
  async batchArchive(
    @Body() body: { ids: string[] },
    @Request() req: any,
  ) {
    return this.attachmentsService.batchArchive(body.ids, req.user?._id, req.user?.realName);
  }

  @Put(':id/restore')
  @UseGuards(AuthGuard('jwt'))
  async restore(@Param('id') id: string) {
    return this.attachmentsService.restore(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(
    @Param('id') id: string,
    @Query('permanent') permanent: string,
  ) {
    return this.attachmentsService.remove(id, permanent !== 'true');
  }
}
