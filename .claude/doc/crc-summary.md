# CRC Modeling - Executive Summary

## The Core Problem

CRC modeling solves the fundamental communication gap between developers and AI assistants. It forces the AI to document its interpretation of your requirements in human-readable design artifacts before writing any code.

**What you get:** The power to catch misunderstandings, architectural flaws, and missing edge cases when they're trivial to fix rather than expensive to refactor.

## The Solution

The three-tier system (specs → design → code) with bidirectional traceability transforms your codebase from a black box into a navigable, maintainable asset.

**Design artifacts produced:**
- CRC cards (classes, responsibilities, collaborations)
- Sequence diagrams (object interactions over time)
- UI specifications (layout structure, data bindings, event handlers)
- Test designs (test specifications with input/output, optional)

## Key Benefits

**Architectural clarity:**
- Review and validate design before committing to code
- Maintain coherence across coding sessions
- Document design decisions automatically as you work

**Knowledge retention:**
- Comprehensive documentation survives staff transitions
- Design artifacts capture architectural intent permanently
- Navigate complex systems through explicit design maps

**Compliance and governance:**
- Create audit trails linking requirements to implementation
- Document business logic and design decisions formally
- Maintain verifiable records of system architecture

**Quality and confidence:**
- Catch misunderstandings before they become code
- Ship with confidence in your architecture
- Trace bugs cleanly from symptom → requirement

## Key Capabilities

**Impact analysis:**
- Find all code implementing a requirement in seconds
- Trace bug reports from symptom → test → code → design → spec
- Identify what needs updating when requirements evolve

**Safe refactoring:**
- Sequences document all expected interactions (test scenarios)
- CRC cards define clear responsibilities (refactoring boundaries)
- Impact analysis prevents breaking changes

**Legacy system support:**
- Apply CRC to existing code through reverse engineering
- Extract designs from inherited codebases
- Finally document that monolith you've been avoiding

**AI assistant stability:**
- Explicit design layer provides consistency across sessions
- Design patterns guide future decisions
- Maintains architectural coherence as projects evolve

## Automation

The designer agent automates the tedious parts, making thorough architecture practical rather than aspirational. You focus on intent and validation while the AI generates comprehensive design documentation.

## Bottom Line

Deliver better software faster with less risk, whether you're building your first MVP or maintaining a million-line enterprise system.

---

**Learn more:** See `.claude/doc/crc.md` for complete documentation.

**Get started:** Run `/init-crc-project` to set up CRC modeling in your project.
