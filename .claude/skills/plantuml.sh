#!/bin/bash
# plantuml.sh - Generate ASCII sequence diagrams using PlantUML
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PLANTUML_JAR="$PROJECT_ROOT/.claude/bin/plantuml.jar"
TEMP_DIR="${TEMP_DIR:-/tmp}"

usage() {
    cat << EOF
Usage: $0 sequence [OPTIONS]

Generate ASCII sequence diagram from PlantUML syntax (via stdin)

Options:
  --help            Show this help message

Examples:
  # Simple sequence
  $0 sequence << 'EOF'
  User -> View: click save
  View -> Model: save()
  Model --> View: success
  EOF

  # With conditions
  $0 sequence << 'EOF'
  User -> Editor: save
  alt valid
    Editor -> Storage: save()
  else invalid
    Editor -> User: show errors
  end
  EOF

PlantUML Syntax:
  ->      Synchronous message
  -->     Return message (dashed)
  note left of / note right of
  alt/else/end    Conditional
  loop/end        Loop

EOF
    exit 1
}

generate_sequence() {
    # Check if PlantUML jar exists
    if [ ! -f "$PLANTUML_JAR" ]; then
        echo "Error: PlantUML jar not found at $PLANTUML_JAR" >&2
        echo "Download from: https://plantuml.com/download" >&2
        exit 1
    fi

    # Find Java executable
    local java_cmd=""
    if [ -x "/home/deck/bin/java" ]; then
        java_cmd="/home/deck/bin/java"
    elif command -v java &> /dev/null && java -version 2>&1 | grep -q "version"; then
        java_cmd="java"
    else
        echo "Error: Java is not installed or not in PATH" >&2
        echo "PlantUML requires Java runtime" >&2
        exit 1
    fi

    # Create temporary files
    local temp_input="${TEMP_DIR}/plantuml-input-$$.puml"
    local temp_output="${TEMP_DIR}/plantuml-output-$$.txt"

    # Cleanup on exit
    trap "rm -f '$temp_input' '$temp_output'" EXIT

    # Wrap input in PlantUML sequence diagram syntax
    {
        echo "@startuml"
        cat  # Read from stdin
        echo "@enduml"
    } > "$temp_input"

    # Generate ASCII diagram using PlantUML
    "$java_cmd" -jar "$PLANTUML_JAR" -tutxt "$temp_input" > /dev/null 2>&1

    # PlantUML outputs to .utxt file with same base name
    local output_file="${temp_input%.puml}.utxt"
    if [ -f "$output_file" ]; then
        cat "$output_file"
        rm -f "$output_file"
    else
        echo "Error: PlantUML did not generate output file" >&2
        echo "Expected: $output_file" >&2
        echo "Input was:" >&2
        cat "$temp_input" >&2
        exit 1
    fi
}

# Main command dispatcher
case "${1:-}" in
    sequence)
        shift
        if [ "$#" -gt 0 ] && [ "$1" = "--help" ]; then
            usage
        fi
        generate_sequence "$@"
        ;;
    generate-ascii)
        # Legacy compatibility
        echo "Warning: 'generate-ascii' is deprecated, use 'sequence' instead" >&2
        shift
        generate_sequence "$@"
        ;;
    --help|help|"")
        usage
        ;;
    *)
        echo "Unknown command: $1" >&2
        usage
        ;;
esac
