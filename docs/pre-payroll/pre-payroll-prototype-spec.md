# Pre-Payroll 目标态原型说明文档

> 最后更新：2026-04-07

## 文档目的

本文档用于基于当前 Butter 组件现状与前期分析结果，定义 Pre-Payroll 目标态原型方案。

本文档聚焦以下目标：

- 将当前 6 个分散的 `Get / Confirm` 页面重组为更符合业务流程的目标态页面结构
- 保留 Butter 现有的页面骨架和视觉风格
- 让 SD 能按步骤准备数据、处理风险并完成准入判断
- 让 Client 在一个统一页面中一次性查看完整数据与全部风险异常并完成确认
- 为 `A5` 单独保留 Payroll Calculation 后复核页面，形成完整闭环

## 设计原则

1. 保留 Butter 现有视觉语言和整体框架，不做脱离现有系统的全新界面风格。
2. 保留当前右侧 `Task Information` 和 `Pay Period Information` 的信息侧栏。
3. 从“纯表格查看页”升级为“任务执行页 + 风险判断页 + 决策页”。
4. `A1-A3` 在 SD 执行页中分步承接，`A4` 作为独立的 Payroll Variance Predictor 页面承接，`A5` 在 Payroll Calculation 后单独承接。
5. Client 侧不再保留 3 个分散确认页，而是合并为 1 个统一确认页。
6. Client 可查看全部风险异常及处理状态，但不可直接修改 HRMS 源数据。

## 页面范围

目标态共 6 个页面：

1. `SD-1 Employee Scope / Master Data`
2. `SD-2 Attendance & Leave`
3. `SD-3 Payroll Interface / Ad-Hoc`
4. `SD-4 Payroll Variance Predictor`
5. `Client-1 Confirm PrePayroll Snapshot`
6. `SD/Payroll-5 Post Payroll Review`

## 与现有组件映射关系

| 目标态页面 | 来源于现有组件 | 页面定位 |
|---|---|---|
| `SD-1 Employee Scope / Master Data` | `GetAndConfirmPrePayrollEmpVerToHRMS` | 员工范围锁定与主数据上下文准备 |
| `SD-2 Attendance & Leave` | `GetAndSubmitAttendanceFromHRMS` | Attendance / Leave 数据准备与 `A1 + 部分 A2` 风险处理 |
| `SD-3 Payroll Interface / Ad-Hoc` | `GetAndSubmitPayrollInterfaceFromHRMS` | Interface / Ad-Hoc 数据准备与 `A3` 风险处理 |
| `SD-4 Payroll Variance Predictor` | 新增 | 正式 payroll 处理前的成本估算、波动解释、阈值预警与 drill-down |
| `Client-1 Confirm PrePayroll Snapshot` | 合并 `ConfirmPrePayrollEmpVerToHRMS`、`ConfirmAttendanceToHRMS`、`ConfirmPayrollinterfaceToHRMS` | 客户统一只读确认页 |
| `SD/Payroll-5 Post Payroll Review` | 新增 | Payroll Calculation 后 `A5` 异常复核页 |

## 通用页面框架

所有页面统一延续当前 Butter 的框架：

- 顶部标题区
  - 页面标题
  - 状态标识
  - Assignee
  - Due Date
  - Remind Date
- 主内容区
  - 以卡片、摘要条、表格区、风险区组成
- 右侧信息区
  - `Task Information`
  - `Pay Period Information`
- 页底操作区
  - 按当前阶段展示主要动作按钮

## 页面一：SD-1 Employee Scope / Master Data

### 页面目标

用于锁定本次 Pre-Payroll 的员工范围，并准备后续规则判断所依赖的主数据上下文。

该页面不以异常处理为核心，而是以“范围确认”和“依赖准备” 为核心。

### 页面结构

1. `Run Summary Bar`
   - Payroll Period
   - Snapshot 状态
   - 参与计算员工数
   - 新入职人数
   - 离职人数
   - 调薪人数
   - 组织变更人数
   - 主数据缺口人数
