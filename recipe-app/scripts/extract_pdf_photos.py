#!/usr/bin/env python3
"""
PDF Photo Extraction Script for Recipe App

This script:
1. Scans PDF files from the Umami Export folder
2. Extracts the first image from each PDF (if present)
3. Uploads images to Supabase storage
4. Updates recipe records with the photo URLs

Prerequisites:
    pip install PyMuPDF requests

Usage:
    1. Set your Supabase credentials below
    2. Run: python extract_pdf_photos.py
    3. Use --dry-run to preview without making changes
"""

import os
import sys
import argparse
import requests
import fitz  # PyMuPDF
from pathlib import Path
from difflib import SequenceMatcher
import json

# =============================================================================
# CONFIGURATION - Update these values!
# =============================================================================

# Your Supabase credentials (find these in your Supabase dashboard > Settings > API)
SUPABASE_URL = "https://rifdotvjfzhqcjvidifx.supabase.co"  # e.g., "https://xxxxx.supabase.co"
SUPABASE_KEY = "sb_publishable_mrSMoDLlN74gyp0QtfsL0w_SmTeVTVK"  # The anon/public key

# Path to your PDF files
PDF_ROOT = r"G:\My Drive\KV HV\Hobbies\Cooking\Umami Export"

# Supabase storage bucket name
STORAGE_BUCKET = "recipe-photos"

# Minimum image size to consider (in pixels) - filters out tiny icons
MIN_IMAGE_WIDTH = 100
MIN_IMAGE_HEIGHT = 100

# =============================================================================
# END CONFIGURATION
# =============================================================================

def find_all_pdfs(root_path: str) -> list[Path]:
    """Recursively find all PDF files."""
    pdfs = []
    for root, dirs, files in os.walk(root_path):
        # Skip desktop.ini and other system files
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for file in files:
            if file.lower().endswith('.pdf') and not file.startswith('.'):
                pdfs.append(Path(root) / file)
    return pdfs

def extract_first_image(pdf_path: Path) -> tuple[bytes, str] | None:
    """
    Extract the first suitable image from the first page of a PDF.
    Returns (image_bytes, extension) or None if no suitable image found.
    """
    try:
        doc = fitz.open(pdf_path)
        if len(doc) == 0:
            return None

        # Only look at the first page
        page = doc[0]
        images = page.get_images(full=True)

        for img_index, img in enumerate(images):
            xref = img[0]

            try:
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                width = base_image["width"]
                height = base_image["height"]

                # Skip tiny images (likely icons or decorations)
                if width >= MIN_IMAGE_WIDTH and height >= MIN_IMAGE_HEIGHT:
                    doc.close()
                    return (image_bytes, image_ext)
            except Exception as e:
                # Some images can't be extracted, skip them
                continue

        doc.close()
        return None

    except Exception as e:
        print(f"  Error reading PDF {pdf_path.name}: {e}")
        return None

def get_recipe_title_from_filename(pdf_path: Path) -> str:
    """Extract recipe title from PDF filename."""
    # Remove .pdf extension and clean up
    title = pdf_path.stem
    return title

def similarity_score(a: str, b: str) -> float:
    """Calculate similarity between two strings."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def find_matching_recipe(title: str, recipes: list[dict]) -> dict | None:
    """Find the best matching recipe by title."""
    best_match = None
    best_score = 0

    for recipe in recipes:
        score = similarity_score(title, recipe['title'])
        if score > best_score:
            best_score = score
            best_match = recipe

    # Require at least 80% similarity
    if best_score >= 0.8:
        return best_match
    return None

def fetch_recipes() -> list[dict]:
    """Fetch all recipes from Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/recipes?select=id,title,photo_urls"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }

    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def upload_to_supabase(image_bytes: bytes, filename: str, content_type: str) -> str | None:
    """Upload image to Supabase storage and return public URL."""
    url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{filename}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true",  # Overwrite if exists
    }

    try:
        response = requests.post(url, headers=headers, data=image_bytes)

        if response.status_code in [200, 201]:
            # Return public URL
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{filename}"
            return public_url
        else:
            print(f"  Upload error: {response.status_code} - {response.text}")
            return None

    except Exception as e:
        print(f"  Upload exception: {e}")
        return None

