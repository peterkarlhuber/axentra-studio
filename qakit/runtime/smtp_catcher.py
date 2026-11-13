"""Local SMTP catcher of the QA kit: accepts mail on 127.0.0.1 and stores each message as an .eml file.

Nothing is relayed. Axentra's smtp provider delivers here, so notifications, invitations and password resets can be
read on the kit page (/qa/) without any real mail leaving the computer.
"""

from __future__ import annotations

import os
import time
from pathlib import Path

from aiosmtpd.controller import Controller


class _Handler:
    def __init__(self, folder: Path) -> None:
        self.folder = folder

    async def handle_DATA(self, server, session, envelope):
        self.folder.mkdir(parents=True, exist_ok=True)
        name = f"{time.time_ns()}.eml"
        tmp = self.folder / (name + ".part")
        data = envelope.original_content or envelope.content
        if isinstance(data, str):
            data = data.encode("utf-8")
        header = (
            f"X-QA-Envelope-From: {envelope.mail_from}\r\nX-QA-Envelope-To: {', '.join(envelope.rcpt_tos)}\r\n"
        ).encode()
        tmp.write_bytes(header + data)
        os.replace(tmp, self.folder / name)
        return "250 Message stored locally (QA kit, not sent)"


class MailCatcher:
    def __init__(self, folder: Path, port: int) -> None:
        self.controller = Controller(_Handler(folder), hostname="127.0.0.1", port=port)

    def start(self) -> None:
        self.controller.start()

    def stop(self) -> None:
        self.controller.stop()
