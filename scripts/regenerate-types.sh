#!/bin/bash

# Script to regenerate Supabase TypeScript types
# Usage: ./scripts/regenerate-types.sh

PROJECT_ID="zrnklcpgumwcswyxnumk"
OUTPUT_FILE="src/integrations/supabase/types.ts"

echo "Regenerating Supabase TypeScript types..."
echo "Project ID: $PROJECT_ID"
echo "Output: $OUTPUT_FILE"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Generate types
supabase gen types typescript --project-id "$PROJECT_ID" --schema public > "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Types regenerated successfully!"
    echo "📝 File updated: $OUTPUT_FILE"
    echo ""
    echo "Next steps:"
    echo "1. Review the generated types"
    echo "2. Commit the updated types.ts file"
else
    echo "❌ Error regenerating types"
    exit 1
fi

