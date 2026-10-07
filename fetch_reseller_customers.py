#!/usr/bin/env python3
"""
Reseller Customer Lookup & Excel Report Generator

Fetches customer accounts for specified Adobe Partner Reseller IDs with pagination,
and generates formatted Excel (.xlsx) and CSV reports.

Usage:
  python3 fetch_reseller_customers.py [RESELLER_ID_1] [RESELLER_ID_2] ...
  python3 fetch_reseller_customers.py --all --separate
  
Example:
  python3 fetch_reseller_customers.py 1000071176
"""

import os
import sys
import re
import math
import time
import json
import argparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from concurrent.futures import ThreadPoolExecutor, as_completed

# Try importing openpyxl for styled Excel export, fallback to CSV if missing
try:
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter
    OPENPYXL_AVAILABLE = True
except ImportError:
    OPENPYXL_AVAILABLE = False

# Default Configuration
DEFAULT_TOKEN = "eyJhbGciOiJSUzI1NiIsIng1dSI6Imltc19uYTEta2V5LWF0LTEuY2VyIiwia2lkIjoiaW1zX25hMS1rZXktYXQtMSIsIml0dCI6ImF0In0.eyJpZCI6IjE3ODc4MTY1Njc2NzhfNjIwNzQwOTgtMTlmMC00Zjk5LWFkNGUtNmI3ZjBkZDdmOGU0X3V3MiIsInR5cGUiOiJhY2Nlc3NfdG9rZW4iLCJjbGllbnRfaWQiOiJwYy1wcm9kLXBhcnRuZXJzZXJ2aWNlIiwidXNlcl9pZCI6InBjLXByb2QtcGFydG5lcnNlcnZpY2VAQWRvYmVJRCIsImFzIjoiaW1zLW5hMSIsImFhX2lkIjoicGMtcHJvZC1wYXJ0bmVyc2VydmljZUBBZG9iZUlEIiwiY3RwIjowLCJwYWMiOiJwYy1wcm9kLXBhcnRuZXJzZXJ2aWNlIiwicnRpZCI6IjE3ODc4MTY1Njc2NzhfOWI2YTk2MmUtMzE3Yy00MDA4LTg0ODMtMTAxMTMyMTlmZjk3X3V3MiIsIm1vaSI6ImMwNzViZGExIiwicnRlYSI6IjE3ODkwMjYxNjc2NzgiLCJleHBpcmVzX2luIjoiODY0MDAwMDAiLCJjcmVhdGVkX2F0IjoiMTc4NzgxNjU2NzY3OCIsInNjb3BlIjoic3lzdGVtLENMQU1fV1JJVEUsQ0xBTV9SRUFELHBhcnRuZXJfc2VydmljZS5hZG1pbi51cGRhdGUifQ.IcAV8E2S_6bu98LQP890aPAcH2xXZl6sT91jKJ7Z5VYDePE7YY6TidQ9yY56zIvPvVYjdy40cnLUOodAtq2ORvA1FoVzUdazdK68UAXLALfuMdzFeIEId2Lg2e5o6mV6AvNXC8PtieFmKD3_X4sQR_rh7WCV9vauo3gzf8gPPEyNzj5c-q_wU7LuS9zY0iI-G_qPoCkap6T104RCT3UWSVWE6SxcvK-XNxOD5b6_8_uI19PhxJidLbkfGrnaM0rFVe0V7zme8r_3pnz1C2xOHbjOjkL99niVcuqJn9aTv6sUqq_AyXvyQQXUyhFmMnEUS5NxLKCFzXO3NTHaq_b5fQ"

# Standard Reseller Mappings
RESELLER_MAP = {
    "1000073214": "VIP Direct Japan - ENT & CORP",
    "1000072850": "VIP Direct Japan",
    "1000072419": "VIP Direct CORP",
    "1000071610": "VIP DIRECT ANZ",
    "1000070984": "VIP Direct ICX-R",
    "1000071176": "VIP DIRECT EMEA",
    "1000070523": "VIP Direct - NA"
}

PAGE_LIMIT = 50  # Endpoint maximum limit is 50
MAX_WORKERS = 16  # Parallel requests per reseller for fast fetching

HEADERS = {
    "x-api-key": "pc-prod-partnerservice",
    "X-Correlation-Id": "261172d5-1af3-4f55-9ad5-a19b63ad3705",
    "Content-Type": "application/json",
    "Accept": "application/json",
    "external-client-id": "AE6A21D86936A04F0A495E67@AdobeOrg",
    "sales-channel": "DIRECT"
}

def sanitize_filename(name):
    """Sanitize string for safe filenames."""
    return re.sub(r'[^a-zA-Z0-9_\-]', '_', name).strip('_')

