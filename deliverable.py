class DeltaRLECompressor:
    """
    A class to handle Delta-RLE timestamp compression and decompression.
    """

    MAX_SUPPORTED_COUNT = 10**6  # Example limit for supported count

    def __init__(self):
        pass

    @staticmethod
    def validate_timestamps(timestamps):
        """
        Validates the input timestamps.

        :param timestamps: List of timestamps to validate.
        :raises ValueError: If the timestamps are invalid.
        """
        if not isinstance(timestamps, list):
            raise ValueError("Timestamps must be a list.")
        if not all(isinstance(ts, (int, float)) for ts in timestamps):
            raise ValueError("All timestamps must be integers or floats.")

    @staticmethod
    def compress(timestamps):
        """
        Compresses a list of timestamps using Delta-RLE.

        :param timestamps: List of timestamps to compress.
        :return: Compressed representation of the timestamps.
        """
        DeltaRLECompressor.validate_timestamps(timestamps)

        if not timestamps:
            return []

        deltas = []
        prev_timestamp = timestamps[0]
        for timestamp in timestamps[1:]:
            delta = timestamp - prev_timestamp
            if not (isinstance(delta, (int, float)) and delta >= 0):
                raise ValueError("Timestamps must be non-decreasing.")
            deltas.append(delta)
            prev_timestamp = timestamp

        compressed = []
        count = 1
        for i in range(1, len(deltas)):
            if deltas[i] == deltas[i - 1]:
                count += 1
            else:
                if count > DeltaRLECompressor.MAX_SUPPORTED_COUNT:
                    raise ValueError(f"Count exceeds maximum supported value: {DeltaRLECompressor.MAX_SUPPORTED_COUNT}")
                compressed.append((deltas[i - 1], count))
                count = 1
        if count > DeltaRLECompressor.MAX_SUPPORTED_COUNT:
            raise ValueError(f"Count exceeds maximum supported value: {DeltaRLECompressor.MAX_SUPPORTED_COUNT}")
        compressed.append((deltas[-1], count))

        return compressed

    @staticmethod
    def decompress(compressed):
        """
        Decompresses a Delta-RLE compressed representation back into timestamps.

        :param compressed: Compressed representation of timestamps.
        :return: Decompressed list of timestamps.
        """
        if not isinstance(compressed, list):
            raise ValueError("Compressed data must be a list.")
        if not all(isinstance(pair, tuple) and len(pair) == 2 and
                   isinstance(pair[0], (int, float)) and isinstance(pair[1], int) and pair[1] > 0
                   for pair in compressed):
            raise ValueError("Compressed data must be a list of (delta, count) tuples.")

        timestamps = [0]  # Start with an initial timestamp of 0
        for delta, count in compressed:
            if delta < 0:
                raise ValueError("Delta values must be non-negative.")
            if count > DeltaRLECompressor.MAX_SUPPORTED_COUNT:
                raise ValueError(f"Count exceeds maximum supported value: {DeltaRLECompressor.MAX_SUPPORTED_COUNT}")
            timestamps.extend([timestamps[-1] + delta] * count)

        return timestamps

    @staticmethod
    def calculate_compression_ratio(original, compressed):
        """
        Calculates the compression ratio.

        :param original: Original list of timestamps.
        :param compressed: Compressed representation of timestamps.
        :return: Compression ratio as a float.
        """
        if not original:
            return 0.0
        original_size = len(original)
        compressed_size = sum(len(str(delta)) + len(str(count)) for delta, count in compressed)
        ratio = compressed_size / original_size
        return round(ratio, 4)


# Example Usage
if __name__ == "__main__":
    timestamps = [0, 1, 2, 3, 5, 8, 8, 8, 10]
    compressor = DeltaRLECompressor()

    # Compress timestamps
    compressed = compressor.compress(timestamps)
    print("Compressed:", compressed)

    # Decompress timestamps
    decompressed = compressor.decompress(compressed)
    print("Decompressed:", decompressed)

    # Calculate compression ratio
    ratio = compressor.calculate_compression_ratio(timestamps, compressed)
    print("Compression Ratio:", ratio)
