# Pre-Payroll AI Review Center 方案草案

## 1. 背景

当前系统中的 pre-payroll 流程大致分为以下几类人工核对步骤：

- Employee Verification
- Attendance Verification
- Payroll Interface Verification

对应的实际核对内容通常包括：

- 确认需要算薪的员工范围及人员异动情况，例如新入职、离职、调薪、组织调整、银行信息变更等
- 核对考勤、加班、请假、节假日出勤等数据
- 核对绩效奖金、加班补贴、报销、临时支付、扣款等接口数据

现有模式的主要问题，不是“缺少页面”，而是“人工需要在多个页面和多个模块之间来回切换”，导致：

- 人工复核路径长
- 低风险问题也被逐条查看
- 高风险问题不能第一时间集中暴露
- 相同员工、相同 pay run 的问题分散在不同页面中
- 每次 re-run 后，用户容易重复做一遍同样的核查动作

因此，优化目标不应只是“在现有页面上加 AI 提示”，而应该是重构 pre-payroll 的工作流，将核心操作从“逐页检查”改为“统一风险处理”。

## 2. 目标

本方案的核心目标是：

- 减少页面切换
- 降低人工逐条复核成本
- 让用户优先处理真正影响发薪准确性与合规性的高风险问题
- 让低风险问题支持批量确认并保留审计记录
- 在不完全推翻现有页面结构的前提下，逐步把主操作入口迁移到 AI 工作台

结合前期 A1-A5 功能分析，建议将产品主线定义为：

`AI 驱动的薪资异常管理与审批控制`

而不是：

`AI 自动算薪`

因为企业薪资场景更适合“AI 识别异常 + 人工审核决策 + 全程留痕”的方式。

## 3. A1-A5 融合原则

A1-A5 不建议继续作为 5 个独立功能入口存在，而应被融合为统一风险引擎中的不同风险来源。

建议融合方式如下：

- A1：Attendance & OT Risk
- A2：Leave & Pay Impact Risk
- A3：Manual Pay Item Risk
- A4：Cost Insight
- A5：Post-Calc Payroll Risk

其中：

- A1、A2、A3 进入 pre-payroll 主风险队列
- A4 不作为主处理队列项，而作为成本波动摘要与管理辅助信息
- A5 作为 payroll calculation 之后、final approval 之前的独立审批门禁

这意味着：

- pre-payroll 主流程不再按模块分割
- 原有 Employee / Attendance / Payroll Interface 页面转为证据页和源数据页
- 用户主要在统一工作台中处理 AI 已筛选出的风险项

## 4. 新流程建议

建议将现有 pre-payroll 流程重构为以下主链路：

1. Run Scope Confirmation
2. AI Pre-Scan
3. Risk Review Center
4. Payroll Calculation
5. AI Post-Calc Scan
6. Approval Gate
7. Final Approval

各阶段说明如下。

### 4.1 Run Scope Confirmation

这一阶段吸收当前 Employee Verification 的核心职责，用于确认本次 pay run 的范围和关键变动。

主要确认内容：

- 参与本次算薪的员工范围
- 新员工入职
- 员工离职
- 薪资调整
- 组织结构变化
- 银行信息变化

这一阶段的目标不是让用户“逐页核对所有变更”，而是为 AI 风险扫描提供本次 run 的边界和上下文。

### 4.2 AI Pre-Scan

系统在进入人工处理前，先自动运行 A1、A2、A3。

系统自动扫描：

- 考勤与加班异常
- 请假与薪资影响异常
- 临时支付与扣款异常

扫描结果统一进入风险队列，并按 High / Medium / Low 分级。

### 4.3 Risk Review Center

这是新流程的核心页面，也是建议新增的默认入口。

用户进入 pre-payroll 后，不再优先进入某个模块页面，而是优先进入统一异常工作台。

处理原则：

- High：必须逐条处理
- Medium：逐条或分组处理
- Low：允许批量确认

这样用户的工作逻辑从“我应该去哪一页看数据”变成“系统告诉我哪些问题值得我看”。

### 4.4 Payroll Calculation

在 pre-payroll 高风险问题处理完毕后，进入 payroll calculation。

### 4.5 AI Post-Calc Scan

Payroll calculation 完成后，运行 A5，对最终薪资结果进行扫描。

主要覆盖：

- 净薪异常
- 同岗异常值
- 缺失法定扣款
- 异常补贴
- 税额异常
- 新增薪资组成项
- 扣款金额异常变化

