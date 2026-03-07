import os
import json
import logging
import argparse
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv
from financetoolkit import Toolkit

# Load environment variables
load_dotenv('../../.env')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_db_connection():
    # Attempt to use individual vars, fallback to connection string if needed
    try:
        if 'LITELLM_DATABASE_URL' in os.environ:
             conn = psycopg2.connect(os.environ['LITELLM_DATABASE_URL'])
        else:
             conn = psycopg2.connect(
                 host=os.getenv('DB_HOST', 'localhost'),
                 database=os.getenv('DB_NAME', 'omnitrade'),
                 user=os.getenv('DB_USER', 'postgres'),
                 password=os.getenv('DB_PASS', 'postgres'),
                 port=os.getenv('DB_PORT', '5432')
             )
        return conn
    except Exception as e:
        logging.error(f"Failed to connect to database: {e}")
        raise

def process_ticker(symbol: str, api_key: str, conn):
    logging.info(f"Processing advanced metrics for {symbol} using FinanceToolkit...")
    
    try:
        # Initialize FinanceToolkit
        # Note: FinanceToolkit fetches data automatically using the FMP API key
        toolkit = Toolkit(tickers=[symbol], api_key=api_key, historical=False)
        
        derived_data = {}
        
        # 1. DuPont Analysis
        logging.info("Calculating DuPont Analysis...")
        dupont = toolkit.models.get_dupont_analysis()
        derived_data['dupont_analysis'] = dupont.to_dict()
        
        # 2. Altman Z-Score (Bankruptcy Risk)
        logging.info("Calculating Altman Z-Score...")
        altman = toolkit.models.get_altman_z_score()
        derived_data['altman_z_score'] = altman.to_dict()
        
        # 3. Piotroski F-Score (Value Stock Assessment)
        logging.info("Calculating Piotroski F-Score...")
        piotroski = toolkit.models.get_piotroski_score()
        derived_data['piotroski_score'] = piotroski.to_dict()

        # Save to database
        upsert_metrics(conn, symbol, derived_data)
        logging.info(f"Successfully processed and saved metrics for {symbol}")

    except Exception as e:
        logging.error(f"Error processing {symbol}: {e}")

def upsert_metrics(conn, symbol: str, metrics_dict: dict):
    with conn.cursor() as cur:
        for metric_type, data in metrics_dict.items():
            cur.execute("""
                INSERT INTO fmp_derived_metrics (symbol, metric_type, data, computed_at)
                VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (symbol, metric_type) 
                DO UPDATE SET data = EXCLUDED.data, computed_at = CURRENT_TIMESTAMP;
            """, (symbol, metric_type, Json(data)))
    conn.commit()

def main():
    parser = argparse.ArgumentParser(description="FinanceToolkit Analytics Worker")
    parser.add_argument("symbols", nargs="+", help="One or more ticker symbols to process (e.g., AAPL MSFT)")
    args = parser.parse_args()

    api_key = os.getenv('FMP_API_KEY')
    if not api_key:
        logging.error("FMP_API_KEY environment variable is required.")
        return

    conn = get_db_connection()
    try:
        for symbol in args.symbols:
            process_ticker(symbol.upper(), api_key, conn)
    finally:
        conn.close()
        logging.info("Database connection closed.")

if __name__ == "__main__":
    main()
