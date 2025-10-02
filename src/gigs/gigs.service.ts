import { Brackets, EntityManager, FindOptionsWhere, Repository } from "typeorm";
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { GigMedia as GigMediaEntity } from "src/model/gig-media.entity";
import { GigPackage as GigPackageEntity } from "src/model/gig-package.entity";
import { Gig as GigEntity } from "src/model/gig.entity";
import { CreateGigDto } from "./dto/create-gig.dto";
import BaseService from "src/interface/service/base.service";
import { IPaginationOptions, paginate } from "nestjs-typeorm-paginate";

@Injectable()
export class GigsService extends BaseService {
  constructor(
    @InjectRepository(GigEntity) private gigRepository: Repository<GigEntity>,
    @InjectRepository(GigPackageEntity)
    private pkgRepository: Repository<GigPackageEntity>,
    @InjectRepository(GigMediaEntity)
    private mediaRepository: Repository<GigMediaEntity>,
    @InjectEntityManager() private readonly manager: EntityManager,
  ) {
    super();
  }

  async persistGig(
    gig: Partial<GigEntity>,
    freelancerId: string,
    transactionalEntity?: EntityManager,
  ) {
    const newGigInstance = this.gigRepository.create({
      ...gig,
      freelancerId,
    });

    return this.performEntityOps<GigEntity, GigEntity>({
      repositoryManager: this.gigRepository,
      transactionalEntity,
      action: "save",
      opsArgs: [newGigInstance],
    });
  }

  async persistGigPackage(
    gigPackage: Partial<GigPackageEntity>,
    gig: GigEntity,
    transactionalEntity?: EntityManager,
  ) {
    const newGigPkgInstance = this.pkgRepository.create({
      ...gigPackage,
      gig,
    });

    return this.performEntityOps<GigPackageEntity, GigPackageEntity>({
      repositoryManager: this.pkgRepository,
      transactionalEntity,
      action: "save",
      opsArgs: [newGigPkgInstance],
    });
  }

  async persistGigMedia(
    gigMedia: Partial<GigMediaEntity>,
    gigPackage: GigPackageEntity,
    transactionalEntity?: EntityManager,
  ) {
    const newGigMediaInstance = this.mediaRepository.create({
      ...gigMedia,
      gig: gigPackage,
    });

    return this.performEntityOps<GigMediaEntity, GigMediaEntity>({
      repositoryManager: this.mediaRepository,
      transactionalEntity,
      action: "save",
      opsArgs: [newGigMediaInstance],
    });
  }

  async createGig(gig: CreateGigDto, freelancerId: string) {
    const { packages, ...gigData } = gig;

    // Make the query transactional
    const createdGig = await this.manager.transaction(
      async (transactionalManager) => {
        // We first create the gig
        const newGig = await this.persistGig(
          gigData,
          freelancerId,
          transactionalManager,
        );

        const createdPackages = await Promise.all(
          packages.map(async (pkg) => {
            const { media, ...rest } = pkg;
            const gigPackage = await this.persistGigPackage(
              rest,
              newGig,
              transactionalManager,
            );

            const packageMedia = await Promise.all(
              media.map(async (m) => {
                const packageMedia = await this.persistGigMedia(
                  m,
                  gigPackage,
                  transactionalManager,
                );
                return packageMedia;
              }),
            );
            return {
              ...gigPackage,
              media: packageMedia,
            } as GigPackageEntity;
          }),
        );

        return {
          ...newGig,
          packages: createdPackages,
        };
      },
    );

    return createdGig;
  }

  async findOne(
    options?: {
      relations?: Array<string>;
      where?: FindOptionsWhere<GigEntity> | FindOptionsWhere<GigEntity>[];
    },
    transactionalEntity?: EntityManager,
  ) {
    return this.performEntityOps<GigEntity, GigEntity>({
      repositoryManager: this.gigRepository,
      transactionalEntity,
      action: "findOne",
      opsArgs: [
        GigEntity,
        {
          ...(options?.where && { where: options.where }),
          ...(options?.relations && { relations: options.relations }),
        },
      ],
    });
  }

