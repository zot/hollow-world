# Update Process Plan: HollowWorld ← claude-crc

**Source**: `~/work/claude-crc/.claude/*`
**Target**: `~/work/HollowStuff/HollowWorld/.claude/*`
**Date**: 2025-11-16

---

## Overview

Update HollowWorld's CRC process infrastructure based on improvements made in the claude-crc reference project. The claude-crc project has refined agents, documentation, scripts, and skills based on real-world usage.

---

## 1. Agent Updates

### 1.1 New Agent: documenter.md
- **Status**: ✅ NEW - Not in HollowWorld
- **Purpose**: Generate comprehensive documentation (requirements, design, developer guide, user manual)
- **Action**: Copy `~/work/claude-crc/.claude/agents/documenter.md` → `.claude/agents/`
- **Impact**: Enables automated generation of project documentation from specs and designs
- **Integration**: References CRC cards, sequences, UI specs, test designs
- **Dependencies**: None - standalone agent

### 1.2 Updated Agent: designer.md
- **Status**: 🔄 UPDATE - Significant improvements
- **Changes**:
  - Integrates test-designer agent workflow (automatic invocation)
  - Updated PlantUML workflow (Python script with argument-based input, not heredoc)
  - Better manifest-ui.md documentation process
  - Clearer quality checklist
  - Better traceability instructions
- **Action**: Replace `.claude/agents/designer.md` with version from claude-crc
- **Review Required**: YES - Check HollowWorld-specific customizations first
- **Backup**: Keep current version as `.claude/agents/designer.md.backup`

### 1.3 Renamed Agent: test-designer.md (was test-writer.md)
- **Status**: 🔄 RENAME + UPDATE
- **Changes**:
  - Renamed from `test-writer.md` to `test-designer.md` (consistency with Level 2 focus)
  - More comprehensive test case format (Purpose, Motivation, Input, Expected Results)
  - Better traceability structure
  - Creates test traceability map (`design/traceability-tests.md`)
  - Clearer coverage analysis
- **Action**:
  1. Copy `~/work/claude-crc/.claude/agents/test-designer.md` → `.claude/agents/`
  2. Remove or archive `.claude/agents/test-writer.md`
  3. Update references in other files
- **Review Required**: YES - Check HollowWorld-specific test patterns

### 1.4 Updated Agent: gap-analyzer.md
- **Status**: 🔄 UPDATE - Check for improvements
- **Action**: Compare with claude-crc version and merge improvements
- **Review Required**: YES

### 1.5 Updated Agent: sequence-diagrammer.md
- **Status**: 🔄 UPDATE - Check for improvements
- **Action**: Compare with claude-crc version and merge improvements
- **Review Required**: YES

### 1.6 Other Agents: No changes expected
- `commit.md` - Symlink in claude-crc (points to `~/.claude/agents/commit.md`)
- `artist.md`, `tester.md`, `spec-implementer.md`, `spec-updater.md` - HollowWorld-specific

---

## 2. Documentation Updates

### 2.1 New Doc: crc-summary.md
- **Status**: ✅ NEW
- **Purpose**: Executive summary of CRC methodology (elevator pitch)
- **Action**: Copy `~/work/claude-crc/.claude/doc/crc-summary.md` → `.claude/doc/`
- **Integration**: Reference from CLAUDE.md and other docs

### 2.2 Updated Doc: crc.md
- **Status**: 🔄 UPDATE - Significant improvements
- **Changes**:
  - Better "Why CRC?" section (communication gap, design discovery, traceability)
  - Quick start with `/init-crc-project` command
  - More comprehensive workflow
  - Better reverse engineering section
  - Clearer benefits documentation
- **Action**:
  1. Review current `.claude/doc/crc.md` for HollowWorld-specific content
  2. Merge claude-crc improvements
  3. Keep HollowWorld-specific examples
- **Review Required**: YES - Manual merge recommended

### 2.3 New Doc: crc-traceability-guide.md (replaces traceability-guide.md)
- **Status**: 🔄 RENAME + UPDATE
- **Changes**:
  - Renamed for consistency (crc-* prefix)
  - More comprehensive traceability examples
  - Better comment format standards
  - Formal traceability map structure documentation
  - Checkbox format explanation
- **Action**:
  1. Copy `~/work/claude-crc/.claude/doc/crc-traceability-guide.md` → `.claude/doc/`
  2. Archive current `.claude/doc/traceability-guide.md`
  3. Update references in other files
- **Review Required**: YES

### 2.4 New Doc: crc-post.md / crc-post.html
- **Status**: ✅ NEW - Blog post about methodology
- **Purpose**: External-facing documentation/blog post about CRC methodology
- **Action**: OPTIONAL - Copy if we want external documentation
- **Decision Required**: Do we want this for HollowWorld?

---

## 3. Scripts Updates

