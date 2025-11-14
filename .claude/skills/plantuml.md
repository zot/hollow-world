# plantuml

Generate ASCII art sequence diagrams using PlantUML for CRC modeling and documentation.

## What this skill does

This skill provides commands to:
1. Generate ASCII sequence diagrams with proper lifelines
2. Support PlantUML sequence diagram syntax
3. Output clean ASCII suitable for pasting into markdown documents

## Pre-approved commands

This skill pre-approves the following commands (no user confirmation needed):

```bash
./.claude/scripts/plantuml.sh sequence
```

## Commands

### sequence

Generate ASCII sequence diagram from PlantUML syntax.

**Usage (via command-line argument - recommended):**
```bash
./.claude/scripts/plantuml.sh sequence "User -> View: click \"Save\"
View -> Model: save()
Model -> Storage: persist()
Storage -> Model: success
Model -> View: saved
View -> User: confirm"
```

**Alternative usage (via stdin/heredoc):**
```bash
./.claude/scripts/plantuml.sh sequence << 'EOF'
User -> View: click "Save"
View -> Model: save()
Model -> Storage: persist()
EOF
```

**Why use argument form?** The command-line argument form is pre-approved and requires no user confirmation, while heredoc may trigger approval requests.

**PlantUML Syntax:**
- `->` : Synchronous message
- `-->` : Return message (dashed)
- `note left of`, `note right of` : Add notes
- `alt/else/end` : Conditional logic
- `loop/end` : Loops

## Examples

### Simple Sequence
```bash
./.claude/scripts/plantuml.sh sequence "User -> SplashScreen: click \"New Character\"
SplashScreen -> CharacterEditor: navigate()
CharacterEditor -> Character: new()
Character --> CharacterEditor: character instance
CharacterEditor --> User: display form"
```

### With Notes
```bash
./.claude/scripts/plantuml.sh sequence "User -> View: submit
note right of View: Validate first
View -> Model: save()
Model --> View: success"
```

### With Conditions
```bash
./.claude/scripts/plantuml.sh sequence "User -> Editor: save
Editor -> Validator: validate()
alt valid
  Validator --> Editor: ok
  Editor -> Storage: save()
else invalid
  Validator --> Editor: errors
  Editor --> User: show errors
end"
```

## Implementation

See `.claude/scripts/plantuml.sh` for the implementation script.

## Notes

- Uses PlantUML for proper UML sequence diagrams
- Output includes participant boxes, lifelines, and arrows
- PlantUML jar is downloaded to `.claude/bin/plantuml.jar`
- Requires Java runtime
