# Pre-Payroll 组件与 A1-A5 校验映射说明

> 最后更新：2026-04-03

## 背景

当前 pre-payroll 流程在 Butter 中进行，数据来源于 HRMS 接口。

当前边界如下：

1. 仅影响 Butter 的 Pre-payroll / Payroll 组件，不涉及 HRMS 系统本身改造。
2. AI 主要用于提醒、识别异常和辅助判断，不自动修改 HRMS 业务数据。
3. Butter 以从 HRMS 获取到的数据作为判断基础；如果现有数据无法支持业务校验，可向 HRMS 提出新增接口需求。

当前组件结构如下：

- SD 侧 `Get` 组件：
  - `GetAndConfirmPrePayrollEmpVerToHRMS`
  - `GetAndSubmitAttendanceFromHRMS`
  - `GetAndSubmitPayrollInterfaceFromHRMS`
- Client 侧 `Confirm` 组件：
  - `ConfirmPrePayrollEmpVerToHRMS`
  - `ConfirmAttendanceToHRMS`
  - `ConfirmPayrollinterfaceToHRMS`

当前流程需要遵循一个核心原则：

- 客户不应按数据域被反复要求确认。
- SD 应先一次性准备好主数据、Leave & Attendance、异动、Interface 及相关 payroll 输入。
- 客户应在一个统一页面中看到完整 pre-payroll 数据包，并完成一次确认。

## 校验设计原则

校验逻辑应以 `A1-A5` 业务规则为主体，而不是以通用技术检查作为 SD 侧主要视图。

这意味着：

- 在每个 `Get xxx` 组件中，SD 看到的是“当前数据支持哪些 A 类规则、规则结果是什么”。
- 接口失败、字段缺失、格式错误等技术检查可以保留，但应作为数据准备状态或系统异常提示，而不是业务校验的主体。

建议将校验分为三层：

1. `组件级校验`
   - 展示当前组件可承接的 `A1-A3` 业务规则。
   - 当需要其他数据域时，可显示 `Pending Dependency`。
2. `快照级校验`
   - 汇总所有组件的 `A1-A3` 结果。
   - 基于完整 pre-payroll package 运行 `A4`。
   - 决定是否允许进入客户确认。
3. `计算后校验`
   - `A5` 仅在 payroll calculation 完成后执行。

## 组件与 A1-A5 映射总表

| 组件 | 主要职责 | 对应 A 项 | 组件内应展示内容 | 全局汇总中展示内容 | 是否为客户确认前门槛 |
|---|---|---|---|---|---|
| `GetAndConfirmPrePayrollEmpVerToHRMS` | 获取并确认本次 pre-payroll 的员工范围和主数据上下文 | 不独立承接完整 A 项；支撑 `A1`、`A2`、`A4` | 员工范围、在职/入职/离职/异动状态、部门、成本中心、参与计算名单、影响后续规则判断的主数据缺口 | 为下游规则提供员工范围与组织维度上下文 | 是 |
| `GetAndSubmitAttendanceFromHRMS` | 获取 attendance、leave、OT 相关数据并形成计算输入 | `A1` 主承接，`A2` 部分承接 | `A1` 异常清单、`A2` 中直接依赖 leave/payroll period 的异常、待其他数据补齐的规则 | attendance/leave 风险、阻塞项、未解决项汇总 | 是 |
| `GetAndSubmitPayrollInterfaceFromHRMS` | 获取 interface、ad-hoc pay、deduction 相关数据并形成计算输入 | `A3` 主承接 | duplicates、历史异常值、policy cap 违规、审批缺失、variable pay 相关法定缴纳风险 | interface/ad-hoc 风险、阻塞项、未解决项汇总 | 是 |
| `Payroll Variance Predictor` | 在正式 payroll 前生成成本估算、variance 解释和阈值预警 | 消费 `A1-A3` 的输入上下文，独立承接 `A4` | 不适用 | variance dashboard、narrative summary、threshold breach alert、department / employee type drill-down | 是 |
| `ConfirmPrePayrollSnapshot` | 客户只读确认完整 pre-payroll package | 不产生新规则结果，只消费已完成校验结果 | 客户查看统一 package、全部风险异常、异常处理状态、排除项、影响说明 | 最终确认包 | 是 |
| `Post Payroll Review` | payroll calculation 完成后的异常复核 | `A5` | 不属于当前 pre-payroll get/confirm 流程 | `A5` 异常、审批门槛、override 留痕 | 否，属于后置阶段 |

## 各组件详细校验归属

## `GetAndConfirmPrePayrollEmpVerToHRMS`

该组件不是 `A1-A3` 的主规则承接页面。

它的核心作用是为下游业务校验提供员工范围和主数据上下文。

应展示：

- 本 payroll period 的员工范围
- joiner、leaver、transfer、promotion 等异动人员
- 部门、成本中心覆盖情况
- payroll eligibility 与参与计算范围
- 因主数据缺失而导致 `A1`、`A2`、`A4` 无法正常判断的员工

建议角色定位：

- 作为后续规则校验的前置条件层
- 不作为主要异常处理界面

建议状态：

- `Ready`
- `Incomplete`
- `Blocked`

## `GetAndSubmitAttendanceFromHRMS`

该组件主要承接 `A1`，并承接 `A2` 的一部分。