### 3.1 New Script: init-crc-project.py
- **Status**: ✅ NEW - Python version
- **Current**: We have `init-crc-project.sh` (shell script)
- **Changes**: Python version is more portable, feature-rich
- **Action**:
  - OPTION A: Keep both (shell + Python)
  - OPTION B: Replace shell with Python
  - OPTION C: Keep shell, reference Python as alternative
- **Decision Required**: Which approach?
- **Benefits of Python version**:
  - Cross-platform (Windows support)
  - Better error handling
  - Can integrate with other Python tools

### 3.2 New Script: plantuml.py
- **Status**: ✅ NEW
- **Purpose**: Python wrapper for PlantUML conversion (argument-based, not heredoc)
- **Integration**: Used by designer agent and sequence-diagrammer agent
- **Action**: Copy `~/work/claude-crc/.claude/scripts/plantuml.py` → `.claude/scripts/`
- **Dependencies**: Java, PlantUML jar (already have)
- **Note**: Updated designer.md references this approach

### 3.3 New Script: trace-verify.py
- **Status**: ✅ NEW
- **Purpose**: Verify traceability comments exist in code
- **Action**: Copy `~/work/claude-crc/.claude/scripts/trace-verify.py` → `.claude/scripts/`
- **Integration**: Could integrate with trace skill

### 3.4 New Script: bundle.py
- **Status**: ✅ NEW - Distribution tool
- **Purpose**: Bundle CRC infrastructure for distribution to other projects
- **Action**: Copy `~/work/claude-crc/.claude/scripts/bundle.py` → `.claude/scripts/`
- **Use Case**: Package HollowWorld's CRC setup for reuse

### 3.5 New Script: claude-crc-dist.py
- **Status**: ✅ NEW - Distribution package
- **Purpose**: Self-contained distribution of CRC infrastructure
- **Action**: Copy `~/work/claude-crc/.claude/scripts/claude-crc-dist.py` → `.claude/scripts/`
- **Use Case**: Install CRC in new projects

### 3.6 New Doc: README-CRC.md
- **Status**: ✅ NEW
- **Purpose**: README for scripts directory
- **Action**: Copy `~/work/claude-crc/.claude/scripts/README-CRC.md` → `.claude/scripts/`

### 3.7 Updated Scripts: trace-*.py
- **Status**: 🔄 UPDATE - Check versions
- **Files**: `trace-add-comments.py`, `trace-gap-analysis.py`
- **Action**: Compare with claude-crc versions and update if improved
- **Review Required**: YES

---

## 4. Skills Updates

### 4.1 Updated Skill: init-crc-project.md
- **Status**: 🔄 UPDATE
- **Action**: Replace `.claude/skills/init-crc-project.md` with claude-crc version
- **Review Required**: YES - Check for HollowWorld-specific content

### 4.2 Updated Skill: plantuml.md
- **Status**: 🔄 UPDATE
- **Changes**: References new plantuml.py script
- **Action**: Replace `.claude/skills/plantuml.md` with claude-crc version
- **Review Required**: YES

### 4.3 Updated Skill: trace.md
- **Status**: 🔄 UPDATE
- **Action**: Compare and merge improvements
- **Review Required**: YES

---

## 5. Shared Files Updates

### 5.1 crc-install.md
- **Status**: 🔄 UPDATE - Check for improvements
- **Action**: Compare `.claude/shared/crc-install.md` with claude-crc version
- **Review Required**: YES

---

## 6. CLAUDE.md Updates

### 6.1 Update CRC References
- **Changes needed**:
  - Update agent names (test-designer vs test-writer)
  - Reference new documentation (crc-summary.md)
  - Update workflow to include documenter agent
  - Update script references (plantuml.py)
- **Action**: Edit CLAUDE.md to reflect new infrastructure

---

## 7. Implementation Plan

### Phase 1: Documentation Review (Day 1)
1. ✅ Read all claude-crc documentation
2. ✅ Create this update plan
3. 🔲 Review HollowWorld's current CRC implementation
4. 🔲 Identify HollowWorld-specific customizations to preserve
5. 🔲 Make key decisions (Python vs shell, etc.)

### Phase 2: Backup & Preparation (Day 1)
1. 🔲 Create backup branch: `git checkout -b backup-pre-crc-update`
2. 🔲 Commit current state
3. 🔲 Create `.claude/backup/` directory for archived files
4. 🔲 Document HollowWorld-specific patterns to preserve

### Phase 3: Core Updates (Day 2)
1. 🔲 Update `.claude/doc/` (crc.md, crc-summary.md, crc-traceability-guide.md)
2. 🔲 Update `.claude/agents/designer.md`
3. 🔲 Add `.claude/agents/documenter.md`
4. 🔲 Rename/update test-writer.md → test-designer.md
5. 🔲 Update other agents (gap-analyzer, sequence-diagrammer)