### 4.6 Approval Gate

A5 的高风险项作为审批门禁存在。

建议规则：

- 若存在未关闭的 High 风险，不允许进入 final approval
- Medium 风险允许在有 owner 和说明的情况下继续推进
- Low 风险允许批量确认并留痕

## 5. AI Review Center 页面方案

建议在 `Pre-Payroll Processing` 下新增 `AI Review Center`，并逐步将其变为默认首页。

页面结构建议如下：

### 5.1 Run Header

用于展示当前 pay run 的核心上下文：

- Pay Group
- Pay Run
- Cut-off Date
- Run Status
- Last Scan Time
- Pending Actions Count

### 5.2 Risk Summary

用卡片方式展示整体风险状态：

- High Count
- Medium Count
- Low Count
- Impacted Employees
- Estimated Financial Impact
- Pending Approval Dependencies

### 5.3 Queue Tabs

建议提供以下队列视图：

- High
- Medium
- Low
- New Since Last Scan
- Resolved

默认进入 `High`。

### 5.4 Filter Bar

建议支持以下筛选维度：

- Employee
- Risk Type
- Department
- Amount Impact
- Owner
- Blocking Status

### 5.5 Issue Table

Issue Table 是工作台核心，建议字段如下：

- Risk
- Issue Type
- Employee
- Summary
- Impact
- Owner
- Status
- Action

其中每条记录代表一条“异常”，而不是一条原始业务数据。

### 5.6 Evidence Drawer

点击异常后，右侧打开详情抽屉，建议分为以下区域：

- AI Explanation
- Evidence
- Recommended Action
- Audit Trail

Evidence 区域支持跳转至原页面，例如：

- Employee Change 页
- Attendance 页
- Leave 页
- Claim / Interface 页
- Salary Adjustment 页

这意味着原页面仍然保留，但定位转为“证据查看和源数据修正”，而不再是主操作入口。

## 6. 风险对象统一建模

为了减少用户在不同模块间切换，建议将 A1-A5 的输出统一抽象为 `Issue` 对象。

每条 Issue 建议具备以下字段：

- Issue ID
- Risk Level
- Risk Type
- Employee
- Pay Run
- Summary
- Why Flagged
- Financial Impact
- Blocking Status
- Recommended Action
- Owner
- Source Module
- Evidence Links
- Status
- Audit Trail

这样做的价值在于：

- 所有异常在 UI 上具备一致结构
- 用户学习成本更低
- 后续可做统一筛选、排序、批量处理和审计

## 7. 风险分级建议

建议风险等级不是简单按模块区分，而是按以下三个维度综合判级：

- 发薪影响
- 金额影响
- 流程依赖

判级原则建议如下：

### 7.1 High

满足以下任一条件可判为 High：

- 直接影响 net pay
- 涉及 statutory deduction
- 涉及未完成审批但会进入本次 payroll
- 涉及大额支付或重复支付
- 涉及关键合规风险
- 属于 approval gate 阻断项

示例：

- 未审批 OT 且会进入本次算薪
- Pending leave 将直接影响扣薪
- 大额 ad-hoc payment 缺审批
- 缺失 CPF/EPF/SOCSO/tax 扣款
- 新增 pay component 未经 HR 审批

### 7.2 Medium

满足以下特点的可判为 Medium：

- 可能存在错误，但不一定阻断发薪
- 金额影响中等
- 可通过人工确认后继续推进
- 需要 owner 跟进，但不一定立即阻断

示例：

- 小额漏打卡
- 异常请假模式
- 偏离历史均值但未超审批阈值
- 成本波动可疑但有业务解释空间

### 7.3 Low

满足以下条件的可判为 Low：

- 影响金额小
- 可解释
- 不影响 statutory deduction
- 不影响审批门禁
- 更偏提醒和审计价值

Low 风险不建议逐条人工处理，应支持批量确认。

## 8. Low Risk 批量确认机制

既然目标是减少人工复核成本，Low 风险必须从“逐条看”改为“批量确认”。

建议 Low 批量确认的准入条件如下：

- 不涉及法定扣款
- 不涉及 net pay 上下限异常
- 不涉及 joiner / leaver 关键 prorate
- 不涉及未审批大额支付
- 金额影响低于设定阈值
- 历史上同类情况通常被 Accept

批量确认后，系统记录审计信息，例如：

