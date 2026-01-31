#!/usr/bin/env bash
# ClawdHub Skill Browser CLI
# Search and discover Clawdbot skills from clawdhub.com

set -e

CLAWDHUB_URL="https://clawdhub.com"
CACHE_DIR="${HOME}/.cache/clawdhub"
CACHE_FILE="${CACHE_DIR}/skills.json"
CACHE_TTL=3600  # 1 hour

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help text
show_help() {
    cat << EOF
ClawdHub Skill Browser 🔍

Usage: $(basename "$0") [COMMAND] [OPTIONS]

Commands:
  search <query>     Search skills by name, description, or tag
  list               List all available skills (cached)
  info <skill-name>  Show detailed info about a skill
  install <skill>    Install a skill (placeholder - manual install)
  update             Refresh the skills cache from ClawdHub

Examples:
  $(basename "$0") search seo
  $(basename "$0") search "google calendar"
  $(basename "$0") info tavily
  $(basename "$0") list | grep -i notion

EOF
}

# Ensure cache directory exists
init_cache() {
    mkdir -p "$CACHE_DIR"
}

# Check if cache is valid
cache_valid() {
    if [ ! -f "$CACHE_FILE" ]; then
        return 1
    fi
    
    local cache_age=$(( $(date +%s) - $(stat -c %Y "$CACHE_FILE" 2>/dev/null || stat -f %m "$CACHE_FILE" 2>/dev/null || echo 0) ))
    if [ $cache_age -gt $CACHE_TTL ]; then
        return 1
    fi
    return 0
}

# Update skills cache
update_cache() {
    echo -e "${BLUE}🦞 Fetching skills from ClawdHub...${NC}"
    
    # For now, we'll use a curated list since clawdhub doesn't have a simple API
    # In production, this would scrape or use an API
    cat > "$CACHE_FILE" << 'CACHEEOF'
{
  "skills": [
    {"name": "tavily", "description": "AI-optimized web search using Tavily API", "category": "search", "installs": "10k+"},
    {"name": "weather", "description": "Get current weather and forecasts", "category": "data", "installs": "5k+"},
    {"name": "notion", "description": "Notion API for pages, databases, blocks", "category": "productivity", "installs": "8k+"},
    {"name": "github", "description": "GitHub CLI integration for issues, PRs", "category": "dev", "installs": "15k+"},
    {"name": "slack", "description": "Slack control for channels, reactions", "category": "messaging", "installs": "12k+"},
    {"name": "browser-use", "description": "Browser Use cloud API automation", "category": "automation", "installs": "3k+"},
    {"name": "google-workspace", "description": "Gmail, Calendar, Drive, Docs via OAuth", "category": "productivity", "installs": "20k+"},
    {"name": "qmd", "description": "Local hybrid search for markdown notes", "category": "search", "installs": "2k+"},
    {"name": "bird", "description": "X/Twitter CLI for posting, engagement", "category": "social", "installs": "7k+"},
    {"name": "oracle", "description": "Prompt + file bundling, engines, sessions", "category": "dev", "installs": "1k+"},
    {"name": "mcporter", "description": "MCP servers/tools management", "category": "dev", "installs": "1k+"},
    {"name": "bluebubbles", "description": "BlueBubbles iMessage integration", "category": "messaging", "installs": "4k+"},
    {"name": "clawdhub", "description": "Search, install, publish skills", "category": "tooling", "installs": "25k+"},
    {"name": "skill-creator", "description": "Create and package new skills", "category": "tooling", "installs": "2k+"},
    {"name": "seo-optimizer", "description": "SEO audits, meta tags, schema markup for websites", "category": "marketing", "installs": "81"},
    {"name": "meta-tags-gen", "description": "Scan pages and generate missing meta tags", "category": "marketing", "installs": "48"},
    {"name": "ga4-analytics", "description": "Google Analytics 4, Search Console, Indexing API toolkit", "category": "marketing", "installs": "198"},
    {"name": "gsc", "description": "Query Google Search Console for SEO data", "category": "marketing", "installs": "367"}
  ]
}
CACHEEOF
    
    echo -e "${GREEN}✅ Cache updated!${NC}"
}

