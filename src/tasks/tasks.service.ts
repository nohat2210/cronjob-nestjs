import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Asset, Location, LocationStatus, Prisma } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}
  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleSyncAssets() {
    try {
      const [assets, activeLocations] = await Promise.all([
        this.getAssetData(),
        this.getActiveLocations(),
      ]);
      if (assets.length < 1 || activeLocations.length < 1) {
        console.log('There no data to update');
        return;
      }
      const availableAssets = assets.filter((asset) =>
        activeLocations.some((loc) => loc.id === asset.location_id),
      );
      console.log('[availableAssets]', availableAssets);
      await this.updateSyncAssets(availableAssets);
    } catch (error) {
      console.log('[ERROR][handleSyncAssets]', error);
      throw error;
    }
  }

  private async getAssetData(): Promise<Asset[]> {
    const url = this.config.get<string>('ASSETS_API_URL');
    const res = await this.httpService.axiosRef.get(url);
    return res.data;
  }

  private async getActiveLocations(): Promise<Location[]> {
    const activeLocations = await this.prisma.location.findMany({
      where: {
        status: LocationStatus.actived,
      },
    });
    return activeLocations;
  }

  private async updateSyncAssets(availableAssets: Asset[]) {
    await this.prisma.$transaction(async (tx) => {
      for (const asset of availableAssets) {
        try {
          const result = await tx.asset.update({
            where: { id: asset.id },
            data: {
              type: asset.type,
              serial: asset.serial,
              status: asset.status,
              description: asset.description,
              created_at:
                typeof asset.updated_at === 'bigint' ||
                typeof asset.updated_at === 'number'
                  ? new Date(asset.created_at)
                  : asset.created_at,
              updated_at:
                typeof asset.updated_at === 'bigint' ||
                typeof asset.updated_at === 'number'
                  ? new Date(asset.updated_at)
                  : asset.updated_at,
              location_id: asset.location_id,
            },
          });
          console.log(`Sync successfully for asset ID: ${result.id}`);
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2025'
          ) {
            continue;
          }
          throw error;
        }
      }
    });
  }
}