2. `Employee Change Overview`
   - 使用分类卡片替代单纯 tab 起始结构
   - 分类建议：
     - `New Joiners`
     - `Leavers`
     - `Salary Adjustment`
     - `Org Structure Changes`
     - `Bank / Allowance Changes`
3. `Employee Scope Table`
   - 视图切换：
     - `All Changes`
     - `Included in Payroll`
     - `Excluded`
     - `Missing Master Data`
   - 表格保留现有字段主干
   - 增加批量动作：
     - `Include in Snapshot`
     - `Exclude with Reason`
     - `Export`
4. `Master Data Readiness`
   - 展示后续 `A1 / A2 / A4` 所依赖的主数据缺口
   - 示例问题：
     - 缺成本中心
     - 缺组织归属
     - 缺 payroll eligibility
     - 异动状态未闭合

### 关键状态

- `Ready`
- `Incomplete`
- `Blocked`

### 页底动作

- `Save Draft`
- `Freeze Employee Scope`
- `Continue to Attendance & Leave`

## 页面二：SD-2 Attendance & Leave

### 页面目标

用于准备 Attendance / Leave / OT 数据，并处理 `A1` 与部分 `A2` 的风险异常。

该页面由现有“数据查看页”升级为“规则执行页 + 风险处理页”。

### 页面结构

1. `Risk Summary Strip`
   - `A1 Critical`
   - `A1 Warning`
   - `A2 Critical`
   - `A2 Warning`
   - `Pending Dependency`
2. `Business Tabs`
   - `Attendance`
   - `Leave Status`
   - `OT Compensation`
   - `Holiday / Rest Day`
3. 每个 tab 内采用双层结构
   - `Exceptions`
     - 风险卡片
     - 异常清单表格
   - `Data Details`
     - Summary table
     - Detail table
4. `Rule Check Panel`
   - 展示：
     - `A1 Missing Punch`
     - `A1 OT Mismatch`
     - `A1 Holiday Attendance`
     - `A2 Pending Leave Impact`
     - `A2 Negative Leave Balance`

### 页面承接的风险类型

- 漏打卡
- 超出 OT 阈值
- OT 未审批
- OT 提报与系统记录不一致
- 打卡与请假重叠
- 节假日 / 休息日打卡
- 影响 payroll 的 pending leave
- leave balance 异常
- prorated leave 异常
- 异常请假模式

### 关键状态

- `Pass`
- `Warning`
- `Blocker`
- `Pending Dependency`
- `Not Applicable`

### 页底动作

- `Save Draft`
- `Mark Resolved`
- `Accept Warning`
- `Continue to Payroll Interface`

## 页面三：SD-3 Payroll Interface / Ad-Hoc

### 页面目标

用于准备 Interface / Ad-Hoc 输入数据，并处理 `A3` 风险。

该页面重点不是“有没有数据”，而是“哪些数据将进入计算、哪些存在支付或政策风险”。

### 页面结构

1. `A3 Risk Summary Strip`
   - `Duplicate Items`
   - `Policy Cap Breach`
   - `Approval Missing`
   - `Historical Outlier`
   - `Pending Baseline`
2. `Business Tabs`
   - `Claims & Reimbursements`
   - `Allowances`
   - `Loans & Deductions`
   - `Claim Status / Approval`
3. 每个 tab 内采用双层结构
   - `Risk Exceptions`
     - 重复项
     - 超 cap 项
     - 审批缺失项
     - 历史异常值
   - `Submitted Data Details`
     - 将进入 snapshot 的数据清单
4. `A3 Rule Check Panel`
   - `Duplicate Detection`
   - `Policy Limit Validation`
   - `Approval Workflow Check`
   - `Historical Amount Outlier`
   - `Statutory Contribution Applicability`
5. `Inclusion Decision Bar`
   - 本次纳入计算项目数
   - 被排除项目数
   - 待确认项目数

### 页面承接的风险类型

- 同一员工、同一金额、同一期间的重复项
- 相比历史显著偏高的金额
- 超出 policy cap 的付款项
- 大额付款缺少审批
- variable pay 对法定缴纳适用性异常