def update_recipe_photo(recipe_id: str, photo_url: str) -> bool:
    """Update recipe record with photo URL."""
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
            json={"photo_urls": [photo_url]}
        )
        return response.status_code in [200, 204]
    except Exception as e:
        print(f"  Database update error: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Extract photos from PDFs and upload to Supabase')
    parser.add_argument('--dry-run', action='store_true', help='Preview without making changes')
    parser.add_argument('--limit', type=int, help='Process only first N PDFs')
    parser.add_argument('--skip-existing', action='store_true', default=True, help='Skip recipes that already have photos (default: True)')
    args = parser.parse_args()

    # Validate configuration
    if SUPABASE_URL == "YOUR_SUPABASE_URL_HERE" or SUPABASE_KEY == "YOUR_SUPABASE_ANON_KEY_HERE":
        print("ERROR: Please update SUPABASE_URL and SUPABASE_KEY in this script!")
        print("Find these values in your Supabase dashboard > Settings > API")
        sys.exit(1)

    print("=" * 60)
    print("PDF Photo Extraction for Recipe App")
    print("=" * 60)

    if args.dry_run:
        print("\n*** DRY RUN MODE - No changes will be made ***\n")

    # Fetch all recipes
    print("Fetching recipes from database...")
    try:
        recipes = fetch_recipes()
        print(f"Found {len(recipes)} recipes in database")
    except Exception as e:
        print(f"ERROR: Failed to fetch recipes: {e}")
        sys.exit(1)

    # Find recipes without photos
    recipes_without_photos = [r for r in recipes if not r.get('photo_urls') or len(r.get('photo_urls', [])) == 0]
    print(f"Recipes without photos: {len(recipes_without_photos)}")

    # Find all PDFs
    print(f"\nScanning PDFs in: {PDF_ROOT}")
    pdfs = find_all_pdfs(PDF_ROOT)
    print(f"Found {len(pdfs)} PDF files")

    if args.limit:
        pdfs = pdfs[:args.limit]
        print(f"Processing first {args.limit} PDFs only")

    # Process each PDF
    print("\n" + "-" * 60)
    stats = {
        'processed': 0,
        'images_found': 0,
        'matched': 0,
        'uploaded': 0,
        'skipped_has_photo': 0,
        'no_match': 0,
        'no_image': 0,
    }

    for pdf_path in pdfs:
        stats['processed'] += 1
        title = get_recipe_title_from_filename(pdf_path)
        print(f"\n[{stats['processed']}/{len(pdfs)}] {title}")

        # Find matching recipe
        matching_recipe = find_matching_recipe(title, recipes)

        if not matching_recipe:
            print(f"  -> No matching recipe found")
            stats['no_match'] += 1
            continue

        # Check if recipe already has a photo
        if args.skip_existing and matching_recipe.get('photo_urls') and len(matching_recipe.get('photo_urls', [])) > 0:
            print(f"  -> Already has photo, skipping")
            stats['skipped_has_photo'] += 1
            continue

        # Extract image from PDF
        image_result = extract_first_image(pdf_path)

        if not image_result:
            print(f"  -> No suitable image found in PDF")
            stats['no_image'] += 1
            continue

        image_bytes, image_ext = image_result
        stats['images_found'] += 1
        print(f"  -> Found image ({len(image_bytes):,} bytes, .{image_ext})")
        print(f"  -> Matched to: {matching_recipe['title']}")

        if args.dry_run:
            print(f"  -> [DRY RUN] Would upload and update recipe")
            stats['uploaded'] += 1
            stats['matched'] += 1
            continue

        # Upload to Supabase storage
        safe_filename = f"{matching_recipe['id']}.{image_ext}"
        content_type = f"image/{image_ext}" if image_ext != 'jpg' else 'image/jpeg'
        photo_url = upload_to_supabase(image_bytes, safe_filename, content_type)

        if not photo_url:
            print(f"  -> Upload failed")
            continue

        print(f"  -> Uploaded: {safe_filename}")

        # Update recipe record
        if update_recipe_photo(matching_recipe['id'], photo_url):
            print(f"  -> Updated recipe record")
            stats['uploaded'] += 1
            stats['matched'] += 1
        else:
            print(f"  -> Failed to update recipe")

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"PDFs processed:        {stats['processed']}")
    print(f"Images found:          {stats['images_found']}")
    print(f"Recipes matched:       {stats['matched']}")
    print(f"Photos uploaded:       {stats['uploaded']}")
    print(f"Skipped (has photo):   {stats['skipped_has_photo']}")
    print(f"No matching recipe:    {stats['no_match']}")
    print(f"No image in PDF:       {stats['no_image']}")

    if args.dry_run:
        print("\n*** This was a dry run. Run without --dry-run to make changes. ***")

if __name__ == '__main__':
    main()
