# 17 - Reuse Map

## Reuse Strongly

| Asset | Reuse reason |
|---|---|
| Prisma schema | Broad domain investment and relationships exist |
| Auth V2 | Session-cookie auth, lockout, parent linking |
| Admin center | Permission matrix, audit logs, settings |
| Academy module | Core academic workflows and planner primitives |
| CRM module | Lead, counselling, admissions, approvals |
| Payments module | Razorpay, manual payments, invoices, fee plans |
| Assessment arena | Rich psychometric/readiness infrastructure |
| Tests module | CBT attempt and question workflows |
| Media module | Cloudinary upload and signed URLs |
| Communication module | Notifications/messages/email/push primitives |
| Queues | BullMQ foundation |
| AI cache/log services | AI reliability/cost primitives |
| Frontend services/hooks | Existing API integration layer |

## Reuse With Refactoring

| Asset | Refactor direction |
|---|---|
| Role dashboards | Simplify into today's focus and task queues |
| Navigation | Keep role menu intent, reduce duplication |
| Academic planner UI | Keep logic, simplify input/review/publish |
| Teacher dashboard | Extract cohesive private modules |
| Director reports | Move toward executive intelligence |
| Communication UI | Add policy/preferences over existing messages |

## Replace or Rework Carefully

| Area | Reason |
|---|---|
| Duplicate public landing experiments | Marketing surface should be isolated from Academy OS |
| String-only workflow statuses | Long-term consistency risk |
| No-op tenant middleware | Must become real before branch scale |
| Any code-generated mock/demo flows in production paths | Must be gated |

## Reuse Verdict

Estimated overall reusable product/technical value: **70-80%**. The value is in domain models and workflows, not necessarily every page layout.

