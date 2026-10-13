from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, text


BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DATA_DIR = BASE_DIR / "data" / "raw"

DATABASE_URL = "postgresql+psycopg2://dhairyaamehta@localhost/retailpulse"

engine = create_engine(DATABASE_URL)


DATASETS = {
    "customers": "olist_customers_dataset.csv",
    "sellers": "olist_sellers_dataset.csv",
    "products": "olist_products_dataset.csv",
    "product_category_translation": "product_category_name_translation.csv",

    # Transactional tables
    "orders": "olist_orders_dataset.csv",
    "order_items": "olist_order_items_dataset.csv",
    "payments": "olist_order_payments_dataset.csv",
    "reviews": "olist_order_reviews_dataset.csv",
    "geolocation": "olist_geolocation_dataset.csv",
}

def clean_geolocation(df: pd.DataFrame) -> pd.DataFrame:
    df["geolocation_lat"] = pd.to_numeric(
        df["geolocation_lat"], errors="coerce"
    )

    df["geolocation_lng"] = pd.to_numeric(
        df["geolocation_lng"], errors="coerce"
    )

    return df

def table_has_data(table_name: str) -> bool:
    with engine.connect() as connection:
        result = connection.execute(
            text(f"SELECT EXISTS (SELECT 1 FROM {table_name} LIMIT 1)")
        )
        return bool(result.scalar())


def clean_products(df: pd.DataFrame) -> pd.DataFrame:
    numeric_columns = [
        "product_name_lenght",
        "product_description_lenght",
        "product_photos_qty",
        "product_weight_g",
        "product_length_cm",
        "product_height_cm",
        "product_width_cm",
    ]

    for column in numeric_columns:
        df[column] = pd.to_numeric(df[column], errors="coerce")

    # Match the CSV column names to our PostgreSQL schema.
    df = df.rename(
        columns={
            "product_name_lenght": "product_name_length",
            "product_description_lenght": "product_description_length",
        }
    )

    return df


def load_dataset(table_name: str, filename: str) -> None:
    if table_has_data(table_name):
        print(f"Skipping {table_name}: table already contains data.")
        return

    print(f"Loading {table_name}...")

    file_path = RAW_DATA_DIR / filename
    df = pd.read_csv(file_path)

    if table_name == "products":
        df = clean_products(df)

    elif table_name == "orders":
        df = clean_orders(df)

    elif table_name == "order_items":
        df = clean_order_items(df)

    elif table_name == "payments":
        df = clean_payments(df)

    elif table_name == "reviews":
        df = clean_reviews(df)

    df.to_sql(
        table_name,
        engine,
        if_exists="append",
        index=False,
        chunksize=1000,
    )

    print(f"Loaded {len(df):,} rows into {table_name}.")


def main() -> None:
    print("Starting RetailPulse ETL pipeline.\n")

    for table_name, filename in DATASETS.items():
        load_dataset(table_name, filename)

    print("\nETL load completed.")

def clean_orders(df: pd.DataFrame) -> pd.DataFrame:
    timestamp_columns = [
        "order_purchase_timestamp",
        "order_approved_at",
        "order_delivered_carrier_date",
        "order_delivered_customer_date",
        "order_estimated_delivery_date",
    ]

    for column in timestamp_columns:
        df[column] = pd.to_datetime(df[column], errors="coerce")

    return df


def clean_order_items(df: pd.DataFrame) -> pd.DataFrame:
    df["shipping_limit_date"] = pd.to_datetime(
        df["shipping_limit_date"],
        errors="coerce",
    )

    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df["freight_value"] = pd.to_numeric(
        df["freight_value"],
        errors="coerce",
    )

    return df


def clean_payments(df: pd.DataFrame) -> pd.DataFrame:
    df["payment_installments"] = pd.to_numeric(
        df["payment_installments"],
        errors="coerce",
    )

    df["payment_value"] = pd.to_numeric(
        df["payment_value"],
        errors="coerce",
    )

    return df


def clean_reviews(df: pd.DataFrame) -> pd.DataFrame:
    timestamp_columns = [
        "review_creation_date",
        "review_answer_timestamp",
    ]

    for column in timestamp_columns:
        df[column] = pd.to_datetime(df[column], errors="coerce")

    df["review_score"] = pd.to_numeric(
        df["review_score"],
        errors="coerce",
    )

    return df

if __name__ == "__main__":
    main()