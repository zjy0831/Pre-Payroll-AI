# A1/A2检测项 & HRMS Leave Attendance 业务含义整理

> 更新时间：2026-04-15\
> 目的：梳理 HRMS 侧分组的业务含义，作为后续与 `A1-A5` 检测项做数据缺口比对的基础。

## A1 / A2 检测项、规则与输出结果对照表

> 说明：`规则是否需配置` 为 `需配置` 的条目，表示需在后台规则配置中心由人工维护参数/策略（如阈值、适用范围、阻塞策略等）。

| A项 | 检测项                   | 检测规则（命中条件）                                                  | 规则是否需配置                         | 检测结果输出（示例）                                         |
| -- | --------------------- | ----------------------------------------------------------- | ------------------------------- | -------------------------------------------------- |
| A1 | 漏打卡                   | payroll period 内，员工存在应出勤班次，但缺少 `clock-in` 或 `clock-out` 记录。 | 否                               | 输出员工、日期、班次、缺失字段（in/out）。建议动作：补卡，必要时确认是否属于豁免场景。     |
| A1 | 加班超阈值（周/月）            | 员工加班汇总超过设定阈值（如 `>20h/周` 或 `>36h/月`）。                        | 需配置（周阈值、月阈值、适用员工范围）             | 输出本期加班时长、阈值、超出时长、风险级别。建议动作：复核加班记录并确认是否需要调整或限制后续审批。 |
| A1 | 连续通宵班/不合理排班模式         | 连续夜班天数或排班时段组合超出策略阈值。                                        | 需配置（连续天数、夜班定义、例外人群）             | 输出连续夜班天数、触发规则。建议动作：复核排班并调整班次安排。                    |
| A1 | 未审批加班影响发薪             | 加班记录状态非 `Approved` 且落在本次 payroll period。                    | 否                               | 输出加班小时、审批状态、预计薪资影响。建议动作：催批或暂缓计薪，待审批后再确认。           |
| A1 | 提报加班与系统加班不一致          | 员工提报加班与系统计算加班差值超过允许偏差。                                      | 需配置（容差阈值、对比口径）                  | 输出提报值、系统值、差值。建议动作：更正加班数据或复核口径差异。                   |
| A1 | 打卡与请假重叠               | 同一员工同一时段同时存在有效打卡记录与有效请假记录。                                  | 需配置（重叠容差分钟、允许重叠假别）              | 输出重叠时段、重叠分钟、请假状态、风险说明。建议动作：核对考勤与请假记录是否冲突。          |
| A1 | 法定节假日/休息日打卡           | 员工在法定节假日或休息日存在打卡。                                           | 否                               | 输出日期类型、打卡证据。建议动作：复核是否符合节假日出勤。                      |
| A2 | 待审批休假影响薪资             | 请假状态为 `Pending`，且请假日期落在本 payroll period，属于影响薪资的假别。          | 需配置（影响薪资假别）                     | 输出待审批天数、预计扣薪金额、审批人。建议动作：催审批并确认是否需要暂缓扣薪。            |
| A2 | 请假负余额未自动扣薪            | leave balance < 0，且对应假别未启用自动扣减或扣减配置缺失。                      | 需配置（auto-deduct 开关、扣减公式、假别适用范围） | 输出当前余额、auto-deduct 配置状态、预计扣薪。建议动作：检查自动扣薪配置并补足扣薪逻辑。 |
| A2 | 假期折现资格异常              | 实际折现结果与策略应得资格不一致（year-end/in-service/exit/LWE 等场景）。         | 需配置（折现资格条件、上限、适用假别、周期）          | 输出应得/实得、差额、命中策略。建议动作：核对折现资格与政策配置，必要时修正结果。          |
| A2 | Joiner/Leaver 按比例请假异常 | 入职/离职员工当期应得假期与系统结果不一致。                                      | 需配置（应得假期公式、舍入规则、生效日期口径）         | 输出服务天数、应得值、系统值、差值。建议动作：修正按比例计算结果并复核生效日期口径。         |
| A2 | 异常请假模式                | 命中行为模式规则（如每周五固定 0.5 天年假、病假当月 `>=X` 天）。                      | 需配置（模式模板、观察窗口、阈值 `X`）           | 输出命中模式、观察窗口、实际次数 vs 阈值。建议动作：复核请假模式是否属于正常业务或例外情况。   |

