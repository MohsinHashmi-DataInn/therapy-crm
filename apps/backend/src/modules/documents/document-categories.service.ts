import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDocumentCategoryDto } from './dto/create-document-category.dto';
import { UpdateDocumentCategoryDto } from './dto/update-document-category.dto';

/**
 * Service for managing document categories
 */
@Injectable()
export class DocumentCategoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new document category
   * @param createDocumentCategoryDto - Data for creating a document category
   * @returns The created document category
   */
  async create(createDocumentCategoryDto: CreateDocumentCategoryDto) {
    return this.prisma.document_categories.create({
      data: {
        name: createDocumentCategoryDto.name,
        description: createDocumentCategoryDto.description,
        is_active: createDocumentCategoryDto.is_active ?? true,
        display_order: createDocumentCategoryDto.display_order,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: createDocumentCategoryDto.created_by 
          ? BigInt(createDocumentCategoryDto.created_by) 
          : null,
        updated_by: createDocumentCategoryDto.updated_by 
          ? BigInt(createDocumentCategoryDto.updated_by) 
          : null,
      },
    });
  }

  /**
   * Find all document categories
   * @param activeOnly - If true, only return active categories
   * @returns List of document categories
   */
  async findAll(activeOnly = false) {
    const where = activeOnly ? { is_active: true } : {};
    
    return this.prisma.document_categories.findMany({
      where,
      orderBy: {
        display_order: 'asc',
      },
      include: {
        users_document_categories_created_byTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        users_document_categories_updated_byTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });
  }

  /**
   * Find one document category by ID
   * @param id - Document category ID
   * @returns The document category
   * @throws NotFoundException if category not found
   */
  async findOne(id: bigint) {
    const category = await this.prisma.document_categories.findUnique({
      where: { id },
      include: {
        users_document_categories_created_byTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        users_document_categories_updated_byTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Document category with ID ${id} not found`);
    }

    return category;
  }

  /**
   * Update a document category
   * @param id - Document category ID
   * @param updateDocumentCategoryDto - Updated data
   * @returns The updated document category
   * @throws NotFoundException if category not found
   */
  async update(id: bigint, updateDocumentCategoryDto: UpdateDocumentCategoryDto) {
    try {
      return await this.prisma.document_categories.update({
        where: { id },
        data: {
          name: updateDocumentCategoryDto.name,
          description: updateDocumentCategoryDto.description,
          is_active: updateDocumentCategoryDto.is_active,
          display_order: updateDocumentCategoryDto.display_order,
          updated_at: new Date(),
          updated_by: updateDocumentCategoryDto.updated_by 
            ? BigInt(updateDocumentCategoryDto.updated_by) 
            : null,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Document category with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Remove a document category
   * @param id - Document category ID
   * @returns The deleted document category
   * @throws NotFoundException if category not found
   */
  async remove(id: bigint) {
    try {
      return await this.prisma.document_categories.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Document category with ID ${id} not found`);
      }
      throw error;
    }
  }
}
