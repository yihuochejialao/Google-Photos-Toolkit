import type { Filter } from '../../types';

function parseSize(value?: string): number {
  return parseInt(value ?? '0', 10);
}

function parseNumber(value?: string): number {
  return parseFloat(value ?? '');
}

function formatDate(value?: string): string | null {
  return value ? new Date(value).toLocaleString('zh-CN') : null;
}

function pluralAlbums(keys: string | string[], noun: string): string {
  return Array.isArray(keys) ? `位于 ${keys.length} 个${noun}中` : `位于${noun}中`;
}

interface DescriptionRule {
  test: (f: Filter) => boolean;
  describe: (f: Filter) => string | string[];
}

const rules: DescriptionRule[] = [
  { test: (f) => f.owned === 'true',   describe: () => '本人所有' },
  { test: (f) => f.owned === 'false',  describe: () => '非本人所有' },

  { test: (f) => f.space === 'consuming',      describe: () => '占用空间' },
  { test: (f) => f.space === 'non-consuming',   describe: () => '不占空间' },

  { test: (f) => f.uploadStatus === 'full',     describe: () => '已完整上传' },
  { test: (f) => f.uploadStatus === 'partial',  describe: () => '部分上传' },

  { test: (f) => f.excludeShared === 'true', describe: () => '未分享' },

  { test: (f) => f.favorite === 'true', describe: () => '已收藏' },
  {
    test: (f) => f.excludeFavorites === 'true' || f.favorite === 'false',
    describe: () => '未收藏',
  },

  { test: (f) => f.quality === 'original',       describe: () => '原始画质' },
  { test: (f) => f.quality === 'storage-saver',  describe: () => '节省存储画质' },

  { test: (f) => f.hasLocation === 'true',  describe: () => '含位置信息' },
  { test: (f) => f.hasLocation === 'false', describe: () => '不含位置信息' },

  {
    test: (f) => Boolean(f.boundSouth && f.boundWest && f.boundNorth && f.boundEast),
    describe: (f) => `位于范围内 南纬${f.boundSouth} 西经${f.boundWest} 北纬${f.boundNorth} 东经${f.boundEast}`,
  },

  { test: (f) => f.archived === 'true',  describe: () => '已归档' },
  { test: (f) => f.archived === 'false', describe: () => '未归档' },

  {
    test: () => true,
    describe: (f) => {
      const typeMap: Record<string, string> = {
        video: '视频',
        live: '动态照片',
        image: '图片',
      };
      return typeMap[f.type ?? ''] ?? '媒体';
    },
  },

  {
    test: (f) => !!f.searchQuery,
    describe: (f) => `位于搜索「${f.searchQuery}」的结果中`,
  },

  {
    test: (f) => !!f.fileNameRegex,
    describe: (f) => {
      const verb = f.fileNameMatchType === 'exclude' ? '文件名不匹配正则' : '文件名匹配正则';
      return `${verb}「${f.fileNameRegex}」`;
    },
  },

  {
    test: (f) => !!f.descriptionRegex,
    describe: (f) => {
      const verb = f.descriptionMatchType === 'exclude' ? '描述不匹配正则' : '描述匹配正则';
      return `${verb}「${f.descriptionRegex}」`;
    },
  },

  {
    test: (f) => !!f.similarityThreshold,
    describe: (f) => `相似度大于「${f.similarityThreshold}」`,
  },

  {
    test: (f) => parseSize(f.minWidth) > 0 || parseSize(f.maxWidth) > 0 || parseSize(f.minHeight) > 0 || parseSize(f.maxHeight) > 0,
    describe: (f) => {
      const parts: string[] = [];
      const minW = parseSize(f.minWidth);
      const maxW = parseSize(f.maxWidth);
      const minH = parseSize(f.minHeight);
      const maxH = parseSize(f.maxHeight);
      if (minW > 0) parts.push(`宽 >= ${minW}px`);
      if (maxW > 0) parts.push(`宽 <= ${maxW}px`);
      if (minH > 0) parts.push(`高 >= ${minH}px`);
      if (maxH > 0) parts.push(`高 <= ${maxH}px`);
      return `分辨率 ${parts.join('，')}`;
    },
  },

  {
    test: (f) => !isNaN(parseNumber(f.minDuration)) || !isNaN(parseNumber(f.maxDuration)),
    describe: (f) => {
      const minDuration = parseNumber(f.minDuration);
      const maxDuration = parseNumber(f.maxDuration);
      const parts: string[] = [];
      if (!isNaN(minDuration)) parts.push(`时长 >= ${minDuration}秒`);
      if (!isNaN(maxDuration)) parts.push(`时长 <= ${maxDuration}秒`);
      return parts;
    },
  },

  {
    test: (f) => parseSize(f.lowerBoundarySize) > 0 || parseSize(f.higherBoundarySize) > 0,
    describe: (f) => {
      const lo = parseSize(f.lowerBoundarySize);
      const hi = parseSize(f.higherBoundarySize);
      const parts: string[] = [];
      if (lo > 0) parts.push(`大于 ${lo} 字节`);
      if (lo > 0 && hi > 0) parts.push('且');
      if (hi > 0) parts.push(`小于 ${hi} 字节`);
      return parts;
    },
  },

  {
    test: (f) => !!f.albumsInclude,
    describe: (f) => pluralAlbums(f.albumsInclude ?? [], '目标相册'),
  },

  {
    test: (f) => !!f.albumsExclude,
    describe: (f) => ['排除以下相册中的项目', pluralAlbums(f.albumsExclude ?? [], '已选相册')],
  },

  {
    test: (f) => Boolean(f.lowerBoundaryDate ?? f.higherBoundaryDate),
    describe: (f) => {
      const lo = formatDate(f.lowerBoundaryDate);
      const hi = formatDate(f.higherBoundaryDate);
      const parts: string[] = [];

      if (f.dateType === 'taken') parts.push('拍摄时间');
      else if (f.dateType === 'uploaded') parts.push('上传时间');

      if (lo && hi) {
        parts.push(
          f.intervalType === 'exclude'
            ? `早于 ${lo} 且晚于 ${hi}`
            : `从 ${lo} 到 ${hi}`
        );
      } else if (lo) {
        parts.push(f.intervalType === 'exclude' ? `早于 ${lo}` : `晚于 ${lo}`);
      } else if (hi) {
        parts.push(f.intervalType === 'exclude' ? `晚于 ${hi}` : `早于 ${hi}`);
      }

      return parts;
    },
  },

  { test: (f) => !!f.sortBySize, describe: () => '按文件大小排序' },
];

function validate(filter: Filter): string | null {
  if (
    filter.lowerBoundaryDate &&
    filter.higherBoundaryDate &&
    filter.lowerBoundaryDate >= filter.higherBoundaryDate
  ) {
    return '错误：日期区间无效';
  }

  const lo = parseSize(filter.lowerBoundarySize);
  const hi = parseSize(filter.higherBoundarySize);
  if (lo > 0 && hi > 0 && lo >= hi) {
    return '错误：文件大小筛选无效';
  }

  const bS = parseFloat(filter.boundSouth ?? '');
  const bN = parseFloat(filter.boundNorth ?? '');
  const hasSomeBounds = [bS, parseFloat(filter.boundWest ?? ''), bN, parseFloat(filter.boundEast ?? '')].some((v) => !isNaN(v));
  const hasAllBounds = [bS, parseFloat(filter.boundWest ?? ''), bN, parseFloat(filter.boundEast ?? '')].every((v) => !isNaN(v));
  if (hasSomeBounds && !hasAllBounds) {
    return '错误：矩形范围需要同时填写四个坐标';
  }
  if (hasAllBounds && bS >= bN) {
    return '错误：南纬必须小于北纬';
  }

  const minW = parseSize(filter.minWidth);
  const maxW = parseSize(filter.maxWidth);
  if (minW > 0 && maxW > 0 && minW >= maxW) {
    return '错误：分辨率筛选无效（宽度）';
  }

  const minH = parseSize(filter.minHeight);
  const maxH = parseSize(filter.maxHeight);
  if (minH > 0 && maxH > 0 && minH >= maxH) {
    return '错误：分辨率筛选无效（高度）';
  }

  const minDuration = parseNumber(filter.minDuration);
  const maxDuration = parseNumber(filter.maxDuration);
  if (!isNaN(minDuration) && minDuration < 0) {
    return '错误：时长筛选无效（最小值）';
  }
  if (!isNaN(maxDuration) && maxDuration < 0) {
    return '错误：时长筛选无效（最大值）';
  }
  if (!isNaN(minDuration) && !isNaN(maxDuration) && minDuration >= maxDuration) {
    return '错误：时长筛选无效';
  }

  return null;
}

export function generateFilterDescription(filter: Filter): string {
  const error = validate(filter);
  if (error) return error;

  const parts: string[] = ['筛选：全部'];

  for (const rule of rules) {
    if (rule.test(filter)) {
      const fragment = rule.describe(filter);
      if (Array.isArray(fragment)) {
        parts.push(...fragment);
      } else {
        parts.push(fragment);
      }
    }
  }

  const result = parts.join(' ');
  return result === '筛选：全部 媒体' ? '筛选：无' : result;
}