<br />

***

## HRMS Key Business Meaning

> 说明：
>
> - 以下内容根据你提供的 JSON 结构整理。
> - `含义` 优先采用 `zh-CN` 的 `labelLang` 翻译。
> - 对于缩写项，例如 `LWE`，含义为根据字段结构和上下文做的业务推断。

### Holiday

业务含义：节假日相关记录，包含员工、公司、节假日信息以及对应金额，适合用于 holiday 出勤/津贴类明细展示。

Details

| field         | label          | 含义   | dataType |
| ------------- | -------------- | ---- | -------- |
| RecordID      | Record ID      | 记录ID | INT      |
| EmployeeCode  | Employee Code  | 员工编号 | NVARCHAR |
| EmployeeName  | Employee Name  | 员工姓名 | NVARCHAR |
| CompanyCode   | Company Code   | 公司代码 | NVARCHAR |
| CompanyName   | Company Name   | 公司名称 | NVARCHAR |
| HolidayCode   | Holiday Code   | 假期代码 | NVARCHAR |
| HolidayName   | Holiday Name   | 假期名称 | NVARCHAR |
| HolidayDate   | Holiday Date   | 假期日期 | DATETIME |
| HolidayAmount | Holiday Amount | 假日金额 | DECIMAL  |
| AllowanceCode | Allowance Code | 津贴编号 | NVARCHAR |
| AllowanceName | Allowance Name | 津贴名称 | NVARCHAR |

Summary

| field         | label          | 含义   | groupBy | dataType |
| ------------- | -------------- | ---- | ------- | -------- |
| RecordID      | Record ID      | 记录ID | 否       | INT      |
| EmployeeCode  | Employee Code  | 员工编号 | 是       | NVARCHAR |
| EmployeeName  | Employee Name  | 员工姓名 | 是       | NVARCHAR |
| CompanyCode   | Company Code   | 公司代码 | 是       | NVARCHAR |
| CompanyName   | Company Name   | 公司名称 | 是       | NVARCHAR |
| HolidayCode   | Holiday Code   | 假期代码 | 是       | NVARCHAR |
| HolidayName   | Holiday Name   | 假期名称 | 是       | NVARCHAR |
| HolidayAmount | Holiday Amount | 假日金额 | 否       | DECIMAL  |
| AllowanceCode | Allowance Code | 津贴编号 | 是       | NVARCHAR |
| AllowanceName | Allowance Name | 津贴名称 | 是       | NVARCHAR |

### Leave

业务含义：请假明细，包含请假起止日期、金额、审批日期以及关联津贴信息，适合用于 leave 记录与扣薪逻辑展示。

Details

| field         | label          | 含义   | dataType |
| ------------- | -------------- | ---- | -------- |
| RecordID      | Record ID      | 记录ID | NVARCHAR |
| EmployeeCode  | Employee Code  | 员工编号 | NVARCHAR |
| EmployeeName  | Employee Name  | 员工姓名 | NVARCHAR |
| CompanyCode   | Company Code   | 公司代码 | NVARCHAR |
| CompanyName   | Company Name   | 公司名称 | NVARCHAR |
| LeaveCode     | Leave Code     | 休假编号 | NVARCHAR |
| LeaveName     | Leave Name     | 假期类型 | NVARCHAR |
| LeaveStart    | Leave Start    | 休假开始 | DATETIME |
| LeaveDate     | Leave Date     | 休假日期 | DATETIME |
| LeaveAmount   | Leave Amount   | 休假金额 | DECIMAL  |
| ApprovalDate  | Approval Date  | 审批日期 | DATETIME |
| AllowanceCode | Allowance Code | 津贴编号 | NVARCHAR |
| AllowanceName | Allowance Name | 津贴名称 | NVARCHAR |

