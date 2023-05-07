from enum import IntEnum


class PacketType(IntEnum):
    NEW = 0b0001
    JOIN = 0b0010
    QUIT = 0b0011
    START = 0b0100
    RESET = 0b0101
    MOVE = 0b0110
    UPDATE = 0b0111
    REFRESH = 0b1000

    UNKNOWN_PT = 0b1111


def extract_header_info(header: int) -> tuple[PacketType, bool, bool, int]:
    return (
        PacketType(header >> 4),
        header & 0b1000 != 0,
        header & 0b100 != 0,
        header & 0b11
    )


def generate_header(
        pt: PacketType,
        is_ack: bool = True,
        is_err: bool = False,
        code: int = 0) -> bytes:
    return bytes([(pt << 4) | (is_ack << 3) | (is_err << 2) | (code & 0b11)])


def str2bytes(s: str) -> bytes:
    return bytes(bytearray(s, "ascii"))
