# Export Functionality - Testing Guide

## Overview
The export functionality for compliance reports has been implemented and is ready for testing. Reports can now be exported in three formats: **PDF**, **CSV**, and **JSON**.

## What Was Fixed

### Backend Changes (`backend/main.py`)
- ✅ Added new endpoint: `GET /export-report?report_id={id}&format={format}`
- ✅ Supports three export formats:
  - **PDF**: Formatted compliance report with tables and styling (using reportlab)
  - **CSV**: Structured data export with headers
  - **JSON**: Raw data export for programmatic access
- ✅ Fetches data from SQLite database
- ✅ Generates reports with:
  - KPI Summary (Total Transactions, Fraud Detected, Fraud Rate, Model Accuracy, System Uptime)
  - Fraud Breakdown by Type (Fraud Rings, Mule Accounts, Fast Cash-out, Loan Fraud, Business Scams)
  - Compliance Status (Audit Ready, Records Preserved, Immutable Ledger)
  - Transaction Details (up to 50 records)

### Frontend Changes (`frontend/src/pages/Reports.jsx`)
- ✅ Replaced mock `handleDownload` function with real implementation
- ✅ Added state management for export status and error handling
- ✅ Updated "Export Report" buttons to support three formats (PDF, CSV, JSON)
- ✅ Updated table action buttons to offer format choices
- ✅ Added loading indicators during export
- ✅ Added error alert display if export fails

### Dependencies Added
- ✅ `reportlab==4.0.9` - For PDF generation with tables and styling
- ✅ `python-docx==0.8.11` - For future Word document support

## Testing Steps

### 1. Install Dependencies
```bash
cd c:\Users\ninos\hybrid-gnn-fraud-intel
pip install -r requirements.txt
pip install reportlab==4.0.9 python-docx==0.8.11
```

### 2. Start the Backend
```bash
python backend/main.py
```
Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 3. Start the Frontend (in new terminal)
```bash
cd frontend
npm run dev
```
Expected output:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

### 4. Test Export Functionality

#### Test 4a: Export from Top Button (PDF)
1. Navigate to Reports page (http://localhost:5173/)
2. Click "Export PDF" button in the top right
3. A file should download: `compliance_report_CURRENT_MONTH_YYYYMMDD.pdf`
4. Verify PDF opens and contains:
   - Report title and metadata
   - KPI Summary table
   - Fraud Breakdown table
   - Compliance Status section

#### Test 4b: Export from Top Button (CSV)
1. Click "Export CSV" button
2. A file should download: `compliance_report_CURRENT_MONTH_YYYYMMDD.csv`
3. Verify CSV opens in spreadsheet app with:
   - Header row with "Metric" and "Value"
   - KPI data rows
   - Fraud breakdown section
   - Transaction details

#### Test 4c: Export from Top Button (JSON)
1. Click "Export JSON" button
2. Check browser console (F12 → Console)
3. Should see message: "Report exported successfully as JSON"
4. Console should show the full report data structure

#### Test 4d: Export from Table (Multiple Formats)
1. Scroll to "CBK Regulatory Report Archives" table
2. In the Action column, click "PDF" to export that report as PDF
3. Verify file downloads correctly
4. Repeat with "CSV" and "JSON" buttons for the same report

### 5. Verify Error Handling

#### Test 5a: Backend Not Running
1. Stop the backend
2. Try to export a report
3. Should see error alert: "Failed to export report: [error message]"

#### Test 5b: Invalid Format
1. Open browser console and run:
   ```javascript
   fetch('http://127.0.0.1:8000/export-report?report_id=REP-2026-03&format=xlsx')
     .then(r => r.json())
     .then(d => console.log(d))
   ```
2. Should see error response about unsupported format

### 6. Test Loading States
1. Click export button and immediately check:
   - Button should show "Exporting..." text
   - Button should be disabled (grayed out)
   - Multiple clicks should not queue multiple exports

### 7. Verify Data Integrity
1. Export the same report in all three formats
2. Verify the data is consistent across formats:
   - KPI numbers match
   - Fraud counts are identical
   - Report ID and dates are the same

## Expected Behavior

### Success Flow
```
User clicks Export → Button shows "Exporting..." (disabled)
                  → API request sent to backend
                  → Backend generates report
                  → File downloads automatically
                  → Button returns to normal state
```

### Error Flow
```
User clicks Export → Button shows "Exporting..." (disabled)
                  → API request fails
                  → Error alert displays
                  → Button returns to normal state
```

## Files Modified

1. **requirements.txt** - Added reportlab and python-docx
2. **backend/main.py** - Added `/export-report` endpoint (~200 lines)
3. **frontend/src/pages/Reports.jsx** - Updated handleDownload function and UI

## API Endpoint Documentation

### Endpoint: GET /export-report

**Parameters:**
- `report_id` (string, required): Report identifier (e.g., 'REP-2026-03', 'CURRENT_MONTH')
- `format` (string, optional): Export format - 'pdf' (default), 'csv', or 'json'

**Response:**
- **PDF/CSV**: Binary file with appropriate Content-Disposition header
- **JSON**: JSON object containing report data structure

**Example Requests:**
```bash
# Export as PDF
curl http://127.0.0.1:8000/export-report?report_id=REP-2026-03&format=pdf > report.pdf

# Export as CSV
curl http://127.0.0.1:8000/export-report?report_id=REP-2026-03&format=csv > report.csv

# Export as JSON
curl http://127.0.0.1:8000/export-report?report_id=REP-2026-03&format=json
```

## Troubleshooting

### Issue: "PDF export requires reportlab library"
**Solution:** Install reportlab with `pip install reportlab==4.0.9`

### Issue: PDF download doesn't trigger
**Solution:** 
1. Check browser console for JavaScript errors
2. Verify backend is running on http://127.0.0.1:8000
3. Check CORS is enabled (it is in main.py)

### Issue: CSV file is empty
**Solution:**
1. Verify SQLite database (fraud_intel.db) exists
2. Check if transactions table has data
3. Run tests to populate database

### Issue: File download has wrong filename
**Solution:** This is browser-dependent; filename is set via Content-Disposition header

## Next Steps

After testing:
1. Commit the changes to git
2. Create a PR with description of export functionality
3. Include testing results
4. Link to this GitHub issue

## Notes

- Reports use mock fraud data if no real transactions in database
- PDF formatting uses reportlab with professional styling
- All exports include timestamp in filename for easy organization
- Error messages are user-friendly and displayed in UI alerts
