# Priority Summary

> Last Updated: 2026-03-31

## Attendance & OT Anomaly Detector

- **ID**: A1
  - **ID**: A1
- **Category**: Pre-Payroll Validation
  - **分类**: 薪资计算前验证
- **Unnamed: 2**: Automated intelligence checks before payroll is processed, catching data issues early
  - **说明**: 在薪资处理前进行自动化的智能检查，及早发现数据问题
- **Primary Users**: HR Staff, Service Delivery
  - **主要用户**: HR员工，服务交付团队
- **Priority**: P1 – Must Have
  - **优先级**: P1 – 必须有
- **How It Works  (summary)**: Scans all clock-in/out records 2–3 days before payroll cutoff. Detects missing punches, excessive OT (>60h/wk), back-to-back overnight shifts, unapproved OT tied to pending payroll calculations, and mismatches between submitted and system-recorded OT hours. Clocking Record overlapped with leave record. Cross-checks if employee have clocking record on statutory holiday or rest day for compliance alert or payment eligibility
  - **工作原理（摘要）**: 在薪资截止前2-3天扫描所有打卡记录。检测漏打卡、过度加班（>60小时/周）、连续通宵班、与待处理薪资计算相关的未经批准加班，以及提交与系统记录的加班时间不匹配的情况。打卡记录与请假记录重叠。交叉检查员工在法定假日或休息日是否有打卡记录，以进行合规预警或支付资格确认
  - **拓展说明 (HOW IT WORKS)**:
    1. Automatically scans all clock-in/clock-out records 2–3 days before payroll cutoff
       - 在工资截止前 2-3 天自动扫描所有上班/下班记录
    2. Detects patterns: missing punches, excessive overtime (>60 hrs/week or >36 hrs/month), overlapping clocking & leave records, clocking on statutory holidays
       - 检测模式：漏打卡、过度加班（每周 >60 小时或每月 >36 小时）、重叠打卡和休假记录、法定节假日打卡
    3. Flags unapproved OT records tied to pending payroll calculations
       - 标记与待定工资计算相关的未经批准的加班记录
    4. Identifies employees whose submitted OT hours differ from system-recorded hours
       - 识别提交的加班时间与系统记录的时间不同的员工
    5. Cross-checks statutory holiday, rest day, and leave attendance
       - 交叉核对法定假日、休息日和请假出勤情况
    6. Generates a prioritised pre-payroll checklist for HR review
       - 生成优先薪资预核清单以供人力资源审查
- **User Benefit**: Eliminates hours of manual attendance review before every payroll run. HR is alerted only to the exceptions that matter — a typical 500-employee run may surface just 10–15 items requiring human attention.
  - **用户收益**: 消除每次薪资计算前数小时的人工考勤审核。HR只收到重要异常的警报——典型的500名员工薪资计算可能只会出现10-15个需要人工干预的项目。
  - **拓展说明 (USER BENEFIT)**:
    1. Eliminates hours of manual attendance review before every payroll run
       - 消除每次薪资运行前的人工出勤审核时间
    2. HR is alerted only to the exceptions that matter — a 500-employee run may surface just 10–15 items
       - HR 仅收到重要例外情况的警报 - 500 名员工的运行可能只显示 10-15 项
    3. Reduces risk of OT underpayments or overpayments reaching employees
       - 降低员工 OT 支付不足或多付的风险
    4. Creates a defensible audit trail of pre-payroll review steps
       - 创建工资单审核前步骤的可靠审计跟踪
- **Key Outputs**: • Prioritised exception report (critical / warning / info)• One-click approve / dismiss per flagged item• Audit trail of pre-payroll review• Email/Slack alert to payroll admin with summary
  - **核心产出**: • 按优先级排列的异常报告（严重/警告/信息）• 对标记项目的单次点击批准/驳回• 薪资计算前审核的审计跟踪• 给薪资管理员的电子邮件/Slack摘要警报
  - **拓展说明 (KEY OUTPUTS)**:
    1. Exception report with severity rating: critical / warning / info
       - 具有严重性评级的异常报告：严重/警告/信息
    2. One-click approve / dismiss action per flagged item
       - 对每个标记项目进行一键批准/驳回操作
    3. Full audit trail of what was reviewed and actioned pre-payroll
       - 对工资单前审查和采取行动的内容进行完整的审计跟踪
    4. Automated email/Slack alert to payroll admin with executive summary
       - 向薪资管理员发送自动电子邮件/Slack 警报以及执行摘要
