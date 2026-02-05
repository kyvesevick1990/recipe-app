#!/usr/bin/env python3
"""
Recipe Book Assignment Script

This script assigns existing recipes to recipe books based on their original
PDF folder structure from the Umami Export.

Prerequisites:
    pip install requests

Usage:
    1. First run the SQL migration (003_create_recipe_books.sql) in Supabase
    2. Update SUPABASE_URL and SUPABASE_KEY below
    3. Run: python assign_recipes_to_books.py --dry-run
    4. If it looks good, run: python assign_recipes_to_books.py
"""

import os
import sys
import argparse
import requests
from pathlib import Path
from difflib import SequenceMatcher

# =============================================================================
# CONFIGURATION - Update these values!
# =============================================================================

SUPABASE_URL = "https://rifdotvjfzhqcjvidifx.supabase.co"
SUPABASE_KEY = "sb_publishable_mrSMoDLlN74gyp0QtfsL0w_SmTeVTVK"

# Path to your PDF files
PDF_ROOT = r"G:\My Drive\KV HV\Hobbies\Cooking\Umami Export"

# Mapping of folder names to book names (should match what's in the database)
FOLDER_TO_BOOK = {
    "Dinners": "Dinners",
    "Dessert": "Dessert",
    "Drinks": "Drinks",
    "Salads & Sides": "Salads & Sides",
    "Sauces, Dips, Dressings": "Sauces Dips Dressings",
    "Thanksgiving": "Thanksgiving",
    "Misc": "Misc",
}

# =============================================================================
# END CONFIGURATION
# =============================================================================

def similarity_score(a: str, b: str) -> float:
    """Calculate similarity between two strings."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def fetch_recipes() -> list[dict]:
    """Fetch all recipes from Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/recipes?select=id,title,book_id"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }

    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def fetch_books() -> list[dict]:
    """Fetch all recipe books from Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/recipe_books?select=id,name"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }

    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def update_recipe_book(recipe_id: str, book_id: str) -> bool:
    """Update recipe with book_id."""
    url = f"{SUPABASE_URL}/rest/v1/recipes?id=eq.{recipe_id}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    try:
        response = requests.patch(
            url,
            headers=headers,
            json={"book_id": book_id}
        )
        return response.status_code in [200, 204]
    except Exception as e:
        print(f"  Error updating recipe: {e}")
        return False

def find_matching_recipe(pdf_title: str, recipes: list[dict]) -> dict | None:
    """Find the best matching recipe by title."""
    best_match = None
    best_score = 0

    for recipe in recipes:
        score = similarity_score(pdf_title, recipe['title'])
        if score > best_score:
            best_score = score
            best_match = recipe

    # Require at least 80% similarity
    if best_score >= 0.8:
        return best_match
    return None

def scan_pdf_folders() -> dict[str, list[str]]:
    """Scan PDF folders and return mapping of folder -> list of PDF titles."""
    folder_contents = {}

    for folder_name in FOLDER_TO_BOOK.keys():
        folder_path = Path(PDF_ROOT) / folder_name
        if folder_path.exists():
            pdfs = []
            for file in folder_path.iterdir():
                if file.suffix.lower() == '.pdf':
                    # Remove .pdf extension to get title
                    pdfs.append(file.stem)
            folder_contents[folder_name] = pdfs
            print(f"  {folder_name}: {len(pdfs)} PDFs")
        else:
            print(f"  {folder_name}: folder not found")

    return folder_contents

def main():
    parser = argparse.ArgumentParser(description='Assign recipes to books based on PDF folders')
    parser.add_argument('--dry-run', action='store_true', help='Preview without making changes')
    args = parser.parse_args()

    print("=" * 60)
    print("Recipe Book Assignment Script")
    print("=" * 60)

    if args.dry_run:
        print("\n*** DRY RUN MODE - No changes will be made ***\n")

    # Fetch data from Supabase
    print("Fetching data from Supabase...")
    try:
        recipes = fetch_recipes()
        books = fetch_books()
        print(f"  Found {len(recipes)} recipes")
        print(f"  Found {len(books)} recipe books")
    except Exception as e:
        print(f"ERROR: Failed to fetch data: {e}")
        sys.exit(1)

    # Create book name to ID mapping
    book_name_to_id = {book['name']: book['id'] for book in books}
    print("\nRecipe books in database:")
    for name, book_id in book_name_to_id.items():
        print(f"  - {name}")

    # Scan PDF folders
    print(f"\nScanning PDF folders in: {PDF_ROOT}")
    folder_contents = scan_pdf_folders()

    # Process each folder
    print("\n" + "-" * 60)
    stats = {
        'assigned': 0,
        'already_assigned': 0,
        'no_match': 0,
        'book_not_found': 0,
    }

    for folder_name, pdf_titles in folder_contents.items():
        book_name = FOLDER_TO_BOOK.get(folder_name)
        if not book_name:
            print(f"\nSkipping folder: {folder_name} (no book mapping)")
            continue

        book_id = book_name_to_id.get(book_name)
        if not book_id:
            print(f"\nSkipping folder: {folder_name} (book '{book_name}' not found in database)")
            stats['book_not_found'] += len(pdf_titles)
            continue

        print(f"\nProcessing: {folder_name} -> {book_name}")

        for pdf_title in pdf_titles:
            # Find matching recipe
            recipe = find_matching_recipe(pdf_title, recipes)

            if not recipe:
                print(f"  [NO MATCH] {pdf_title}")
                stats['no_match'] += 1
                continue

            # Check if already assigned
            if recipe.get('book_id'):
                print(f"  [SKIP] {recipe['title']} (already assigned)")
                stats['already_assigned'] += 1
                continue

            # Assign to book
            if args.dry_run:
                print(f"  [WOULD ASSIGN] {recipe['title']}")
                stats['assigned'] += 1
            else:
                if update_recipe_book(recipe['id'], book_id):
                    print(f"  [ASSIGNED] {recipe['title']}")
                    stats['assigned'] += 1
                else:
                    print(f"  [FAILED] {recipe['title']}")

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Recipes assigned:       {stats['assigned']}")
    print(f"Already assigned:       {stats['already_assigned']}")
    print(f"No matching recipe:     {stats['no_match']}")
    print(f"Book not found:         {stats['book_not_found']}")

    if args.dry_run:
        print("\n*** This was a dry run. Run without --dry-run to make changes. ***")

if __name__ == '__main__':
    main()