Summary

| field         | label          | 含义   | groupBy | dataType |
| ------------- | -------------- | ---- | ------- | -------- |
| RecordID      | Record ID      | 记录ID | 否       | INT      |
| EmployeeCode  | Employee Code  | 员工编号 | 是       | NVARCHAR |
| EmployeeName  | Employee Name  | 员工姓名 | 是       | NVARCHAR |
| CompanyCode   | Company Code   | 公司代码 | 是       | NVARCHAR |
| CompanyName   | Company Name   | 公司名称 | 是       | NVARCHAR |
| LeaveCode     | Leave Code     | 休假编号 | 是       | NVARCHAR |
| LeaveName     | Leave Name     | 假期类型 | 是       | NVARCHAR |
| LeaveAmount   | Leave Amount   | 休假金额 | 否       | DECIMAL  |
| ApprovalDate  | Approval Date  | 审批日期 | 否       | DATETIME |
| AllowanceCode | Allowance Code | 津贴编号 | 是       | NVARCHAR |
| AllowanceName | Allowance Name | 津贴名称 | 是       | NVARCHAR |

### Leave Status

业务含义：请假状态汇总，聚焦员工请假状态、数量和关联津贴，适合用于 leave status 的汇总视图。

Details

| field         | label          | 含义   | dataType |
| ------------- | -------------- | ---- | -------- |
| RecordID      | Record ID      | 记录ID | INT      |
| EmployeeCode  | Employee Code  | 员工编号 | NVARCHAR |
| EmployeeName  | Employee Name  | 员工姓名 | NVARCHAR |
| CompanyCode   | Company Code   | 公司代码 | NVARCHAR |
| CompanyName   | Company Name   | 公司名称 | NVARCHAR |
| LeaveCode     | Leave Code     | 休假编号 | NVARCHAR |
| LeaveName     | Leave Name     | 假期类型 | NVARCHAR |
| Quantity      | Quantity       | 数量   | DECIMAL  |
| AllowanceCode | Allowance Code | 津贴编号 | NVARCHAR |
| AllowanceName | Allowance Name | 津贴名称 | NVARCHAR |

Summary

| field         | label          | 含义   | groupBy | dataType |
| ------------- | -------------- | ---- | ------- | -------- |
| RecordID      | Record ID      | 记录ID | 否       | INT      |
| EmployeeCode  | Employee Code  | 员工编号 | 是       | NVARCHAR |
| EmployeeName  | Employee Name  | 员工姓名 | 是       | NVARCHAR |
| CompanyCode   | Company Code   | 公司代码 | 是       | NVARCHAR |
| CompanyName   | Company Name   | 公司名称 | 是       | NVARCHAR |
| LeaveCode     | Leave Code     | 休假编号 | 是       | NVARCHAR |
| LeaveName     | Leave Name     | 假期类型 | 是       | NVARCHAR |
| Quantity      | Quantity       | 数量   | 否       | DECIMAL  |
| AllowanceCode | Allowance Code | 津贴编号 | 是       | NVARCHAR |
| AllowanceName | Allowance Name | 津贴名称 | 是       | NVARCHAR |

### Leave Encash Year End

业务含义：年末休假折现记录，用于年终结转或折现场景的明细展示。

Details