- **Implementation Notes**: Builds on existing attendance data in HRMS. Configurable thresholds per client.
  - **实施备注**: 基于HRMS中现有的考勤数据构建。每个客户可配置阈值。
- **Effort Estimate**: Low–Medium
  - **工作量评估**: 低-中
- **Dependencies**: Attendance module, Leave Module
  - **依赖项**: 考勤模块，请假模块
- **Stakeholder Decision**:
  - **利益相关者决策**:
- **EXAMPLE SCENARIO**:
  - **示例场景**:
  - Before October payroll, AI surfaces: "8 employees have unapproved OT records totalling 42 hours. 3 employees have missing clock-out punches on 14 Oct. 1 employee has OT exceeding the monthly cap." HR resolves all issues in 20 minutes instead of 3 hours.
    - 10月发工资前，AI浮出水面：“8名员工有未经批准的加班记录，总计42小时。10月14日，3名员工未打卡下班。1名员工加班超过每月上限。” HR 在 20 分钟内解决所有问题，而不是 3 小时。

***

## Leave Balance & Payroll Impact Checker

- **ID**: A2
  - **ID**: A2
- **Category**: Pre-Payroll Validation
  - **分类**: 薪资计算前验证
- **Unnamed: 2**: Automated intelligence checks before payroll is processed, catching data issues early
  - **说明**: 在薪资处理前进行自动化的智能检查，及早发现数据问题
- **Primary Users**: HR Staff, Service Delivery
  - **主要用户**: HR员工，服务交付团队
- **Priority**: P1 – Must Have
  - **优先级**: P1 – 必须有
- **How It Works  (summary)**: Cross-checks leave application status (approved / pending / rejected) against the payroll period. Flags employees with pending leave requests that affect pay, negative balances not configured for auto-deduction, incorrect leave encashment eligibility, and pro-rated leave errors for joiners / leavers.
  - **工作原理（摘要）**: 将请假申请状态（已批准/待处理/已拒绝）与薪资周期进行交叉检查。标记有待处理请假请求会影响薪资的员工、未配置为自动扣除的负余额、不正确的假期兑现资格，以及入职/离职员工的按比例请假错误。
  - **拓展说明 (HOW IT WORKS)**:
    1. Cross-checks all leave application statuses (approved / pending / rejected) against the payroll period
       - 根据工资周期交叉检查所有休假申请状态（已批准/待处理/拒绝）
    2. Flags employees with pending leave requests that affect pay computation
       - 标记有影响工资计算的待处理休假请求的员工
    3. Detects employee anomaly leave parttern, such as take 0.5 annual leave on every Friday, medical leave taken >=X days in the current pay month
       - 检测员工异常请假模式，如每周五休0.5年假，当月病假>=X天
- **User Benefit**: Prevents the most common payroll error source — leave-to-payroll mismatches — before the run is finalised, avoiding costly corrections and employee disputes.
  - **用户收益**: 在最终确定计算前，防止最常见的薪资错误来源——请假与薪资不匹配，避免昂贵的更正和员工纠纷。
  - **拓展说明 (USER BENEFIT)**:
    1. Prevents the most common payroll error — leave-to-payroll mismatches — before the run is finalised
       - 在运行最终确定之前，防止最常见的工资错误——休假与工资不匹配
    2. Avoids costly payroll corrections and employee disputes over incorrect deductions
       - 避免代价高昂的工资更正和因不正确扣除而引起的员工纠纷
    3. Ensures employees on no-pay leave have correct deductions applied
       - 确保休无薪假的员工得到正确的扣除
    4. Protects against encashment errors during year-end or offboarding
       - 防止年末或离职期间出现兑现错误