### 关键状态

- `Pass`
- `Warning`
- `Blocker`
- `Pending Baseline`
- `Not Applicable`

### 页底动作

- `Save Draft`
- `Resolve / Accept`
- `Continue to Payroll Variance Predictor`

## 页面四：SD-4 Payroll Variance Predictor

### 页面目标

该页面用于承接 `A4 Payroll Variance Predictor`。

面向 `HR Staff`、`Service Delivery`、`Manager` 三类用户，在正式 payroll processing 前运行计算前成本估算，比较本月与上月的 payroll cost 变化，解释主要驱动因素，并识别需要业务或管理层提前关注的波动。

### 页面结构

1. `Estimate Summary Header`
   - Payroll Period
   - Estimate Version / Snapshot Version
   - Estimated Payroll Cost
   - Previous Month Cost
   - Variance Amount
   - MoM Variance %
   - Configured Threshold
   - Current Status
2. `Threshold Breach Alert Panel`
   - 当前是否存在超阈值波动
   - breach 部门数 / 成本中心数
   - 最大 breach 对象
   - alert 接收对象（Finance / Manager / Payroll Admin）
   - 快捷动作：
     - `View all breaches`
     - `Notify stakeholders`
     - `Mark as reviewed`
3. `MoM Variance Dashboard`
   - 公司总成本本月 vs 上月对比
   - Department-level variance chart
   - Top increasing departments
   - Top decreasing departments
   - threshold marker
   - 绝对值 / 百分比切换
4. `AI Narrative Summary`
   - `What changed`
   - `Why it changed`
   - `What needs attention`
   - `Suggested next step`
5. `Driver Breakdown`
   - `New Hires`
   - `Resignations / Leavers`
   - `Bonus / Incentive Runs`
   - `Salary Adjustments / Promotions`
   - `Allowance / One-off Payments`
   - 每项显示影响金额、影响人数、影响部门、是否属于预期变化
6. `Drill-down Explorer`
   - 筛选维度：
     - Department
     - Cost Centre
     - Employee Type
     - Pay Component
     - Variance Severity
   - 字段建议：
     - Dimension
     - Current Estimate
     - Previous Month
     - Variance Amount
     - Variance %
     - Main Driver
     - Threshold Status
     - Reviewer / Notes
7. `Review & Action Panel`
   - `Acknowledge variance`
   - `Request explanation`
   - `Escalate to manager`
   - `Send threshold alert`
   - `Export variance report`
   - `Send to Client Confirmation`

### 关键状态

- `Estimate Generated`
- `Under Review`
- `Threshold Breach`
- `Reviewed`
- `Escalated`

### 页底动作

- `Send threshold alert`
- `Mark variance reviewed`
- `Send to Client Confirmation`

## 页面五：Client-1 Confirm PrePayroll Snapshot

### 页面目标

该页面是 Client 侧唯一确认页面，用于一次性查看完整数据包、全部风险异常及处理状态，并完成确认或退回。

该页面不是对原 3 个 Confirm 页的简单拼接，而是统一确认页。

### 页面结构

1. `Confirmation Header`
   - Snapshot Version
   - Freeze Time
   - Employee Count
   - Included / Excluded Count
   - Total Risk Count
   - Current Snapshot Status
2. `Final Data Summary`
   - `Employee Scope`
   - `Attendance & Leave`
   - `Payroll Interface / Ad-Hoc`
   - `Variance Impact`
3. `All Risk Anomalies`
   - 统一风险表格
   - 字段建议：
     - Risk ID
     - Category
     - Severity
     - Employee / Department
     - Description
     - Impact
     - Suggested Action
     - Current Status
4. `Risk Handling Status`
   - `Resolved`
   - `Accepted Risk`
   - `Unresolved`
   - `Non-Blocking`
5. `Variance Summary`
   - 部门级成本波动
   - Top Drivers
   - 主要波动说明
6. `Excluded Items & Reasons`
   - 排除员工或记录
   - 排除原因