| field         | label          | 含义   | dataType |
| ------------- | -------------- | ---- | -------- |
| RecordID      | Record ID      | 记录ID | INT      |
| EmployeeCode  | Employee Code  | 员工编号 | NVARCHAR |
| EmployeeName  | Employee Name  | 员工姓名 | NVARCHAR |
| CompanyCode   | Company Code   | 公司代码 | NVARCHAR |
| CompanyName   | Company Name   | 公司名称 | NVARCHAR |
| LeaveCode     | Leave Code     | 休假编号 | NVARCHAR |
| LeaveName     | Leave Name     | 假期类型 | NVARCHAR |
| LeaveStart    | Leave Start    | 休假开始 | DATETIME |
| LeaveDate     | Leave Date     | 休假日期 | DATETIME |
| LeaveAmount   | Leave Amount   | 休假金额 | DECIMAL  |
| PeriodYear    | Period Year    | 年限   | NVARCHAR |
| AllowanceCode | Allowance Code | 津贴编号 | NVARCHAR |
| AllowanceName | Allowance Name | 津贴名称 | NVARCHAR |

Summary

| field         | label          | 含义   | groupBy | dataType |
| ------------- | -------------- | ---- | ------- | -------- |
| RecordID      | Record ID      | 记录ID | 否       | INT      |
| EmployeeCode  | Employee Code  | 员工编号 | 是       | NVARCHAR |
| EmployeeName  | Employee Name  | 员工姓名 | 是       | NVARCHAR |
| CompanyCode   | Company Code   | 公司代码 | 是       | NVARCHAR |
| CompanyName   | Company Name   | 公司名称 | 是       | NVARCHAR |
| LeaveCode     | Leave Code     | 休假编号 | 是       | NVARCHAR |
| LeaveName     | Leave Name     | 假期类型 | 是       | NVARCHAR |
| LeaveAmount   | Leave Amount   | 休假金额 | 否       | DECIMAL  |
| PeriodYear    | Period Year    | 年限   | 是       | NVARCHAR |
| AllowanceCode | Allowance Code | 津贴编号 | 是       | NVARCHAR |
| AllowanceName | Allowance Name | 津贴名称 | 是       | NVARCHAR |

### Leave Encash Unconsumed

业务含义：未使用休假折现记录，通常用于员工未休完假期的结算/折现场景。

Details

| field         | label          | 含义   | dataType |
| ------------- | -------------- | ---- | -------- |
| RecordID      | Record ID      | 记录ID | INT      |
| EmployeeCode  | Employee Code  | 员工编号 | NVARCHAR |
| EmployeeName  | Employee Name  | 员工姓名 | NVARCHAR |
| CompanyCode   | Company Code   | 公司代码 | NVARCHAR |
| CompanyName   | Company Name   | 公司名称 | NVARCHAR |
| LeaveCode     | Leave Code     | 休假编号 | NVARCHAR |
| LeaveName     | Leave Name     | 假期类型 | NVARCHAR |
| LeaveStart    | Leave Start    | 休假开始 | DATETIME |
| LeaveDate     | Leave Date     | 休假日期 | DATETIME |
| LeaveAmount   | Leave Amount   | 休假金额 | DECIMAL  |
| PeriodYear    | Period Year    | 年限   | NVARCHAR |
| AllowanceCode | Allowance Code | 津贴编号 | NVARCHAR |
| AllowanceName | Allowance Name | 津贴名称 | NVARCHAR |

Summary

| field         | label          | 含义   | groupBy | dataType |
| ------------- | -------------- | ---- | ------- | -------- |
| RecordID      | Record ID      | 记录ID | 否       | INT      |
| EmployeeCode  | Employee Code  | 员工编号 | 是       | NVARCHAR |
| EmployeeName  | Employee Name  | 员工姓名 | 是       | NVARCHAR |
| CompanyCode   | Company Code   | 公司代码 | 是       | NVARCHAR |
| CompanyName   | Company Name   | 公司名称 | 是       | NVARCHAR |
| LeaveCode     | Leave Code     | 休假编号 | 是       | NVARCHAR |
| LeaveName     | Leave Name     | 假期类型 | 是       | NVARCHAR |
| LeaveAmount   | Leave Amount   | 休假金额 | 否       | DECIMAL  |
| PeriodYear    | Period Year    | 年限   | 是       | NVARCHAR |
| AllowanceCode | Allowance Code | 津贴编号 | 是       | NVARCHAR |
| AllowanceName | Allowance Name | 津贴名称 | 是       | NVARCHAR |

