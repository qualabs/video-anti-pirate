import base64
import binascii
import struct

COMMON_SYSTEM_ID = base64.b16decode("1077EFECC0B24D02ACE33C1E52E2FB4B")


def genClearkeyPssh(kids):
    return MakePsshBoxV1(COMMON_SYSTEM_ID, kids, "")


def MakePsshBoxV1(system_id, kids, payload):
    payload = payload.encode("ascii")
    pssh_size = 12 + 16 + 4 + (16 * len(kids)) + 4 + len(payload)
    pssh = (
        struct.pack(">I", pssh_size)
        + b"pssh"
        + struct.pack(">I", 0x01000000)
        + system_id
        + struct.pack(">I", len(kids))
    )
    for kid in kids:
        pssh += binascii.a2b_hex(kid.replace("-", ""))
    pssh += struct.pack(">I", len(payload)) + payload
    return base64.b64encode(pssh).decode("ascii")
