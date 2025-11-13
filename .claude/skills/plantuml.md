# plantuml

Generate ASCII art sequence diagrams using PlantUML for CRC modeling and documentation.

## What this skill does

This skill provides commands to:
1. Generate ASCII sequence diagrams with proper lifelines
2. Support PlantUML sequence diagram syntax
3. Output clean ASCII suitable for pasting into markdown documents

## Commands

### sequence

Generate ASCII sequence diagram from PlantUML syntax.

**Usage:**
```bash
./.claude/skills/plantuml.sh sequence << 'EOF'
User -> View: click "Save"
View -> Model: save()
Model -> Storage: persist()
Storage -> Model: success
Model -> View: saved
View -> User: confirm
EOF
```

**PlantUML Syntax:**
- `->` : Synchronous message
- `-->` : Return message (dashed)
- `note left of`, `note right of` : Add notes
- `alt/else/end` : Conditional logic
- `loop/end` : Loops

## Examples

### Simple Sequence
```bash
./.claude/skills/plantuml.sh sequence << 'EOF'
User -> SplashScreen: click "New Character"
SplashScreen -> CharacterEditor: navigate()
CharacterEditor -> Character: new()
Character --> CharacterEditor: character instance
CharacterEditor --> User: display form
EOF
```

### With Notes
```bash
./.claude/skills/plantuml.sh sequence << 'EOF'
User -> View: submit
note right of View: Validate first
View -> Model: save()
Model --> View: success
EOF
```

### With Conditions
```bash
./.claude/skills/plantuml.sh sequence << 'EOF'
User -> Editor: save
Editor -> Validator: validate()
alt valid
  Validator --> Editor: ok
  Editor -> Storage: save()
else invalid
  Validator --> Editor: errors
  Editor --> User: show errors
end
EOF
```

## Implementation

See `.claude/skills/plantuml.sh` for the implementation script.

## Notes

- Uses PlantUML for proper UML sequence diagrams
- Output includes participant boxes, lifelines, and arrows
- PlantUML jar is downloaded to `.claude/bin/plantuml.jar`
- Requires Java runtime