- 确认人
- 确认时间
- 确认数量
- 涉及的 pay run

## 9. A1-A5 在新流程中的具体角色

### 9.1 A1

从原来的 Attendance Verification 能力，升级为统一风险引擎中的 `Attendance & OT Risk`。

主要职责：

- 识别漏打卡
- 识别异常加班
- 识别未审批 OT
- 识别打卡与请假重叠
- 识别节假日 / 休息日出勤风险

### 9.2 A2

从 leave 校验能力，升级为 `Leave & Pay Impact Risk`。

主要职责：

- 识别 pending leave 对当期工资的影响
- 识别负余额问题
- 识别 encashment 资格异常
- 识别 joiner / leaver 的比例计算问题

### 9.3 A3

作为 `Manual Pay Item Risk`。

主要职责：

- 识别重复奖金或重复支付
- 识别超 policy cap 的补贴
- 识别异常 ad-hoc payment
- 识别缺少审批的大额支付

### 9.4 A4

作为 `Cost Insight`。

主要职责：

- 对部门或成本中心波动做摘要提示
- 为 manager / finance 提供前瞻信息

建议：

- 不进入主异常处理队列
- 作为 summary 或 side panel 展示

### 9.5 A5

作为 `Post-Calc Payroll Risk`。

主要职责：

- 在 calculation 后拦截最终高风险异常
- 作为 final approval 前的审批门禁

## 10. 与现有页面的关系

本方案不是立刻废弃现有页面，而是调整其定位。

建议新旧关系如下：

- 现有 `Employee Verification` 页面：保留，作为员工异动证据页
- 现有 `Attendance Verification` 页面：保留，作为考勤证据页
- 现有 `Payroll Interface Verification` 页面：保留，作为接口数据证据页
- 新增 `AI Review Center`：作为主操作入口

用户处理逻辑应变为：

1. 先在 AI Review Center 中看高风险项
2. 只有在需要证据或修改源数据时才跳转原页面
3. 修完数据后 re-scan，只关注新增或未关闭项

## 11. 推荐实施路径

建议分三阶段推进。

### 阶段一：AI Overlay

- 新增 AI Review Center
- 保留原有页面和现有主流程
- A1/A2/A3 先统一输出异常列表
- 用户可从工作台跳转原页面处理

目标：

- 验证用户是否愿意先看 AI 风险汇总
- 验证命中率和误报率

### 阶段二：AI First

- `Pre-Payroll Processing` 默认首页切换到 AI Review Center
- 原 tab 保留，但定位降为 source / details
- 支持 Low 风险批量确认
- 引入 A5 approval gate

目标：

- 真正减少页面切换
- 让大多数复核动作在工作台中完成

### 阶段三：Risk-Driven Workflow

- pre-payroll 主流程完全按风险队列组织
- 原页面只承担证据与编辑功能
- A1-A5 形成完整闭环

目标：

- 从“逐页检查”彻底转为“风险驱动处理”

## 12. MVP 建议

首版 MVP 不建议一次性覆盖全部能力，建议只做最能体现人工成本下降的部分。

推荐 MVP 范围：

- AI Review Center 首页
- A1 + A2 + A3 的统一异常队列
- High / Medium / Low 分级
- Low 风险批量确认
- A5 的 approval gate

首版暂不建议作为主处理对象的内容：

- A4 深度成本分析
- 复杂的跨模块智能叙述
- 过多自定义规则编排

## 13. 预期收益

如果该方案落地，预期收益主要体现在：

- 用户不再需要在多个 pre-payroll 页面之间反复切换
- 大量低风险事项从逐条检查变为批量确认
- 高风险问题被优先暴露和优先处理
- payroll approval 前有统一、清晰、可审计的异常门禁
- AI 的价值点从“增加一个功能”变成“重构整个复核流程”

## 14. 结论

从减少人工复核成本的目标出发，A1-A5 最合理的整合方式不是继续嵌入原有模块步骤，而是以统一风险工作台为核心，重构 pre-payroll 的主操作路径。

建议方向为：

- 用 `AI Review Center` 替代“逐页核对”作为主入口
- 用 `High / Medium / Low` 风险队列替代模块式处理顺序
- 用 `Low Risk 批量确认` 替代低价值人工逐条复核
- 用 `A5 Approval Gate` 作为 final approval 前的最后一道风险控制

最终形成的不是一个新的 AI 小功能，而是一套新的 payroll review operating model。