def fetch_page(reseller_id, offset, limit, auth_token, retries=3):
    """Fetch a single page of customers for a given reseller."""
    url = f"https://partners.adobe.io/v3/internal/resellers/{reseller_id}/customers?offset={offset}&limit={limit}"
    req_headers = dict(HEADERS)
    req_headers["Authorization"] = auth_token

    for attempt in range(retries):
        try:
            req = Request(url, headers=req_headers, method="GET")
            with urlopen(req, timeout=30) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    return data
        except HTTPError as e:
            if attempt == retries - 1:
                print(f"\n  [ERROR] HTTP {e.code} for reseller {reseller_id} at offset {offset}: {e.reason}")
                return None
            time.sleep(1 * (attempt + 1))
        except Exception as e:
            if attempt == retries - 1:
                print(f"\n  [ERROR] Exception for reseller {reseller_id} at offset {offset}: {e}")
                return None
            time.sleep(1 * (attempt + 1))
    return None

def fetch_all_customers(reseller_id, auth_token, limit=PAGE_LIMIT, max_workers=MAX_WORKERS):
    """Fetch all customer records for a reseller handling pagination concurrently."""
    label = RESELLER_MAP.get(reseller_id, "")
    label_str = f" ({label})" if label else ""
    print(f"\n=== Processing Reseller ID: {reseller_id}{label_str} ===")
    
    # Initial request to get total count
    first_page = fetch_page(reseller_id, offset=0, limit=limit, auth_token=auth_token)
    if not first_page:
        print(f"Failed to fetch initial data for reseller {reseller_id}")
        return []

    total_count = first_page.get("totalCount", 0)
    first_accounts = first_page.get("accounts", [])
    print(f"Total customers reported: {total_count}")

    if total_count == 0 or not first_accounts:
        return first_accounts

    all_accounts = [None] * math.ceil(total_count / limit)
    all_accounts[0] = first_accounts

    offsets = [off for off in range(limit, total_count, limit)]
    total_pages = len(offsets) + 1

    if not offsets:
        return first_accounts

    print(f"Fetching remaining {len(offsets)} pages ({total_pages} pages total, limit={limit}) concurrently...")

    completed_pages = 1
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_offset = {
            executor.submit(fetch_page, reseller_id, off, limit, auth_token): off
            for off in offsets
        }
        for future in as_completed(future_to_offset):
            off = future_to_offset[future]
            idx = off // limit
            res = future.result()
            if res and "accounts" in res:
                all_accounts[idx] = res["accounts"]
            else:
                all_accounts[idx] = []
            
            completed_pages += 1
            fetched_count = sum(len(page) for page in all_accounts if page is not None)
            pct = (completed_pages / total_pages) * 100
            print(f"\rProgress: {completed_pages}/{total_pages} pages ({fetched_count}/{total_count} records - {pct:.1f}%)", end="", flush=True)

    print("\nFetch completed successfully!")
    
    # Flatten list of lists preserving page order
    flat_list = []
    for page in all_accounts:
        if page:
            flat_list.extend(page)
    
    return flat_list

def export_to_excel(all_data, output_file, title="Customer Accounts"):
    """Export customer records to a styled Excel (.xlsx) workbook using openpyxl."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = title[:30]  # Excel max sheet title is 31 chars

    # Define Headers
    headers = [
        "Reseller ID",
        "Customer ID",
        "Company Name",
        "Market Segment",
        "Status",
        "Total Licenses",
        "Used Licenses",
        "Creation Date",
        "Anniversary Date",
        "Preferred Language",
        "Managed By",
        "Distributor ID",
        "Licenses Pending Order",
        "Days Until PA Expiry",
        "Global Sales Enabled",
        "External Reference ID"
    ]

    ws.append(headers)

    # Style Header Row
    header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = header_alignment

    # Data Rows
    row_alt_fill = PatternFill(start_color="F2F5F9", end_color="F2F5F9", fill_type="solid")
    border_thin = Side(style='thin', color='D9D9D9')
    cell_border = Border(left=border_thin, right=border_thin, top=border_thin, bottom=border_thin)

    for row_idx, acc in enumerate(all_data, start=2):
        company_profile = acc.get("companyProfile", {})
        has_pa_pending = acc.get("hasLicensesPendingPartnerOrder", False)
        days_pa_exp = acc.get("daysUntilPaExpiry")
        if not has_pa_pending or days_pa_exp is None or days_pa_exp == "":
            days_pa_exp = ""

        row = [
            acc.get("resellerId", ""),
            acc.get("customerId", ""),
            company_profile.get("companyName", ""),
            company_profile.get("marketSegment", ""),
            acc.get("status", ""),
            acc.get("totalLicenses", 0),
            acc.get("usedLicenses", 0),
            acc.get("creationDate", ""),
            acc.get("anniversaryDate") or "",
            company_profile.get("preferredLanguage", ""),
            acc.get("managedBy", ""),
            acc.get("distributorId", ""),
            "Yes" if has_pa_pending else "No",
            days_pa_exp,
            "Yes" if acc.get("globalSalesEnabled") else "No",
            acc.get("externalReferenceId", "")
        ]
        ws.append(row)

        # Style data row
        is_alt = (row_idx % 2 == 0)
        for col_idx in range(1, len(headers) + 1):
            c = ws.cell(row=row_idx, column=col_idx)
            c.border = cell_border
            if is_alt:
                c.fill = row_alt_fill
            # Alignments
            if col_idx in [6, 7]:  # Licenses
                c.alignment = Alignment(horizontal="right", vertical="center")
            elif col_idx in [1, 2, 4, 5, 10, 12, 13, 14, 15]:
                c.alignment = Alignment(horizontal="center", vertical="center")
            else:
                c.alignment = Alignment(horizontal="left", vertical="center")

    # Auto-adjust column widths
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val_str = str(cell.value or '')
            if cell.row == 1:
                max_len = max(max_len, len(val_str))
            else:
                max_len = max(max_len, min(len(val_str), 50))
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    # Freeze top row and enable filter
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions

    wb.save(output_file)
    print(f"Excel report saved to: {output_file}")

def export_to_csv(all_data, output_file):
    """Export customer records to a CSV file."""
    import csv
    headers = [
        "Reseller ID", "Customer ID", "Company Name", "Market Segment", "Status",
        "Total Licenses", "Used Licenses", "Creation Date", "Anniversary Date",
        "Preferred Language", "Managed By", "Distributor ID",
        "Licenses Pending Order", "Days Until PA Expiry", "Global Sales Enabled", "External Reference ID"
    ]
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for acc in all_data:
            cp = acc.get("companyProfile", {})
            has_pa_pending = acc.get("hasLicensesPendingPartnerOrder", False)
            days_pa_exp = acc.get("daysUntilPaExpiry")
            if not has_pa_pending or days_pa_exp is None or days_pa_exp == "":
                days_pa_exp = ""

            writer.writerow([
                acc.get("resellerId", ""),
                acc.get("customerId", ""),
                cp.get("companyName", ""),
                cp.get("marketSegment", ""),
                acc.get("status", ""),
                acc.get("totalLicenses", 0),
                acc.get("usedLicenses", 0),
                acc.get("creationDate", ""),
                acc.get("anniversaryDate") or "",
                cp.get("preferredLanguage", ""),
                acc.get("managedBy", ""),
                acc.get("distributorId", ""),
                "Yes" if has_pa_pending else "No",
                days_pa_exp,
                "Yes" if acc.get("globalSalesEnabled") else "No",
                acc.get("externalReferenceId", "")
            ])
    print(f"CSV report saved to: {output_file}")

def main():
    parser = argparse.ArgumentParser(description="Fetch Reseller Customers & Generate Excel Report")
    parser.add_argument("reseller_ids", nargs="*", help="One or more reseller IDs")
    parser.add_argument("--all", action="store_true", help="Process all predefined reseller IDs")
    parser.add_argument("--separate", action="store_true", default=True, help="Generate separate individual Excel file per reseller")
    parser.add_argument("--token", default=os.getenv("AUTH_TOKEN", DEFAULT_TOKEN), help="Authorization Bearer Token")
    parser.add_argument("--out", help="Custom output filename prefix or path")
    parser.add_argument("--limit", type=int, default=PAGE_LIMIT, help="Page limit (max 50)")
    parser.add_argument("--workers", type=int, default=MAX_WORKERS, help="Parallel worker threads")
    
    args = parser.parse_args()

    auth_token = args.token if args.token.startswith("Bearer ") else f"Bearer {args.token}"
    
    if args.all or not args.reseller_ids:
        reseller_ids = list(RESELLER_MAP.keys())
    else:
        reseller_ids = args.reseller_ids

    print(f"Starting Customer Lookup for {len(reseller_ids)} Reseller ID(s)...")

    summary_results = {}
    
    for r_id in reseller_ids:
        customers = fetch_all_customers(r_id, auth_token=auth_token, limit=args.limit, max_workers=args.workers)
        summary_results[r_id] = len(customers)

        label = RESELLER_MAP.get(r_id, "")
        safe_label = sanitize_filename(label) if label else r_id
        
        # Individual output filename
        if args.out and len(reseller_ids) == 1:
            excel_filename = args.out if args.out.endswith(".xlsx") else f"{args.out}.xlsx"
        else:
            excel_filename = f"reseller_{r_id}_{safe_label}.xlsx"

        csv_filename = excel_filename.replace(".xlsx", ".csv")

        if customers:
            if OPENPYXL_AVAILABLE:
                export_to_excel(customers, excel_filename, title=label or r_id)
            else:
                print("\nWarning: openpyxl library not available.")
                export_to_csv(customers, excel_filename.replace(".xlsx", ".csv"))
        else:
            print(f"No records found for Reseller {r_id}")

    print(f"\n==========================================")
    print(f"  SUMMARY OF GENERATED REPORTS")
    print(f"==========================================")
    for r_id, count in summary_results.items():
        label = RESELLER_MAP.get(r_id, "Reseller")
        safe_label = sanitize_filename(label)
        fname = f"reseller_{r_id}_{safe_label}.xlsx"
        print(f"  - [{r_id}] {label}: {count} customers -> {fname}")
    print(f"==========================================")

if __name__ == "__main__":
    main()
