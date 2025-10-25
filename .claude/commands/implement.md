---
description: Implement features from spec files using the spec-implementer agent
---

Use the spec-implementer agent to implement code from spec files.

The spec-implementer agent will:
1. Read and analyze the specified spec file
2. Check for ambiguities, contradictions, or overly verbose sections
3. Ask clarifying questions if anything is unclear
4. Implement the code according to the spec
5. Document any feedback in `specs/feedback/SPEC-feedback.md`

**Usage:**
- `/implement specs/SPEC.md` - Implement features from the specified spec file
- `/implement` - Ask which spec file to implement

The agent will stop and ask for clarification if the spec is:
- Ambiguous or contradictory
- Ill-defined or overly verbose
- Missing critical implementation details