- **Key Outputs**: • Leave-to-payroll reconciliation report• List of employees with pending leave impacting pay• Recommended action per exception• One-click escalation to approver
  - **核心产出**: • 请假与薪资核对报告• 待处理请假影响薪资的员工列表• 每个异常的建议操作• 一键升级给审批人
  - **拓展说明 (KEY OUTPUTS)**:
    1. Leave-to-payroll reconciliation report with exception list
       - 带异常列表的休假工资核对报告
    2. List of employees with pending leave that impacts pay
       - 影响工资的待休假员工名单
    3. Recommended action per exception (contact approver / auto-deduct / hold)
       - 针对异常情况建议采取的措施（联系审批者/自动扣除/保留）
    4. One-click escalation to leave approver from within the report
       - 一键升级以将审批者从报告中剔除
- **Implementation Notes**: Requires leave module integration. Policy rules (encashment caps, carry-over) must be configured per client.
  - **实施备注**: 需要请假模块集成。必须为每个客户配置政策规则（兑现上限、结转）。
- **Effort Estimate**: Low–Medium
  - **工作量评估**: 低-中
- **Dependencies**: Leave module
  - **依赖项**: 请假模块
- **Stakeholder Decision**:
  - **利益相关者决策**:
- **EXAMPLE SCENARIO**:
  - **示例场景**:
  - "Sarah Chen has 2 days of pending leave in October that have not been approved. If approved, her pay will be reduced by $320. If rejected, no deduction applies. Please confirm with her manager before running payroll."
    - “Sarah Chen 10 月份还有 2 天待休假尚未获得批准。如果获得批准，她的工资将减少 320 美元。如果被拒绝，则不会扣除任何费用。请在发放工资之前与她的经理确认。”

***

## Ad-Hoc Payment & Deduction Validator

- **ID**: A3
  - **ID**: A3
- **Category**: Pre-Payroll Validation
  - **分类**: 薪资计算前验证
- **Unnamed: 2**: Automated intelligence checks before payroll is processed, catching data issues early
  - **说明**: 在薪资处理前进行自动化的智能检查，及早发现数据问题
- **Primary Users**: HR Staff, Service Delivery
  - **主要用户**: HR员工，服务交付团队
- **Priority**: P2 – High Impact
  - **优先级**: P2 – 高影响
- **How It Works  (summary)**: Scans all manually entered ad-hoc items (commissions, bonuses, reimbursements, deductions) for the period. Detects duplicates (same employee, same amount, same period), statistical outliers vs. historical averages, policy cap violations (e.g. max transport allowance), and large payments lacking proper approval workflow.
  - **工作原理（摘要）**: 扫描该期间所有手动输入的临时项目（佣金、奖金、报销、扣款）。检测重复项（同一员工、相同金额、相同期间）、与历史平均值相比的统计异常值、违反政策上限（如最大交通补贴）以及缺乏适当审批流程的大额付款。
  - **拓展说明 (HOW IT WORKS)**:
    1. Scans all manually entered ad-hoc items (commissions, bonuses, reimbursements) for the period
       - 扫描该期间所有手动输入的临时项目（佣金、奖金、报销）
    2. Detects duplicates: same employee, same amount, same period
       - 检测重复：同一员工、相同金额、同一时期
    3. Identifies statistical outliers — amounts significantly above historical averages (configurable threshold)
       - 识别统计异常值 - 数量明显高于历史平均值（可配置阈值）
    4. Validates against policy caps (e.g. max transport allowance $150/month)
       - 根据保单上限进行验证（例如最大交通津贴 150 美元/月）
    5. Checks that mandatory statutory contributions will be correctly applied to variable pay
       - 检查强制性法定缴款是否正确适用于可变工资
    6. Triggers approval workflow for large ad-hoc payments lacking proper sign-off
       - 触发缺乏适当签字的大额临时付款的审批工作流程