### 页面边界

- 客户可以查看全部风险异常及处理状态。
- 客户不能在该页面直接修改 HRMS 源数据。
- 如需调整，需退回 SD 重新处理并生成新 snapshot。

### 关键状态

- `Pending Client Confirmation`
- `Confirmed`
- `Returned`

### 页底动作

- `Confirm Snapshot`
- `Return to SD for Rework`
- `Export Confirmation Package`

## 页面六：SD/Payroll-5 Post Payroll Review

### 页面目标

该页面用于承接 `A5`，在 Payroll Calculation 完成后，对最终 payroll result 做异常复核和审批门槛控制。

### 页面结构

1. `Payroll Result Header`
   - Payroll Run ID
   - Calculation Time
   - Employee Count
   - Total Exposure
   - High / Medium / Low Risk Count
2. `Department Risk Dashboard`
   - 各部门异常数
   - 风险敞口
   - 风险等级
3. `A5 Anomaly Table`
   - 字段建议：
     - Anomaly ID
     - Department
     - Employee
     - Anomaly Type
     - Severity
     - Current Pay
     - Baseline / Peer Comparison
     - AI Explanation
     - Status
4. `Employee Drill-down`
   - 当前 pay vs 6-month average
   - peer group comparison
   - pay component detail
   - AI explanation
5. `Decision Panel`
   - `Accept`
   - `Investigate`
   - `Override`
   - `Override Reason`
6. `Approval Gate`
   - 是否仍有高风险异常未确认
   - 是否允许进入最终审批 / 发薪

### 页面承接的异常类型

- Net pay variance
- Peer group outlier
- Missing deduction
- Unexpected allowance
- Floor / ceiling breach
- Tax variance
- OT spike
- New pay component
- Deduction change threshold breach

### 关键状态

- `In Review`
- `Blocked`
- `Ready for Approval`

### 页底动作

- `Re-run Analysis`
- `Save Review`
- `Unlock for Approval`

## 关键交互流转

1. SD 在 `SD-1` 锁定员工范围与主数据上下文。
2. SD 在 `SD-2` 完成 `A1 + 部分 A2` 数据准备与风险处理。
3. SD 在 `SD-3` 完成 `A3` 数据准备与风险处理。
4. HR / SD / Manager 在 `SD-4` 中执行 `A4 Payroll Variance Predictor`，完成成本估算、波动解释、阈值检查，并直接决定是否发送客户确认。
5. Client 在 `Client-1` 中查看完整数据包、全部风险异常及处理状态，并完成确认或退回。
6. 确认后，系统将最终输入提交给 HRMS / Payroll Engine。
7. Payroll Calculation 完成后，在 `SD/Payroll-5` 中执行 `A5` 复核与审批门槛控制。

## 高保真原型实施建议

在实际出图时，建议遵循以下原则：

1. 保留 Butter 当前页面框架，重点调整主内容层级。
2. 摘要卡片、风险条、状态卡使用统一组件样式。
3. 异常表格字段在 SD 和 Client 页面尽量复用，避免理解成本上升。
4. `Payroll Variance Predictor` 页面应明显区别于现有纯表格页，突出“估算、解释、预警、下钻”的分析角色。
5. `Client Confirm` 页面应明显区别于现有纯表格页，突出统一确认的角色。
6. `A5` 页面可在视觉上延续 Butter 样式，但需要更强的风险审查氛围，例如更明确的风险分层、审批门槛和 drill-down 结构。

## 结论

该 6 页目标态原型可以完整覆盖此前分析结论：

- `SD-1 ~ SD-3` 负责分步取数与局部业务校验
- `SD-4` 负责 `A4 Payroll Variance Predictor` 的估算、解释、预警与 drill-down
- `Client-1` 负责统一确认完整数据与全部风险异常
- `SD/Payroll-5` 负责 Payroll Calculation 后的 `A5` 复核

该方案既保留了 Butter 当前页面基础，又能支持“客户一次确认、风险全量可见、流程前后闭环”的目标态设计。