### Phase 4: Scripts & Skills (Day 2-3)
1. 🔲 Add Python scripts (plantuml.py, trace-verify.py, etc.)
2. 🔲 Update or keep init-crc-project.sh (decision needed)
3. 🔲 Update skills (init-crc-project.md, plantuml.md, trace.md)
4. 🔲 Add README-CRC.md to scripts/

### Phase 5: Integration & Testing (Day 3)
1. 🔲 Update CLAUDE.md with new references
2. 🔲 Update design/traceability.md format (if needed)
3. 🔲 Test `/init-crc-project` command
4. 🔲 Test plantuml skill with new Python script
5. 🔲 Test designer agent with updated workflow
6. 🔲 Test documenter agent

### Phase 6: Documentation & Cleanup (Day 4)
1. 🔲 Update all references from old to new files
2. 🔲 Archive old files (test-writer.md, traceability-guide.md, etc.)
3. 🔲 Update design/traceability.md with new format examples
4. 🔲 Document changes in this file
5. 🔲 Commit changes with descriptive message

---

## 8. Key Decisions Needed

### Decision 1: Python vs Shell Scripts
- **Question**: Replace init-crc-project.sh with init-crc-project.py, or keep both?
- **Options**:
  - A) Keep shell, add Python as alternative (most flexible)
  - B) Replace shell with Python (better cross-platform)
  - C) Keep both with skill/command routing
- **Recommendation**: OPTION A - Keep both, shell for Linux/Mac users, Python for cross-platform
- **Decision**: [ ] Pending user approval

### Decision 2: Blog Post Documentation
- **Question**: Include crc-post.md/crc-post.html in HollowWorld?
- **Options**:
  - A) Include for reference (may help onboarding)
  - B) Skip (HollowWorld-specific, not needed)
- **Recommendation**: OPTION B - Skip for now, can add later if needed
- **Decision**: [ ] Pending user approval

### Decision 3: Distribution Scripts
- **Question**: Include bundle.py and claude-crc-dist.py?
- **Options**:
  - A) Include (enables packaging HollowWorld's CRC for other projects)
  - B) Skip (not currently needed)
- **Recommendation**: OPTION A - Include for future reuse
- **Decision**: [ ] Pending user approval

### Decision 4: Update Approach
- **Question**: Big bang update or incremental?
- **Options**:
  - A) Update everything at once (cleaner but riskier)
  - B) Update in stages (safer but more complex)
- **Recommendation**: OPTION B - Phase-based approach (see Phase 3-6 above)
- **Decision**: [ ] Pending user approval

---

## 9. Risk Assessment

### Low Risk
- ✅ Adding new documentation (crc-summary.md)
- ✅ Adding new agent (documenter.md)
- ✅ Adding new scripts (plantuml.py, trace-verify.py)

### Medium Risk
- ⚠️ Updating designer.md (check for HollowWorld customizations)
- ⚠️ Renaming test-writer → test-designer (update references)
- ⚠️ Updating crc.md (preserve HollowWorld examples)

### High Risk
- 🚨 Replacing init-crc-project.sh (many dependencies)
- 🚨 Updating CLAUDE.md (central reference doc)

### Mitigation Strategies
1. **Backup branch** before any changes
2. **Incremental commits** for each phase
3. **Test after each phase** before proceeding
4. **Preserve HollowWorld-specific content** in separate files if needed
5. **Git tags** at each phase completion for easy rollback

---

## 10. Success Criteria

- [ ] All new agents working (documenter, updated designer, test-designer)
- [ ] All new scripts working (plantuml.py, trace-verify.py)
- [ ] Documentation updated and consistent
- [ ] All existing functionality preserved
- [ ] HollowWorld-specific customizations intact
- [ ] No broken references or links
- [ ] Skills and slash commands working
- [ ] Git history clean with descriptive commits

---

## 11. Rollback Plan

If issues arise:

1. **Immediate rollback**: `git checkout backup-pre-crc-update`
2. **Partial rollback**: Revert specific commits by phase
3. **File-level rollback**: Restore from `.claude/backup/` directory
4. **Git reflog**: Last resort recovery

---

## 12. Post-Update Tasks

After successful update:

1. [ ] Update design/traceability.md with examples of new format
2. [ ] Test complete workflow: spec → design → code
3. [ ] Update any project-specific documentation
4. [ ] Consider writing HollowWorld-specific additions to crc.md
5. [ ] Test all agents with real HollowWorld features
6. [ ] Document lessons learned
7. [ ] Consider contributing improvements back to claude-crc

---

## 13. Notes

- claude-crc is a reference implementation - it's the "clean room" version
- HollowWorld may have evolved independently with project-specific needs
- Preserve HollowWorld-specific patterns while adopting general improvements
- Some files (commit.md in claude-crc) are symlinks to ~/.claude/ - handle carefully

---

**Next Steps**: Review this plan with user, get decisions on key questions, then proceed with Phase 2 (Backup & Preparation).
