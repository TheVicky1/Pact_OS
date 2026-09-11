/**
 * Pure TypeScript PKZip Archive Generator
 * Zero runtime dependencies. Fully compliant with PKZip standard.
 */

// CRC-32 table initialization
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

export function computeCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipFileInput {
  filename: string;
  content: string | Uint8Array;
}

/**
 * Creates a standard ZIP archive buffer from a collection of named files (stored uncompressed / Store method 0).
 */
export function createZipArchive(files: ZipFileInput[]): Uint8Array {
  const encoder = new TextEncoder();
  const fileRecords: {
    filenameBytes: Uint8Array;
    contentBytes: Uint8Array;
    crc32: number;
    offset: number;
  }[] = [];

  const localHeaders: Uint8Array[] = [];
  let currentOffset = 0;

  for (const file of files) {
    const filenameBytes = encoder.encode(file.filename);
    const contentBytes =
      typeof file.content === 'string'
        ? encoder.encode(file.content)
        : file.content;
    const crc32 = computeCrc32(contentBytes);
    const offset = currentOffset;

    // Local file header (30 bytes + filename length)
    const header = new Uint8Array(30 + filenameBytes.length);
    const view = new DataView(header.buffer);

    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true); // Version needed to extract (2.0)
    view.setUint16(6, 0x0800, true); // General purpose bit flag (UTF-8 filename)
    view.setUint16(8, 0, true); // Compression method (0 = store)
    view.setUint16(10, 0, true); // File last mod time
    view.setUint16(12, 0, true); // File last mod date
    view.setUint32(14, crc32, true); // CRC-32
    view.setUint32(18, contentBytes.length, true); // Compressed size
    view.setUint32(22, contentBytes.length, true); // Uncompressed size
    view.setUint16(26, filenameBytes.length, true); // Filename length
    view.setUint16(28, 0, true); // Extra field length

    header.set(filenameBytes, 30);

    localHeaders.push(header);
    localHeaders.push(contentBytes);

    currentOffset += header.length + contentBytes.length;

    fileRecords.push({
      filenameBytes,
      contentBytes,
      crc32,
      offset,
    });
  }

  // Central Directory
  const centralDirectoryHeaders: Uint8Array[] = [];
  let centralDirectorySize = 0;
  const centralDirectoryOffset = currentOffset;

  for (const record of fileRecords) {
    const cdHeader = new Uint8Array(46 + record.filenameBytes.length);
    const view = new DataView(cdHeader.buffer);

    view.setUint32(0, 0x02014b50, true); // Central directory header signature
    view.setUint16(4, 20, true); // Version made by
    view.setUint16(6, 20, true); // Version needed to extract
    view.setUint16(8, 0x0800, true); // General purpose bit flag (UTF-8)
    view.setUint16(10, 0, true); // Compression method (0 = store)
    view.setUint16(12, 0, true); // File last mod time
    view.setUint16(14, 0, true); // File last mod date
    view.setUint32(16, record.crc32, true); // CRC-32
    view.setUint32(20, record.contentBytes.length, true); // Compressed size
    view.setUint32(24, record.contentBytes.length, true); // Uncompressed size
    view.setUint16(28, record.filenameBytes.length, true); // Filename length
    view.setUint16(30, 0, true); // Extra field length
    view.setUint16(32, 0, true); // File comment length
    view.setUint16(34, 0, true); // Disk number start
    view.setUint16(36, 0, true); // Internal file attributes
    view.setUint32(38, 0, true); // External file attributes
    view.setUint32(42, record.offset, true); // Relative offset of local header

    cdHeader.set(record.filenameBytes, 46);

    centralDirectoryHeaders.push(cdHeader);
    centralDirectorySize += cdHeader.length;
  }

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true); // End of central dir signature
  eocdView.setUint16(4, 0, true); // Number of this disk
  eocdView.setUint16(6, 0, true); // Disk where central directory starts
  eocdView.setUint16(8, fileRecords.length, true); // Number of central directory records on this disk
  eocdView.setUint16(10, fileRecords.length, true); // Total number of central directory records
  eocdView.setUint32(12, centralDirectorySize, true); // Size of central directory
  eocdView.setUint32(16, centralDirectoryOffset, true); // Offset of start of central directory
  eocdView.setUint16(20, 0, true); // Comment length

  // Assemble full archive
  const totalLength = currentOffset + centralDirectorySize + eocd.length;
  const result = new Uint8Array(totalLength);
  let writeOffset = 0;

  for (const chunk of localHeaders) {
    result.set(chunk, writeOffset);
    writeOffset += chunk.length;
  }

  for (const chunk of centralDirectoryHeaders) {
    result.set(chunk, writeOffset);
    writeOffset += chunk.length;
  }

  result.set(eocd, writeOffset);

  return result;
}