- **User Benefit**: Catches accidental duplicate bonuses or uncapped allowances before they become costly overpayments. Particularly valuable for clients with high volumes of variable pay.
  - **用户收益**: 在意外的重复奖金或无上限补贴变成昂贵的超额支付之前捕获它们。对于可变薪酬量大的客户特别有价值。
  - **拓展说明 (USER BENEFIT)**:
    1. Catches accidental duplicate bonus entries before they become costly overpayments
       - 在意外重复的奖金条目变成代价高昂的超额支付之前捕获它们
    2. Flags uncapped transport or meal allowances that breach company policy
       - 标记违反公司政策的无上限交通或膳食津贴
    3. Reduces financial risk from large manual ad-hoc items processed without senior approval
       - 降低未经高层批准而处理的大型手动临时项目的财务风险
    4. Especially valuable for clients with high volumes of variable or incentive pay
       - 对于拥有大量可变薪酬或激励薪酬的客户来说尤其有价值
- **Key Outputs**: • Flagged items with risk level and reason• Policy violation summary with cap details• Approval workflow trigger for high-risk items• Duplicate detection report
  - **核心产出**: • 带有风险级别和原因的标记项目• 包含上限详细信息的政策违规摘要• 高风险项目的审批流程触发• 重复检测报告
  - **拓展说明 (KEY OUTPUTS)**:
    1. Flagged items with risk level (high / medium / low) and specific reason
       - 带有风险级别（高/中/低）和具体原因的标记项目
    2. Policy violation summary with applicable cap details
       - 政策违规摘要以及适用的上限详细信息
    3. Approval workflow trigger for high-risk items
       - 高风险项目的审批工作流程触发器
    4. Duplicate detection report with suggested resolution
       - 具有建议解决方案的重复检测报告
- **Implementation Notes**: Requires company policy rules to be configured in HRMS. Statistical baselines built after 3+ months of data.
  - **实施备注**: 需要在HRMS中配置公司政策规则。统计基线在3个月以上的数据后建立。
- **Effort Estimate**: Medium
  - **工作量评估**: 中
- **Dependencies**: Policy config, 3+ months payroll history
  - **依赖项**: 政策配置，3个月以上的薪资历史
- **Stakeholder Decision**:
  - **利益相关者决策**:
- **EXAMPLE SCENARIO**:
  - **示例场景**:
  - AI flags: "Transport allowance for James Wong = $450 this month vs. company policy cap of $150. Difference of $300 appears to be a data entry error. Recommend reviewing before processing."
    - AI 标记：“本月 James Wong 的交通津贴 = 450 美元，而公司保单上限为 150 美元。300 美元的差异似乎是数据输入错误。建议在处理前进行审查。”

***

## Payroll Variance Predictor

- **ID**: A4
  - **ID**: A4
- **Category**: Pre-Payroll Validation
  - **分类**: 薪资计算前验证
- **Unnamed: 2**: Automated intelligence checks before payroll is processed, catching data issues early
  - **说明**: 在薪资处理前进行自动化的智能检查，及早发现数据问题
- **Primary Users**: HR Staff, Service Delivery, Manager
  - **主要用户**: HR员工，服务交付团队，经理
- **Priority**: P3 – Strategic
  - **优先级**: P3 – 战略性
- **How It Works  (summary)**: Runs a pre-calculation cost estimate before the official payroll is processed. Compares department-level total cost vs. previous month with % variance. Highlights top cost change contributors (new hires, resignations, bonus runs). Flags breaches beyond a configurable threshold (e.g. >10% MoM change). Provides drill-down by cost centre.
  - **工作原理（摘要）**: 在正式处理薪资前运行计算前成本估算。比较部门级总成本与上个月及差异百分比。突出显示导致成本变化的主要因素（新员工、离职、奖金发放）。标记超出可配置阈值（如>10%环比变化）的违规行为。提供按成本中心的向下钻取。
  - **拓展说明 (HOW IT WORKS)**:
    1. Runs a pre-calculation cost estimate before the official payroll is processed
       - 在处理正式工资单之前运行预先计算成本估算
    2. Compares department-level total cost vs. previous month with % variance
       - 将部门级总成本与上个月的差异百分比进行比较
    3. Highlights top contributors to cost changes: new hires, resignations, bonus payments
       - 突出显示成本变化的主要贡献者：新员工、辞职、奖金支付
    4. Flags variance breaches beyond a configurable threshold (e.g. >10% MoM change)
       - 标记超出可配置阈值的方差违规（例如 >10% MoM 变化）
    5. Provides drill-down analysis by cost centre, department, or employee type
       - 按成本中心、部门或员工类型提供深入分析
    6. Generates an AI-written narrative summary of the key drivers
       - 生成关键驱动因素的人工智能编写的叙述性摘要