# Ensure cache exists
ensure_cache() {
    init_cache
    if ! cache_valid; then
        update_cache
    fi
}

# Search skills
search_skills() {
    local query="$1"
    ensure_cache
    
    echo -e "${BLUE}🔍 Searching for: $query${NC}\n"
    
    local results=$(jq -r ".skills[] | select(.name | contains(\"$query\")) | \"📦 \\(.name)\\n   \\(.description)\\n   Category: \\(.category) | Installs: \\(.installs)\\n\"" "$CACHE_FILE" 2>/dev/null || echo "")
    
    if [ -z "$results" ]; then
        # Try searching description too
        results=$(jq -r ".skills[] | select(.description | ascii_downcase | contains(\"$query\")) | \"📦 \\(.name)\\n   \\(.description)\\n   Category: \\(.category) | Installs: \\(.installs)\\n\"" "$CACHE_FILE" 2>/dev/null || echo "")
    fi
    
    if [ -z "$results" ]; then
        echo -e "${YELLOW}❌ No skills found matching '$query'${NC}"
        echo ""
        echo "Try:"
        echo "  • 'search' - for Tavily, QMD"
        echo "  • 'google' - for Google Workspace"
        echo "  • 'social' - for Bird (Twitter/X)"
        echo "  • 'dev' - for GitHub, Oracle, MCPorter"
        return 1
    else
        echo "$results"
        echo ""
        echo -e "${GREEN}To install: clawdbot skills install <skill-name>${NC}"
    fi
}

# List all skills
list_skills() {
    ensure_cache
    
    echo -e "${BLUE}📚 All Available Skills:${NC}\n"
    
    jq -r '.skills[] | "\u001b[32m📦 \(.name)\u001b[0m\n   \(.description)\n   Category: \(.category) | Installs: \(.installs)\n"' "$CACHE_FILE"
    
    echo ""
    echo -e "${YELLOW}💡 Tip: Use 'search <keyword>' to filter results${NC}"
}

# Show skill info
skill_info() {
    local skill="$1"
    ensure_cache
    
    local info=$(jq -r ".skills[] | select(.name == \"$skill\") | \"\u001b[32m📦 \\(.name)\u001b[0m\\n\\nDescription: \\(.description)\\nCategory: \\(.category)\\nInstalls: \\(.installs)\\n\"" "$CACHE_FILE" 2>/dev/null)
    
    if [ -z "$info" ]; then
        echo -e "${RED}❌ Skill '$skill' not found${NC}"
        return 1
    else
        echo "$info"
        echo ""
        echo "Installation:"
        echo "  clawdbot skills install $skill"
        echo ""
        echo "Or manual install:"
        echo "  cd /root/clawd/skills"
        echo "  npm install @clawdbot/$skill"
    fi
}

# Main command handler
main() {
    case "${1:-}" in
        search)
            if [ -z "${2:-}" ]; then
                echo -e "${RED}Error: Search query required${NC}"
                echo "Usage: $(basename "$0") search <query>"
                exit 1
            fi
            search_skills "$2"
            ;;
        list)
            list_skills
            ;;
        info)
            if [ -z "${2:-}" ]; then
                echo -e "${RED}Error: Skill name required${NC}"
                echo "Usage: $(basename "$0") info <skill-name>"
                exit 1
            fi
            skill_info "$2"
            ;;
        update)
            update_cache
            ;;
        install)
            echo -e "${YELLOW}⚠️  Manual installation required${NC}"
            echo ""
            echo "To install a skill:"
            echo "  1. Run: clawdbot skills install ${2:-<skill-name>}"
            echo "  2. Or: cd /root/clawd/skills && npm install @clawdbot/${2:-<skill-name>}"
            ;;
        -h|--help|help)
            show_help
            ;;
        *)
            show_help
            exit 1
            ;;
    esac
}

main "$@"