### Leave Encash Exit

业务含义：离职时的休假折现记录，用于员工离职清算场景。

Details

| field         | label          | 含义   | dataType |
| ------------- | -------------- | ---- | -------- |
| RecordID      | Record ID      | 记录ID | INT      |
| EmployeeCode  | Employee Code  | 员工编号 | NVARCHAR |
| EmployeeName  | Employee Name  | 员工姓名 | NVARCHAR |
| CompanyCode   | Company Code   | 公司代码 | NVARCHAR |
| CompanyName   | Company Name   | 公司名称 | NVARCHAR |
| LeaveCode     | Leave Code     | 休假编号 | NVARCHAR |
| LeaveName     | Leave Name     | 假期类型 | NVARCHAR |
| LeaveStart    | Leave Start    | 休假开始 | DATETIME |
| LeaveDate     | Leave Date     | 休假日期 | DATETIME |
| LeaveAmount   | Leave Amount   | 休假金额 | DECIMAL  |
| PeriodYear    | Period Year    | 年限   | NVARCHAR |
| AllowanceCode | Allowance Code | 津贴编号 | NVARCHAR |
| AllowanceName | Allowance Name | 津贴名称 | NVARCHAR |

Summary

| field         | label          | 含义   | groupBy | dataType |
| ------------- | -------------- | ---- | ------- | -------- |
| RecordID      | Record ID      | 记录ID | 否       | INT      |
| EmployeeCode  | Employee Code  | 员工编号 | 是       | NVARCHAR |
| EmployeeName  | Employee Name  | 员工姓名 | 是       | NVARCHAR |
| CompanyCode   | Company Code   | 公司代码 | 是       | NVARCHAR |
| CompanyName   | Company Name   | 公司名称 | 是       | NVARCHAR |
| LeaveCode     | Leave Code     | 休假编号 | 是       | NVARCHAR |
| LeaveName     | Leave Name     | 假期类型 | 是       | NVARCHAR |
| LeaveAmount   | Leave Amount   | 休假金额 | 否       | DECIMAL  |
| PeriodYear    | Period Year    | 年限   | 是       | NVARCHAR |
| AllowanceCode | Allowance Code | 津贴编号 | 是       | NVARCHAR |
| AllowanceName | Allowance Name | 津贴名称 | 是       | NVARCHAR |

### LWE Encash

业务含义：LWE 相关的休假折现记录。这里的 `LWE` 是根据字段结构和上下文做的缩写推断，指向一类与休假折现有关的工资/权益结算数据。

Details

| field         | label          | 含义   | dataType |
| ------------- | -------------- | ---- | -------- |
| RecordID      | Record ID      | 记录ID | INT      |
| EmployeeCode  | Employee Code  | 员工编号 | NVARCHAR |
| EmployeeName  | Employee Name  | 员工姓名 | NVARCHAR |
| CompanyCode   | Company Code   | 公司代码 | NVARCHAR |
| CompanyName   | Company Name   | 公司名称 | NVARCHAR |
| LeaveCode     | Leave Code     | 休假编号 | NVARCHAR |
| LeaveName     | Leave Name     | 假期类型 | NVARCHAR |
| LeaveStart    | Leave Start    | 休假开始 | DATETIME |
| LeaveDate     | Leave Date     | 休假日期 | DATETIME |
| LeaveAmount   | Leave Amount   | 休假金额 | DECIMAL  |
| AllowanceCode | Allowance Code | 津贴编号 | NVARCHAR |
| AllowanceName | Allowance Name | 津贴名称 | NVARCHAR |

Summary

