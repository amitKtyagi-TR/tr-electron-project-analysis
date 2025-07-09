# tr-electron-project-analysis


## Usage Examples:

Now you can analyze any git repository with these commands:

```bash
# Enhanced analysis (default) - shows comprehensive output + saves JSON
npm run analyze /path/to/your/repo

# Quick analysis with formatted text output
npm run analyze:quick /path/to/your/repo

# Quick analysis with file limit
npm run analyze:quick /path/to/your/repo 100

# Full analysis with detailed JSON output
npm run analyze:full /path/to/your/repo

# Save analysis to specific file
npm run analyze:save "/Users/amitk/Development/GitHub/SOLARIUM-BCKND" my_analysis.json

# Analyze current directory
npm run analyze

# Or use tsx directly for more control
tsx examples/complete-analysis.ts enhanced /path/to/repo
tsx examples/complete-analysis.ts quick /path/to/repo 50
tsx examples/complete-analysis.ts save /path/to/repo output.json
```



## Clean File
npm run clean-json  project_analysis.txt my_analysis.json