- **User Benefit**: Gives management early visibility into payroll cost spikes before the run is finalised — especially critical for budget-sensitive months or after large headcount changes.
  - **用户收益**: 在最终确定计算前，让管理层及早了解薪资成本激增情况——对于对预算敏感的月份或大量人员变动后尤其关键。
  - **拓展说明 (USER BENEFIT)**:
    1. Gives management early visibility into payroll cost spikes before the run is finalised
       - 让管理层在运行最终确定之前尽早了解工资成本峰值
    2. Enables Finance to prepare for budget variances before month-end reporting
       - 使财务部门能够在月末报告之前为预算差异做好准备
    3. Reduces surprise escalations to senior management after payroll is processed
       - 减少薪资处理后向高级管理层意外升级的情况
    4. Particularly valuable during bonus months, restructuring, or rapid headcount growth
       - 在奖金月、重组或员工快速增长期间特别有价值
- **Key Outputs**: • Variance dashboard with MoM comparison chart• AI-generated narrative explaining key changes• Threshold breach alert to Finance / management• Drill-down by department and employee type
  - **核心产出**: • 包含环比比较图表的差异仪表板• 解释关键变化的AI生成叙述• 给财务/管理层的阈值突破警报• 按部门和员工类型向下钻取
  - **拓展说明 (KEY OUTPUTS)**:
    1. Variance dashboard with month-on-month comparison chart
       - 带有月度比较图表的方差仪表板
    2. AI-generated narrative explaining the key cost changes
       - 人工智能生成的叙述解释了关键的成本变化
    3. Threshold breach alert to Finance / management
       - 向财务/管理层发出阈值违规警报
    4. Drill-down report by department and employee type
       - 按部门和员工类型细分的报告
- **Implementation Notes**: Builds on pre-payroll data pipeline from A1/A2. Requires cost centre configuration.
  - **实施备注**: 建立在A1/A2的薪资计算前数据管道上。需要成本中心配置。
- **Effort Estimate**: High
  - **工作量评估**: 高
- **Dependencies**: A1, A2 pipeline; cost centre setup
  - **依赖项**: A1、A2数据管道；成本中心设置
- **Stakeholder Decision**:
  - **利益相关者决策**:
- **EXAMPLE SCENARIO**:
  - **示例场景**:
  - "October payroll estimate is $2.4M, up 14% from September ($2.1M). Primary drivers: 8 new hires in Engineering (+$85K), annual bonus run for Sales team (+$120K), 2 promotions with salary adjustments (+$15K)."
    - “10 月份薪资预计为 240 万美元，比 9 月份（210 万美元）增长 14%。主要推动因素：工程部门新聘 8 名员工（+8.5 万美元）、销售团队年度奖金（+12 万美元）、2 次晋升并进行薪资调整（+1.5 万美元）。”

***

## Post-Payroll Calculation Anomaly Check

- **ID**: A5
  - **ID**: A5
- **Category**: Post-Payroll Anomaly Detection
  - **分类**: 薪资计算后异常检测
- **Unnamed: 2**: AI-powered post-calculation validation that scans finalised payroll results for statistical outliers, missing deductions, compliance breaches, and data entry errors before approval
  - **说明**: AI驱动的计算后验证，在审批前扫描最终薪资结果，寻找统计异常值、缺失的扣款、合规性漏洞和数据输入错误
- **Primary Users**: HR Staff, Service Delivery, Manager
  - **主要用户**: HR员工，服务交付团队，经理
- **Priority**: P1 – Must Have
  - **优先级**: P1 – 必须有