| field         | label          | 含义   | groupBy | dataType |
| ------------- | -------------- | ---- | ------- | -------- |
| RecordID      | Record ID      | 记录ID | 否       | INT      |
| EmployeeCode  | Employee Code  | 员工编号 | 是       | NVARCHAR |
| EmployeeName  | Employee Name  | 员工姓名 | 是       | NVARCHAR |
| CompanyCode   | Company Code   | 公司代码 | 是       | NVARCHAR |
| CompanyName   | Company Name   | 公司名称 | 是       | NVARCHAR |
| LeaveCode     | Leave Code     | 休假编号 | 是       | NVARCHAR |
| LeaveName     | Leave Name     | 假期类型 | 是       | NVARCHAR |
| LeaveAmount   | Leave Amount   | 休假金额 | 否       | DECIMAL  |
| AllowanceCode | Allowance Code | 津贴编号 | 是       | NVARCHAR |
| AllowanceName | Allowance Name | 津贴名称 | 是       | NVARCHAR |

### LWE Encash Exit

业务含义：LWE 离职折现记录。属于离职清算场景中的 LWE 相关结算数据，和 `lweeu` 对应，但面向 exit 流程。

Details

| field         | label          | 含义   | dataType |
| ------------- | -------------- | ---- | -------- |
| RecordID      | Record ID      | 记录ID | INT      |
| EmployeeCode  | Employee Code  | 员工编号 | NVARCHAR |
| EmployeeName  | Employee Name  | 员工姓名 | NVARCHAR |
| CompanyCode   | Company Code   | 公司代码 | NVARCHAR |
| CompanyName   | Company Name   | 公司名称 | NVARCHAR |
| LeaveCode     | Leave Code     | 休假编号 | NVARCHAR |
| LeaveName     | Leave Name     | 假期类型 | NVARCHAR |
| LeaveStart    | Leave Start    | 休假开始 | DATETIME |
| LeaveDate     | Leave Date     | 休假日期 | DATETIME |
| LeaveAmount   | Leave Amount   | 休假金额 | DECIMAL  |
| AllowanceCode | Allowance Code | 津贴编号 | NVARCHAR |
| AllowanceName | Allowance Name | 津贴名称 | NVARCHAR |

Summary

| field         | label          | 含义   | groupBy | dataType |
| ------------- | -------------- | ---- | ------- | -------- |
| RecordID      | Record ID      | 记录ID | 否       | INT      |
| EmployeeCode  | Employee Code  | 员工编号 | 是       | NVARCHAR |
| EmployeeName  | Employee Name  | 员工姓名 | 是       | NVARCHAR |
| CompanyCode   | Company Code   | 公司代码 | 是       | NVARCHAR |
| CompanyName   | Company Name   | 公司名称 | 是       | NVARCHAR |
| LeaveCode     | Leave Code     | 休假编号 | 是       | NVARCHAR |
| LeaveName     | Leave Name     | 假期类型 | 是       | NVARCHAR |
| LeaveAmount   | Leave Amount   | 休假金额 | 否       | DECIMAL  |
| AllowanceCode | Allowance Code | 津贴编号 | 是       | NVARCHAR |
| AllowanceName | Allowance Name | 津贴名称 | 是       | NVARCHAR |

### Attendance

业务含义：考勤记录及其调整明细，包含原始数量、旧数量、比率和差额，适合用于 attendance / time 相关差异分析。

Details

| field         | label          | 含义   | dataType |
| ------------- | -------------- | ---- | -------- |
| RecordID      | Record ID      | 记录ID | INT      |
| EmployeeCode  | Employee Code  | 员工编号 | NVARCHAR |
| EmployeeName  | Employee Name  | 员工姓名 | NVARCHAR |
| CompanyCode   | Company Code   | 公司代码 | NVARCHAR |
| CompanyName   | Company Name   | 公司名称 | NVARCHAR |
| AllowanceCode | Allowance Code | 津贴编号 | NVARCHAR |
| AllowanceName | Allowance Name | 津贴名称 | NVARCHAR |
| ClockDate     | Clock Date     | 打卡日期 | DATETIME |
| Quantity      | Quantity       | 数量   | DECIMAL  |
| OldQuantity   | Old Quantity   | 旧数量  | DECIMAL  |
| Rate          | Rate           | 比率   | DECIMAL  |
| Delta         | Delta          | 差值   | DECIMAL  |

