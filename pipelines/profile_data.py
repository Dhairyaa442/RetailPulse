from pathlib import Path

import pandas as pd


RAW_DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "raw"


def profile_csv(file_path: Path) -> None:
    df = pd.read_csv(file_path)

    print(f"\n{'=' * 70}")
    print(f"DATASET: {file_path.name}")
    print(f"{'=' * 70}")

    print(f"Rows: {len(df):,}")
    print(f"Columns: {len(df.columns)}")
    print(f"Duplicate rows: {df.duplicated().sum():,}")

    print("\nCOLUMNS")
    for column in df.columns:
        missing = df[column].isna().sum()
        unique = df[column].nunique()

        print(
            f"{column:<40} "
            f"type={str(df[column].dtype):<10} "
            f"missing={missing:<8} "
            f"unique={unique}"
        )


def main() -> None:
    csv_files = sorted(RAW_DATA_DIR.glob("*.csv"))

    if not csv_files:
        print(f"No CSV files found in {RAW_DATA_DIR}")
        return

    print(f"Found {len(csv_files)} CSV files.")

    for file_path in csv_files:
        profile_csv(file_path)


if __name__ == "__main__":
    main()
