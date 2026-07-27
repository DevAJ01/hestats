#!/usr/bin/env python3
"""Convert HESA's DT042 data.xlsx archive to a compact, reproducible long-form CSV gzip."""

from __future__ import annotations

import argparse
import csv
import gzip
from pathlib import Path

from openpyxl import load_workbook


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path, help="Official HESA DT042 data.xlsx")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("public/data/hesa-estates-dt042-2015-16-to-2024-25.csv.gz"),
    )
    args = parser.parse_args()

    workbook = load_workbook(args.workbook, read_only=True, data_only=True)
    sheet = workbook.active
    header_row = None
    for row_number, row in enumerate(sheet.iter_rows(values_only=True), start=1):
        if row and str(row[0]).strip() == "UKPRN":
            header_row = row_number
            headers = [str(value or "").strip() for value in row]
            break
    if header_row is None:
        raise RuntimeError("The workbook does not contain a UKPRN header row.")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    row_count = 0
    with gzip.open(args.output, "wt", encoding="utf-8", newline="", compresslevel=9) as handle:
        writer = csv.writer(handle)
        writer.writerow(headers)
        for row in sheet.iter_rows(min_row=header_row + 1, values_only=True):
            if not row or not row[0]:
                continue
            writer.writerow(["" if value is None else value for value in row])
            row_count += 1

    print(f"Wrote {row_count:,} HESA DT042 rows to {args.output}")


if __name__ == "__main__":
    main()
