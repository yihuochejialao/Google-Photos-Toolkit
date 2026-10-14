import Api from './api';
import log from '../ui/logic/log';
import splitArrayIntoChunks from '../utils/splitArrayIntoChunks';
import { apiSettingsDefault } from './api-utils-default-presets';
import { parseDateFromFilename, formatParsedDate } from '../utils/parseDateFromFilename';
import type { MediaItem, Album, SharedLink, ApiSettings, PaginatedPage, ItemInfoExt, BulkMediaInfo } from '../types';
import type Core from '../gptk-core';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */

export default class ApiUtils {
  api: Api;
  core: Core;
  maxConcurrentSingleApiReq: number;
  maxConcurrentBatchApiReq: number;
  operationSize: number;
  lockedFolderOpSize: number;
  infoSize: number;

  constructor(core: Core, settings?: ApiSettings) {
    this.api = new Api();
    this.core = core;

    const resolvedSettings = settings ?? apiSettingsDefault;
    this.maxConcurrentSingleApiReq = Math.floor(Number(resolvedSettings.maxConcurrentSingleApiReq));
    this.maxConcurrentBatchApiReq = Math.floor(Number(resolvedSettings.maxConcurrentBatchApiReq));
    this.operationSize = Math.floor(Number(resolvedSettings.operationSize));
    this.lockedFolderOpSize = Math.floor(Number(resolvedSettings.lockedFolderOpSize));
    this.infoSize = Math.floor(Number(resolvedSettings.infoSize));
  }

