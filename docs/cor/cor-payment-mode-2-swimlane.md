# COR Payment Mode 2 Flow

> 最后更新：2026-04-13

## 文档目的

本文档用于描述 COR 业务模式二的付款流程：

- 客户直接与 contractor 签约
- BIPO 不承担 `new contractor onboarding`
- BIPO 仅负责 `payment` 相关的资料校验、收款和代付执行

## 流程定义

模式二的核心原则是：

1. 客户确认本期 `payable`
2. contractor 提交付款所需资料
3. BIPO 校验付款资料并向客户发起 `funding notice`
4. 客户付款给 BIPO
5. BIPO 向 contractor 打款并完成对账

## 流程图

```mermaid
flowchart TB
  S([Start]) --> A21["2.1 Client<br/>Create payment request / confirm payable"]
  A21 --> A22["2.2 Contractor<br/>Submit payment profile and optional invoice"]
  A22 --> A23["2.3 SD / BIPO Ops<br/>Collect and validate payment information"]
  A23 --> D1{"Information complete<br/>and amount aligned?"}
  D1 -- No --> R1["Return to Client / Contractor<br/>for clarification or resubmission"]
  R1 --> R2["Client reconfirms payable<br/>or Contractor resubmits payment profile"]
  R2 --> A23
  D1 -- Yes --> A24["2.4 SD / BIPO Ops<br/>Confirm payable ready"]
  A24 --> A25["2.5 BIPO Finance / ERP<br/>Generate funding notice or payment notice"]
  A25 --> A26["2.6 Client<br/>Review notice and pay to BIPO"]
  A26 --> D2{"Funds received?"}
  D2 -- No --> R3["Finance follows up payment<br/>or resends notice"]
  R3 --> A26
  D2 -- Yes --> A27["2.7 BIPO Finance / ERP<br/>Confirm funds received"]
  A27 --> A28["2.8 BIPO Finance / ERP<br/>Create payout batch"]
  A28 --> A29["2.9 BIPO Finance / ERP<br/>Pay contractor"]
  A29 --> A210["2.10 Contractor<br/>Confirm receipt"]
  A210 --> A211["2.11 SD / BIPO Ops<br/>Close payment case and reconcile"]
  A211 --> E([End])
```

## 与模式一的关键差异

- 模式一中，BIPO 与 contractor 直接签约，因此通常需要先完成 `new contractor onboarding`
- 模式二中，客户与 contractor 直接签约，因此不应强制走 `onboarding`
- 模式一里，BIPO 往往同时承担 `contractor payable confirmation` 和 `client billing`
- 模式二里，客户才是 `payable owner`，BIPO 更偏向 `payment executor`
- 模式二下，contractor 提交的资料重点是 `payment readiness`，而不是完整入职资料

## 建模建议

- 将该流程建模为独立的 `PaymentCase`
- 在 `Engagement` 或 `Assignment` 上明确标记 `engagementMode = CLIENT_DIRECT`
- 对 `OnboardingCase` 支持 `NOT_APPLICABLE`
- 将 `payable confirmation`、`client funding`、`contractor payout` 视为三个独立阶段，而不是一个大一统状态流