Summary

| field         | label          | 含义   | groupBy | dataType |
| ------------- | -------------- | ---- | ------- | -------- |
| RecordID      | Record ID      | 记录ID | 否       | INT      |
| EmployeeCode  | Employee Code  | 员工编号 | 是       | NVARCHAR |
| EmployeeName  | Employee Name  | 员工姓名 | 是       | NVARCHAR |
| CompanyCode   | Company Code   | 公司代码 | 是       | NVARCHAR |
| CompanyName   | Company Name   | 公司名称 | 是       | NVARCHAR |
| AllowanceCode | Allowance Code | 津贴编号 | 是       | NVARCHAR |
| AllowanceName | Allowance Name | 津贴名称 | 是       | NVARCHAR |
| ClockDate     | Clock Date     | 打卡日期 | 是       | DATETIME |
| Quantity      | Quantity       | 数量   | 是       | DECIMAL  |
| OldQuantity   | Old Quantity   | 旧数量  | 是       | DECIMAL  |
| Rate          | Rate           | 比率   | 是       | DECIMAL  |
| Delta         | Delta          | 差值   | 是       | DECIMAL  |

### OT Compensation

业务含义：加班补偿记录，包含加班补偿代码、打卡日期、工时、审批日期以及津贴信息，用于 OT compensation 计算和审批展示。

Details

| field              | label                | 含义     | dataType |
| ------------------ | -------------------- | ------ | -------- |
| RecordID           | Record ID            | 记录ID   | NVARCHAR |
| EmployeeCode       | Employee Code        | 员工编号   | NVARCHAR |
| EmployeeName       | Employee Name        | 员工姓名   | NVARCHAR |
| CompanyCode        | Company Code         | 公司代码   | NVARCHAR |
| CompanyName        | Company Name         | 公司名称   | NVARCHAR |
| OTCompensationCode | OT Compensation Code | 加班补偿代码 | NVARCHAR |
| OTCompensationName | OT Compensation Name | 加班补偿名称 | NVARCHAR |
| ClockDate          | Clock Date           | 打卡日期   | DATETIME |
| TimeHours          | Time Hours           | 时间小时   | DECIMAL  |
| ApprovalDate       | Approval Date        | 审批日期   | DATETIME |
| AllowanceCode      | Allowance Code       | 津贴编号   | NVARCHAR |
| AllowanceName      | Allowance Name       | 津贴名称   | NVARCHAR |

Summary

| field              | label                | 含义     | groupBy | dataType |
| ------------------ | -------------------- | ------ | ------- | -------- |
| RecordID           | Record ID            | 记录ID   | 否       | INT      |
| EmployeeCode       | Employee Code        | 员工编号   | 是       | NVARCHAR |
| EmployeeName       | Employee Name        | 员工姓名   | 是       | NVARCHAR |
| CompanyCode        | Company Code         | 公司代码   | 是       | NVARCHAR |
| CompanyName        | Company Name         | 公司名称   | 是       | NVARCHAR |
| OTCompensationCode | OT Compensation Code | 加班补偿代码 | 是       | NVARCHAR |
| OTCompensationName | OT Compensation Name | 加班补偿名称 | 是       | NVARCHAR |
| ClockDate          | Clock Date           | 打卡日期   | 是       | DATETIME |
| TimeHours          | Time Hours           | 时间小时   | 否       | DECIMAL  |
| ApprovalDate       | Approval Date        | 审批日期   | 否       | DATETIME |
| AllowanceCode      | Allowance Code       | 津贴编号   | 是       | NVARCHAR |
| AllowanceName      | Allowance Name       | 津贴名称   | 是       | NVARCHAR |

