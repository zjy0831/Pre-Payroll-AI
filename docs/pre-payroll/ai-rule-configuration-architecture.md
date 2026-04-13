# Pre-Payroll AI Rule Configuration Architecture

## 1. 目的

本文档用于明确 Pre-Payroll AI 检测能力中，哪些内容应该做成后台配置项，哪些内容应该由 AI agent 或规则执行层负责。

目标是避免把客户策略、阈值和政策上限写死在 agent prompt 或 skill 中，同时保证：

- 规则可配置
- 结果可审计
- 不同客户可复用同一套规则框架
- AI 解释能力与业务规则能力分层清晰

## 2. 核心结论

### 2.1 应做成后台配置项的内容

以下内容应由后台配置管理，而不是写入 skill 或 prompt：

- 数值阈值
- 上限 / 下限
- 统计异常判断参数
- 历史窗口长度
- 风险等级映射
- 是否阻塞流程
- 适用范围
- 客户级差异化政策

典型例子：

- 过度加班：`> 60 小时 / 周`
- 交通津贴上限：`150 美元 / 月`
- 历史均值偏差阈值：`高于近 6 个月平均值 1.8 倍`
- 最小金额差：`至少高出 200 美元才算异常`

### 2.2 应由 AI agent / 执行层负责的内容

以下内容适合交给 AI agent 或规则执行层：

- 读取和整合多来源数据
- 根据配置执行规则
- 将结果转成业务可读的异常解释
- 生成建议动作
- 对多条异常做归并和摘要
- 用自然语言说明风险原因和影响

典型例子：

- “James Wong 本期交通津贴超出上限 300 美元，建议在进入 payroll calculation 前更正或排除。”
- “Sarah Chen 的 pending leave 可能导致本期扣薪 320 美元，需要经理审批结果后再确认。”

## 3. 为什么不建议把规则做成 skill

### 3.1 规则本质是业务策略，不是模型能力

`>60 小时 / 周`、`最大交通津贴 150 美元 / 月` 这类内容属于业务规则参数，不是 AI 的通用能力。

如果把它们写死进 skill，会导致：

- 每次改阈值都要改代码或 prompt
- 客户之间难以复用
- 规则来源不透明
- 审计时难以说明“本次判断依据是什么配置”

### 3.2 Skill 无法替代可审计的策略配置

Payroll 场景需要明确记录：

- 当时生效的阈值
- 配置由谁修改
- 规则适用于哪个客户 / 国家 / pay group
- 某条异常是按哪套规则判断出来的

这类能力应由后台规则配置中心承接，而不是依赖 skill 定义。

### 3.3 客户政策天然多租户、多维度差异化

同一规则在不同场景下常常不同：

- 国家不同
- 客户不同
- pay group 不同
- 员工类型不同
- 项目 / 部门不同

这些差异本质上是配置覆盖问题，不是 skill 变体问题。

## 4. 推荐分层架构

建议将整体能力拆成四层。

### 4.1 Rule Template Layer

产品内置的规则模板层，用于定义规则类型和执行框架。

例子：

- `overtime_limit_check`
- `historical_outlier_check`
- `policy_cap_check`
- `missing_approval_check`
- `duplicate_input_check`
- `eligibility_check`

这一层定义的是“检查方法”，不是“具体阈值”。

### 4.2 Configuration Layer

后台配置层，用于定义规则参数和适用范围。

这一层负责：

- 阈值
- 金额上限
- lookback period
- 比较算法参数
- 风险等级
- blocking 策略
- 生效范围

### 4.3 Execution Layer

规则执行层根据数据和配置产出结构化异常结果。

这一层负责：

- 数据读取
- 数据归一化
- 规则执行
- 异常产出
- 风险等级映射
- 生成可供 UI 与 AI 使用的 issue 对象

### 4.4 AI Explanation Layer

AI 层消费执行结果，负责：

- 解释异常原因
- 生成建议动作
- 做摘要与聚合
- 做多条异常合并说明
- 输出面向业务用户的可读文本

这一层不负责决定阈值。

## 5. 规则分类建议

### 5.1 明确规则类

适合完全规则化，不依赖 AI 判断：

- 上限 / 下限验证
- 超时阈值验证
- 缺字段验证
- 缺审批验证
- 重复输入验证
- 生效日期校验

例子：

- 周 OT 超过 60 小时
- 津贴超过保单上限
- 缺少 approval attachment
- 同一 loan deduction 重复出现

### 5.2 统计规则类

适合规则执行层计算，AI 只做解释：

- 高于历史均值
- 低于历史均值
- 相比 peer group 偏离过大
- 环比 / 同比变化过大

这类规则的关键参数应配置化：

- 历史窗口长度
- 参考基线
- 倍数阈值
- 最小绝对差值
- 最小样本量

### 5.3 AI 辅助规则类

适合由 AI 辅助解释或归因，但不建议直接由 AI 决定是否命中：

- 异常原因摘要
- 风险归因聚合
- 人类可读建议
- 相似异常归并

例子：

- “本次 variance 主要由新入职和 incentive run 驱动”
- “该异常更像审批缺失，不像重复录入”

## 6. 推荐配置模型

建议每条规则配置至少包含以下字段。

