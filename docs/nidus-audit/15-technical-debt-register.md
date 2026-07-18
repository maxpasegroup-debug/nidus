# 15 - Technical Debt Register

| ID | Debt | Evidence | Severity | Notes |
|---|---|---|---|---|
| TD-001 | Route surface is very large | 238 frontend pages | High | Needs workspace consolidation, not route deletion. |
| TD-002 | RBAC is mixed | roles, metadata templates, admin permissions | High | Create one policy library over existing checks. |
| TD-003 | Multi-branch isolation not enforced globally | `requireInstituteScope` no-op comment | High | Must solve before real multi-branch. |
| TD-004 | Workflow logic embedded in services/pages | academy/crm/payments/dashboard flows | High | Add event/workflow orchestration. |
| TD-005 | Academic engine has multiple entry points | academy, ERP timetable, dashboard pages | High | Consolidate around planner without duplicating. |
| TD-006 | Exams are spread across modules | tests, examination, assessment arena, psychometric, AI exam | Medium | Build visible Examination Engine over existing modules. |
| TD-007 | Communication lacks central policy | communication + sales booster WhatsApp | Medium | Add opt-in, throttling, summaries, templates. |
| TD-008 | AI is fragmented | ai-engine, ai-exam, ai-planner, ai-workflow | Medium | Keep services, unify UX and governance. |
| TD-009 | Some statuses are strings | schema uses many string status fields | Medium | Normalize when safe. |
| TD-010 | Generated Prisma files in source | `backend/src/generated/prisma` | Medium | Increases search/audit noise. |
| TD-011 | Large frontend components | teacher dashboard path evidence | Medium | Extract only cohesive private modules. |
| TD-012 | Docs drift | README mentions Brevo while code uses Resend | Low | Align ops docs. |
| TD-013 | Upload scanning not confirmed | media middleware only checks mime/size | Medium | Needed for documents. |
| TD-014 | Queue criticality not classified | queues can skip when Redis unavailable | Medium | Separate critical and best-effort jobs. |
| TD-015 | Object-level authorization incomplete from static inspection | many role route checks | High | Needs endpoint tests. |

## Debt Strategy

Address debt through product-engine phases, not broad refactors. Each debt item should be linked to an acceptance test and a business workflow.