### 在该组件中展示的 `A1` 条目

- 漏打卡
- 超出周/月阈值的 OT
- 连续通宵班或异常排班模式
- 与待发薪相关但尚未审批的 OT
- 员工提报 OT 与系统记录 OT 不一致
- 打卡记录与请假记录重叠
- 法定节假日或休息日打卡

### 在该组件中展示的 `A2` 条目

- 影响当前 payroll period 的 pending leave
- 未配置自动扣减的负 leave balance
- leave encashment eligibility 异常
- joiner / leaver 的按比例 leave 异常
- 异常请假模式

### 页面建议展示区域

- `Attendance Exceptions`
- `Leave Impact Exceptions`
- `Rules Waiting for More Data`

该组件不一定能单独闭环所有规则。

如果 leave 数据、员工状态或 payroll period 上下文还不完整，应明确展示：

- `Pending Dependency`

建议状态：

- `Pass`
- `Warning`
- `Blocker`
- `Pending Dependency`
- `Not Applicable`

## `GetAndSubmitPayrollInterfaceFromHRMS`

该组件主要承接 `A3`。

### 在该组件中展示的 `A3` 条目

- 同一员工、同一金额、同一期间的 ad-hoc item 重复
- 相比历史均值显著偏高的异常金额
- 超出公司 policy cap 的项目
- 金额较大但缺少必要审批的项目
- variable pay 对法定缴纳项目适用性异常

### 页面建议展示区域

- `Duplicate Risks`
- `Historical Outliers`
- `Policy Violations`
- `Approval Risks`

如果缺少足够历史基线数据，应展示：

- `Pending Baseline`

建议状态：

- `Pass`
- `Warning`
- `Blocker`
- `Pending Baseline`
- `Not Applicable`

## `Payroll Variance Predictor`

这是正式 payroll 处理前的独立分析层。

它不承担 readiness gate 职责，而是基于当前 pre-payroll package 做成本估算、波动解释、阈值预警与 drill-down。

### 核心职责

- 基于当前 pre-payroll 输入生成 payroll cost estimate
- 展示部门级、成本中心级的 MoM variance
- 标记超出阈值的部门 / 成本中心
- 解释主要成本驱动因素
- 为 HR、SD、Manager 提供 payroll run 前的沟通与预警材料

### `A4` 的归属

`A4` 不应放在任何单个 `Get` 组件内，而应作为独立页面统一运行。

应展示：

- 部门级 payroll cost 与上月对比的 variance
- threshold breach
- 成本变化主要驱动因素，例如新入职、离职、奖金、调薪
- 按成本中心、部门、员工类型 drill-down
- 如条件允许，给出 narrative explanation

### 页面建议展示区域

- `Estimate Summary Header`
- `Threshold Breach Alert`
- `Variance Dashboard`
- `AI Narrative Summary`
- `Driver Breakdown`
- `Drill-down Explorer`

建议状态：

- `Estimate Generated`
- `Under Review`
- `Threshold Breach`
- `Reviewed`

## `ConfirmPrePayrollSnapshot`

客户确认层应统一为一个只读确认包，不应按模块拆成多次确认。

客户应看到：

- 最终员工范围
- 最终 attendance 与 leave 影响结果
- 最终 interface 与 ad-hoc payment 数据
- 全部风险异常
- 每条异常的风险等级、原因、影响对象、建议动作
- 异常处理状态，包括已处理、已接受风险、未解决项
- 被排除项及原因
- 高风险提醒和业务影响说明

客户只针对一个冻结版本的 snapshot 完成一次确认。

需要明确的边界是：

- 客户可以查看全部风险异常，但不能在确认页直接修改 HRMS 源数据。
- 如需处理异常，应由 SD 返回前置步骤处理后重新生成 snapshot，再重新进入客户确认。

## `Post Payroll Review`

`A5` 不属于当前 pre-payroll `Get/Confirm` 阶段。

它应放在 payroll calculation 之后、最终审批或发薪之前。

应包含：

- 净薪与历史均值波动检查
- 同岗同级同地 peer group 异常值检查
- 缺失或异常 deduction
- 无 entitlement 的 allowance
- floor / ceiling 越界
- tax variance 检查
- OT spike 检查
- 新 pay component 检查
- deduction change 超阈值检查

应提供：

- `Accept / Investigate / Override` 操作
- 强制填写 override reason
- 高风险审批门槛
- 不可变审计日志

## 推荐统一状态集

为避免不同组件口径不一致，建议统一使用以下状态：

- `Pass`
- `Warning`
- `Blocker`
- `Pending Dependency`
- `Pending Baseline`
- `Not Applicable`

## 最终设计建议

不要把模型强行设计成“一个组件 = 一个 A 项”。

更可落地的结构是：

- 主数据组件负责提供校验上下文
- Attendance 组件承接 `A1` 和部分 `A2`
- Interface 组件承接 `A3`
- Payroll Variance Predictor 承接 `A4`
- Post-calculation Review 承接 `A5`

这样既符合当前 Butter 组件结构，也能满足目标体验：

- SD 可以在组件维度完成分步准备和分步校验
- HR / SD / Manager 可以在 payroll run 前完成成本波动检查与解释
- 客户只需要面对一个完整 snapshot 做一次确认，并能看到全部风险异常及其处理状态