- **How It Works  (summary)**: After payroll calculation is completed, AI automatically scans all employee pay records against 9 anomaly types: (1) Net pay variance vs 6-month average (configurable % threshold); (2) Peer group outlier detection (salary vs employees of same role, grade, site); (3) Missing or unexpected deductions (e.g. absent statutory deduction, leave-without-pay flag); (4) Unexpected allowances without entitlement records; (5) Net pay amount floor/ceiling breach (absolute min/max thresholds); (6) Tax amount variance vs prior periods; (7) Overtime spike beyond configurable standard deviation; (8) New pay component added without HR approval; (9) Deduction change exceeding threshold. Results are ranked by risk level (High / Medium / Low) and grouped by department. Anomalies are surfaced in a review dashboard where processors can Accept, Investigate, or Override with documented reason. All actions are logged to an immutable audit trail. High-risk anomalies must be acknowledged before the payroll approval gate is unlocked.
  - **工作原理（摘要）**: 薪资计算完成后，AI自动针对9种异常类型扫描所有员工薪资记录：(1)净薪资差异与6个月平均值（可配置的%阈值）；(2)同行群体异常值检测（与相同角色、职级、地点的员工薪资相比）；(3)缺失或意外的扣款（如缺少法定扣款、无薪假标记）；(4)没有享有记录的意外补贴；(5)净薪资金额下限/上限突破（绝对最小/最大阈值）；(6)与前期相比的税额差异；(7)超出可配置标准差的加班激增；(8)未经HR批准添加的新薪资组成部分；(9)扣款变化超过阈值。结果按风险级别（高/中/低）排序并按部门分组。异常情况会显示在审查仪表板中，处理人员可以接受、调查或使用记录的原因进行覆盖。所有操作都记录在不可变的审计跟踪中。高风险异常必须在薪资审批门解锁前得到确认。
  - **拓展说明 (HOW IT WORKS)**:
    1. After payroll calculation is complete, AI automatically scans all employee records across 9 configurable anomaly types within minutes.
       - 工资计算完成后，AI 在几分钟内自动扫描 9 种可配置异常类型的所有员工记录。
    2. Net Pay Variance: flags if net pay changed by more than the configured % threshold vs the employee's 6-month rolling baseline.
       - 净工资差异：标记净工资变化与员工的 6 个月滚动基线相比是否超过配置的百分比阈值。
    3. Peer Group Outlier: compares each employee's pay against peers of the same role, grade, and site — flags statistical outliers beyond configured SDs.
       - 同行组异常值：将每个员工的薪酬与相同角色、级别和站点的同行进行比较 - 标记超出配置 SD 的统计异常值。
    4. Missing Deduction: detects when a mandatory recurring deduction (CPF, EPF, SOCSO, tax) is absent without a valid leave-without-pay or termination flag.
       - 缺失扣除额：检测何时缺少强制性经常性扣除额（CPF、EPF、SOCSO、税）且没有有效的停薪假或终止标记。
    5. Unexpected Allowance: flags allowances that have no entitlement record in HR or have never appeared in this employee's prior payroll history.
       - 意外津贴：标记在 HR 中没有权利记录或从未出现在该员工之前的工资历史记录中的津贴。
    6. Net Pay Amount Floor/Ceiling: flags absolute pay ceiling/floor breaches (e.g. net pay > $25,000 or < $3,500) regardless of % variance — catches data entry errors.
       - 净工资金额下限/上限：标记绝对工资上限/下限违规情况（例如，净工资 > 25,000 美元或 < 3,500 美元），无论差异百分比如何 — 捕获数据输入错误。
    7. Tax Amount Variance: compares tax withheld this period vs the 6-month average; sharp drops flag potential missing Additional Wage or wrong tax code.
       - 税额差异：将本期预扣税款与 6 个月平均值进行比较；急剧下降表明可能缺少额外工资或错误的税法。
    8. Overtime Spike: detects OT hours deviating beyond the configured standard deviations above peer group norm for the same role and grade.
       - 加班峰值：检测超出相同角色和级别的同侪组规范的配置标准偏差的加班时间。
    9. New Pay Component / Deduction Change: flags first-time pay components or significant changes to recurring deduction amounts vs prior periods.
       - 新的工资组成部分/扣除额变化：标记首次工资组成部分或与之前期间相比，经常性扣除金额的重大变化。
    10. All anomalies are risk-classified (High / Medium / Low) and grouped by department with AI-generated explanations and financial exposure summaries.
    - 所有异常均按风险分类（高/中/低），并按部门分组，并提供人工智能生成的解释和财务风险摘要。
    1. Payroll processors can Accept, Investigate, or Override each anomaly — every action is mandatory-logged with reason for full audit trail.
    - 薪资处理者可以接受、调查或覆盖每个异常情况——每个操作都被强制记录，并附有完整审计跟踪的原因。
    1. High-risk anomalies lock the payroll approval gate; approver must explicitly acknowledge all flagged items before the payroll run can be approved.
    - 高风险异常锁定薪资审批大门；审批者必须明确确认所有标记的项目，然后才能批准工资单运行。
