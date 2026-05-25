import duckdb
import json
import uuid
from datetime import datetime

print("Extracting top contracts from philgeps.parquet...")

con = duckdb.connect()

# Query the top 3000 rows to ensure we get 2500 high-quality unique records after filtering
query = """
SELECT 
    id,
    COALESCE(award_title, notice_title, 'Unnamed Contract') as title,
    COALESCE(organization_name, 'Unknown Agency') as agency,
    contract_amount,
    award_date,
    awardee_name,
    reference_id,
    COALESCE(award_status, 'Awarded') as status
FROM "philgeps.parquet"
WHERE contract_amount IS NOT NULL AND contract_amount > 0
ORDER BY contract_amount DESC
LIMIT 3000
"""

rows = con.execute(query).fetchall()

# Deduplicate reference_id and prepare anomalies list
anomalies = []
seen_references = set()

for row in rows:
    raw_id, title, agency, amount, award_date, contractor, ref_id, status = row
    
    # If title is empty or just whitespace, skip it
    if not title or not title.strip():
        continue
        
    # Generate unique ID
    anomaly_id = str(raw_id) if raw_id else str(uuid.uuid4())
    
    # Clean up and ensure unique reference number if provided
    philgeps_ref = None
    if ref_id:
        ref_id_str = str(ref_id).strip()
        if ref_id_str:
            if ref_id_str in seen_references:
                # Add suffix to make it unique
                philgeps_ref = f"{ref_id_str}-{anomaly_id[:8]}"
            else:
                philgeps_ref = ref_id_str
                seen_references.add(ref_id_str)
                
    # Format date
    date_str = None
    if award_date:
        if isinstance(award_date, datetime):
            date_str = award_date.isoformat()
        else:
            date_str = str(award_date)

    # Standard PhilGEPS detail URL or fallback
    source_url = "https://philgeps.gov.ph"
    if ref_id:
        # standard notice abstract URL format for PhilGEPS
        source_url = f"https://notices.philgeps.gov.ph/GEPSNONPILOT/Tender/SplashBidNoticeAbstractUI.aspx?menuIndex=3&refID={ref_id}"

    anomalies.append({
        "id": anomaly_id,
        "title": title.strip()[:255] if len(title) > 255 else title.strip(),
        "agency": agency.strip(),
        "contract_amount_php": float(amount),
        "date_awarded": date_str,
        "contractor_name": contractor.strip() if contractor else "Unknown Contractor",
        "philgeps_reference_no": philgeps_ref,
        "source_url": source_url,
        "status": status.strip() if status else "Awarded"
    })
    
    if len(anomalies) >= 2500:
        break

# Save to json file
with open("philgeps_top_contracts.json", "w") as f:
    json.dump(anomalies, f, indent=2)

print(f"Extraction complete. Saved {len(anomalies)} records to philgeps_top_contracts.json.")