  async findAll(
    { page, limit }: { page: number; limit: number },
    options: {
      freelancerId?: string;
      transactionalEntity?: EntityManager;
    },
  ) {
    const { freelancerId, transactionalEntity } = options;
    const [items, total] = await this.performEntityOps<
      GigEntity,
      [GigEntity[], number]
    >({
      repositoryManager: this.gigRepository,
      transactionalEntity,
      action: "findAndCount",
      opsArgs: [
        GigEntity,
        {
          relations: freelancerId
            ? ["packages", "packages.media"]
            : ["packages", "packages.media", "freelancer"],
          skip: (page - 1) * limit,
          take: limit,
          order: { createdAt: "DESC" },
        },
      ],
    });

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchGig(
    params: {
      keyword?: string;
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      maxDeliveryDays?: number;
      tags?: string[];
    },
    options: IPaginationOptions & {
      sortOrder?: "ASC" | "DESC";
      sortBy?: string;
    },
  ) {
    const { route } = options;

    if (!route)
      throw new InternalServerErrorException(
        "Please pass a route, to enable creating the next route",
      );

    // Will not perform transactional query on this.. Usually a standalone query
    const qb = this.gigRepository
      .createQueryBuilder("gig")
      .leftJoinAndSelect("gig.packages", "pkg")
      .leftJoinAndSelect("pkg.media", "media")
      .leftJoinAndSelect("gig.freelancer", "freelancer");

    // keyword search in title or description
    if (params.keyword || params.category || params.tags?.length) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where("(gig.title ILIKE :kw OR gig.description ILIKE :kw)", {
            kw: `%${params.keyword}%`,
          })
            .orWhere("gig.category = :category", { category: params.category })
            .orWhere("gig.tags && :tags", { tags: params.tags });
        }),
      );
    }

    // filter by price
    if (params.minPrice) {
      qb.andWhere("pkg.price >= :minPrice", { minPrice: params.minPrice });
    }
    if (params.maxPrice) {
      qb.andWhere("pkg.price <= :maxPrice", { maxPrice: params.maxPrice });
    }

    // // filter by delivery time
    if (params.maxDeliveryDays)
      qb.andWhere("pkg.delivery_days <= :maxDeliveryDays", {
        maxDeliveryDays: params.maxDeliveryDays,
      });

    return paginate<GigEntity>(qb, options);
  }

  async update(
    id: string,
    newRecord: Partial<GigEntity>,
    transactionalEntity?: EntityManager,
  ) {
    await this.performEntityOps<GigEntity, GigEntity>({
      repositoryManager: this.gigRepository,
      transactionalEntity,
      action: "update",
      opsArgs: [GigEntity, { id }, { ...newRecord }],
    });
  }

  async retrieveSingleGig(
    id: string,
    options: {
      freelancerId?: string;
      transactionalEntity?: EntityManager;
    },
  ) {
    const { freelancerId, transactionalEntity } = options;
    const foundGig = await this.findOne(
      {
        where: { ...(freelancerId && { freelancerId }), id },
        relations: freelancerId
          ? ["packages", "packages.media"]
          : ["packages", "packages.media", "freelancer"],
      },
      transactionalEntity,
    );

    if (!foundGig)
      throw new NotFoundException("Your request gig was not found");

    return foundGig;
  }

  async removeGig(
    id: string,
    freelancerId: string,
    transactionalEntity?: EntityManager,
  ) {
    const gig = await this.findOne(
      { where: { id, freelancerId } },
      transactionalEntity,
    );

    if (!gig) return;

    await this.performEntityOps<GigEntity, null>({
      repositoryManager: this.gigRepository,
      transactionalEntity,
      action: "remove",
      opsArgs: [gig],
    });
  }
}
