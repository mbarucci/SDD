# Taskify Constitution

# Taskify Constitution

## Core Principles

### I. Specification Before Implementation
Every feature MUST have an agreed specification that identifies its user problem, scope, and
observable acceptance criteria before implementation begins. Plans and tasks MUST derive from
that specification. This prevents implementation from silently replacing the intended outcome.

### II. Artifact Traceability
Plans and implementation tasks MUST map to specified requirements or identify themselves as
necessary enabling work. When scope or behavior changes, the affected specification, plan, and
tasks MUST be updated together. This keeps delivery auditable from intent through code.

### III. Verifiable Outcomes
Acceptance criteria MUST be objectively checkable. Behavior changes MUST include automated tests
at an appropriate level, and contributors MUST run focused checks for the changed behavior before
reporting completion. Verification claims MUST reflect observed results.

### IV. Small, Reversible Changes
Changes MUST be limited to the requirements being delivered and preserve unrelated user work.
Contributors MUST prefer the smallest implementation that satisfies the acceptance criteria and
avoid unrelated refactoring. This reduces review risk and makes changes easier to reverse.

### V. Security and Privacy by Default
Implementations MUST validate untrusted input, protect secrets, and limit collection and exposure
of sensitive data to what the specified behavior requires. Credentials and private data MUST NOT
be committed to source control. Security-sensitive choices MUST be documented in the plan.

## Additional Constraints
Technology and architecture choices MUST support the specified user workflows and be recorded in
the plan when they materially affect security, maintainability, or deployment. New dependencies
MUST have a clear need and an acceptable maintenance and security profile. Requirements in a
feature specification MUST NOT contradict these principles; conflicts MUST be resolved before
implementation.

## Development Workflow
Feature work MUST proceed from specification to plan and ordered tasks before implementation.
Each task MUST have a verifiable completion condition. Reviews MUST check requirement coverage,
test results, security implications, and adherence to this constitution. A task is complete only
when its checks pass or any blocked check is explicitly documented with its impact.

## Governance
This constitution governs project specifications, plans, implementation, and reviews. Amendments
MUST be proposed as explicit changes to this document and reviewed for impact on existing
requirements and work. The version MUST follow semantic versioning: MAJOR for incompatible
governance changes, MINOR for new principles or materially expanded requirements, and PATCH for
clarifications that do not change obligations. Every amendment MUST update the last-amended date
and include a concise impact report during review. The original ratification date is retained
across amendments. Reviews MUST identify non-compliance, and affected work MUST be corrected or
explicitly accepted as an exception before it is considered complete.

## constraints
All project documentation and Spec Kit artifacts, including specifications, plans, tasks, and
checklists, MUST use Brazilian Portuguese for explanatory prose. Fixed headings and labels
required by Spec Kit templates or command workflows MAY remain in English. Code identifiers, API
names, file paths, command names, and schema-required tokens MUST retain their canonical spelling.

**Version**: 1.1.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date unknown | **Last Amended**: 2026-10-05