```json
{
  "rule_id": "transport_allowance_cap_sg_ch01",
  "rule_type": "policy_cap_check",
  "name": "Transport Allowance Cap",
  "description": "Validate transport allowance against monthly cap",
  "enabled": true,
  "scope": {
    "country": "SG",
    "client_id": "zhappy",
    "legal_entity": "CH01",
    "pay_group": "CH01",
    "employee_type": null
  },
  "params": {
    "item_code": "transport_allowance",
    "cap_amount": 150,
    "currency": "USD",
    "period": "monthly"
  },
  "severity": "blocker",
  "blocking": true,
  "message_template": {
    "title": "Transport allowance cap breach",
    "detail": "Amount exceeds configured cap",
    "recommendation": "Correct or exclude before payroll calculation"
  },
  "audit": {
    "version": 3,
    "updated_by": "admin@company.com",
    "updated_at": "2026-04-07T10:00:00Z"
  }
}
```

## 7. 推荐 issue 输出模型

规则执行层应输出统一 issue 对象，供 UI、AI 和审计复用。

```json
{
  "issue_id": "risk-1042",
  "rule_id": "transport_allowance_cap_sg_ch01",
  "rule_type": "policy_cap_check",
  "severity": "blocker",
  "blocking": true,
  "entity": {
    "employee_id": "james-wong",
    "employee_name": "James Wong"
  },
  "evidence": {
    "current_amount": 450,
    "configured_cap": 150,
    "currency": "USD",
    "difference": 300
  },
  "summary": {
    "title": "Transport allowance cap breach",
    "detail": "James Wong transport allowance exceeds configured cap by USD 300"
  },
  "recommendation": "Correct amount or exclude item before payroll calculation",
  "linked_records": [
    "interface-detail-james-wong"
  ],
  "status": "open"
}
```

## 8. 配置项与 agent 的职责边界

### 8.1 配置项负责什么

- 定义“什么算异常”
- 定义“异常程度是多少”
- 定义“是否阻塞流程”
- 定义“这条规则适用于谁”

### 8.2 Agent 负责什么

- 执行检查
- 读取和关联数据
- 解释为什么命中
- 生成建议动作
- 生成页面上的摘要卡片和 AI 分析文案

### 8.3 不要混淆的部分

以下内容不要直接写进 agent prompt：

- 某客户 OT 阈值是多少
- 某项津贴的 cap 是多少
- 某国家税务规则的具体参数
- 哪类异常属于 blocker

这些内容都应该从配置读取。

## 9. 典型规则设计示例

### 9.1 过度加班

规则模板：

- `overtime_limit_check`

配置参数：

- `period = weekly`
- `threshold_hours = 60`
- `severity = warning 或 blocker`
- `scope = country / client / pay_group`

执行逻辑：

- 按员工、按周汇总 OT 小时
- 若大于配置阈值，则生成 issue

AI 输出：

- 解释员工哪一周超出阈值
- 说明可能的薪资风险或合规风险
- 给出建议动作

### 9.2 历史异常值识别

规则模板：

- `historical_outlier_check`

配置参数：

- `lookback_months = 6`
- `baseline = mean`
- `multiplier = 1.8`
- `min_absolute_delta = 200`
- `min_sample_size = 3`

执行逻辑：

- 拉取历史数据
- 计算历史平均值
- 若当前值大于平均值乘以阈值，且差值超过最小金额，则生成 issue

AI 输出：

- 说明当前值相较历史均值高出多少
- 说明可能原因
- 提示用户核查是否为真实业务变化

### 9.3 津贴保单上限

规则模板：

- `policy_cap_check`

配置参数：

- `item_code = transport_allowance`
- `cap_amount = 150`
- `currency = USD`
- `period = monthly`

执行逻辑：

- 识别津贴项
- 聚合至月度口径
- 与 cap 对比

AI 输出：

- 指出超出多少
- 解释这是保单上限校验
- 建议更正或排除

## 10. 后台配置中心建议字段

建议后台规则配置页面支持以下字段：

- Rule Name
- Rule Type
- Description
- Enabled / Disabled
- Country
- Client
- Legal Entity
- Pay Group
- Employee Type
- Threshold / Cap / Multiplier 参数
- Severity
- Blocking
- Effective Start Date
- Effective End Date
- Version
- Updated By
- Updated At

建议额外支持：

- 配置预览
- 命中样例测试
- 覆盖关系展示
- 变更历史

## 11. 审计与治理建议

Payroll 场景中必须保留以下审计能力：

- 每条 issue 使用了哪条规则配置
- 当时生效的参数值
- 规则版本号
- 配置变更历史
- 谁修改了阈值
- 修改何时生效

否则后续无法回答：

- 为什么这条员工记录被判异常
- 为什么上个月不报，这个月报
- 为什么同类客户判断标准不同

## 12. MVP 实施建议

如果先做 MVP，建议按以下顺序推进。

### 阶段一：规则模板 + 配置化阈值

先覆盖最明确、最稳定的规则：

- OT 阈值
- 津贴上限
- 缺审批
- 缺字段
- 重复输入

### 阶段二：统计异常规则

加入：

- 历史均值偏差
- peer group 偏差
- variance 趋势异常

### 阶段三：AI 解释增强

加入：

- 多异常归并
- 根因摘要
- 页面级建议动作
- 面向客户的摘要说明

## 13. 最终建议

推荐的最终原则如下：

- 规则模板做产品能力
- 阈值与政策做后台配置
- 执行层做结构化检测
- AI 层做解释与建议

简化表述就是：

- “如何检查” 是产品内置能力
- “检查标准是多少” 是后台配置
- “如何向用户解释” 是 AI 能力

这套分层更适合企业 payroll 场景，因为它同时满足：

- 灵活配置
- 多客户复用
- 审计可追溯
- AI 解释友好