  private downloadTextFile(fileName: string, content: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = fileName;
    downloadLink.style.display = 'none';

    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private toCsvValue(value: unknown): string {
    if (value === undefined || value === null) return '';
    if (value instanceof Date) return value.toISOString();
    let text: string;
    if (typeof value === 'object') {
      text = JSON.stringify(value) ?? '';
    } else if (typeof value === 'string') {
      text = value;
    } else if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      text = value.toString();
    } else if (typeof value === 'symbol') {
      text = value.description ?? '';
    } else {
      text = '';
    }
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  async executeWithConcurrency(
    apiMethod: (...args: any[]) => Promise<any>,
    operationSize: number,
    itemsArray: any[],
    ...args: any[]
  ): Promise<any[]> {
    const promisePool = new Set<Promise<void>>();
    const results: any[] = [];
    const chunkedItems = splitArrayIntoChunks(itemsArray, operationSize);
    const maxConcurrentApiReq =
      operationSize === 1 ? this.maxConcurrentSingleApiReq : this.maxConcurrentBatchApiReq;

    for (const chunk of chunkedItems) {
      if (!this.core.isProcessRunning) return results;

      while (promisePool.size >= maxConcurrentApiReq) {
        await Promise.race(promisePool);
      }

      if (operationSize !== 1) log(`正在处理 ${chunk.length} 项`);

      const promise = apiMethod.call(this.api, chunk, ...args);
      promisePool.add(promise);

      promise
        .then((result: any) => {
          // When the API returns null (rate-limited, error response),
          // `results.push(...null)` threw "result is not iterable".
          if (result == null) {
            log(`${apiMethod.name} 返回空结果，已跳过该批次`, 'error');
          } else if (!Array.isArray(result)) {
            log(`${apiMethod.name} 返回结果不是数组，已跳过该批次`, 'error');
          } else {
            results.push(...result);
            if (operationSize === 1 && results.length % 100 === 0) {
              log(`已处理 ${results.length} 项`);
            }
          }
        })
        .catch((error: Error) => {
          log(`${apiMethod.name} 接口出错：${String(error)}`, 'error');
        })
        .finally(() => {
          promisePool.delete(promise);
        });
    }
    await Promise.all(promisePool);
    return results;
  }

  async getAllItems<T>(
    apiMethod: (...args: any[]) => Promise<PaginatedPage<T>>,
    ...args: any[]
  ): Promise<T[]> {
    const items: T[] = [];
    let nextPageId: string | undefined;
    do {
      if (!this.core.isProcessRunning) return items;
      try {
        const page = await apiMethod.call(this.api, ...args, nextPageId);
        if (page?.items && page.items.length > 0) {
          log(`本页找到 ${page.items.length} 项`);
          items.push(...page.items);
        }
        nextPageId = page?.nextPageId;
      } catch (error) {
        log(`获取分页数据出错，已跳过：${error instanceof Error ? error.message : String(error)}`, 'error');
        // Stop pagination — we can't get nextPageId from a failed request
        break;
      }
    } while (nextPageId);
    return items;
  }

  async getAllAlbums(): Promise<Album[]> {
    return await this.getAllItems<Album>(this.api.getAlbums.bind(this.api));
  }

  async getAllSharedLinks(): Promise<SharedLink[]> {
    return await this.getAllItems<SharedLink>(this.api.getSharedLinks.bind(this.api));
  }

  async getAllMediaInSharedLink(sharedLinkId: string): Promise<MediaItem[]> {
    return await this.getAllItems<MediaItem>(this.api.getAlbumPage.bind(this.api), sharedLinkId);
  }

  async getAllMediaInAlbum(albumMediaKey: string): Promise<MediaItem[]> {
    return await this.getAllItems<MediaItem>(this.api.getAlbumPage.bind(this.api), albumMediaKey);
  }

  async getAllMediaInAlbumWithContext(albumMediaKey: string): Promise<{ title?: string; items: MediaItem[] }> {
    const items: MediaItem[] = [];
    let title: string | undefined;
    let nextPageId: string | null = null;
    do {
      if (!this.core.isProcessRunning) return { title, items };
      try {
        const page = await this.api.getAlbumPage(albumMediaKey, nextPageId);
        title ??= page?.title;
        if (page?.items && page.items.length > 0) {
          log(`本页找到 ${page.items.length} 项`);
          items.push(...page.items);
        }
        nextPageId = page?.nextPageId ?? null;
      } catch (error) {
        log(`获取相册分页数据出错，已跳过：${error instanceof Error ? error.message : String(error)}`, 'error');
        break;
      }
    } while (nextPageId);
    return { title, items };
  }

  async getAllTrashItems(): Promise<MediaItem[]> {
    return await this.getAllItems<MediaItem>(this.api.getTrashItems.bind(this.api));
  }

  async getAllFavoriteItems(): Promise<MediaItem[]> {
    return await this.getAllItems<MediaItem>(this.api.getFavoriteItems.bind(this.api));
  }

  async getAllSearchItems(searchQuery: string): Promise<MediaItem[]> {
    return await this.getAllItems<MediaItem>(this.api.search.bind(this.api), searchQuery);
  }

  async getAllLockedFolderItems(): Promise<MediaItem[]> {
    return await this.getAllItems<MediaItem>(this.api.getLockedFolderItems.bind(this.api));
  }

  async moveToLockedFolder(mediaItems: MediaItem[]): Promise<void> {
    log(`正在将 ${mediaItems.length} 项移入锁定文件夹`);
    const dedupKeyArray = mediaItems.map((item) => item.dedupKey);
    await this.executeWithConcurrency(this.api.moveToLockedFolder.bind(this.api), this.lockedFolderOpSize, dedupKeyArray);
  }

  async removeFromLockedFolder(mediaItems: MediaItem[]): Promise<void> {
    log(`正在将 ${mediaItems.length} 项移出锁定文件夹`);
    const dedupKeyArray = mediaItems.map((item) => item.dedupKey);
    await this.executeWithConcurrency(this.api.removeFromLockedFolder.bind(this.api), this.lockedFolderOpSize, dedupKeyArray);
  }

  async moveToTrash(mediaItems: MediaItem[]): Promise<void> {
    log(`正在将 ${mediaItems.length} 项移入回收站`);
    const dedupKeyArray = mediaItems.map((item) => item.dedupKey);
    await this.executeWithConcurrency(this.api.moveItemsToTrash.bind(this.api), this.operationSize, dedupKeyArray);
  }

  async restoreFromTrash(trashItems: MediaItem[]): Promise<void> {
    log(`正在从回收站还原 ${trashItems.length} 项`);
    const dedupKeyArray = trashItems.map((item) => item.dedupKey);
    await this.executeWithConcurrency(this.api.restoreFromTrash.bind(this.api), this.operationSize, dedupKeyArray);
  }

  /**
   * Removes items from their album(s) without trashing them.
   *
   * Only valid for items fetched via the Albums source: their album-scoped
   * `mediaKey` (from getAlbumPage) is the key the removal RPCs expect — not
   * the library dedupKey. Items are grouped by source album and routed to the
   * shared- or regular-album RPC, then sent in configured batches.
   *
   * @param mediaItems - The album items to remove.
   */
  async removeFromAlbum(mediaItems: MediaItem[]): Promise<void> {
    log(`正在从相册中移除 ${mediaItems.length} 项`);

    const itemsByAlbum = new Map<string, MediaItem[]>();
    for (const item of mediaItems) {
      const albumKey = item.sourceAlbumMediaKey ?? '';
      const group = itemsByAlbum.get(albumKey);
      if (group) group.push(item);
      else itemsByAlbum.set(albumKey, [item]);
    }

    for (const [albumMediaKey, items] of itemsByAlbum) {
      const itemMediaKeys = items.map((item) => item.mediaKey);
      if (items[0]?.sourceAlbumIsShared) {
        // Shared albums use a different RPC that also needs the album key.
        const removeFromShared = (chunk: string[]): Promise<unknown> => this.api.removeItemsFromSharedAlbum(albumMediaKey, chunk);
        await this.executeWithConcurrency(removeFromShared, this.operationSize, itemMediaKeys);
      } else {
        await this.executeWithConcurrency(this.api.removeItemsFromAlbum.bind(this.api), this.operationSize, itemMediaKeys);
      }
    }
  }

  async sendToArchive(mediaItems: MediaItem[]): Promise<void> {
    log(`正在归档 ${mediaItems.length} 项`);
    const filtered = mediaItems.filter((item) => item?.isArchived !== true);
    if (filtered.length === 0) {
      log('目标项目均已归档，无需处理');
      return;
    }
    const dedupKeyArray = filtered.map((item) => item.dedupKey);
    await this.executeWithConcurrency(this.api.setArchive.bind(this.api), this.operationSize, dedupKeyArray, true);
  }

  async unArchive(mediaItems: MediaItem[]): Promise<void> {
    log(`正在取消归档 ${mediaItems.length} 项`);
    const filtered = mediaItems.filter((item) => item?.isArchived !== false);
    if (filtered.length === 0) {
      log('目标项目均未归档，无需处理');
      return;
    }
    const dedupKeyArray = filtered.map((item) => item.dedupKey);
    await this.executeWithConcurrency(this.api.setArchive.bind(this.api), this.operationSize, dedupKeyArray, false);
  }

  async setAsFavorite(mediaItems: MediaItem[]): Promise<void> {
    log(`正在收藏 ${mediaItems.length} 项`);
    const filtered = mediaItems.filter((item) => item?.isFavorite !== true);
    if (filtered.length === 0) {
      log('目标项目均已收藏，无需处理');
      return;
    }
    const dedupKeyArray = filtered.map((item) => item.dedupKey);
    await this.executeWithConcurrency(this.api.setFavorite.bind(this.api), this.operationSize, dedupKeyArray, true);
  }

  async unFavorite(mediaItems: MediaItem[]): Promise<void> {
    log(`正在取消收藏 ${mediaItems.length} 项`);
    const filtered = mediaItems.filter((item) => item?.isFavorite !== false);
    if (filtered.length === 0) {
      log('目标项目均未收藏，无需处理');
      return;
    }
    const dedupKeyArray = filtered.map((item) => item.dedupKey);
    await this.executeWithConcurrency(this.api.setFavorite.bind(this.api), this.operationSize, dedupKeyArray, false);
  }

  /**
   * Google Photos albums have a hard limit of 20,000 items.
   * When the item count would exceed this, we split across
   * sequentially numbered albums.
   *
   * @see https://developers.google.com/photos/library/guides/manage-albums#adding-items-to-album
   */
  private static readonly ALBUM_ITEM_LIMIT = 20_000;

  async addToExistingAlbum(
    mediaItems: MediaItem[],
    targetAlbum: Album,
    preserveOrder = false
  ): Promise<void> {
    const existingCount = targetAlbum.itemCount ?? 0;
    const remaining = Math.max(0, ApiUtils.ALBUM_ITEM_LIMIT - existingCount);

    if (mediaItems.length <= remaining) {
      await this.addItemsToSingleAlbum(mediaItems, targetAlbum, preserveOrder);
    } else {
      const firstBatch = mediaItems.slice(0, remaining);
      const overflow = mediaItems.slice(remaining);

      if (firstBatch.length > 0) {
        log(`相册「${targetAlbum.title}」还可容纳 ${remaining} 项（上限 ${ApiUtils.ALBUM_ITEM_LIMIT}）`);
        await this.addItemsToSingleAlbum(firstBatch, targetAlbum, preserveOrder);
      }

      const overflowChunks = splitArrayIntoChunks(overflow, ApiUtils.ALBUM_ITEM_LIMIT);
      for (let i = 0; i < overflowChunks.length; i++) {
        const chunk = overflowChunks[i];
        const overflowName = `${targetAlbum.title} (${i + 2})`;
        log(`正在为 ${chunk.length} 项创建溢出相册「${overflowName}」`);
        const newAlbumMediaKey = await this.api.createAlbum(overflowName);
        const overflowAlbum: Album = {
          title: overflowName,
          isShared: false,
          mediaKey: newAlbumMediaKey,
          itemCount: 0,
        };
        await this.addItemsToSingleAlbum(chunk, overflowAlbum, preserveOrder);
      }
    }
  }

  private async addItemsToSingleAlbum(
    mediaItems: MediaItem[],
    targetAlbum: Album,
    preserveOrder: boolean
  ): Promise<void> {
    log(`正在向相册「${targetAlbum.title}」添加 ${mediaItems.length} 项`);
    const mediaKeyArray = mediaItems.map((item) => item.mediaKey);

    const addItemFunction = targetAlbum.isShared
      ? this.api.addItemsToSharedAlbum.bind(this.api)
      : this.api.addItemsToAlbum.bind(this.api);

    await this.executeWithConcurrency(addItemFunction, this.operationSize, mediaKeyArray, targetAlbum.mediaKey);

    if (preserveOrder) {
      log('正在设置相册内项目顺序');
      const albumItems = await this.getAllMediaInAlbum(targetAlbum.mediaKey);
      const orderMap = new Map<string, number>();
      mediaItems.forEach((item, index) => {
        orderMap.set(item.dedupKey, index);
      });
      const sortedAlbumItems = [...albumItems].sort((a, b) => {
        const indexA = orderMap.get(a.dedupKey) ?? Infinity;
        const indexB = orderMap.get(b.dedupKey) ?? Infinity;
        return indexA - indexB;
      });
      const sortedMediaKeys = sortedAlbumItems.map((item) => item.mediaKey);
      for (const key of sortedMediaKeys.reverse()) {
        await this.api.setAlbumItemOrder(targetAlbum.mediaKey, [key]);
      }
    }
  }

  async addToNewAlbum(
    mediaItems: MediaItem[],
    targetAlbumName: string,
    preserveOrder = false
  ): Promise<void> {
    log(`正在创建新相册「${targetAlbumName}」`);
    const album: Album = {
      title: targetAlbumName,
      isShared: false,
      mediaKey: await this.api.createAlbum(targetAlbumName),
      itemCount: 0,
    };
    await this.addToExistingAlbum(mediaItems, album, preserveOrder);
  }

  async getBatchMediaInfoChunked(mediaItems: MediaItem[]): Promise<BulkMediaInfo[]> {
    log('正在获取媒体信息');
    const mediaKeyArray = mediaItems.map((item) => item.mediaKey);
    const mediaInfoData = await this.executeWithConcurrency(this.api.getBatchMediaInfo.bind(this.api), this.infoSize, mediaKeyArray);
    return mediaInfoData;
  }

  private async copyOneDescriptionFromOther(mediaItems: MediaItem[]): Promise<[boolean]> {
    try {
      const item = mediaItems[0];
      const itemInfoExt: ItemInfoExt = await this.api.getItemInfoExt(item.mediaKey);
      if (itemInfoExt.descriptionFull || !itemInfoExt.other) {
        return [false];
      }
      // Adding a zero-width space (U+200B) since the Google Photos API
      // doesn't allow the description to be identical to the "Other" field.
      const description = itemInfoExt.other + '\u200B';
      await this.api.setItemDescription(item.dedupKey, description);
      return [true];
    } catch (error) {
      console.error('复制单条描述时出错：', error);
      throw error;
    }
  }

  async copyDescriptionFromOther(mediaItems: MediaItem[]): Promise<void> {
    log(`正在从「其他」字段复制最多 ${mediaItems.length} 条描述`);
    const results = await this.executeWithConcurrency(
      this.copyOneDescriptionFromOther.bind(this),
      1,
      mediaItems
    );
    log(`已从「其他」字段复制 ${results.filter(Boolean).length} 条描述`);
  }

  /**
   * Set the date/time of media items based on dates parsed from their filenames.
   * Uses exiftool-style date parsing algorithm:
   * - Looks for 4 consecutive digits as year (YYYY)
   * - Followed by 2 digits each for month, day, hour, minute, second
   * - Separator-agnostic (works with -, _, /, or no separator)
   *
   * Useful for screenshots or bulk-uploaded photos that have the date
   * in the filename but not in the embedded EXIF metadata.
   *
   * @param mediaItems - Array of media items to process.
   *
   * @example
   * // Supported filename formats:
   * // IMG_20230515_143022.jpg → 2023-05-15 14:30:22
   * // Screenshot_2023-05-15-14-30-22.png → 2023-05-15 14:30:22
   * // photo_20230515.jpg → 2023-05-15 00:00:00
   * // 2023_05_15_photo.jpg → 2023-05-15 00:00:00
   */
  async setTimestampFromFilename(mediaItems: MediaItem[]): Promise<void> {
    log(`正在处理 ${mediaItems.length} 项并按文件名设置日期`);

    const mediaInfoData = await this.getBatchMediaInfoChunked(mediaItems);

    const infoByKey = new Map(mediaInfoData.map((info) => [info.mediaKey, info]));

    const itemsWithInfo = mediaItems.map((item) => {
      const info = infoByKey.get(item.mediaKey);
      return {
        ...item,
        fileName: info?.fileName,
        timezoneOffset: info?.timezoneOffset ?? item.timezoneOffset,
      };
    });

    const itemsToUpdate: Array<{
      dedupKey: string;
      timestampSec: number;
      timezoneSec: number;
      fileName: string;
      formattedDate: string;
    }> = [];

    for (const item of itemsWithInfo) {
      if (!item.fileName) continue;

      const parsedDate = parseDateFromFilename(item.fileName);
      if (!parsedDate) continue;

      const timestampSec = Math.floor(parsedDate.timestamp / 1000);

      const timezoneSec = item.timezoneOffset
        ? Math.floor(item.timezoneOffset / 1000)
        : 0;

      itemsToUpdate.push({
        dedupKey: item.dedupKey,
        timestampSec,
        timezoneSec,
        fileName: item.fileName,
        formattedDate: formatParsedDate(parsedDate),
      });
    }

    if (itemsToUpdate.length === 0) {
      log('没有能从文件名中解析出日期的项目');
      return;
    }

    log(`找到 ${itemsToUpdate.length} 项能从文件名中解析出日期的项目`);

    const chunks = splitArrayIntoChunks(itemsToUpdate, this.operationSize);
    let successCount = 0;

    for (const chunk of chunks) {
      if (!this.core.isProcessRunning) break;

      try {
        await this.api.setItemsTimestamp(chunk);
        successCount += chunk.length;

        for (const item of chunk) {
          log(`已将「${item.fileName}」的日期设为 ${item.formattedDate}`);
        }
      } catch (error) {
        console.error('为该批次设置时间戳时出错：', error);
      }
    }

    log(`已成功为 ${itemsToUpdate.length} 项中的 ${successCount} 项设置日期`);
  }

  async exportMetadata(mediaItems: MediaItem[]): Promise<void> {
    log(`正在获取 ${mediaItems.length} 项的元数据`);

    const mediaInfoData = await this.getBatchMediaInfoChunked(mediaItems);
    const infoByKey = new Map(mediaInfoData.map((info) => [info.mediaKey, info]));

    const headers = [
      'mediaKey',
      'dedupKey',
      'sourceAlbumMediaKey',
      'sourceAlbumTitle',
      'fileName',
      'description',
      'takenAt',
      'uploadedAt',
      'timezoneOffsetMs',
      'width',
      'height',
      'durationMs',
      'livePhotoDurationMs',
      'sizeBytes',
      'takesUpSpace',
      'spaceTakenBytes',
      'isOriginalQuality',
      'isArchived',
      'isFavorite',
      'isOwned',
      'hasLocation',
      'locationName',
      'latitude',
      'longitude',
      'thumbnailUrl',
    ];

    const rows = mediaItems.map((item) => {
      const info = infoByKey.get(item.mediaKey);
      const timestamp = info?.timestamp ?? item.timestamp;
      const creationTimestamp = info?.creationTimestamp ?? item.creationTimestamp;
      const coordinates = item.geoLocation?.coordinates ?? [];

      return [
        item.mediaKey,
        item.dedupKey,
        item.sourceAlbumMediaKey,
        item.sourceAlbumTitle,
        info?.fileName ?? item.fileName,
        info?.descriptionFull ?? item.descriptionFull ?? item.descriptionShort,
        timestamp ? new Date(timestamp) : undefined,
        creationTimestamp ? new Date(creationTimestamp) : undefined,
        info?.timezoneOffset ?? item.timezoneOffset,
        item.resWidth,
        item.resHeight,
        item.duration,
        item.livePhotoDuration,
        info?.size ?? item.size,
        info?.takesUpSpace ?? item.takesUpSpace,
        info?.spaceTaken ?? item.spaceTaken,
        info?.isOriginalQuality ?? item.isOriginalQuality,
        item.isArchived,
        item.isFavorite,
        item.isOwned,
        item.geoLocation ? true : false,
        item.geoLocation?.name,
        coordinates[0],
        coordinates[1],
        item.thumb,
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => this.toCsvValue(value)).join(','))
      .join('\n');

    this.downloadTextFile('metadata.csv', `${csv}\n`, 'text/csv');
    log(`已下载 ${mediaItems.length} 项的元数据`);
  }
}