<br />

***

## A1 / A2 可满足度评估

> 说明：
>
> - 本节只基于 `HRMS Key Business Meaning` 的现有字段结构判断。
> - 先不考虑规则中心配置、阈值维护、例外策略等规则层能力。
> - `部分满足` 表示可以覆盖部分输入，但仍缺少关键字段，无法稳定完整落地。

| A项 | 检测项                   | 结论   | 可依赖的 HRMS key                                                                              | 缺失字段 / 原因                                                                           |
| -- | --------------------- | ---- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| A1 | 漏打卡                   | 不满足  | Attendance                                                                                 | 缺少应出勤班次、`clock-in`、`clock-out` 明细，无法识别缺哪一段打卡。                                       |
| A1 | 加班超阈值（周/月）            | 可满足  | OT Compensation                                                                            | 已有 `EmployeeCode`、`ClockDate`、`TimeHours`，可按员工和周/月汇总时长。                             |
| A1 | 连续通宵班/不合理排班模式         | 不满足  | Attendance                                                                                 | 缺少班次定义、上下班时段、夜班标识，无法判断通宵班和排班模式。                                                     |
| A1 | 未审批加班影响发薪             | 部分满足 | OT Compensation                                                                            | 有 `ApprovalDate`、`ClockDate`、`TimeHours`，但缺少明确审批状态字段，也缺少直接薪资影响计算基础。                 |
| A1 | 提报加班与系统加班不一致          | 不满足  | OT Compensation                                                                            | 只有一套 OT 数据，缺少“提报值”和“系统值”双来源对比。                                                      |
| A1 | 打卡与请假重叠               | 部分满足 | Attendance、Leave                                                                           | `ClockDate` 可与 `LeaveStart` / `LeaveDate` 粗粒度比对，但缺少具体打卡时点和请假时段。                     |
| A1 | 法定节假日/休息日打卡           | 部分满足 | Holiday、Attendance                                                                         | 可用 `HolidayDate` 对 `ClockDate` 判断节假日打卡，但“休息日”口径是否完整表达仍不明确。                          |
| A2 | 待审批休假影响薪资             | 部分满足 | Leave、Leave Status                                                                         | 有 `ApprovalDate`、`LeaveDate`、`LeaveAmount`，但缺少明确的 `Pending/Approved/Rejected` 状态字段。 |
| A2 | 请假负余额未自动扣薪            | 不满足  | Leave、Leave Status                                                                         | 缺少 `leave balance`、`auto-deduct` 开关、扣减配置状态等关键输入。                                    |
| A2 | 假期折现资格异常              | 不满足  | Leave Encash Year End、Leave Encash Unconsumed、Leave Encash Exit、LWE Encash、LWE Encash Exit | 有折现结果数据，但缺少应得资格、政策口径、余额基线，无法判断“应得 vs 实得”。                                           |
| A2 | Joiner/Leaver 按比例请假异常 | 不满足  | Leave                                                                                      | 缺少入职日期、离职日期、应得假期基线和按比例计算依据。                                                         |
| A2 | 异常请假模式                | 可满足  | Leave                                                                                      | 已有 `EmployeeCode`、`LeaveDate`、`LeaveName`、`LeaveAmount`，可以按员工、日期、假别做模式分析。           |

## 小结

- 可满足：`2` 项
- 部分满足：`4` 项
- 不满足：`6` 项

当前最大缺口不在规则配置，而在基础输入字段本身，主要包括：

- 打卡明细时点：`clock-in` / `clock-out`
- 班次与夜班标识
- 明确审批状态
- 假期余额与自动扣减配置
- 入职 / 离职日期
- 折现资格基线与政策口径
- OT 双来源对比值（提报值 / 系统值）

