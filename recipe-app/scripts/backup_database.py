"""
Database Backup Script for Recipe App
Exports all data from Supabase to JSON files for backup/restore purposes.
Uses only the requests library (no supabase dependency).
"""

import os
import json
from datetime import datetime
import requests

# Supabase credentials
SUPABASE_URL = "https://rifdotvjfzhqcjvidifx.supabase.co"
SUPABASE_KEY = "sb_publishable_mrSMoDLlN74gyp0QtfsL0w_SmTeVTVK"

# Create backup directory
BACKUP_DIR = os.path.join(os.path.dirname(__file__), '..', 'backups')

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

def fetch_table(table_name):
    """Fetch all records from a table, handling pagination"""
    all_data = []
    offset = 0
    limit = 1000  # Supabase default limit

    while True:
        url = f"{SUPABASE_URL}/rest/v1/{table_name}?select=*&offset={offset}&limit={limit}"
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        data = response.json()

        if not data:
            break

        all_data.extend(data)

        if len(data) < limit:
            break

        offset += limit

    return all_data

def backup_database():
    # Create backup directory with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = os.path.join(BACKUP_DIR, f'backup_{timestamp}')
    os.makedirs(backup_path, exist_ok=True)

    print(f"Creating backup in: {backup_path}")

    # Tables to backup
    tables = ['recipes', 'ingredients', 'directions', 'favorites', 'recipe_books']

    backup_summary = {}

    for table in tables:
        print(f"  Backing up {table}...")

        try:
            data = fetch_table(table)

            # Save to JSON file
            file_path = os.path.join(backup_path, f'{table}.json')
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            backup_summary[table] = len(data)
            print(f"    -> {len(data)} records saved")
        except Exception as e:
            print(f"    -> Error: {e}")
            backup_summary[table] = f"Error: {e}"

    # Save backup summary
    summary_path = os.path.join(backup_path, 'backup_summary.json')
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump({
            'timestamp': timestamp,
            'tables': backup_summary
        }, f, indent=2)

    print(f"\nBackup complete!")
    print(f"Location: {backup_path}")
    print(f"Summary: {backup_summary}")

    return backup_path

if __name__ == '__main__':
    backup_database()
