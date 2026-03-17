"""
Database Restore Script for Recipe App
Restores all data from JSON backup files to Supabase.
WARNING: This will DELETE all current data and replace it with the backup!
Uses only the requests library (no supabase dependency).
"""

import os
import json
import sys
import requests

# Supabase credentials
SUPABASE_URL = "https://rifdotvjfzhqcjvidifx.supabase.co"
SUPABASE_KEY = "sb_publishable_mrSMoDLlN74gyp0QtfsL0w_SmTeVTVK"

# Backup directory
BACKUP_DIR = os.path.join(os.path.dirname(__file__), '..', 'backups')

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

def delete_all_from_table(table_name):
    """Delete all records from a table"""
    # First get all IDs
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?select=id"
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
    records = response.json()

    if not records:
        return 0

    # Delete all records by ID
    ids = [r['id'] for r in records]
    for record_id in ids:
        delete_url = f"{SUPABASE_URL}/rest/v1/{table_name}?id=eq.{record_id}"
        requests.delete(delete_url, headers=HEADERS)

    return len(ids)

def insert_records(table_name, records):
    """Insert records into a table"""
    if not records:
        return 0

    url = f"{SUPABASE_URL}/rest/v1/{table_name}"

    # Insert in batches
    batch_size = 50
    inserted = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        response = requests.post(url, headers=HEADERS, json=batch)
        if response.status_code in [200, 201]:
            inserted += len(batch)
        else:
            # Try one by one
            for record in batch:
                resp = requests.post(url, headers=HEADERS, json=record)
                if resp.status_code in [200, 201]:
                    inserted += 1
                else:
                    print(f"      Failed: {resp.text[:100]}")

    return inserted

def list_backups():
    """List all available backups"""
    if not os.path.exists(BACKUP_DIR):
        print("No backups found.")
        return []

    backups = [d for d in os.listdir(BACKUP_DIR) if d.startswith('backup_')]
    backups.sort(reverse=True)  # Most recent first

    if not backups:
        print("No backups found.")
        return []

    print("Available backups:")
    for i, backup in enumerate(backups, 1):
        summary_path = os.path.join(BACKUP_DIR, backup, 'backup_summary.json')
        if os.path.exists(summary_path):
            with open(summary_path, 'r') as f:
                summary = json.load(f)
            print(f"  {i}. {backup}")
            print(f"      Tables: {summary.get('tables', {})}")
        else:
            print(f"  {i}. {backup} (no summary)")

    return backups

def restore_database(backup_name):
    """Restore database from a backup"""
    backup_path = os.path.join(BACKUP_DIR, backup_name)

    if not os.path.exists(backup_path):
        print(f"Backup not found: {backup_path}")
        return False

    # Confirm restoration
    print(f"\n⚠️  WARNING: This will DELETE ALL CURRENT DATA and restore from backup!")
    print(f"Backup to restore: {backup_name}")
    confirm = input("Type 'YES' to confirm: ")

    if confirm != 'YES':
        print("Restore cancelled.")
        return False

    # Order matters for foreign keys - delete in reverse order, restore in forward order
    tables_delete_order = ['favorites', 'directions', 'ingredients', 'recipes', 'recipe_books']

    print("\nDeleting current data...")
    for table in tables_delete_order:
        print(f"  Deleting from {table}...", end=" ")
        try:
            count = delete_all_from_table(table)
            print(f"({count} records)")
        except Exception as e:
            print(f"Error: {e}")

    print("\nRestoring data from backup...")
    # Restore in correct order (parents first, then children)
    restore_order = ['recipe_books', 'recipes', 'ingredients', 'directions', 'favorites']

    for table in restore_order:
        file_path = os.path.join(backup_path, f'{table}.json')

        if not os.path.exists(file_path):
            print(f"  Skipping {table} (no backup file)")
            continue

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if not data:
            print(f"  Skipping {table} (empty)")
            continue

        print(f"  Restoring {table}...", end=" ")
        try:
            inserted = insert_records(table, data)
            print(f"({inserted}/{len(data)} records)")
        except Exception as e:
            print(f"Error: {e}")

    print("\n✅ Restore complete!")
    return True

if __name__ == '__main__':
    if len(sys.argv) > 1:
        # Restore specific backup
        restore_database(sys.argv[1])
    else:
        # List backups and let user choose
        backups = list_backups()
        if backups:
            print("\nTo restore a backup, run:")
            print(f"  python restore_database.py {backups[0]}")