- **User Benefit**: Catches calculation errors, overpayments, compliance gaps, and data entry mistakes after payroll is run but before it is approved and disbursed. A single missed anomaly (e.g. a $487,400 overpayment due to a decimal error, or a missing CPF deduction) can result in significant financial loss or regulatory exposure. The feature provides a structured human-in-the-loop approval gate — AI flags, human decides, every decision is audited.
  - **用户收益**: 在薪资计算后但在审批和发放之前捕获计算错误、超额支付、合规漏洞和数据输入错误。一个遗漏的异常（例如，由于小数错误导致487,400美元的超额支付，或缺失的公积金扣款）可能会导致重大的财务损失或监管风险。该功能提供了一个结构化的人机协同审批门限——AI标记，人类决策，每个决定都被审计。
  - **拓展说明 (USER BENEFIT)**:
    1. Prevents gross overpayments before disbursement: the $512,400 data entry error (Jonathan Yeo, Sales) would have been paid out if not caught — AI detects it in seconds vs. days of manual reconciliation.
       - 在付款前防止总多付款项：如果没有发现 512,400 美元的数据输入错误（销售人员 Jonathan Yeo），人工智能会在几秒钟内检测到该错误，而手动对账则需要几天时间。
- **Key Outputs**: • Department-level risk dashboard with anomaly count, exposure summary, and AI assessment per department• Flagged anomaly table filterable by risk level, department, and anomaly type• Employee-level drill-down: AI explanation, pay comparison chart (current vs 6-month avg vs peer group)• Accept / Investigate / Override actions with mandatory override reason• Approval gate: high-risk anomalies require acknowledgement before payroll can be approved• Immutable audit log of all AI outputs and human decisions• Configurable thresholds: variance %, peer group definition, floor/ceiling amounts, lookback period• Re-run analysis button after payroll corrections
  - **核心产出**: • 包含每个部门异常计数、风险暴露摘要和AI评估的部门级风险仪表板• 可按风险级别、部门和异常类型过滤的标记异常表• 员工级向下钻取：AI解释，薪资比较图表（当前与6个月平均值与同行群体）• 具有强制覆盖原因的接受/调查/覆盖操作• 审批门限：高风险异常需要确认后才能批准薪资• 所有AI输出和人类决策的不可变审计日志• 可配置的阈值：差异%、同行群体定义、下限/上限金额、回溯期• 薪资修正后的重新运行分析按钮
- **Implementation Notes**: Fully built and demonstrated in Payroll\_Anomalies\_V3 prototype. Configurable thresholds and anomaly types via Config panel. Requires 3–6 months of payroll history for peer/baseline accuracy. Anomaly types and risk thresholds are all configurable per client.
  - **实施备注**: 已在Payroll\_Anomalies\_V3原型中完全构建并演示。通过配置面板可配置阈值和异常类型。需要3-6个月的薪资历史数据以确保同行/基线的准确性。异常类型和风险阈值均可根据每个客户进行配置。
- **Effort Estimate**: Medium–High
  - **工作量评估**: 中-高
- **Dependencies**: Payroll calculation module; 3–6 months payroll history; A1–A4 pre-payroll pipeline
  - **依赖项**: 薪资计算模块；3-6个月的薪资历史数据；A1-A4薪资计算前管道
- **Stakeholder Decision**:
  - **利益相关者决策**:

