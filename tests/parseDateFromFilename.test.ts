import { describe, it, expect } from 'vitest';
import { parseDateFromFilename, formatParsedDate, ParsedDate } from '../src/utils/parseDateFromFilename';

describe('parseDateFromFilename', () => {
  describe('concatenated formats (no separators)', () => {
    it('parses YYYYMMDD format', () => {
      const result = parseDateFromFilename('photo_20230515.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(0);
      expect(result!.minute).toBe(0);
      expect(result!.second).toBe(0);
    });

    it('parses YYYYMMDDHHMMSS format', () => {
      const result = parseDateFromFilename('IMG_20230515143022.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(22);
    });

    it('parses YYYYMMDDHHMM format (no seconds)', () => {
      const result = parseDateFromFilename('photo_202305151430.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(0);
    });
  });

  describe('separated formats', () => {
    it('parses YYYY-MM-DD format with dashes', () => {
      const result = parseDateFromFilename('screenshot_2023-05-15.png');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses YYYY_MM_DD format with underscores', () => {
      const result = parseDateFromFilename('photo_2023_05_15.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses YYYY-MM-DD-HH-MM-SS format', () => {
      const result = parseDateFromFilename('Screenshot_2023-05-15-14-30-22.png');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(22);
    });

    it('parses mixed separator format', () => {
      const result = parseDateFromFilename('IMG_2023-05_15_14.30.22.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(22);
    });
  });

  describe('common device filename patterns', () => {
    it('parses Android camera format IMG_YYYYMMDD_HHMMSS', () => {
      const result = parseDateFromFilename('IMG_20230515_143022.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(22);
    });

    it('parses WhatsApp format IMG-YYYYMMDD-WAxxxx', () => {
      const result = parseDateFromFilename('IMG-20230515-WA0001.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses iOS screenshot format', () => {
      const result = parseDateFromFilename('Screenshot 2023-05-15 at 14.30.22.png');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(22);
    });

    it('parses Windows screenshot format', () => {
      const result = parseDateFromFilename('Screenshot (2023-05-15 143022).png');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses date at start of filename', () => {
      const result = parseDateFromFilename('2023-05-15_vacation_photo.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses date in middle of filename', () => {
      const result = parseDateFromFilename('vacation_2023-05-15_beach.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });
  });

  describe('edge cases', () => {
    it('returns null for filename without date', () => {
      const result = parseDateFromFilename('photo.jpg');
      expect(result).toBeNull();
    });

    it('returns null for invalid date (Feb 30)', () => {
      const result = parseDateFromFilename('photo_20230230.jpg');
      expect(result).toBeNull();
    });

    it('returns null for invalid month (13)', () => {
      const result = parseDateFromFilename('photo_20231315.jpg');
      expect(result).toBeNull();
    });

    it('returns null for invalid day (32)', () => {
      const result = parseDateFromFilename('photo_20230532.jpg');
      expect(result).toBeNull();
    });

    it('returns null for year out of range', () => {
      const result = parseDateFromFilename('photo_18990515.jpg');
      expect(result).toBeNull();
    });

    it('handles full path and extracts filename', () => {
      const result = parseDateFromFilename('/path/to/photos/IMG_20230515_143022.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('handles Windows path', () => {
      const result = parseDateFromFilename('C:\\Users\\Photos\\IMG_20230515_143022.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('returns null for only year in filename', () => {
      const result = parseDateFromFilename('photo_2023.jpg');
      expect(result).toBeNull();
    });

    it('handles leap year Feb 29 correctly', () => {
      const result = parseDateFromFilename('photo_20240229.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2024);
      expect(result!.month).toBe(2);
      expect(result!.day).toBe(29);
    });

    it('rejects Feb 29 on non-leap year', () => {
      const result = parseDateFromFilename('photo_20230229.jpg');
      expect(result).toBeNull();
    });
  });

  describe('timestamp generation', () => {
    it('generates correct timestamp for date only', () => {
      const result = parseDateFromFilename('photo_20230515.jpg');
      expect(result).not.toBeNull();
      const expected = new Date(2023, 4, 15, 0, 0, 0).getTime(); // Month is 0-indexed
      expect(result!.timestamp).toBe(expected);
    });

    it('generates correct timestamp for date and time', () => {
      const result = parseDateFromFilename('IMG_20230515_143022.jpg');
      expect(result).not.toBeNull();
      const expected = new Date(2023, 4, 15, 14, 30, 22).getTime();
      expect(result!.timestamp).toBe(expected);
    });
  });

  describe('Samsung camera formats', () => {
    it('parses Samsung format YYYYMMDD_HHMMSS', () => {
      const result = parseDateFromFilename('20230515_143022.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(22);
    });

    it('parses Samsung burst format YYYYMMDD_HHMMSS_xxx', () => {
      const result = parseDateFromFilename('20230515_143022_001.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(22);
    });
  });

  describe('Google Photos/Pixel formats', () => {
    it('parses Pixel format PXL_YYYYMMDD_HHMMSS', () => {
      const result = parseDateFromFilename('PXL_20230515_143022.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(22);
    });

    it('parses Pixel night sight format PXL_YYYYMMDD_HHMMSS.NIGHT', () => {
      const result = parseDateFromFilename('PXL_20230515_143022.NIGHT.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(22);
    });

    it('parses Pixel portrait format PXL_YYYYMMDD_HHMMSS.PORTRAIT', () => {
      const result = parseDateFromFilename('PXL_20230515_143022.PORTRAIT.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });
  });

  describe('iPhone/iOS formats', () => {
    it('parses iPhone format IMG_xxxx with date in EXIF style', () => {
      // iPhone typically uses IMG_xxxx but we test date-based variants
      const result = parseDateFromFilename('IMG_2023-05-15_143022.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses iOS screenshot format with AM/PM style', () => {
      const result = parseDateFromFilename('Screenshot 2023-05-15 at 2.30.22 PM.png');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      // Note: AM/PM is not parsed, so time defaults based on numbers found
    });

    it('parses iOS photo format with spaces', () => {
      const result = parseDateFromFilename('Photo 2023-05-15, 14 30 22.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(22);
    });
  });

  describe('WhatsApp formats', () => {
    it('parses WhatsApp image format IMG-YYYYMMDD-WAxxxx', () => {
      const result = parseDateFromFilename('IMG-20230515-WA0042.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses WhatsApp video format VID-YYYYMMDD-WAxxxx', () => {
      const result = parseDateFromFilename('VID-20230515-WA0001.mp4');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses WhatsApp audio format AUD-YYYYMMDD-WAxxxx', () => {
      const result = parseDateFromFilename('AUD-20230515-WA0003.opus');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses WhatsApp PTT format PTT-YYYYMMDD-WAxxxx', () => {
      const result = parseDateFromFilename('PTT-20230515-WA0007.opus');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });
  });

  describe('Telegram formats', () => {
    it('parses Telegram photo format', () => {
      const result = parseDateFromFilename('photo_2023-05-15_14-30-22.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(22);
    });

    it('parses Telegram video format', () => {
      const result = parseDateFromFilename('video_2023-05-15_14-30-22.mp4');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });
  });

  describe('Screenshot formats from various apps', () => {
    it('parses macOS screenshot format', () => {
      const result = parseDateFromFilename('Screen Shot 2023-05-15 at 14.30.22.png');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(22);
    });

    it('parses macOS Sonoma screenshot format', () => {
      const result = parseDateFromFilename('Screenshot 2023-05-15 at 14.30.22.png');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses Windows Snipping Tool format', () => {
      const result = parseDateFromFilename('Screenshot 2023-05-15 143022.png');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses ShareX format', () => {
      const result = parseDateFromFilename('ShareX_Screenshot_2023-05-15-14-30-22.png');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses Greenshot format', () => {
      const result = parseDateFromFilename('greenshot_2023-05-15_14-30-22.png');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses Flameshot format', () => {
      const result = parseDateFromFilename('flameshot-2023-05-15T14-30-22.png');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses Android screenshot format', () => {
      const result = parseDateFromFilename('Screenshot_20230515-143022.png');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses Android screenshot format with underscore time', () => {
      const result = parseDateFromFilename('Screenshot_20230515_143022.png');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(22);
    });
  });

  describe('Video recording formats', () => {
    it('parses screen recording format', () => {
      const result = parseDateFromFilename('Screen Recording 2023-05-15 at 14.30.22.mov');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses VLC recording format', () => {
      const result = parseDateFromFilename('vlc-record-2023-05-15-14h30m22s.mp4');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(22);
    });

    it('parses OBS recording format', () => {
      const result = parseDateFromFilename('2023-05-15 14-30-22.mkv');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(22);
    });

    it('parses GoPro format', () => {
      const result = parseDateFromFilename('GH010042_20230515_143022.MP4');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });
  });

  describe('DSLR/Camera formats', () => {
    it('parses Canon format with date', () => {
      const result = parseDateFromFilename('IMG_20230515_0042.CR2');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses Nikon format with date', () => {
      const result = parseDateFromFilename('DSC_20230515_0042.NEF');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses Sony format with date', () => {
      const result = parseDateFromFilename('DSC20230515_143022.ARW');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses DJI drone format', () => {
      const result = parseDateFromFilename('DJI_20230515143022_0001.JPG');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(22);
    });
  });

  describe('Cloud/Backup service formats', () => {
    it('parses Google Photos export format', () => {
      const result = parseDateFromFilename('IMG_20230515_143022-EFFECTS.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses Dropbox Camera Upload format', () => {
      const result = parseDateFromFilename('2023-05-15 14.30.22.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(22);
    });

    it('parses OneDrive format', () => {
      const result = parseDateFromFilename('20230515_143022000_iOS.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });
  });

  describe('ISO 8601 and standard date formats', () => {
    it('parses ISO 8601 basic format YYYYMMDDTHHMMSS', () => {
      const result = parseDateFromFilename('backup_20230515T143022.zip');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('parses ISO 8601 extended format with colons', () => {
      const result = parseDateFromFilename('log_2023-05-15T14:30:22.txt');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(22);
    });

    it('parses compact date-time format', () => {
      const result = parseDateFromFilename('export-20230515143022.csv');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(14);
      expect(result!.minute).toBe(30);
      expect(result!.second).toBe(22);
    });
  });

  describe('various file extensions', () => {
    it('parses HEIC files (iPhone)', () => {
      const result = parseDateFromFilename('IMG_20230515_143022.HEIC');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
    });

    it('parses HEIF files', () => {
      const result = parseDateFromFilename('IMG_20230515_143022.heif');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
    });

    it('parses WebP files', () => {
      const result = parseDateFromFilename('image_20230515_143022.webp');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
    });

    it('parses RAW files (.dng)', () => {
      const result = parseDateFromFilename('photo_20230515.dng');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
    });

    it('parses RAW files (.cr2)', () => {
      const result = parseDateFromFilename('IMG_20230515_143022.CR2');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
    });

    it('parses RAW files (.nef)', () => {
      const result = parseDateFromFilename('DSC_20230515_143022.NEF');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
    });

    it('parses video files (.mp4)', () => {
      const result = parseDateFromFilename('VID_20230515_143022.mp4');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
    });

    it('parses video files (.mov)', () => {
      const result = parseDateFromFilename('IMG_20230515_143022.MOV');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
    });

    it('parses video files (.mkv)', () => {
      const result = parseDateFromFilename('recording_20230515_143022.mkv');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
    });
  });

  describe('special characters in filenames', () => {
    it('handles filename with multiple dots', () => {
      const result = parseDateFromFilename('photo.2023.05.15.backup.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('handles filename with parentheses and numbers', () => {
      const result = parseDateFromFilename('photo_20230515 (1).jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('handles filename with brackets', () => {
      const result = parseDateFromFilename('[2023-05-15] vacation photo.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('handles filename with hash/pound sign', () => {
      const result = parseDateFromFilename('photo#20230515#143022.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });
  });

  describe('Year boundary cases', () => {
    it('parses date from year 1900', () => {
      const result = parseDateFromFilename('archive_19000101.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(1900);
      expect(result!.month).toBe(1);
      expect(result!.day).toBe(1);
    });

    it('parses date from year 2000 (Y2K)', () => {
      const result = parseDateFromFilename('photo_20000101_000000.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2000);
      expect(result!.month).toBe(1);
      expect(result!.day).toBe(1);
    });

    it('parses date from year 2099', () => {
      const result = parseDateFromFilename('future_20991231.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2099);
      expect(result!.month).toBe(12);
      expect(result!.day).toBe(31);
    });

    it('parses date from year 2100', () => {
      const result = parseDateFromFilename('photo_21000101.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2100);
    });

    it('rejects year 2101 (out of range)', () => {
      const result = parseDateFromFilename('photo_21010101.jpg');
      expect(result).toBeNull();
    });
  });

  describe('Time boundary cases', () => {
    it('parses midnight (00:00:00)', () => {
      const result = parseDateFromFilename('IMG_20230515_000000.jpg');
      expect(result).not.toBeNull();
      expect(result!.hour).toBe(0);
      expect(result!.minute).toBe(0);
      expect(result!.second).toBe(0);
    });

    it('parses end of day (23:59:59)', () => {
      const result = parseDateFromFilename('IMG_20230515_235959.jpg');
      expect(result).not.toBeNull();
      expect(result!.hour).toBe(23);
      expect(result!.minute).toBe(59);
      expect(result!.second).toBe(59);
    });

    it('falls back to date-only when hour is invalid (24)', () => {
      // When time sequence is invalid, parser falls back to valid date without time
      const result = parseDateFromFilename('IMG_20230515_240000.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(0); // Falls back to date-only
    });

    it('falls back to date-only when minute is invalid (60)', () => {
      const result = parseDateFromFilename('IMG_20230515_146000.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(0); // Falls back to date-only
    });

    it('falls back to date-only when second is invalid (60)', () => {
      const result = parseDateFromFilename('IMG_20230515_143060.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
      expect(result!.hour).toBe(0); // Falls back to date-only
    });
  });

  describe('Month-specific day validation', () => {
    it('accepts Jan 31', () => {
      const result = parseDateFromFilename('photo_20230131.jpg');
      expect(result).not.toBeNull();
      expect(result!.day).toBe(31);
    });

    it('rejects Feb 30', () => {
      const result = parseDateFromFilename('photo_20230230.jpg');
      expect(result).toBeNull();
    });

    it('rejects Apr 31', () => {
      const result = parseDateFromFilename('photo_20230431.jpg');
      expect(result).toBeNull();
    });

    it('rejects Jun 31', () => {
      const result = parseDateFromFilename('photo_20230631.jpg');
      expect(result).toBeNull();
    });

    it('rejects Sep 31', () => {
      const result = parseDateFromFilename('photo_20230931.jpg');
      expect(result).toBeNull();
    });

    it('rejects Nov 31', () => {
      const result = parseDateFromFilename('photo_20231131.jpg');
      expect(result).toBeNull();
    });

    it('accepts Dec 31', () => {
      const result = parseDateFromFilename('photo_20231231.jpg');
      expect(result).not.toBeNull();
      expect(result!.day).toBe(31);
    });

    it('accepts leap year Feb 29 (2024)', () => {
      const result = parseDateFromFilename('photo_20240229.jpg');
      expect(result).not.toBeNull();
      expect(result!.day).toBe(29);
    });

    it('rejects non-leap year Feb 29 (2023)', () => {
      const result = parseDateFromFilename('photo_20230229.jpg');
      expect(result).toBeNull();
    });

    it('accepts century leap year Feb 29 (2000)', () => {
      const result = parseDateFromFilename('photo_20000229.jpg');
      expect(result).not.toBeNull();
      expect(result!.day).toBe(29);
    });

    it('rejects non-century leap year Feb 29 (1900)', () => {
      const result = parseDateFromFilename('photo_19000229.jpg');
      expect(result).toBeNull();
    });
  });

  describe('Ambiguous filenames (should pick first valid date)', () => {
    it('picks first valid date when multiple dates present', () => {
      const result = parseDateFromFilename('copy_20230515_of_20220101.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });

    it('skips invalid date and finds next valid one', () => {
      const result = parseDateFromFilename('backup_20231301_fixed_20230515.jpg');
      // First date (20231301) has invalid month 13, should find 20230515
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
      expect(result!.month).toBe(5);
      expect(result!.day).toBe(15);
    });
  });

  describe('Unicode and international filenames', () => {
    it('handles filename with Japanese characters', () => {
      const result = parseDateFromFilename('写真_20230515_143022.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
    });

    it('handles filename with Chinese characters', () => {
      const result = parseDateFromFilename('照片_20230515.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
    });

    it('handles filename with Korean characters', () => {
      const result = parseDateFromFilename('사진_20230515_143022.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
    });

    it('handles filename with emoji', () => {
      const result = parseDateFromFilename('vacation🏖️_20230515.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
    });

    it('handles filename with accented characters', () => {
      const result = parseDateFromFilename('café_photo_20230515.jpg');
      expect(result).not.toBeNull();
      expect(result!.year).toBe(2023);
    });
  });

  describe('No date should be found', () => {
    it('returns null for random numbers that are not dates', () => {
      const result = parseDateFromFilename('IMG_1234.jpg');
      expect(result).toBeNull();
    });

    it('returns null for sequential numbers', () => {
      const result = parseDateFromFilename('DSC_0001.jpg');
      expect(result).toBeNull();
    });

    it('returns null for hash-like filenames', () => {
      const result = parseDateFromFilename('a1b2c3d4e5f6.jpg');
      expect(result).toBeNull();
    });

    it('returns null for UUID filenames', () => {
      const result = parseDateFromFilename('550e8400-e29b-41d4-a716-446655440000.jpg');
      expect(result).toBeNull();
    });

    it('returns null for empty filename', () => {
      const result = parseDateFromFilename('');
      expect(result).toBeNull();
    });

    it('returns null for filename with only extension', () => {
      const result = parseDateFromFilename('.jpg');
      expect(result).toBeNull();
    });
  });
});

describe('formatParsedDate', () => {
  it('formats a parsed date correctly', () => {
    const parsed: ParsedDate = {
      timestamp: 0,
      year: 2023,
      month: 5,
      day: 15,
      hour: 14,
      minute: 30,
      second: 22,
    };
    expect(formatParsedDate(parsed)).toBe('2023-05-15 14:30:22');
  });

  it('pads single digit values', () => {
    const parsed: ParsedDate = {
      timestamp: 0,
      year: 2023,
      month: 1,
      day: 5,
      hour: 9,
      minute: 5,
      second: 3,
    };
    expect(formatParsedDate(parsed)).toBe('2023-01-05 09:05:03');
  });
});
