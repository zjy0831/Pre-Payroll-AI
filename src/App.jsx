import React, { useEffect, useState } from 'react'
import './App.css'

function getActionTone(action, index, actions) {
  if (index === actions.length - 1 || action.startsWith('Continue')) {
    return 'is-primary'
  }

  if (
    action.startsWith('Freeze') ||
    action.startsWith('Mark Resolved') ||
    action.startsWith('Mark variance') ||
    action.startsWith('Include') ||
    action.startsWith('Acknowledge')
  ) {
    return 'is-secondary'
  }

  return 'is-ghost'
}

function getAgreementBuilderActionTone(action, agreementGenerated) {
  if (action === 'Generate Agreement') {
    return agreementGenerated ? 'is-secondary' : 'is-primary'
  }

  if (action === 'Send for Review') {
    return agreementGenerated ? 'is-primary' : 'is-ghost'
  }

  return 'is-ghost'
}

function normalizeRow(row) {
  return Array.isArray(row) ? { cells: row } : row
}

function collectLinkedRowIds(page, issueId, activeTab) {
  if (!issueId) {
    return []
  }

  const activeView = getCurrentView(page, activeTab)
  const activeTables = getCurrentTables(page, activeTab)
  const extraTables = Object.values(page.tabTables ?? {}).flat()

  const findLinkedRowIds = (rows) =>
    rows
      .map((row) => normalizeRow(row))
      .filter((row) => row.linkedIssueIds?.includes(issueId) && row.rowId)
      .map((row) => row.rowId)

  return [
    ...findLinkedRowIds(activeView.rows),
    ...activeTables.flatMap((table) => findLinkedRowIds(table.rows)),
    ...page.tables.flatMap((table) => findLinkedRowIds(table.rows)),
    ...extraTables.flatMap((table) => findLinkedRowIds(table.rows)),
  ]
}

function getLinkedIssues(page, linkedIssueIds = []) {
  if (!linkedIssueIds.length) {
    return []
  }

  return linkedIssueIds
    .map((issueId) => page.ai.anomalies.find((anomaly) => anomaly.id === issueId))
    .filter(Boolean)
}

function getSeverityCounts(anomalies) {
  return anomalies.reduce(
    (counts, anomaly) => {
      const key = anomaly.severity ?? 'info'
      counts[key] = (counts[key] ?? 0) + 1
      return counts
    },
    { critical: 0, warning: 0, info: 0 }
  )
}

function getCurrentView(page, activeTab) {
  return page.tabViews?.[activeTab] ?? page.currentView
}

function getCurrentTables(page, activeTab) {
  return page.tabTables?.[activeTab] ?? page.tables
}

function getCurrentSummaryPanels(page, activeTab) {
  return page.summaryPanelsByTab?.[activeTab] ?? page.summaryPanels ?? []
}

function getCurrentComparisonPanels(page, activeTab) {
  return page.comparisonPanelsByTab?.[activeTab] ?? []
}

function getCurrentTabAi(page, activeTab) {
  return page.tabAi?.[activeTab] ?? page.ai
}

function getCurrentSubTabAi(page, activeTab, activeSubTab) {
  if (activeSubTab && page.subTabAiByTab?.[activeTab]?.[activeSubTab]) {
    return page.subTabAiByTab[activeTab][activeSubTab]
  }

  return getCurrentTabAi(page, activeTab)
}

function getCurrentSubTabs(page, activeTab) {
  return page.subTabsByTab?.[activeTab] ?? []
}

function getCurrentSubView(page, activeTab, activeSubTab) {
  if (activeSubTab && page.subTabViewsByTab?.[activeTab]?.[activeSubTab]) {
    return page.subTabViewsByTab[activeTab][activeSubTab]
  }

  return getCurrentView(page, activeTab)
}

function getCurrentSubTables(page, activeTab, activeSubTab) {
  if (activeSubTab && page.subTabTablesByTab?.[activeTab]?.[activeSubTab]) {
    return page.subTabTablesByTab[activeTab][activeSubTab]
  }

  return getCurrentTables(page, activeTab)
}

function filterRows(rows, filters) {
  if (!filters) {
    return rows
  }

  return rows.filter((row) => {
    const normalizedRow = normalizeRow(row)
    const filterMeta = normalizedRow.filterMeta ?? {}

    if (filters.riskLevel !== 'all' && filterMeta.riskLevel !== filters.riskLevel) {
      return false
    }

    if (filters.department !== 'all' && filterMeta.department !== filters.department) {
      return false
    }

    if (filters.anomalyType !== 'all' && filterMeta.anomalyType !== filters.anomalyType) {
      return false
    }

    return true
  })
}

function getFilterOptions(rows, key) {
  return [...new Set(rows.map((row) => normalizeRow(row).filterMeta?.[key]).filter(Boolean))]
}

function renderCellContent(cell) {
  if (typeof cell !== 'object' || cell === null) {
    return cell
  }

  if (cell.kind === 'action-set') {
    return (
      <div className="inline-action-set">
        {cell.actions.map((action) => (
          <button className={`inline-action-chip tone-${action.tone ?? 'neutral'}`} key={action.label} type="button">
            {action.label}
          </button>
        ))}
      </div>
    )
  }

  if (cell.kind === 'reason') {
    return (
      <div className="inline-reason-block">
        <strong>{cell.title}</strong>
        <span>{cell.detail}</span>
      </div>
    )
  }

  return cell.label ?? ''
}

function getTableCellClass(column, cell, row, index) {
  const classes = []

  if (index === row.cells.length - 1 && row.tone) {
    classes.push(`cell-tone-${row.tone}`)
  }

  if (column === 'Flag') {
    classes.push('cell-flag')
  }

  return classes.join(' ')
}

function supportsIssueTooltip(cell) {
  return !(typeof cell === 'object' && cell !== null && cell.kind === 'action-set')
}

const prePayrollPages = [
  {
    id: 'sd-master',
    phase: 'SD Workspace',
    title: 'Employee Scope / Master Data',
    status: 'In Progress',
    accent: 'scope',
    subtitle: '以员工范围和主数据源表为主体，AI 只提示会阻塞后续校验与成本汇总的缺口。',
    stats: [
      ['Included', '486'],
      ['Excluded', '14'],
      ['Data Gaps', '7'],
    ],
    tabs: [
      'New Employee Information',
      'Resigned Employee Information',
      'Employee With Salary Adjustment',
      'Employee With Org Structure Changes',
      'Employee With Bank Detail Changes',
      'Employee With Allowance Adjustment',
    ],
    activeTab: 'Employee With Org Structure Changes',
    currentView: {
      title: 'Employee Verification Data',
      caption: '当前 tab 展示对应 HRMS 源数据汇总，保留现有页面按变更类型查看的工作方式。',
      columns: ['Employee Code', 'Employee Name', 'Join Date', 'Exit Date', 'Company Code', 'Project Code', 'Work Location', 'Cost Centre Code'],
      rows: [
        { rowId: 'scope-andy', cells: ['KT0101', 'Andy', '2022-01-01', '-', 'biu1_AS_2/biu1_AS_2', 'zhappy_SG_1/Zhappy', 'Singapore', 'Missing'] },
        { rowId: 'scope-rose-lim', cells: ['rose1', 'Rose Lim', '2025-01-01', '-', 'CH01/IAC TEST', 'zhappy_SG_1/Zhappy', 'Singapore', 'CH01-SG'], linkedIssueIds: ['scope-missing-cost-centre'] },
        { rowId: 'scope-nora-goh', cells: ['nora8', 'Nora Goh', '2023-03-11', '-', 'CH01/IAC TEST', 'zhappy_AS_1/Zhappy', 'Singapore', 'Pending'], linkedIssueIds: ['scope-effective-date'] },
      ],
    },
    tables: [
      {
        title: 'Employee Verification Details',
        caption: '本次参与 payroll calculation 的员工明细，保留现有页面下半区的参与计算员工清单。',
        columns: ['Selected', 'Employee Code', 'Employee Name', 'Join Date', 'Exit Date', 'Company Code', 'Project Code', 'Remarks'],
        rows: [
          { rowId: 'scope-detail-rose-lim', cells: ['true', 'rose1', 'Rose Lim', '2025-01-01', '-', 'CH01/IAC TEST', 'zhappy_SG_1/Zhappy', 'Ready'], tone: 'normal', linkedIssueIds: ['scope-missing-cost-centre'] },
          { rowId: 'scope-detail-rose6', cells: ['true', 'rose6', 'Rose6', '2025-01-06', '-', '0766649009...', 'zhappy_AS_1/Zhappy', 'Ready'], tone: 'normal' },
          { rowId: 'scope-detail-marcus-tan', cells: ['false', 'marcus3', 'Marcus Tan', '2024-07-14', '-', 'CH01/IAC TEST', 'zhappy_SG_1/Zhappy', 'Approval note missing'], tone: 'warning', linkedIssueIds: ['scope-bank-change'] },
          { rowId: 'scope-detail-nora-goh', cells: ['true', 'nora8', 'Nora Goh', '2023-03-11', '-', 'CH01/IAC TEST', 'zhappy_AS_1/Zhappy', 'Cost centre pending'], tone: 'critical', linkedIssueIds: ['scope-effective-date'] },
        ],
      },
    ],
    ai: {
      executiveSummary: '7 名员工存在主数据就绪风险，其中 4 项会阻塞后续校验或成本汇总，建议先补齐关键字段后再继续。',
      outputs: [
        ['Employees with data gaps', '4'],
        ['Records needing approval note', '1'],
        ['Movement date mismatches', '2'],
      ],
      quickActions: ['Escalate to HRIS owner', 'Export impacted employee list', 'Notify payroll admin'],
      rules: [
        ['Cost Centre Mapping', 'Blocker', '4 employees缺失成本中心，成本汇总无法按组织输出'],
        ['Payroll Eligibility', 'Warning', '1 joiner 仍未确认 payroll eligibility'],
        ['Movement Effective Date', 'Blocker', '2 salary adjustment 生效日期与 payroll period 不一致'],
      ],
      anomalies: [
        {
          id: 'scope-missing-cost-centre',
          severity: 'critical',
          summary: '4 名员工存在主数据缺口，会直接阻塞后续校验与成本汇总。',
          outputs: ['Employees with data gaps', 'Cost centre gap list', 'Readiness blocker list'],
          aiRecommendation: 'Freeze scope only after the cost centre gaps are resolved.',
          quickActions: ['Escalate to HRIS owner', 'Export impacted employee list'],
          title: 'Rose Lim',
          detail: 'Missing cost centre',
          impact: 'Blocks cost summary',
          recommendation: 'Freeze scope only after cost centre gaps are resolved',
        },
        {
          id: 'scope-effective-date',
          severity: 'critical',
          summary: '2 条异动记录的生效日期与 payroll period 不一致，需要在冻结前修正。',
          outputs: ['Movement date mismatch list', 'Payroll impact review'],
          aiRecommendation: 'Correct movement effective dates before continuing to the next stage.',
          quickActions: ['Notify payroll admin', 'Request source correction'],
          title: 'Nora Goh',
          detail: 'Effective date mismatch',
          impact: 'Blocks readiness',
          recommendation: 'Correct movement effective date before continuing',
        },
        {
          id: 'scope-bank-change',
          severity: 'warning',
          summary: '1 条银行信息变更缺少审批说明，仍需要补齐审计证据。',
          outputs: ['Approval note exception list'],
          aiRecommendation: 'Collect the missing approval note or keep the record in manual review.',
          quickActions: ['Remind record owner', 'Mark for manual review'],
          title: 'Marcus Tan',
          detail: 'Bank change without note',
          impact: 'Client visibility required',
          recommendation: 'Exclude records lacking mandatory approval note',
        },
      ],
      actions: ['Save Draft', 'Freeze Employee Scope', 'Continue to Attendance & Leave'],
    },
  },
  {
    id: 'sd-attendance',
    phase: 'SD Workspace',
    title: 'Attendance & Leave',
    status: 'Risk Review',
    accent: 'attendance',
    subtitle: '页面主体仍然是 attendance / leave 源数据表，AI 在右侧集中展示考勤、加班与请假风险。',
    stats: [
      ['Attendance Critical', '6'],
      ['Leave Critical', '3'],
      ['Warning', '14'],
      ['Pending', '2'],
    ],
    tabs: ['Attendance', 'Leave Status', 'OT Compensation', 'Holiday / Rest Day'],
    activeTab: 'OT Compensation',
    currentView: {
      title: 'Leave Attendance Data',
      caption: '按员工汇总当前 tab 的 leave attendance 数据，字段顺序与明细表保持一致，便于上下对照。',
      stickyLastColumn: false,
      columns: ['Flag', 'Employee Code', 'Employee Name', 'Company Code', 'Company Name', 'Holiday Code', 'Holiday Name', 'Allowance Code', 'Allowance Name', 'Holiday Amount'],
      rows: [
        { rowId: 'attendance-andy', cells: ['Critical', 'KT0101', 'Andy', 'biu1_AS_2', 'biu1_AS_2', '#OFF', 'Off Day', '0766651102000000', '基本工资', '14.00'], tone: 'critical', linkedIssueIds: ['attendance-ot-mismatch'], flagReason: 'Amount mismatch vs daily details' },
        { rowId: 'attendance-rose1', cells: ['Warning', 'rose1', 'rose1', 'CH01', 'IAC TEST Company-ch', '#OFF', 'Off Day', '0766651102000000', '基本工资', '14.00'], tone: 'warning', linkedIssueIds: ['attendance-pending-leave'], flagReason: 'Pending leave impact in current period' },
        { rowId: 'attendance-rose6', cells: ['Warning', 'rose6', 'rose6', '0766649009785001', 'HRMS TEST Company-ms', '#OFF', 'Off Day', 'Missing mapping', '基本工资', '14.00'], tone: 'warning', linkedIssueIds: ['attendance-rest-day'], flagReason: 'Missing allowance mapping' },
        { rowId: 'attendance-normal-kto101', cells: ['', 'KTO101', 'Mila Tan', 'SG01', 'IAC SG Company', '#OFF', 'Off Day', '0766651102000000', '基本工资', '12.00'], tone: 'normal' },
        { rowId: 'attendance-normal-rose3', cells: ['', 'rose3', 'rose3', 'CH01', 'IAC TEST Company-ch', '#OFF', 'Off Day', '0766651102000000', '基本工资', '10.00'], tone: 'normal' },
        { rowId: 'attendance-normal-rose5', cells: ['', 'rose5', 'rose5', 'MY01', 'HRMS TEST Company-my', '#OFF', 'Off Day', '0766651102000000', '基本工资', '11.00'], tone: 'normal' },
      ],
    },
    tables: [
      {
        title: 'Leave Attendance Details',
        caption: '按员工 + 日期展示明细数据，前置字段与汇总表一致，额外补充 Holiday Date 方便逐日定位。',
        stickyLastColumn: false,
        columns: ['Flag', 'Employee Code', 'Employee Name', 'Company Code', 'Company Name', 'Holiday Code', 'Holiday Name', 'Allowance Code', 'Allowance Name', 'Holiday Date', 'Holiday Amount'],
        rows: [
          { rowId: 'attendance-detail-andy-0402', cells: ['Critical', 'KT0101', 'Andy', 'biu1_AS_2', 'biu1_AS_2', '#OFF', 'Off Day', '0766651102000000', '基本工资', '2026-04-02', '1.00'], tone: 'critical', linkedIssueIds: ['attendance-ot-mismatch'], flagReason: 'Daily value does not reconcile to header total' },
          { rowId: 'attendance-detail-andy-0404', cells: ['Critical', 'KT0101', 'Andy', 'biu1_AS_2', 'biu1_AS_2', '#OFF', 'Off Day', '0766651102000000', '基本工资', '2026-04-04', '1.00'], tone: 'critical', linkedIssueIds: ['attendance-ot-mismatch'], flagReason: 'Duplicate holiday entry suspected' },
          { rowId: 'attendance-detail-rose1-0402', cells: ['Warning', 'rose1', 'rose1', 'CH01', 'IAC TEST Company-ch', '#OFF', 'Off Day', '0766651102000000', '基本工资', '2026-04-02', '1.00'], tone: 'warning', linkedIssueIds: ['attendance-pending-leave'], flagReason: 'Pending leave approval affects payroll' },
          { rowId: 'attendance-detail-rose6-0402', cells: ['Warning', 'rose6', 'rose6', '0766649009785001', 'HRMS TEST Company-ms', '#OFF', 'Off Day', 'Missing mapping', '基本工资', '2026-04-02', '1.00'], tone: 'warning', linkedIssueIds: ['attendance-rest-day'], flagReason: 'Allowance code missing in source mapping' },
          { rowId: 'attendance-detail-mila-0402', cells: ['', 'KTO101', 'Mila Tan', 'SG01', 'IAC SG Company', '#OFF', 'Off Day', '0766651102000000', '基本工资', '2026-04-02', '1.00'], tone: 'normal' },
          { rowId: 'attendance-detail-mila-0404', cells: ['', 'KTO101', 'Mila Tan', 'SG01', 'IAC SG Company', '#OFF', 'Off Day', '0766651102000000', '基本工资', '2026-04-04', '1.00'], tone: 'normal' },
          { rowId: 'attendance-detail-rose3-0402', cells: ['', 'rose3', 'rose3', 'CH01', 'IAC TEST Company-ch', '#OFF', 'Off Day', '0766651102000000', '基本工资', '2026-04-02', '1.00'], tone: 'normal' },
          { rowId: 'attendance-detail-rose3-0404', cells: ['', 'rose3', 'rose3', 'CH01', 'IAC TEST Company-ch', '#OFF', 'Off Day', '0766651102000000', '基本工资', '2026-04-04', '1.00'], tone: 'normal' },
          { rowId: 'attendance-detail-rose5-0402', cells: ['', 'rose5', 'rose5', 'MY01', 'HRMS TEST Company-my', '#OFF', 'Off Day', '0766651102000000', '基本工资', '2026-04-02', '1.00'], tone: 'normal' },
        ],
      },
    ],
    ai: {
      executiveSummary: '8 名员工有未经批准或异常的 OT / leave 记录，总计 42 小时待确认加班，3 条请假记录会直接影响本期薪资。',
      outputs: [
        ['Unapproved OT employee list', '8'],
        ['Leave impacting pay list', '3'],
        ['Missing punch exceptions', '3'],
      ],
      quickActions: ['Escalate to leave approver', 'Approve flagged OT', 'Send Email / Slack summary'],
      rules: [
        ['OT Mismatch', 'Blocker', '3 unresolved records will distort payment'],
        ['Holiday Attendance', 'Warning', '2 records require eligibility validation'],
        ['Pending Leave Impact', 'Blocker', '2 leave approvals still pending'],
        ['Negative Leave Balance', 'Warning', 'Manual deduction handling needed'],
      ],
      anomalies: [
        {
          id: 'attendance-ot-mismatch',
          severity: 'critical',
          summary: '8 名员工有未经批准或异常的 OT 记录，总计 42 小时待确认加班。',
          outputs: ['Unapproved OT employee list', 'OT mismatch report', 'Hours exposure summary'],
          aiRecommendation: 'Approve or correct the flagged OT records before payroll is finalised.',
          quickActions: ['Approve flagged OT', 'Send Email / Slack summary'],
          title: 'James Wong',
          detail: 'Submitted OT exceeds system OT by 6.5h',
          impact: 'Potential overpayment',
          recommendation: 'Resolve OT mismatch before moving to readiness',
        },
        {
          id: 'attendance-pending-leave',
          severity: 'critical',
          summary: '3 条待处理请假会直接影响本期薪资，需要在跑薪前确认审批结果。',
          outputs: ['Leave impacting pay list', 'Deduction simulation list'],
          aiRecommendation: 'Escalate the leave requests to approvers and hold the payroll decision until confirmed.',
          quickActions: ['Escalate to leave approver', 'Hold payroll decision'],
          title: 'Sarah Chen',
          detail: 'Pending leave may reduce pay by SGD 320',
          impact: 'Needs manager decision',
          recommendation: 'Keep pending leave items visible until approval outcome returns',
        },
        {
          id: 'attendance-rest-day',
          severity: 'warning',
          summary: '存在休息日 / 假日出勤但缺少审批证明的记录，需要补证或接受风险。',
          outputs: ['Rest-day attendance exception list'],
          aiRecommendation: 'Request approval evidence first; accept risk only when business confirms it is valid.',
          quickActions: ['Request approval evidence', 'Accept flagged item'],
          title: 'Daniel Lee',
          detail: 'Rest-day attendance without approval proof',
          impact: 'Review required',
          recommendation: 'Attach approval evidence or mark the risk as accepted',
        },
      ],
      actions: ['Mark Resolved', 'Accept Warning', 'Continue to Payroll Interface'],
    },
  },
  {
    id: 'sd-interface',
    phase: 'SD Workspace',
    title: 'Payroll Interface / Ad-Hoc',
    status: 'In Review',
    accent: 'interface',
    subtitle: '以 interface 源数据表为主，AI 只负责把 duplicate、cap、approval、outlier 风险收拢出来。',
    stats: [
      ['Duplicates', '4'],
      ['Cap Breach', '2'],
      ['Approval Missing', '3'],
      ['Pending Baseline', '5'],
    ],
    tabs: ['Claims & Reimbursements', 'Allowances', 'Loans & Deductions', 'Claim Status / Approval'],
    activeTab: 'Allowances',
    currentView: {
      title: 'Payroll Interface Data',
      caption: '按员工汇总当前 tab 的 payroll interface 数据，字段顺序与明细表尽量保持一致。',
      stickyLastColumn: false,
      columns: ['Flag', 'Employee', 'Allowance', 'Company', 'Claim', 'Claim Amount'],
      rows: [
        { rowId: 'interface-xpf013', cells: ['Critical', 'XPF013 - zhang san', '#AR_BASC', 'XPF - X-PRESS FEEDERS', 'testclaim - testclaim', '33.00'], tone: 'critical', linkedIssueIds: ['interface-cap-breach'], flagReason: 'Claim amount breaches configured allowance cap' },
        { rowId: 'interface-ava-lim', cells: ['Warning', 'AVA021 - Ava Lim', '#MEAL', 'IAC - APAC HQ', 'meal-0426 - lunch subsidy', '220.00'], tone: 'warning', linkedIssueIds: ['interface-missing-approval'], flagReason: 'Approval evidence is still missing' },
        { rowId: 'interface-nora-goh', cells: ['Critical', 'NGH008 - Nora Goh', '#LN_DED', 'IAC - SG Services', 'loan-dup-01 - payroll deduction', '420.00'], tone: 'critical', linkedIssueIds: ['interface-duplicate-deduction'], flagReason: 'Duplicate deduction suspected in current batch' },
        { rowId: 'interface-normal-marcus', cells: ['', 'MTS015 - Marcus Tan', '#BONUS', 'IAC - Commercial', 'bonus-apr - bonus payout', '1260.00'], tone: 'normal' },
        { rowId: 'interface-normal-julia', cells: ['', 'JLY002 - Julia Tan', '#TRAVEL', 'IAC - Operations', 'travel-claim-22 - taxi', '48.00'], tone: 'normal' },
      ],
    },
    tables: [
      {
        title: 'Payroll Interface Details',
        caption: '按员工 + claim 明细展示当前选中视图的数据，前置字段与 summary 保持相近。',
        stickyLastColumn: false,
        columns: ['Flag', 'Employee', 'Company', 'Claim', 'Claim Date', 'Claim Amount', 'Approval Date', 'Allowance'],
        rows: [
          { rowId: 'interface-detail-xpf013', cells: ['Critical', 'XPF013 - zhang san', 'XPF - X-PRESS FEEDERS', 'testclaim - testclaim', '2023-04-12T00:00:00', '33.00', '2023-04-12 14:25 (UTC+8)', '#AR_BASC'], tone: 'critical', linkedIssueIds: ['interface-cap-breach'], flagReason: 'Claim amount breaches configured allowance cap' },
          { rowId: 'interface-detail-ava-lim', cells: ['Warning', 'AVA021 - Ava Lim', 'IAC - APAC HQ', 'meal-0426 - lunch subsidy', '2026-04-26T00:00:00', '220.00', '-', '#MEAL'], tone: 'warning', linkedIssueIds: ['interface-missing-approval'], flagReason: 'Approval evidence is still missing' },
          { rowId: 'interface-detail-nora-goh', cells: ['Critical', 'NGH008 - Nora Goh', 'IAC - SG Services', 'loan-dup-01 - payroll deduction', '2026-04-20T00:00:00', '420.00', '2026-04-20 09:10 (UTC+8)', '#LN_DED'], tone: 'critical', linkedIssueIds: ['interface-duplicate-deduction'], flagReason: 'Duplicate deduction suspected in current batch' },
          { rowId: 'interface-detail-marcus', cells: ['', 'MTS015 - Marcus Tan', 'IAC - Commercial', 'bonus-apr - bonus payout', '2026-04-25T00:00:00', '1260.00', '2026-04-25 16:00 (UTC+8)', '#BONUS'], tone: 'normal' },
          { rowId: 'interface-detail-julia', cells: ['', 'JLY002 - Julia Tan', 'IAC - Operations', 'travel-claim-22 - taxi', '2026-04-18T00:00:00', '48.00', '2026-04-18 11:08 (UTC+8)', '#TRAVEL'], tone: 'normal' },
        ],
      },
    ],
    ai: {
      executiveSummary: '当前 interface 输入中有 5 项高风险和 5 项警告，重点集中在津贴超上限、缺审批附件和重复扣款。',
      outputs: [
        ['Policy cap breach list', '2'],
        ['Missing approval item list', '3'],
        ['Duplicate detection report', '4'],
      ],
      quickActions: ['Trigger approval workflow', 'Notify item owner', 'Export flagged items'],
      rules: [
        ['Duplicate Detection', 'Blocker', '4 duplicate items remain unresolved'],
        ['Policy Limit Validation', 'Blocker', '2 cap breaches require exclusion or correction'],
        ['Approval Workflow Check', 'Warning', '3 items missing sign-off evidence'],
        ['Historical Amount Outlier', 'Pending', '5 items lack sufficient baseline'],
      ],
      anomalies: [
        {
          id: 'interface-cap-breach',
          severity: 'critical',
          summary: '2 条津贴输入超过政策上限，存在超额支付风险。',
          outputs: ['Policy cap breach list', 'Cap difference summary'],
          aiRecommendation: 'Correct or exclude the items that breach policy caps before processing.',
          quickActions: ['Trigger approval workflow', 'Export flagged items'],
          title: 'James Wong',
          detail: 'Transport allowance cap breach',
          impact: 'Possible SGD 300 overpayment',
          recommendation: 'Exclude cap breach items unless corrected',
        },
        {
          id: 'interface-missing-approval',
          severity: 'warning',
          summary: '3 条人工输入缺少审批附件，当前无法完整校验支付依据。',
          outputs: ['Missing approval item list'],
          aiRecommendation: 'Hold these items until approval evidence is attached and verified.',
          quickActions: ['Notify item owner', 'Hold item pending evidence'],
          title: 'Ava Lim',
          detail: 'Missing approval attachment',
          impact: 'Cannot fully validate payment',
          recommendation: 'Hold the item until approval evidence is attached',
        },
        {
          id: 'interface-duplicate-deduction',
          severity: 'critical',
          summary: '检测到重复扣款迹象，若不处理可能造成双重扣款。',
          outputs: ['Duplicate detection report', 'Impacted employee list'],
          aiRecommendation: 'Open a duplicate review and remove duplicated deductions before payroll run.',
          quickActions: ['Open duplicate review', 'Escalate to payroll admin'],
          title: 'Nora Goh',
          detail: 'Loan deduction duplicated',
          impact: 'Double deduction risk',
          recommendation: 'Leave historical outliers visible with explanation if retained',
        },
      ],
      actions: ['Include', 'Exclude with Reason', 'Mark for Review', 'Continue to Payroll Variance Predictor'],
    },
  },
  {
    id: 'sd-variance',
    phase: 'Shared Workspace',
    title: 'Payroll Variance Predictor',
    status: 'Threshold Breach',
    accent: 'variance',
    subtitle: 'A4 是独立的预计算成本估算页，面向 HR、SD 与 Manager 做 payroll run 前的波动检查、解释与预警。',
    stats: [
      ['Estimate', 'SGD 2.40M'],
      ['MoM Variance', '+14.0%'],
      ['Threshold Breaches', '3'],
      ['Configured Threshold', '10%'],
    ],
    tabs: ['Department View', 'Cost Centre', 'Employee Type', 'Threshold Breaches', 'Narrative'],
    activeTab: 'Department View',
    summaryPanelsByTab: {
      'Department View': [
        {
          eyebrow: 'Threshold Breach Alert',
          title: '3 departments and 7 cost centres exceeded the configured 10% MoM threshold.',
          value: 'Sales +18.6%',
          detail: 'Sales carries the largest breach after the annual incentive run. Engineering and Operations also moved above threshold because of new joiners and salary adjustments.',
          bullets: [
            'Sales: bonus run added SGD 120K and pushed total estimate to SGD 766K.',
            'Engineering: 8 new hires added SGD 85K and moved the department to +12.1%.',
            'Operations: 2 promotions and allowance changes moved payroll cost to +10.7%.',
          ],
          actions: ['View all breaches', 'Notify stakeholders'],
        },
        {
          eyebrow: 'AI Narrative Summary',
          title: 'The current estimate is explainable, but not yet fully socialised to Finance and managers.',
          value: 'Top drivers identified',
          detail: 'Most of the increase is driven by expected business changes rather than a single unexplained anomaly. Bonus run timing is the largest one-off factor this month.',
          bullets: [
            'What changed: total estimated payroll rose from SGD 2.10M to SGD 2.40M.',
            'Why it changed: new hires, annual bonuses, and promotion-related salary changes.',
            'What needs attention: departments above threshold still need business explanation attached.',
          ],
          actions: ['Open narrative summary', 'Request explanation'],
        },
      ],
      'Cost Centre': [
        {
          eyebrow: 'Concentration View',
          title: 'Breach risk is concentrated in a few cost centres rather than spread evenly across departments.',
          value: '3 breached centres',
          detail: 'This tab is for pinpointing where the variance physically sits in the organisation. It is the best view when department-level totals are too coarse to act on.',
          bullets: [
            'Sales East explains most of the Sales spike.',
            'Engineering Platform absorbs the joiner-driven uplift.',
            'Operations Hub remains a watch item near threshold.',
          ],
          actions: ['Open affected cost centres', 'Export cost-centre report'],
        },
        {
          eyebrow: 'Owner Routing',
          title: 'Cost-centre view is the fastest way to identify who should explain or approve a localised spike.',
          value: '7 centres monitored',
          detail: 'Use this tab to decide which local owners need to be tagged before payroll processing continues.',
          bullets: [
            'Breached centres should get owner acknowledgement.',
            'Watch items stay visible for budget control.',
            'Offsets remain visible to show net movement, not only spikes.',
          ],
          actions: ['Notify stakeholders', 'Mark variance reviewed'],
        },
      ],
      'Employee Type': [
        {
          eyebrow: 'Workforce Mix',
          title: 'The increase is driven more by workforce mix changes than by broad salary inflation.',
          value: '3 key segments',
          detail: 'Employee-type view separates new headcount, incentive earners, supervisors and support populations so the team can explain the estimate in workforce terms.',
          bullets: [
            'Engineer population drives fixed-cost uplift.',
            'Sales incentive earners drive the variable-pay spike.',
            'Support staff exits partially offset the total increase.',
          ],
          actions: ['Open employee-type report', 'Request explanation'],
        },
        {
          eyebrow: 'Manager Lens',
          title: 'Use this when the business asks which kind of people caused the movement, not just which department.',
          value: 'Workforce planning view',
          detail: 'This tab is especially useful for manager review and workforce planning because it reframes the variance as population change instead of org-structure change.',
          bullets: [
            'Separates structural growth from seasonal payouts.',
            'Makes mix-shift easier to explain than a flat org chart.',
            'Supports budget-sensitive conversations.',
          ],
          actions: ['Open narrative summary', 'Export variance report'],
        },
      ],
      'Threshold Breaches': [
        {
          eyebrow: 'Action Queue',
          title: 'This tab strips away normal movement and leaves only the items that need escalation or acknowledgement.',
          value: '3 active breaches',
          detail: 'Use it as the operational queue for alerts, owner assignment and explanation tracking.',
          bullets: [
            'Best tab for escalation work.',
            'Removes within-threshold noise from the review flow.',
            'Keeps send-state and owner visible together.',
          ],
          actions: ['Notify stakeholders', 'View all breaches'],
        },
        {
          eyebrow: 'Escalation Priority',
          title: 'Sales is the clearest Finance alert. Engineering and Operations are manager-led explanation items.',
          value: '1 Finance / 2 manager',
          detail: 'This prevents over-alerting while preserving a clean escalation trail.',
          bullets: [
            'Sales should carry a budget note to Finance.',
            'Engineering should be validated with the hiring manager.',
            'Operations stays visible unless variance increases further.',
          ],
          actions: ['Send threshold alert', 'Open stakeholder queue'],
        },
      ],
      Narrative: [
        {
          eyebrow: 'Narrative Package',
          title: 'This tab turns the dashboard into reusable explanation blocks for internal or client-facing communication.',
          value: '1 reusable summary',
          detail: 'The goal here is not another metric table. It is a clear explanation of what changed, why it changed, and what still needs acknowledgement.',
          bullets: [
            'Summarises the estimate in business language.',
            'Separates expected drivers from active review items.',
            'Supports manager briefing and client prep.',
          ],
          actions: ['Open narrative summary', 'Export variance report'],
        },
        {
          eyebrow: 'Approval Readiness',
          title: 'Narrative quality matters because unexplained spikes create escalation even when the numbers are valid.',
          value: 'Explanation attached',
          detail: 'This view helps the team decide whether the estimate is explained well enough to move forward.',
          bullets: [
            'Attach explanation before sending high-variance packages.',
            'Show both increases and offsets to avoid one-sided interpretation.',
            'Keep audience and owner note visible in the same place.',
          ],
          actions: ['Request explanation', 'Mark variance reviewed'],
        },
      ],
    },
    tabViews: {
      'Department View': {
        title: 'Variance Dashboard',
        caption: '按 Department 展示预估 payroll cost 与上月对比，先看哪些部门推动了整体波动。',
        columns: ['Department', 'Current Estimate', 'Previous Month', 'Variance %', 'Threshold Status', 'Top Driver'],
        rows: [
          { rowId: 'variance-sales', cells: ['Sales', 'SGD 766K', 'SGD 646K', '+18.6%', 'Breach', 'Annual bonus run'], tone: 'critical', linkedIssueIds: ['variance-threshold-breach'] },
          { rowId: 'variance-engineering', cells: ['Engineering', 'SGD 788K', 'SGD 703K', '+12.1%', 'Breach', '8 new hires'], tone: 'critical', linkedIssueIds: ['variance-threshold-breach'] },
          { rowId: 'variance-operations', cells: ['Operations', 'SGD 476K', 'SGD 430K', '+10.7%', 'Breach', 'Promotions + allowance'], tone: 'warning', linkedIssueIds: ['variance-driver-mix'] },
          { rowId: 'variance-support', cells: ['Support', 'SGD 370K', 'SGD 388K', '-4.6%', 'Within threshold', '2 leavers'], tone: 'normal', linkedIssueIds: ['variance-downward-shift'] },
        ],
      },
      'Cost Centre': {
        title: 'Cost Centre View',
        caption: '聚焦成本中心层级，定位部门波动究竟集中在哪些 cost centre。',
        columns: ['Cost Centre', 'Department', 'Current Estimate', 'Previous Month', 'Variance %', 'Threshold Status', 'Main Driver'],
        rows: [
          { rowId: 'variance-centre-sales-east', cells: ['CC-SALES-EAST', 'Sales', 'SGD 248K', 'SGD 205K', '+21.2%', 'Breach', 'Incentive payout'], tone: 'critical', linkedIssueIds: ['variance-threshold-breach'] },
          { rowId: 'variance-centre-sales-regional', cells: ['CC-SALES-REG', 'Sales', 'SGD 196K', 'SGD 184K', '+6.5%', 'Within threshold', 'Quarterly allowance'], tone: 'normal' },
          { rowId: 'variance-centre-eng-platform', cells: ['CC-ENG-PLT', 'Engineering', 'SGD 312K', 'SGD 274K', '+13.8%', 'Breach', '4 joiners'], tone: 'critical', linkedIssueIds: ['variance-threshold-breach'] },
          { rowId: 'variance-centre-ops-hub', cells: ['CC-OPS-HUB', 'Operations', 'SGD 128K', 'SGD 117K', '+9.4%', 'Watch', 'Promotion uplift'], tone: 'warning', linkedIssueIds: ['variance-driver-mix'] },
        ],
      },
      'Employee Type': {
        title: 'Employee Type View',
        caption: '按员工类型拆分固定薪与可变薪影响，帮助说明 workforce mix 对成本的拉动。',
        columns: ['Employee Type', 'Current Estimate', 'Previous Month', 'Variance Amount', 'Variance %', 'Primary Driver'],
        rows: [
          { rowId: 'variance-type-engineer', cells: ['Engineer', 'SGD 682K', 'SGD 604K', '+SGD 78K', '+12.9%', '8 new hires'], tone: 'critical', linkedIssueIds: ['variance-driver-mix'] },
          { rowId: 'variance-type-sales', cells: ['Sales Incentive Earner', 'SGD 544K', 'SGD 438K', '+SGD 106K', '+24.2%', 'Bonus / incentive run'], tone: 'critical', linkedIssueIds: ['variance-threshold-breach'] },
          { rowId: 'variance-type-supervisor', cells: ['Supervisor', 'SGD 186K', 'SGD 173K', '+SGD 13K', '+7.5%', 'Promotion uplift'], tone: 'warning', linkedIssueIds: ['variance-driver-mix'] },
          { rowId: 'variance-type-support', cells: ['Support Staff', 'SGD 176K', 'SGD 186K', '-SGD 10K', '-5.4%', '2 leavers'], tone: 'normal', linkedIssueIds: ['variance-downward-shift'] },
        ],
      },
      'Threshold Breaches': {
        title: 'Threshold Breach Queue',
        caption: '只保留超过阈值或接近阈值的对象，用于快速处理 escalation 与 alert 发送。',
        columns: ['Scope', 'Dimension', 'Variance %', 'Reason', 'Owner', 'Alert State'],
        rows: [
          { rowId: 'variance-breach-sales', cells: ['Department', 'Sales', '+18.6%', 'Annual bonus run', 'SD-Kevin', 'Finance alert pending'], tone: 'critical', linkedIssueIds: ['variance-threshold-breach'] },
          { rowId: 'variance-breach-eng-platform', cells: ['Cost Centre', 'CC-ENG-PLT', '+13.8%', '4 new hires', 'HR-Maya', 'Manager review'], tone: 'critical', linkedIssueIds: ['variance-threshold-breach'] },
          { rowId: 'variance-breach-engineering', cells: ['Department', 'Engineering', '+12.1%', '8 new hires', 'HR-Maya', 'Ready to send'], tone: 'warning', linkedIssueIds: ['variance-threshold-breach'] },
          { rowId: 'variance-breach-operations', cells: ['Department', 'Operations', '+10.7%', 'Promotions + allowance', 'SD-Fran', 'Needs explanation'], tone: 'warning', linkedIssueIds: ['variance-driver-mix'] },
        ],
      },
      Narrative: {
        title: 'Narrative Summary',
        caption: '把 variance 结果转成可复用的解释文本，适合内部汇报和客户沟通准备。',
        columns: ['Narrative Section', 'Current Draft', 'Evidence Source', 'Audience'],
        rows: [
          { rowId: 'variance-narrative-what', cells: ['What changed', 'Estimated payroll increased from SGD 2.10M to SGD 2.40M (+14.0%).', 'MoM variance dashboard', 'Finance / Manager'], tone: 'critical', linkedIssueIds: ['variance-threshold-breach'] },
          { rowId: 'variance-narrative-why', cells: ['Why it changed', 'Increase mainly driven by 8 Engineering hires, Sales bonus run, and 2 promotions in Operations.', 'Driver breakdown', 'Manager / Client-facing SD'], tone: 'warning', linkedIssueIds: ['variance-driver-mix'] },
          { rowId: 'variance-narrative-attention', cells: ['What needs attention', 'Sales and Engineering exceeded threshold and should carry explanation before processing.', 'Threshold breach queue', 'Finance / Payroll Admin'], tone: 'critical', linkedIssueIds: ['variance-threshold-breach'] },
          { rowId: 'variance-narrative-offset', cells: ['Offset / balancing note', 'Support cost decreased because of 2 leavers, partially offsetting total increase.', 'Department drill-down', 'Finance / Manager'], tone: 'normal', linkedIssueIds: ['variance-downward-shift'] },
        ],
      },
    },
    tabTables: {
      'Department View': [
        {
          title: 'Driver Breakdown',
          caption: '把波动结果拆成业务驱动，帮助 HR、SD、Manager 在 payroll run 前完成解释与确认。',
          columns: ['Driver Type', 'Impacted Headcount', 'Estimated Impact', 'Departments', 'Expected?', 'Reviewer Note'],
          rows: [
            { rowId: 'variance-driver-hires', cells: ['New Hires', '8', '+SGD 85K', 'Engineering', 'Yes', 'Planned headcount ramp-up'], tone: 'normal', linkedIssueIds: ['variance-driver-mix'] },
            { rowId: 'variance-driver-bonus', cells: ['Bonus / Incentive Runs', '26', '+SGD 120K', 'Sales', 'Yes', 'Annual incentive cycle'], tone: 'warning', linkedIssueIds: ['variance-threshold-breach'] },
            { rowId: 'variance-driver-promo', cells: ['Salary Adjustments / Promotions', '2', '+SGD 15K', 'Operations', 'Yes', 'Needs manager explanation'], tone: 'warning', linkedIssueIds: ['variance-driver-mix'] },
            { rowId: 'variance-driver-leavers', cells: ['Resignations / Leavers', '2', '-SGD 18K', 'Support', 'Yes', 'Expected offset against hiring cost'], tone: 'normal', linkedIssueIds: ['variance-downward-shift'] },
          ],
        },
      ],
      'Cost Centre': [],
      'Employee Type': [
        {
          title: 'Employee Type Driver Breakdown',
          caption: '从人群维度解释 variance，适合 workforce mix 和 compensation mix 分析。',
          columns: ['Employee Type', 'Impacted Headcount', 'Fixed Pay Impact', 'Variable Pay Impact', 'Main Driver', 'Comment'],
          rows: [
            { rowId: 'variance-type-detail-engineer', cells: ['Engineer', '8', '+SGD 71K', '+SGD 7K', 'New hires', 'Hiring wave'], tone: 'critical', linkedIssueIds: ['variance-driver-mix'] },
            { rowId: 'variance-type-detail-sales', cells: ['Sales Incentive Earner', '26', '+SGD 14K', '+SGD 92K', 'Bonus run', 'One-off seasonal spike'], tone: 'critical', linkedIssueIds: ['variance-threshold-breach'] },
            { rowId: 'variance-type-detail-support', cells: ['Support Staff', '2', '-SGD 10K', '0', 'Leavers', 'Partial offset'], tone: 'normal', linkedIssueIds: ['variance-downward-shift'] },
          ],
        },
      ],
      'Threshold Breaches': [],
      Narrative: [],
    },
    ai: {
      executiveSummary: '预估 payroll cost 为 SGD 2.40M，较上月增加 14.0%。系统已识别主要驱动因素，并发现 3 个部门超过 10% 阈值，需要在 payroll run 前完成说明或预警。',
      outputs: [
        ['Variance dashboard', '1'],
        ['AI narrative summary', '1'],
        ['Threshold breach alert queue', '3'],
      ],
      quickActions: ['Notify stakeholders', 'Export variance report', 'Open affected cost centres'],
      rules: [
        ['Estimate Generated', 'Pass', 'Pre-calculation estimate is available for the current snapshot'],
        ['MoM Comparison Ready', 'Pass', 'Department and cost-centre comparisons are generated'],
        ['Threshold Breach Detection', 'Warning', '3 departments are above the configured 10% threshold'],
        ['Narrative Explanation', 'Pass', 'Top drivers are explained in AI-written summary'],
      ],
      anomalies: [
        {
          id: 'variance-threshold-breach',
          severity: 'critical',
          summary: '3 个部门超过 10% MoM 阈值，其中 Sales 达到 +18.6%，需要在 payroll run 前完成业务说明或预警。',
          outputs: ['Threshold breach dashboard', 'Finance / management alert queue', 'Department drill-down'],
          aiRecommendation: 'Escalate breached departments to Finance or managers before final payroll processing.',
          quickActions: ['Notify stakeholders', 'Open affected cost centres'],
          title: 'Threshold Breach',
          detail: 'Departments above configured MoM threshold',
          impact: 'Requires Finance / management visibility',
          recommendation: 'Attach explanation or send alert before moving forward',
        },
        {
          id: 'variance-driver-mix',
          severity: 'warning',
          summary: '主要成本变动由新入职、奖金和调薪驱动，属于可解释波动，但仍需把 explanation 补到 review 流里。',
          outputs: ['Driver breakdown', 'Narrative summary'],
          aiRecommendation: 'Capture expected business drivers clearly so reviewers do not misread the increase as unexplained exposure.',
          quickActions: ['Open narrative summary', 'Request explanation'],
          title: 'Driver Mix',
          detail: 'Variance driven by hires, incentives, and salary changes',
          impact: 'Needs reviewer context',
          recommendation: 'Record business explanation for each material driver',
        },
        {
          id: 'variance-downward-shift',
          severity: 'info',
          summary: 'Support 部门出现 -4.6% 的成本回落，主要由离职带来，可作为总成本变化的部分对冲项。',
          outputs: ['Department drill-down', 'Downward variance note'],
          aiRecommendation: 'Keep downward shifts visible so stakeholders see both cost increases and offsets.',
          quickActions: ['Open department drill-down', 'Export variance report'],
          title: 'Downward Shift',
          detail: 'Leaver-driven offset in Support',
          impact: 'Useful management context',
          recommendation: 'Show both upward and downward variance in the final explanation',
        },
      ],
      actions: ['Send threshold alert', 'Mark variance reviewed', 'Send to Client Confirmation'],
    },
  },
  {
    id: 'client-confirm',
    phase: 'Client Workspace',
    title: 'Confirm PrePayroll Snapshot',
    status: 'Pending Confirmation',
    accent: 'client',
    subtitle: '客户端通过三个总 tab 查看与 SD 对应的数据包。切到具体模块时，直接查看该模块的 AI 分析、summary 和明细数据。',
    stats: [
      ['Snapshot', 'APR-2026-V3'],
      ['Included', '559'],
      ['Open Risks', '5'],
      ['Excluded', '31'],
    ],
    tabs: ['Employee Verification Data', 'Leave Attendance Data', 'Payroll Interface Data'],
    activeTab: 'Employee Verification Data',
    subTabsByTab: {
      'Employee Verification Data': [
        'New Employee Information',
        'Resigned Employee Information',
        'Employee With Salary Adjustment',
        'Employee With Org Structure Changes',
        'Employee With Bank Detail Changes',
        'Employee With Allowance Adjustment',
      ],
      'Leave Attendance Data': ['Attendance', 'Leave Status', 'OT Compensation', 'Holiday / Rest Day'],
      'Payroll Interface Data': ['Claims & Reimbursements', 'Allowances', 'Loans & Deductions', 'Claim Status / Approval'],
    },
    currentView: {
      title: 'Employee Verification Data',
      caption: '客户切到 Employee Verification Data 后，直接查看本次 snapshot 中的员工范围源数据。',
      columns: ['Employee Code', 'Employee Name', 'Join Date', 'Exit Date', 'Company Code', 'Project Code', 'Work Location', 'Cost Centre Code'],
      rows: [
        { rowId: 'client-scope-andy', cells: ['KT0101', 'Andy', '2022-01-01', '-', 'biu1_AS_2/biu1_AS_2', 'zhappy_SG_1/Zhappy', 'Singapore', 'Missing'] },
        { rowId: 'client-scope-rose-lim', cells: ['rose1', 'Rose Lim', '2025-01-01', '-', 'CH01/IAC TEST', 'zhappy_SG_1/Zhappy', 'Singapore', 'CH01-SG'], linkedIssueIds: ['client-current-package'] },
        { rowId: 'client-scope-nora-goh', cells: ['nora8', 'Nora Goh', '2023-03-11', '-', 'CH01/IAC TEST', 'zhappy_AS_1/Zhappy', 'Singapore', 'Pending'], linkedIssueIds: ['client-current-package'] },
      ],
    },
    tabViews: {
      'Employee Verification Data': {
        title: 'Employee Verification Data',
        caption: '与 SD 侧员工校验页一致，客户在这里查看员工范围源数据与异动员工 summary。',
        columns: ['Employee Code', 'Employee Name', 'Join Date', 'Exit Date', 'Company Code', 'Project Code', 'Work Location', 'Cost Centre Code'],
        rows: [
          { rowId: 'client-view-scope-andy', cells: ['KT0101', 'Andy', '2022-01-01', '-', 'biu1_AS_2/biu1_AS_2', 'zhappy_SG_1/Zhappy', 'Singapore', 'Missing'] },
          { rowId: 'client-view-scope-rose-lim', cells: ['rose1', 'Rose Lim', '2025-01-01', '-', 'CH01/IAC TEST', 'zhappy_SG_1/Zhappy', 'Singapore', 'CH01-SG'], linkedIssueIds: ['client-current-package'] },
          { rowId: 'client-view-scope-nora-goh', cells: ['nora8', 'Nora Goh', '2023-03-11', '-', 'CH01/IAC TEST', 'zhappy_AS_1/Zhappy', 'Singapore', 'Pending'], linkedIssueIds: ['client-current-package'] },
        ],
      },
      'Leave Attendance Data': {
        title: 'Leave Attendance Data',
        caption: '与 SD 侧 attendance / leave 页一致，客户在这里查看考勤、请假、OT 的 summary 与明细。',
        stickyLastColumn: false,
        columns: ['Flag', 'Employee Code', 'Employee Name', 'Company Code', 'Company Name', 'Holiday Code', 'Holiday Name', 'Allowance Code', 'Allowance Name', 'Holiday Amount'],
        rows: [
          { rowId: 'client-attendance-andy', cells: ['Critical', 'KT0101', 'Andy', 'biu1_AS_2', 'biu1_AS_2', '#OFF', 'Off Day', '0766651102000000', '基本工资', '14.00'], tone: 'critical', linkedIssueIds: ['client-current-package'], flagReason: 'Amount mismatch vs daily details' },
          { rowId: 'client-attendance-rose1', cells: ['Warning', 'rose1', 'rose1', 'CH01', 'IAC TEST Company-ch', '#OFF', 'Off Day', '0766651102000000', '基本工资', '14.00'], tone: 'warning', linkedIssueIds: ['client-current-package'], flagReason: 'Pending leave impact in current period' },
          { rowId: 'client-attendance-rose6', cells: ['Warning', 'rose6', 'rose6', '0766649009785001', 'HRMS TEST Company-ms', '#OFF', 'Off Day', 'Missing mapping', '基本工资', '14.00'], tone: 'warning', linkedIssueIds: ['client-boundary'], flagReason: 'Missing allowance mapping' },
          { rowId: 'client-attendance-normal-kto101', cells: ['', 'KTO101', 'Mila Tan', 'SG01', 'IAC SG Company', '#OFF', 'Off Day', '0766651102000000', '基本工资', '12.00'], tone: 'normal' },
        ],
      },
      'Payroll Interface Data': {
        title: 'Payroll Interface Data',
        caption: '与 SD 侧 payroll interface 页一致，客户在这里查看 interface 输入的 summary 和 claim 级明细。',
        stickyLastColumn: false,
        columns: ['Flag', 'Employee', 'Allowance', 'Company', 'Claim', 'Claim Amount'],
        rows: [
          { rowId: 'client-interface-xpf013', cells: ['Critical', 'XPF013 - zhang san', '#AR_BASC', 'XPF - X-PRESS FEEDERS', 'testclaim - testclaim', '33.00'], tone: 'critical', linkedIssueIds: ['client-current-package'], flagReason: 'Claim amount breaches configured allowance cap' },
          { rowId: 'client-interface-ava-lim', cells: ['Warning', 'AVA021 - Ava Lim', '#MEAL', 'IAC - APAC HQ', 'meal-0426 - lunch subsidy', '220.00'], tone: 'warning', linkedIssueIds: ['client-current-package'], flagReason: 'Approval evidence is still missing' },
          { rowId: 'client-interface-nora-goh', cells: ['Critical', 'NGH008 - Nora Goh', '#LN_DED', 'IAC - SG Services', 'loan-dup-01 - payroll deduction', '420.00'], tone: 'critical', linkedIssueIds: ['client-current-package'], flagReason: 'Duplicate deduction suspected in current batch' },
          { rowId: 'client-interface-normal-marcus', cells: ['', 'MTS015 - Marcus Tan', '#BONUS', 'IAC - Commercial', 'bonus-apr - bonus payout', '1260.00'], tone: 'normal' },
        ],
      },
    },
    subTabViewsByTab: {
      'Employee Verification Data': {
        'New Employee Information': {
          title: 'Employee Verification Data',
          caption: '当前二级 tab 为 New Employee Information，客户查看本次 snapshot 中的新入职员工数据。',
          columns: ['Employee Code', 'Employee Name', 'Join Date', 'Exit Date', 'Company Code', 'Project Code', 'Work Location', 'Cost Centre Code'],
          rows: [
            { rowId: 'client-joiner-rose-lim', cells: ['rose1', 'Rose Lim', '2025-01-01', '-', 'CH01/IAC TEST', 'zhappy_SG_1/Zhappy', 'Singapore', 'CH01-SG'], linkedIssueIds: ['client-current-package'] },
            { rowId: 'client-joiner-rose6', cells: ['rose6', 'Rose6', '2025-01-06', '-', '0766649009...', 'zhappy_AS_1/Zhappy', 'Singapore', 'Ready'] },
          ],
        },
        'Resigned Employee Information': {
          title: 'Employee Verification Data',
          caption: '当前二级 tab 为 Resigned Employee Information，客户查看本期离职员工的 payroll scope 处理。',
          columns: ['Employee Code', 'Employee Name', 'Join Date', 'Exit Date', 'Company Code', 'Project Code', 'Work Location', 'Cost Centre Code'],
          rows: [
            { rowId: 'client-leaver-ivy', cells: ['ivy9', 'Ivy Lim', '2023-04-02', '2026-04-06', 'CH01/IAC TEST', 'zhappy_SG_1/Zhappy', 'Singapore', 'Excluded'], linkedIssueIds: ['client-current-package'] },
            { rowId: 'client-leaver-kian', cells: ['kian2', 'Kian Teo', '2021-09-10', '2026-04-03', 'SG01/IAC SG', 'zhappy_SG_1/Zhappy', 'Singapore', 'Ready'] },
          ],
        },
        'Employee With Salary Adjustment': {
          title: 'Employee Verification Data',
          caption: '当前二级 tab 为 Employee With Salary Adjustment，客户查看调薪员工及生效信息。',
          columns: ['Employee Code', 'Employee Name', 'Join Date', 'Exit Date', 'Company Code', 'Project Code', 'Work Location', 'Cost Centre Code'],
          rows: [
            { rowId: 'client-salary-marcus', cells: ['marcus3', 'Marcus Tan', '2024-07-14', '-', 'CH01/IAC TEST', 'zhappy_SG_1/Zhappy', 'Singapore', 'CH01-SG'] },
            { rowId: 'client-salary-nora', cells: ['nora8', 'Nora Goh', '2023-03-11', '-', 'CH01/IAC TEST', 'zhappy_AS_1/Zhappy', 'Singapore', 'Pending'], linkedIssueIds: ['client-current-package'] },
          ],
        },
        'Employee With Org Structure Changes': {
          title: 'Employee Verification Data',
          caption: '当前二级 tab 为 Employee With Org Structure Changes，客户查看组织变动员工数据。',
          columns: ['Employee Code', 'Employee Name', 'Join Date', 'Exit Date', 'Company Code', 'Project Code', 'Work Location', 'Cost Centre Code'],
          rows: [
            { rowId: 'client-org-nora', cells: ['nora8', 'Nora Goh', '2023-03-11', '-', 'CH01/IAC TEST', 'zhappy_AS_1/Zhappy', 'Singapore', 'Pending'], linkedIssueIds: ['client-current-package'] },
            { rowId: 'client-org-mia', cells: ['mia2', 'Mia Tan', '2022-05-18', '-', 'CH01/IAC TEST', 'zhappy_HR_1/Zhappy', 'Singapore', 'CH01-HR'] },
          ],
        },
        'Employee With Bank Detail Changes': {
          title: 'Employee Verification Data',
          caption: '当前二级 tab 为 Employee With Bank Detail Changes，客户查看银行信息变更员工。',
          columns: ['Employee Code', 'Employee Name', 'Join Date', 'Exit Date', 'Company Code', 'Project Code', 'Work Location', 'Cost Centre Code'],
          rows: [
            { rowId: 'client-bank-marcus', cells: ['marcus3', 'Marcus Tan', '2024-07-14', '-', 'CH01/IAC TEST', 'zhappy_SG_1/Zhappy', 'Singapore', 'Approval note missing'], linkedIssueIds: ['client-current-package'] },
            { rowId: 'client-bank-julia', cells: ['julia2', 'Julia Tan', '2021-11-05', '-', 'SG01/IAC SG', 'zhappy_SG_1/Zhappy', 'Singapore', 'Ready'] },
          ],
        },
        'Employee With Allowance Adjustment': {
          title: 'Employee Verification Data',
          caption: '当前二级 tab 为 Employee With Allowance Adjustment，客户查看 allowance 调整员工。',
          columns: ['Employee Code', 'Employee Name', 'Join Date', 'Exit Date', 'Company Code', 'Project Code', 'Work Location', 'Cost Centre Code'],
          rows: [
            { rowId: 'client-allowance-rose', cells: ['rose1', 'Rose Lim', '2025-01-01', '-', 'CH01/IAC TEST', 'zhappy_SG_1/Zhappy', 'Singapore', 'CH01-SG'] },
            { rowId: 'client-allowance-andy', cells: ['KT0101', 'Andy', '2022-01-01', '-', 'biu1_AS_2/biu1_AS_2', 'zhappy_SG_1/Zhappy', 'Singapore', 'Missing'], linkedIssueIds: ['client-current-package'] },
          ],
        },
      },
      'Leave Attendance Data': {
        Attendance: {
          title: 'Leave Attendance Data',
          caption: '当前二级 tab 为 Attendance，客户查看 attendance 源数据 summary。',
          stickyLastColumn: false,
          columns: ['Flag', 'Employee Code', 'Employee Name', 'Company Code', 'Company Name', 'Holiday Code', 'Holiday Name', 'Allowance Code', 'Allowance Name', 'Holiday Amount'],
          rows: [
            { rowId: 'client-att-sub-andy', cells: ['Critical', 'KT0101', 'Andy', 'biu1_AS_2', 'biu1_AS_2', '#OFF', 'Off Day', '0766651102000000', '基本工资', '14.00'], tone: 'critical', linkedIssueIds: ['client-current-package'] },
            { rowId: 'client-att-sub-mila', cells: ['', 'KTO101', 'Mila Tan', 'SG01', 'IAC SG Company', '#OFF', 'Off Day', '0766651102000000', '基本工资', '12.00'], tone: 'normal' },
          ],
        },
        'Leave Status': {
          title: 'Leave Attendance Data',
          caption: '当前二级 tab 为 Leave Status，客户查看会影响 payroll 的请假记录。',
          stickyLastColumn: false,
          columns: ['Flag', 'Employee Code', 'Employee Name', 'Company Code', 'Company Name', 'Holiday Code', 'Holiday Name', 'Allowance Code', 'Allowance Name', 'Holiday Amount'],
          rows: [
            { rowId: 'client-leave-sub-rose1', cells: ['Warning', 'rose1', 'rose1', 'CH01', 'IAC TEST Company-ch', '#OFF', 'Off Day', '0766651102000000', '基本工资', '14.00'], tone: 'warning', linkedIssueIds: ['client-current-package'] },
            { rowId: 'client-leave-sub-priya', cells: ['', 'priya2', 'Priya Nair', 'CH01', 'IAC TEST Company-ch', '#AL', 'Annual Leave', '0766651102000000', '基本工资', '8.00'], tone: 'normal' },
          ],
        },
        'OT Compensation': {
          title: 'Leave Attendance Data',
          caption: '当前二级 tab 为 OT Compensation，客户查看 OT 汇总与异常记录。',
          stickyLastColumn: false,
          columns: ['Flag', 'Employee Code', 'Employee Name', 'Company Code', 'Company Name', 'Holiday Code', 'Holiday Name', 'Allowance Code', 'Allowance Name', 'Holiday Amount'],
          rows: [
            { rowId: 'client-ot-sub-andy', cells: ['Critical', 'KT0101', 'Andy', 'biu1_AS_2', 'biu1_AS_2', '#OT', 'Overtime', '0766651102000000', '加班费', '42.00'], tone: 'critical', linkedIssueIds: ['client-current-package'] },
            { rowId: 'client-ot-sub-aaron', cells: ['', 'aaron4', 'Aaron Goh', 'SG01', 'IAC SG Company', '#OT', 'Overtime', '0766651102000000', '加班费', '18.00'], tone: 'normal' },
          ],
        },
        'Holiday / Rest Day': {
          title: 'Leave Attendance Data',
          caption: '当前二级 tab 为 Holiday / Rest Day，客户查看节假日和休息日出勤记录。',
          stickyLastColumn: false,
          columns: ['Flag', 'Employee Code', 'Employee Name', 'Company Code', 'Company Name', 'Holiday Code', 'Holiday Name', 'Allowance Code', 'Allowance Name', 'Holiday Amount'],
          rows: [
            { rowId: 'client-rest-sub-rose6', cells: ['Warning', 'rose6', 'rose6', '0766649009785001', 'HRMS TEST Company-ms', '#OFF', 'Off Day', 'Missing mapping', '基本工资', '14.00'], tone: 'warning', linkedIssueIds: ['client-boundary'] },
            { rowId: 'client-rest-sub-daniel', cells: ['', 'daniel3', 'Daniel Lee', 'SG01', 'IAC SG Company', '#REST', 'Rest Day', '0766651102000000', '基本工资', '10.00'], tone: 'normal' },
          ],
        },
      },
      'Payroll Interface Data': {
        'Claims & Reimbursements': {
          title: 'Payroll Interface Data',
          caption: '当前二级 tab 为 Claims & Reimbursements。',
          stickyLastColumn: false,
          columns: ['Flag', 'Employee', 'Allowance', 'Company', 'Claim', 'Claim Amount'],
          rows: [
            { rowId: 'client-claim-sub-xpf013', cells: ['Critical', 'XPF013 - zhang san', '#AR_BASC', 'XPF - X-PRESS FEEDERS', 'testclaim - testclaim', '33.00'], tone: 'critical', linkedIssueIds: ['client-current-package'] },
            { rowId: 'client-claim-sub-julia', cells: ['', 'JLY002 - Julia Tan', '#TRAVEL', 'IAC - Operations', 'travel-claim-22 - taxi', '48.00'], tone: 'normal' },
          ],
        },
        Allowances: {
          title: 'Payroll Interface Data',
          caption: '当前二级 tab 为 Allowances。',
          stickyLastColumn: false,
          columns: ['Flag', 'Employee', 'Allowance', 'Company', 'Claim', 'Claim Amount'],
          rows: [
            { rowId: 'client-allow-sub-ava', cells: ['Warning', 'AVA021 - Ava Lim', '#MEAL', 'IAC - APAC HQ', 'meal-0426 - lunch subsidy', '220.00'], tone: 'warning', linkedIssueIds: ['client-current-package'] },
            { rowId: 'client-allow-sub-marcus', cells: ['', 'MTS015 - Marcus Tan', '#BONUS', 'IAC - Commercial', 'bonus-apr - bonus payout', '1260.00'], tone: 'normal' },
          ],
        },
        'Loans & Deductions': {
          title: 'Payroll Interface Data',
          caption: '当前二级 tab 为 Loans & Deductions。',
          stickyLastColumn: false,
          columns: ['Flag', 'Employee', 'Allowance', 'Company', 'Claim', 'Claim Amount'],
          rows: [
            { rowId: 'client-ded-sub-nora', cells: ['Critical', 'NGH008 - Nora Goh', '#LN_DED', 'IAC - SG Services', 'loan-dup-01 - payroll deduction', '420.00'], tone: 'critical', linkedIssueIds: ['client-current-package'] },
            { rowId: 'client-ded-sub-adrian', cells: ['', 'ADS011 - Adrian Seah', '#SAL_ADV', 'IAC - Shared Services', 'salary-advance-apr', '640.00'], tone: 'normal' },
          ],
        },
        'Claim Status / Approval': {
          title: 'Payroll Interface Data',
          caption: '当前二级 tab 为 Claim Status / Approval。',
          stickyLastColumn: false,
          columns: ['Flag', 'Employee', 'Allowance', 'Company', 'Claim', 'Claim Amount'],
          rows: [
            { rowId: 'client-approval-sub-ava', cells: ['Warning', 'AVA021 - Ava Lim', '#MEAL', 'IAC - APAC HQ', 'meal-0426 - lunch subsidy', '220.00'], tone: 'warning', linkedIssueIds: ['client-current-package'] },
            { rowId: 'client-approval-sub-julia', cells: ['', 'JLY002 - Julia Tan', '#TRAVEL', 'IAC - Operations', 'travel-claim-22 - taxi', '48.00'], tone: 'normal' },
          ],
        },
      },
    },
    summaryPanelsByTab: {
      'Employee Verification Data': [],
      'Leave Attendance Data': [],
      'Payroll Interface Data': [],
    },
    tabTables: {
      'Employee Verification Data': [
        {
          title: 'Employee Verification Details',
          caption: '与 SD 侧一致，客户在下半区直接查看本次参与 payroll calculation 的员工明细。',
          columns: ['Selected', 'Employee Code', 'Employee Name', 'Join Date', 'Exit Date', 'Company Code', 'Project Code', 'Remarks'],
          rows: [
            { rowId: 'client-scope-detail-rose-lim', cells: ['true', 'rose1', 'Rose Lim', '2025-01-01', '-', 'CH01/IAC TEST', 'zhappy_SG_1/Zhappy', 'Ready'], tone: 'normal', linkedIssueIds: ['client-current-package'] },
            { rowId: 'client-scope-detail-rose6', cells: ['true', 'rose6', 'Rose6', '2025-01-06', '-', '0766649009...', 'zhappy_AS_1/Zhappy', 'Ready'], tone: 'normal' },
            { rowId: 'client-scope-detail-marcus-tan', cells: ['false', 'marcus3', 'Marcus Tan', '2024-07-14', '-', 'CH01/IAC TEST', 'zhappy_SG_1/Zhappy', 'Approval note missing'], tone: 'warning', linkedIssueIds: ['client-current-package'] },
            { rowId: 'client-scope-detail-nora-goh', cells: ['true', 'nora8', 'Nora Goh', '2023-03-11', '-', 'CH01/IAC TEST', 'zhappy_AS_1/Zhappy', 'Cost centre pending'], tone: 'critical', linkedIssueIds: ['client-current-package'] },
          ],
        },
      ],
      'Leave Attendance Data': [
        {
          title: 'Leave Attendance Details',
          caption: '与 SD 侧一致，客户在下半区查看按员工 + 日期展开的 leave attendance 明细。',
          stickyLastColumn: false,
          columns: ['Flag', 'Employee Code', 'Employee Name', 'Company Code', 'Company Name', 'Holiday Code', 'Holiday Name', 'Allowance Code', 'Allowance Name', 'Holiday Date', 'Holiday Amount'],
          rows: [
            { rowId: 'client-attendance-detail-andy-0402', cells: ['Critical', 'KT0101', 'Andy', 'biu1_AS_2', 'biu1_AS_2', '#OFF', 'Off Day', '0766651102000000', '基本工资', '2026-04-02', '1.00'], tone: 'critical', linkedIssueIds: ['client-current-package'], flagReason: 'Daily value does not reconcile to header total' },
            { rowId: 'client-attendance-detail-andy-0404', cells: ['Critical', 'KT0101', 'Andy', 'biu1_AS_2', 'biu1_AS_2', '#OFF', 'Off Day', '0766651102000000', '基本工资', '2026-04-04', '1.00'], tone: 'critical', linkedIssueIds: ['client-current-package'], flagReason: 'Duplicate holiday entry suspected' },
            { rowId: 'client-attendance-detail-rose1-0402', cells: ['Warning', 'rose1', 'rose1', 'CH01', 'IAC TEST Company-ch', '#OFF', 'Off Day', '0766651102000000', '基本工资', '2026-04-02', '1.00'], tone: 'warning', linkedIssueIds: ['client-current-package'], flagReason: 'Pending leave approval affects payroll' },
            { rowId: 'client-attendance-detail-rose6-0402', cells: ['Warning', 'rose6', 'rose6', '0766649009785001', 'HRMS TEST Company-ms', '#OFF', 'Off Day', 'Missing mapping', '基本工资', '2026-04-02', '1.00'], tone: 'warning', linkedIssueIds: ['client-boundary'], flagReason: 'Allowance code missing in source mapping' },
            { rowId: 'client-attendance-detail-mila-0402', cells: ['', 'KTO101', 'Mila Tan', 'SG01', 'IAC SG Company', '#OFF', 'Off Day', '0766651102000000', '基本工资', '2026-04-02', '1.00'], tone: 'normal' },
          ],
        },
      ],
      'Payroll Interface Data': [
        {
          title: 'Payroll Interface Details',
          caption: '与 SD 侧一致，客户在下半区查看按员工 + claim 展开的 interface 明细。',
          stickyLastColumn: false,
          columns: ['Flag', 'Employee', 'Company', 'Claim', 'Claim Date', 'Claim Amount', 'Approval Date', 'Allowance'],
          rows: [
            { rowId: 'client-interface-detail-xpf013', cells: ['Critical', 'XPF013 - zhang san', 'XPF - X-PRESS FEEDERS', 'testclaim - testclaim', '2023-04-12T00:00:00', '33.00', '2023-04-12 14:25 (UTC+8)', '#AR_BASC'], tone: 'critical', linkedIssueIds: ['client-current-package'], flagReason: 'Claim amount breaches configured allowance cap' },
            { rowId: 'client-interface-detail-ava-lim', cells: ['Warning', 'AVA021 - Ava Lim', 'IAC - APAC HQ', 'meal-0426 - lunch subsidy', '2026-04-26T00:00:00', '220.00', '-', '#MEAL'], tone: 'warning', linkedIssueIds: ['client-current-package'], flagReason: 'Approval evidence is still missing' },
            { rowId: 'client-interface-detail-nora-goh', cells: ['Critical', 'NGH008 - Nora Goh', 'IAC - SG Services', 'loan-dup-01 - payroll deduction', '2026-04-20T00:00:00', '420.00', '2026-04-20 09:10 (UTC+8)', '#LN_DED'], tone: 'critical', linkedIssueIds: ['client-current-package'], flagReason: 'Duplicate deduction suspected in current batch' },
            { rowId: 'client-interface-detail-marcus', cells: ['', 'MTS015 - Marcus Tan', 'IAC - Commercial', 'bonus-apr - bonus payout', '2026-04-25T00:00:00', '1260.00', '2026-04-25 16:00 (UTC+8)', '#BONUS'], tone: 'normal' },
          ],
        },
      ],
    },
    subTabTablesByTab: {
      'Leave Attendance Data': {
        Attendance: [
          {
            title: 'Leave Attendance Details',
            caption: '当前二级 tab 为 Attendance，展示记录级明细。',
            stickyLastColumn: false,
            columns: ['Flag', 'Employee Code', 'Employee Name', 'Company Code', 'Company Name', 'Holiday Code', 'Holiday Name', 'Allowance Code', 'Allowance Name', 'Holiday Date', 'Holiday Amount'],
            rows: [
              { rowId: 'client-att-detail-sub-andy-0402', cells: ['Critical', 'KT0101', 'Andy', 'biu1_AS_2', 'biu1_AS_2', '#OFF', 'Off Day', '0766651102000000', '基本工资', '2026-04-02', '1.00'], tone: 'critical', linkedIssueIds: ['client-current-package'] },
              { rowId: 'client-att-detail-sub-mila-0402', cells: ['', 'KTO101', 'Mila Tan', 'SG01', 'IAC SG Company', '#OFF', 'Off Day', '0766651102000000', '基本工资', '2026-04-02', '1.00'], tone: 'normal' },
            ],
          },
        ],
        'Leave Status': [
          {
            title: 'Leave Attendance Details',
            caption: '当前二级 tab 为 Leave Status，展示请假记录明细。',
            stickyLastColumn: false,
            columns: ['Flag', 'Employee Code', 'Employee Name', 'Company Code', 'Company Name', 'Holiday Code', 'Holiday Name', 'Allowance Code', 'Allowance Name', 'Holiday Date', 'Holiday Amount'],
            rows: [
              { rowId: 'client-leave-detail-sub-rose1', cells: ['Warning', 'rose1', 'rose1', 'CH01', 'IAC TEST Company-ch', '#AL', 'Annual Leave', '0766651102000000', '基本工资', '2026-04-02', '1.00'], tone: 'warning', linkedIssueIds: ['client-current-package'] },
              { rowId: 'client-leave-detail-sub-priya', cells: ['', 'priya2', 'Priya Nair', 'CH01', 'IAC TEST Company-ch', '#AL', 'Annual Leave', '0766651102000000', '基本工资', '2026-04-03', '1.00'], tone: 'normal' },
            ],
          },
        ],
        'OT Compensation': [
          {
            title: 'Leave Attendance Details',
            caption: '当前二级 tab 为 OT Compensation，展示 OT 明细。',
            stickyLastColumn: false,
            columns: ['Flag', 'Employee Code', 'Employee Name', 'Company Code', 'Company Name', 'Holiday Code', 'Holiday Name', 'Allowance Code', 'Allowance Name', 'Holiday Date', 'Holiday Amount'],
            rows: [
              { rowId: 'client-ot-detail-sub-andy', cells: ['Critical', 'KT0101', 'Andy', 'biu1_AS_2', 'biu1_AS_2', '#OT', 'Overtime', '0766651102000000', '加班费', '2026-04-04', '6.50'], tone: 'critical', linkedIssueIds: ['client-current-package'] },
              { rowId: 'client-ot-detail-sub-aaron', cells: ['', 'aaron4', 'Aaron Goh', 'SG01', 'IAC SG Company', '#OT', 'Overtime', '0766651102000000', '加班费', '2026-04-06', '3.00'], tone: 'normal' },
            ],
          },
        ],
        'Holiday / Rest Day': [
          {
            title: 'Leave Attendance Details',
            caption: '当前二级 tab 为 Holiday / Rest Day，展示节假日 / 休息日出勤明细。',
            stickyLastColumn: false,
            columns: ['Flag', 'Employee Code', 'Employee Name', 'Company Code', 'Company Name', 'Holiday Code', 'Holiday Name', 'Allowance Code', 'Allowance Name', 'Holiday Date', 'Holiday Amount'],
            rows: [
              { rowId: 'client-rest-detail-sub-rose6', cells: ['Warning', 'rose6', 'rose6', '0766649009785001', 'HRMS TEST Company-ms', '#OFF', 'Off Day', 'Missing mapping', '基本工资', '2026-04-02', '1.00'], tone: 'warning', linkedIssueIds: ['client-boundary'] },
              { rowId: 'client-rest-detail-sub-daniel', cells: ['', 'daniel3', 'Daniel Lee', 'SG01', 'IAC SG Company', '#REST', 'Rest Day', '0766651102000000', '基本工资', '2026-04-05', '1.00'], tone: 'normal' },
            ],
          },
        ],
      },
      'Payroll Interface Data': {
        'Claims & Reimbursements': [
          {
            title: 'Payroll Interface Details',
            caption: '当前二级 tab 为 Claims & Reimbursements，展示 claim 级明细。',
            stickyLastColumn: false,
            columns: ['Flag', 'Employee', 'Company', 'Claim', 'Claim Date', 'Claim Amount', 'Approval Date', 'Allowance'],
            rows: [
              { rowId: 'client-claim-detail-sub-xpf013', cells: ['Critical', 'XPF013 - zhang san', 'XPF - X-PRESS FEEDERS', 'testclaim - testclaim', '2023-04-12T00:00:00', '33.00', '2023-04-12 14:25 (UTC+8)', '#AR_BASC'], tone: 'critical', linkedIssueIds: ['client-current-package'] },
              { rowId: 'client-claim-detail-sub-julia', cells: ['', 'JLY002 - Julia Tan', 'IAC - Operations', 'travel-claim-22 - taxi', '2026-04-18T00:00:00', '48.00', '2026-04-18 11:08 (UTC+8)', '#TRAVEL'], tone: 'normal' },
            ],
          },
        ],
        Allowances: [
          {
            title: 'Payroll Interface Details',
            caption: '当前二级 tab 为 Allowances，展示 allowance 明细。',
            stickyLastColumn: false,
            columns: ['Flag', 'Employee', 'Company', 'Claim', 'Claim Date', 'Claim Amount', 'Approval Date', 'Allowance'],
            rows: [
              { rowId: 'client-allow-detail-sub-ava', cells: ['Warning', 'AVA021 - Ava Lim', 'IAC - APAC HQ', 'meal-0426 - lunch subsidy', '2026-04-26T00:00:00', '220.00', '-', '#MEAL'], tone: 'warning', linkedIssueIds: ['client-current-package'] },
              { rowId: 'client-allow-detail-sub-marcus', cells: ['', 'MTS015 - Marcus Tan', 'IAC - Commercial', 'bonus-apr - bonus payout', '2026-04-25T00:00:00', '1260.00', '2026-04-25 16:00 (UTC+8)', '#BONUS'], tone: 'normal' },
            ],
          },
        ],
        'Loans & Deductions': [
          {
            title: 'Payroll Interface Details',
            caption: '当前二级 tab 为 Loans & Deductions，展示 deduction 明细。',
            stickyLastColumn: false,
            columns: ['Flag', 'Employee', 'Company', 'Claim', 'Claim Date', 'Claim Amount', 'Approval Date', 'Allowance'],
            rows: [
              { rowId: 'client-ded-detail-sub-nora', cells: ['Critical', 'NGH008 - Nora Goh', 'IAC - SG Services', 'loan-dup-01 - payroll deduction', '2026-04-20T00:00:00', '420.00', '2026-04-20 09:10 (UTC+8)', '#LN_DED'], tone: 'critical', linkedIssueIds: ['client-current-package'] },
              { rowId: 'client-ded-detail-sub-adrian', cells: ['', 'ADS011 - Adrian Seah', 'IAC - Shared Services', 'salary-advance-apr', '2026-04-20T00:00:00', '640.00', '2026-04-20 10:20 (UTC+8)', '#SAL_ADV'], tone: 'normal' },
            ],
          },
        ],
        'Claim Status / Approval': [
          {
            title: 'Payroll Interface Details',
            caption: '当前二级 tab 为 Claim Status / Approval，展示审批状态相关明细。',
            stickyLastColumn: false,
            columns: ['Flag', 'Employee', 'Company', 'Claim', 'Claim Date', 'Claim Amount', 'Approval Date', 'Allowance'],
            rows: [
              { rowId: 'client-approval-detail-sub-ava', cells: ['Warning', 'AVA021 - Ava Lim', 'IAC - APAC HQ', 'meal-0426 - lunch subsidy', '2026-04-26T00:00:00', '220.00', '-', '#MEAL'], tone: 'warning', linkedIssueIds: ['client-current-package'] },
              { rowId: 'client-approval-detail-sub-julia', cells: ['', 'JLY002 - Julia Tan', 'IAC - Operations', 'travel-claim-22 - taxi', '2026-04-18T00:00:00', '48.00', '2026-04-18 11:08 (UTC+8)', '#TRAVEL'], tone: 'normal' },
            ],
          },
        ],
      },
    },
    tabAi: {
      'Employee Verification Data': {
        executiveSummary: '客户当前查看 Employee Verification Data。员工范围、异动信息和参与算薪名单与 SD 视角保持一致，1 项主数据缺口仍需关注。',
        outputs: [['Employees with data gaps', '4'], ['Records needing approval note', '1'], ['Movement date mismatches', '2']],
        quickActions: ['Review employee scope', 'Export employee package', 'Return to SD'],
        rules: [
          ['Cost Centre Mapping', 'Blocker', '4 employees缺失成本中心，成本汇总无法按组织输出'],
          ['Payroll Eligibility', 'Warning', '1 joiner 仍未确认 payroll eligibility'],
          ['Movement Effective Date', 'Blocker', '2 salary adjustment 生效日期与 payroll period 不一致'],
        ],
        anomalies: [
          {
            id: 'client-current-package',
            severity: 'critical',
            summary: '员工范围包里仍有主数据缺口和异动待确认项目，客户确认前需要判断是否接受当前 package。',
            outputs: ['Employee scope exception list', 'Payroll inclusion list'],
            aiRecommendation: 'Return the snapshot to SD if employee scope or master data issues are not acceptable.',
            quickActions: ['Return to SD', 'Export client package'],
            title: 'Employee Scope',
            detail: 'Master data or movement issue remains',
            impact: 'Affects payroll population confidence',
            recommendation: 'Confirm only after employee scope issues are understood',
          },
          {
            id: 'client-boundary',
            severity: 'info',
            summary: '客户可以查看与 SD 一致的员工范围数据，但不能直接修改 HRMS 源数据。',
            outputs: ['Client review scope'],
            aiRecommendation: 'Use return flow instead of attempting source changes.',
            quickActions: ['Notify payroll admin'],
            title: 'Client Boundary',
            detail: 'Read-only package review',
            impact: 'Return flow required for changes',
            recommendation: 'Keep review read-only and traceable',
          },
        ],
        actions: ['Confirm Snapshot', 'Return to SD for Rework', 'Export Confirmation Package'],
      },
      'Leave Attendance Data': {
        executiveSummary: '客户当前查看 Leave Attendance Data。考勤、请假、OT 和节假日记录与 SD 视角一致，其中待批请假和 OT 异常仍是主要 open risks。',
        outputs: [['Unapproved OT employee list', '8'], ['Leave impacting pay list', '3'], ['Missing punch exceptions', '3']],
        quickActions: ['Open flagged records', 'Return to SD', 'Export client package'],
        rules: [
          ['OT Mismatch', 'Blocker', '3 unresolved records will distort payment'],
          ['Holiday Attendance', 'Warning', '2 records require eligibility validation'],
          ['Pending Leave Impact', 'Blocker', '2 leave approvals still pending'],
          ['Negative Leave Balance', 'Warning', 'Manual deduction handling needed'],
        ],
        anomalies: [
          {
            id: 'client-current-package',
            severity: 'critical',
            summary: 'Leave Attendance 包中仍存在 pending leave impact 和 OT mismatch，客户需要决定是否接受当前 package。',
            outputs: ['Leave impacting pay list', 'OT mismatch report'],
            aiRecommendation: 'Return unresolved attendance items to SD unless the client explicitly accepts the risk.',
            quickActions: ['Return to SD', 'Open flagged records'],
            title: 'Leave Attendance',
            detail: 'Pending leave and OT issues remain',
            impact: 'May alter payroll result',
            recommendation: 'Keep unresolved attendance impacts visible before confirmation',
          },
          {
            id: 'client-boundary',
            severity: 'info',
            summary: '客户可以查看完整 attendance / leave 数据和状态，但不能直接修改源数据。',
            outputs: ['Client review scope'],
            aiRecommendation: 'Use the return workflow for any required data correction.',
            quickActions: ['Notify payroll admin'],
            title: 'Client Boundary',
            detail: 'Read-only attendance review',
            impact: 'Return flow required for changes',
            recommendation: 'Use return to SD for changes',
          },
        ],
        actions: ['Confirm Snapshot', 'Return to SD for Rework', 'Export Confirmation Package'],
      },
      'Payroll Interface Data': {
        executiveSummary: '客户当前查看 Payroll Interface Data。claim、allowance、deduction 输入包与 SD 视角一致，cap breach 和 duplicate deduction 仍需客户判断。',
        outputs: [['Policy cap breach list', '2'], ['Missing approval item list', '3'], ['Duplicate detection report', '4']],
        quickActions: ['Open flagged records', 'Return to SD', 'Export client package'],
        rules: [
          ['Duplicate Detection', 'Blocker', '4 duplicate items remain unresolved'],
          ['Policy Limit Validation', 'Blocker', '2 cap breaches require exclusion or correction'],
          ['Approval Workflow Check', 'Warning', '3 items missing sign-off evidence'],
          ['Historical Amount Outlier', 'Pending', '5 items lack sufficient baseline'],
        ],
        anomalies: [
          {
            id: 'client-current-package',
            severity: 'critical',
            summary: 'Payroll Interface 包中仍存在 cap breach 和 duplicate deduction，客户需要决定是否退回 SD 重做。',
            outputs: ['Policy cap breach list', 'Duplicate detection report'],
            aiRecommendation: 'Return unresolved interface risks to SD when they are not explicitly acceptable.',
            quickActions: ['Return to SD', 'Open flagged records'],
            title: 'Payroll Interface',
            detail: 'Interface risk items remain',
            impact: 'May cause overpayment or wrong deduction',
            recommendation: 'Confirm only when interface risks are understood',
          },
          {
            id: 'client-boundary',
            severity: 'info',
            summary: '客户可以查看完整 interface 输入包，但不能直接修改 claim 或 allowance 源数据。',
            outputs: ['Client review scope'],
            aiRecommendation: 'Use return workflow for source changes.',
            quickActions: ['Notify payroll admin'],
            title: 'Client Boundary',
            detail: 'Read-only interface review',
            impact: 'Return flow required for changes',
            recommendation: 'Keep source changes in SD workspace',
          },
        ],
        actions: ['Confirm Snapshot', 'Return to SD for Rework', 'Export Confirmation Package'],
      },
    },
    subTabAiByTab: {
      'Employee Verification Data': {
        'New Employee Information': {
          executiveSummary: '当前查看 New Employee Information。重点确认新入职员工是否应纳入本次 payroll snapshot，以及其主数据是否完整。',
          outputs: [['New joiner list', '2'], ['Missing master data check', '1']],
          quickActions: ['Review joiners', 'Return to SD', 'Export joiner list'],
          rules: [
            ['Payroll Eligibility', 'Warning', 'New joiners must be payroll-eligible before confirmation'],
            ['Master Data Completeness', 'Blocker', 'Missing cost centre or org mapping must be visible'],
          ],
          anomalies: [
            {
              id: 'client-current-package',
              severity: 'critical',
              summary: '部分新入职员工的主数据仍未完全闭合，客户确认前需要判断是否接受当前纳入范围。',
              outputs: ['New joiner list'],
              aiRecommendation: 'Return the snapshot to SD if any new joiner should not yet be included.',
              quickActions: ['Return to SD'],
              title: 'New Joiners',
              detail: 'Joiner scope needs confirmation',
              impact: 'Affects payroll population',
              recommendation: 'Confirm only after joiner inclusion is understood',
            },
          ],
          actions: ['Confirm Snapshot', 'Return to SD for Rework', 'Export Confirmation Package'],
        },
        'Resigned Employee Information': {
          executiveSummary: '当前查看 Resigned Employee Information。重点确认离职员工是否应排除，及其离职日期是否已正确作用到 payroll scope。',
          outputs: [['Leaver list', '2'], ['Exclusion decision list', '1']],
          quickActions: ['Review leavers', 'Return to SD', 'Export leaver list'],
          rules: [['Exit Date Validation', 'Blocker', 'Leavers must be correctly excluded or prorated based on cutoff']],
          anomalies: [
            {
              id: 'client-current-package',
              severity: 'warning',
              summary: '离职员工的纳入 / 排除边界需要客户确认，避免错误进入本次 payroll population。',
              outputs: ['Leaver list'],
              aiRecommendation: 'Return to SD if any leaver is included or excluded incorrectly.',
              quickActions: ['Return to SD'],
              title: 'Leavers',
              detail: 'Leaver scope needs confirmation',
              impact: 'Affects payroll population',
              recommendation: 'Review cutoff handling for leavers',
            },
          ],
          actions: ['Confirm Snapshot', 'Return to SD for Rework', 'Export Confirmation Package'],
        },
        'Employee With Salary Adjustment': {
          executiveSummary: '当前查看 Employee With Salary Adjustment。重点确认调薪员工的生效范围和主数据映射。',
          outputs: [['Salary adjustment list', '2']],
          quickActions: ['Review adjustments', 'Return to SD'],
          rules: [['Movement Effective Date', 'Blocker', 'Effective date mismatch must remain visible to the client']],
          anomalies: [
            {
              id: 'client-current-package',
              severity: 'critical',
              summary: '调薪员工中仍有生效日期或组织映射待确认项。',
              outputs: ['Salary adjustment list'],
              aiRecommendation: 'Return to SD if salary adjustment timing is not acceptable.',
              quickActions: ['Return to SD'],
              title: 'Salary Adjustment',
              detail: 'Effective date mismatch remains',
              impact: 'May affect pay result',
              recommendation: 'Confirm only after effective dates are understood',
            },
          ],
          actions: ['Confirm Snapshot', 'Return to SD for Rework', 'Export Confirmation Package'],
        },
        'Employee With Org Structure Changes': {
          executiveSummary: '当前查看 Employee With Org Structure Changes。重点确认组织、项目和成本中心变动是否已正确落入本次 snapshot。',
          outputs: [['Org change list', '2']],
          quickActions: ['Review org changes', 'Return to SD'],
          rules: [['Org Mapping', 'Warning', 'Org and cost centre changes should remain auditable to the client']],
          anomalies: [
            {
              id: 'client-current-package',
              severity: 'warning',
              summary: '组织变动员工仍有待确认映射，客户应确认是否接受当前 package。',
              outputs: ['Org change list'],
              aiRecommendation: 'Return to SD when org mapping is not acceptable.',
              quickActions: ['Return to SD'],
              title: 'Org Changes',
              detail: 'Org mapping still under review',
              impact: 'Affects cost allocation confidence',
              recommendation: 'Review org and cost centre changes carefully',
            },
          ],
          actions: ['Confirm Snapshot', 'Return to SD for Rework', 'Export Confirmation Package'],
        },
      },
      'Leave Attendance Data': {
        Attendance: {
          executiveSummary: '当前查看 Attendance。重点确认考勤汇总与明细是否一致，以及是否存在会影响薪资计算的 attendance blocker。',
          outputs: [['Attendance exception list', '1'], ['Daily detail reconciliation', '1']],
          quickActions: ['Open flagged records', 'Return to SD'],
          rules: [['Attendance Reconciliation', 'Blocker', 'Attendance summary must reconcile to daily details']],
          anomalies: [
            {
              id: 'client-current-package',
              severity: 'critical',
              summary: 'Attendance 当前仍存在汇总与明细不一致的记录，客户需要决定是否退回 SD。',
              outputs: ['Attendance exception list'],
              aiRecommendation: 'Return attendance issues to SD unless explicitly accepted.',
              quickActions: ['Return to SD'],
              title: 'Attendance',
              detail: 'Attendance mismatch remains',
              impact: 'May affect worked-day logic',
              recommendation: 'Review attendance reconciliation before confirmation',
            },
          ],
          actions: ['Confirm Snapshot', 'Return to SD for Rework', 'Export Confirmation Package'],
        },
        'Leave Status': {
          executiveSummary: '当前查看 Leave Status。重点确认 pending leave 是否会影响本期 payroll，以及请假记录是否已被正确纳入或暂挂。',
          outputs: [['Leave impacting pay list', '2'], ['Pending leave review', '1']],
          quickActions: ['Open flagged records', 'Return to SD'],
          rules: [['Pending Leave Impact', 'Blocker', 'Leave approvals that affect pay should stay visible to the client']],
          anomalies: [
            {
              id: 'client-current-package',
              severity: 'critical',
              summary: 'Leave Status 仍存在 pending leave impact，客户确认前需要决定是否接受当前 package。',
              outputs: ['Leave impacting pay list'],
              aiRecommendation: 'Return unresolved leave-impact items to SD unless the client accepts them explicitly.',
              quickActions: ['Return to SD'],
              title: 'Leave Status',
              detail: 'Pending leave impact remains',
              impact: 'May reduce current pay',
              recommendation: 'Keep pending leave items visible until decision is made',
            },
          ],
          actions: ['Confirm Snapshot', 'Return to SD for Rework', 'Export Confirmation Package'],
        },
        'OT Compensation': {
          executiveSummary: '当前查看 OT Compensation。重点确认 OT 金额与工时、审批和系统记录是否一致。',
          outputs: [['OT mismatch report', '1'], ['Unapproved OT employee list', '1']],
          quickActions: ['Open flagged records', 'Return to SD'],
          rules: [['OT Mismatch', 'Blocker', 'Unresolved OT mismatches should remain visible before confirmation']],
          anomalies: [
            {
              id: 'client-current-package',
              severity: 'critical',
              summary: 'OT Compensation 当前仍有 OT mismatch，客户应确认是否退回 SD 处理。',
              outputs: ['OT mismatch report'],
              aiRecommendation: 'Return unresolved OT mismatches to SD unless explicitly accepted.',
              quickActions: ['Return to SD'],
              title: 'OT Compensation',
              detail: 'OT mismatch remains',
              impact: 'Potential overpayment',
              recommendation: 'Confirm only after OT mismatch is understood',
            },
          ],
          actions: ['Confirm Snapshot', 'Return to SD for Rework', 'Export Confirmation Package'],
        },
        'Holiday / Rest Day': {
          executiveSummary: '当前查看 Holiday / Rest Day。重点确认休息日和节假日出勤是否属于合理例外，并且审批痕迹完整。',
          outputs: [['Rest-day attendance exception list', '1']],
          quickActions: ['Open flagged records', 'Return to SD'],
          rules: [['Holiday Attendance', 'Warning', 'Rest-day or holiday work should carry approval evidence or accepted rationale']],
          anomalies: [
            {
              id: 'client-boundary',
              severity: 'warning',
              summary: 'Holiday / Rest Day 记录中仍有需要客户确认的例外出勤项目。',
              outputs: ['Rest-day attendance exception list'],
              aiRecommendation: 'Accept only when the exception rationale is clear, otherwise return to SD.',
              quickActions: ['Return to SD'],
              title: 'Holiday / Rest Day',
              detail: 'Exception attendance under review',
              impact: 'May affect allowance / OT treatment',
              recommendation: 'Review rest-day exception rationale carefully',
            },
          ],
          actions: ['Confirm Snapshot', 'Return to SD for Rework', 'Export Confirmation Package'],
        },
      },
      'Payroll Interface Data': {
        'Claims & Reimbursements': {
          executiveSummary: '当前查看 Claims & Reimbursements。重点确认报销和 claim 输入是否完整且未超政策边界。',
          outputs: [['Claim exception list', '1']],
          quickActions: ['Open flagged records', 'Return to SD'],
          rules: [['Claim Validation', 'Warning', 'Claim exceptions should remain visible to the client']],
          anomalies: [
            {
              id: 'client-current-package',
              severity: 'warning',
              summary: 'Claims & Reimbursements 仍有待确认的 claim 例外项。',
              outputs: ['Claim exception list'],
              aiRecommendation: 'Return to SD when claim evidence or amount is not acceptable.',
              quickActions: ['Return to SD'],
              title: 'Claims & Reimbursements',
              detail: 'Claim exception remains',
              impact: 'May affect reimbursement result',
              recommendation: 'Review flagged claims before confirmation',
            },
          ],
          actions: ['Confirm Snapshot', 'Return to SD for Rework', 'Export Confirmation Package'],
        },
        Allowances: {
          executiveSummary: '当前查看 Allowances。重点确认 allowance 是否超 cap、是否缺审批、以及是否应进入当前 package。',
          outputs: [['Policy cap breach list', '1'], ['Missing approval item list', '1']],
          quickActions: ['Open flagged records', 'Return to SD'],
          rules: [['Policy Limit Validation', 'Blocker', 'Cap breach items must remain visible before confirmation']],
          anomalies: [
            {
              id: 'client-current-package',
              severity: 'critical',
              summary: 'Allowances 当前仍存在 cap breach 或缺审批项目，客户需要决定是否退回 SD。',
              outputs: ['Policy cap breach list'],
              aiRecommendation: 'Return unresolved allowance risks to SD unless explicitly accepted.',
              quickActions: ['Return to SD'],
              title: 'Allowances',
              detail: 'Allowance risk remains',
              impact: 'Potential overpayment',
              recommendation: 'Confirm only after allowance risk is understood',
            },
          ],
          actions: ['Confirm Snapshot', 'Return to SD for Rework', 'Export Confirmation Package'],
        },
        'Loans & Deductions': {
          executiveSummary: '当前查看 Loans & Deductions。重点确认 deduction 输入没有重复或错误扣款风险。',
          outputs: [['Duplicate detection report', '1']],
          quickActions: ['Open flagged records', 'Return to SD'],
          rules: [['Duplicate Detection', 'Blocker', 'Duplicate deductions should remain visible to the client']],
          anomalies: [
            {
              id: 'client-current-package',
              severity: 'critical',
              summary: 'Loans & Deductions 仍存在 duplicate deduction 风险，客户确认前需要决定是否退回 SD。',
              outputs: ['Duplicate detection report'],
              aiRecommendation: 'Return unresolved deduction risks to SD unless explicitly accepted.',
              quickActions: ['Return to SD'],
              title: 'Loans & Deductions',
              detail: 'Duplicate deduction risk remains',
              impact: 'Potential wrong deduction',
              recommendation: 'Review deduction duplication before confirmation',
            },
          ],
          actions: ['Confirm Snapshot', 'Return to SD for Rework', 'Export Confirmation Package'],
        },
        'Claim Status / Approval': {
          executiveSummary: '当前查看 Claim Status / Approval。重点确认 claim 级审批状态是否足够支撑本次 package 确认。',
          outputs: [['Missing approval item list', '1']],
          quickActions: ['Open flagged records', 'Return to SD'],
          rules: [['Approval Workflow Check', 'Warning', 'Items missing sign-off evidence should remain visible before confirmation']],
          anomalies: [
            {
              id: 'client-current-package',
              severity: 'warning',
              summary: 'Claim Status / Approval 仍存在审批证据不足的项目，客户应确认是否接受当前 package。',
              outputs: ['Missing approval item list'],
              aiRecommendation: 'Return to SD when approval evidence is not acceptable.',
              quickActions: ['Return to SD'],
              title: 'Claim Status / Approval',
              detail: 'Approval evidence still missing',
              impact: 'Weakens payment basis',
              recommendation: 'Review approval completeness before confirmation',
            },
          ],
          actions: ['Confirm Snapshot', 'Return to SD for Rework', 'Export Confirmation Package'],
        },
      },
    },
    tables: [],
    ai: {
      executiveSummary: '客户页现在按三大源数据块切换查看。每个模块内部都保留了 AI 分析、summary 和 detail 数据，确保客户看到的 package 与 SD review 视图一致。',
      outputs: [
        ['Employee verification view', '1'],
        ['Leave attendance view', '1'],
        ['Payroll interface view', '1'],
      ],
      quickActions: ['Open source areas', 'Return to SD', 'Export client package'],
      rules: [
        ['Source Data Visibility', 'Visible', 'Client sees the same source data structure as SD in read-only mode'],
        ['Snapshot Boundary', 'Visible', 'Header remains visible across all tabs'],
        ['Return Flow', 'Required', 'Client must return to SD instead of editing source data directly'],
      ],
      anomalies: [
        {
          id: 'client-boundary',
          severity: 'info',
          summary: '客户可以在统一页面中查看与 SD 一致的三大源数据块，但不能直接修改 HRMS 源数据。',
          outputs: ['Client review scope', 'Unified source area view'],
          aiRecommendation: 'Guide the client to confirm or return items instead of attempting source data edits.',
          quickActions: ['Notify payroll admin', 'Open SD handback flow'],
          title: 'Client Boundary',
          detail: 'Client can review full source package but cannot edit HRMS source data',
          impact: 'Return flow required for changes',
          recommendation: 'Ask client to review unresolved items before confirming',
        },
        {
          id: 'client-current-package',
          severity: 'critical',
          summary: '当前 snapshot package 在三大源数据块中都已可查看，但仍有 5 项 open risks 需要客户决定是否接受或退回 SD。',
          outputs: ['Open risk list', 'Client package detail'],
          aiRecommendation: 'Return unresolved financial risks to SD when the client does not explicitly accept them.',
          quickActions: ['Return to SD', 'Export client package'],
          title: 'Current Package',
          detail: 'Full package still contains 5 open items',
          impact: 'Client may confirm or return',
          recommendation: 'Return to SD if any unresolved financial risk is not acceptable',
        },
      ],
      actions: ['Confirm Snapshot', 'Return to SD for Rework', 'Export Confirmation Package'],
    },
  },
  {
    id: 'post-payroll',
    phase: 'Payroll Control',
    title: 'Post Payroll Review',
    status: 'Approval Gate',
    accent: 'post',
    subtitle: '页面应以 payroll result 异常总表为主体，AI explanation 和审批动作放在右侧集中展示。',
    stats: [
      ['Payroll Run', 'APR-2026-CH01'],
      ['High Risk', '4'],
      ['Medium Risk', '9'],
      ['Financial Impact', 'SGD 38,420'],
    ],
    tabs: ['Department View', 'Employee View', 'Anomaly Type View', 'Investigate', 'Audit Trail'],
    activeTab: 'Department View',
    comparisonPanelsByTab: {
      'Employee View': [
        {
          employee: 'Jonathan Yeo',
          anomalyType: 'Net Pay Variance',
          note: 'Current net pay is far above both his 6-month baseline and the peer median, which is consistent with a scaling or decimal mapping issue.',
          values: [
            { label: 'Current', displayValue: 'SGD 512,400', width: '100%', tone: 'critical' },
            { label: '6m Avg', displayValue: 'SGD 12,800', width: '12%', tone: 'neutral' },
            { label: 'Peer Median', displayValue: 'SGD 14,120', width: '14%', tone: 'neutral' },
          ],
        },
        {
          employee: 'Ava Lim',
          anomalyType: 'Missing Deduction',
          note: 'Net result looks normal at a glance, but the missing CPF deduction becomes obvious when comparing current take-home pay against baseline and peers.',
          values: [
            { label: 'Current', displayValue: 'SGD 8,140', width: '74%', tone: 'warning' },
            { label: '6m Avg', displayValue: 'SGD 6,980', width: '64%', tone: 'neutral' },
            { label: 'Peer Median', displayValue: 'SGD 6,720', width: '61%', tone: 'neutral' },
          ],
        },
        {
          employee: 'Lina Koh',
          anomalyType: 'Peer Group Outlier',
          note: 'Total pay is not breaching the absolute ceiling, but it sits well outside the expected range for the same role, grade, and site.',
          values: [
            { label: 'Current', displayValue: 'SGD 11,620', width: '88%', tone: 'warning' },
            { label: '6m Avg', displayValue: 'SGD 9,240', width: '70%', tone: 'neutral' },
            { label: 'Peer Median', displayValue: 'SGD 8,940', width: '68%', tone: 'neutral' },
          ],
        },
      ],
    },
    summaryPanelsByTab: {
      'Department View': [
        {
          eyebrow: 'Risk Concentration',
          title: '异常暴露并不是平均分布，而是集中在少数 payroll ownership 单元里。',
          value: '2 critical departments',
          detail: 'Department 视角适合 payroll manager 先判断问题是局部流程失控，还是系统性结算异常。当前 Finance Ops 和 Commercial 两个部门占了大部分高风险暴露。',
          bullets: [
            'Finance Ops 主要受 net pay variance 与 deduction gap 影响。',
            'Commercial 暴露更多来自 allowance / incentive entitlement mismatch。',
            'People Ops 以审批留痕缺口为主，风险等级次高。',
          ],
          actions: ['Open department dashboard', 'Send executive summary'],
        },
        {
          eyebrow: 'Approval Routing',
          title: 'Department View 最适合决定由谁先接手调查，而不是直接做逐条审批。',
          value: '3 owners involved',
          detail: '先按部门归口，可以避免 investigation 任务在 payroll、HR 和 finance 之间来回转派。',
          bullets: [
            'Finance Ops 由 payroll control lead 先处理。',
            'Commercial 问题需要 business owner 补 entitlement 依据。',
            'People Ops 项目适合 HR shared service 补审计材料。',
          ],
          actions: ['Assign investigation owners', 'Export department queue'],
        },
      ],
      'Employee View': [
        {
          eyebrow: 'Case Management',
          title: 'Employee View 适合逐案判断是修正、接受还是 override。',
          value: '13 employees',
          detail: '这里把风险回到员工粒度，便于审批人看到单个员工当前薪资结果、基线对比和处理状态。',
          bullets: [
            '高风险员工优先保留在 investigate 队列。',
            '中风险项目可在 evidence 齐备后转为 accept 或 override。',
            '同一员工的多条异常需要合并判断，避免重复操作。',
          ],
          actions: ['Open employee cases', 'Accept selected items'],
        },
        {
          eyebrow: 'Reviewer Efficiency',
          title: '员工视图最适合 payroll reviewer 做批量甄别和 case-by-case 跟进。',
          value: 'Single-case lens',
          detail: '相比 Department View，这里更接近最终审批动作，因为 reviewer 关心的是某个人这一期结果能否放行。',
          bullets: [
            '可快速分辨 correction 与 justified exception。',
            '方便逐条补备注和 override reason。',
            '更适合和 HR/manager 做个案确认。',
          ],
          actions: ['Investigate flagged anomalies', 'Require override reason'],
        },
      ],
      'Anomaly Type View': [
        {
          eyebrow: 'Pattern Lens',
          title: '按异常类型看风险，比按部门更适合判断当前 payroll run 的主要错误模式。',
          value: '9 anomaly types',
          detail: '这个视图把所有 case 从组织维度抽离出来，直接看是哪几类 anomaly 在推高本期 review 负担和财务影响。',
          bullets: [
            'Net pay variance 和 missing deduction 仍是 blocker 类问题。',
            'Unexpected allowance、peer outlier 和 deduction change 属于解释型风险。',
            'Tax variance 与 overtime spike 更适合交给专项 owner 跟进。',
          ],
          actions: ['Open anomaly queue', 'Export anomaly summary'],
        },
        {
          eyebrow: 'Processing Priority',
          title: '先按 anomaly type 排序，可以更快决定哪些问题需要系统修正，哪些问题只需要补证据。',
          value: '2 blocker types',
          detail: '它特别适合 payroll control lead 做 run-level triage，因为同类问题通常可以复用同一套调查路径。',
          bullets: [
            'Blocker 类型优先排入 correction 或 approval hold。',
            'Review 类型适合成批路由给业务 owner。',
            '同类异常能共享同一套 evidence checklist。',
          ],
          actions: ['Route by anomaly type', 'Assign specialist owners'],
        },
      ],
      Investigate: [
        {
          eyebrow: 'Work Queue',
          title: 'Investigate tab 把问题从“有风险”推进到“谁在处理、还差什么证据”。',
          value: '6 active investigations',
          detail: '这个视图的重点不是风险排序，而是调查状态、责任人和下一步动作，适合 payroll control 跟踪闭环。',
          bullets: [
            '优先看缺少根因结论的 case。',
            '把 evidence 缺口与 owner 一起展示。',
            '便于判断哪些项目能在本周期内关闭。',
          ],
          actions: ['Assign investigation owners', 'Open evidence checklist'],
        },
        {
          eyebrow: 'Closure Readiness',
          title: '不是所有 investigate 项都需要 correction，但都需要清晰结论。',
          value: '2 ready to close',
          detail: '当根因和证据已足够时，调查项可以直接转 Accept / Override，而不必一直挂在 open queue。',
          bullets: [
            '已确认的 policy-exception 可以转 override。',
            '有系统修正路径的 case 应保留 correction follow-up。',
            '缺 owner 的项目最容易拖延审批节奏。',
          ],
          actions: ['Mark cases ready', 'Route to approver'],
        },
      ],
      'Audit Trail': [
        {
          eyebrow: 'Decision Trace',
          title: 'Audit Trail 不是附属信息，而是 post-payroll override 能否成立的证据面。',
          value: '7 logged decisions',
          detail: '审批动作、调查备注和 supporting evidence 要能回溯到具体人和时间，否则 override 决定在审计上站不住。',
          bullets: [
            '每个高风险决定都应带 reviewer 与 timestamp。',
            'accepted / overridden case 需要说明依据。',
            '缺留痕的 case 应保持在 investigation 状态。',
          ],
          actions: ['Export audit pack', 'Require override reason'],
        },
        {
          eyebrow: 'Compliance Lens',
          title: '这个视图帮助 payroll control 证明流程是“被解释后放行”，不是“带风险直接放行”。',
          value: 'Traceable approval',
          detail: '把 decision log、证据状态和审批结果放在一起，可以显著降低事后追溯成本。',
          bullets: [
            '适合审计、Finance 和 payroll manager 复核。',
            '明确哪类决定需要二次审批。',
            '让 override 与 correction 都保留统一轨迹。',
          ],
          actions: ['Open decision history', 'Send audit summary'],
        },
      ],
    },
    tabViews: {
      'Department View': {
        title: 'Post-Payroll Risk Data',
        caption: '按 Department 聚合 post-payroll 异常，先看哪些部门承载了最高暴露与最多待审项目。',
        columns: ['Department', 'High Risk', 'Medium Risk', 'Financial Impact', 'Anomaly Type', 'Risk Level', 'Decision State'],
        rows: [
          { rowId: 'post-dept-finops', cells: ['Finance Ops', '2', '3', 'SGD 21,340', 'Net pay variance + missing deduction', 'High', 'Investigate'], tone: 'critical', linkedIssueIds: ['post-net-pay-variance', 'post-missing-deduction'], filterMeta: { riskLevel: 'high', department: 'Finance Ops', anomalyType: 'Net Pay Variance' } },
          { rowId: 'post-dept-commercial', cells: ['Commercial', '1', '4', 'SGD 11,880', 'Unexpected allowance / peer outlier', 'Medium', 'Override review'], tone: 'warning', linkedIssueIds: ['post-unexpected-allowance', 'post-peer-outlier'], filterMeta: { riskLevel: 'medium', department: 'Commercial', anomalyType: 'Unexpected Allowance' } },
          { rowId: 'post-dept-peopleops', cells: ['People Ops', '1', '3', 'SGD 5,200', 'New pay component + tax variance', 'Medium', 'Evidence pending'], tone: 'warning', linkedIssueIds: ['post-new-pay-component', 'post-tax-variance'], filterMeta: { riskLevel: 'medium', department: 'People Ops', anomalyType: 'New Pay Component' } },
          { rowId: 'post-dept-shared', cells: ['Shared Services', '0', '2', 'SGD 2,180', 'Deduction change threshold breach', 'Low', 'Accept'], tone: 'normal', linkedIssueIds: ['post-deduction-change'], filterMeta: { riskLevel: 'low', department: 'Shared Services', anomalyType: 'Deduction Change' } },
        ],
      },
      'Employee View': {
        title: 'Post-Payroll Risk Data',
        caption: '按员工逐案查看 payroll result 异常，适合 reviewer 直接做 accept / investigate / override 判断。',
        columns: ['Employee', 'Department', 'Anomaly Type', 'Current Result', 'Financial Impact', 'Risk Level', 'Decision State', 'Logged Reason', 'Actions'],
        rows: [
          {
            rowId: 'post-emp-jonathan-yeo',
            cells: [
              'Jonathan Yeo',
              'Finance Ops',
              'Net pay variance',
              'SGD 512,400',
              'SGD 18,900',
              'High',
              'Investigate',
              { kind: 'reason', title: 'Reason logged', detail: 'Blocked pending recalculation and source-file validation.' },
              { kind: 'action-set', actions: [{ label: 'Accept' }, { label: 'Investigate', tone: 'critical' }, { label: 'Override' }] },
            ],
            tone: 'critical',
            linkedIssueIds: ['post-net-pay-variance', 'post-floor-ceiling'],
            filterMeta: { riskLevel: 'high', department: 'Finance Ops', anomalyType: 'Net Pay Variance' },
          },
          {
            rowId: 'post-emp-ava-lim',
            cells: [
              'Ava Lim',
              'Finance Ops',
              'Missing deduction',
              'SGD 8,140',
              'SGD 7,860',
              'High',
              'Investigate',
              { kind: 'reason', title: 'Reason logged', detail: 'Compliance review required before any accept / override decision.' },
              { kind: 'action-set', actions: [{ label: 'Accept' }, { label: 'Investigate', tone: 'critical' }, { label: 'Override' }] },
            ],
            tone: 'critical',
            linkedIssueIds: ['post-missing-deduction'],
            filterMeta: { riskLevel: 'high', department: 'Finance Ops', anomalyType: 'Missing Deduction' },
          },
          {
            rowId: 'post-emp-lina-koh',
            cells: [
              'Lina Koh',
              'Commercial',
              'Peer group outlier',
              'SGD 11,620',
              'SGD 2,380',
              'Medium',
              'Review',
              { kind: 'reason', title: 'Reason pending', detail: 'Manager validation on role / grade mapping still needed.' },
              { kind: 'action-set', actions: [{ label: 'Accept' }, { label: 'Investigate' }, { label: 'Override' }] },
            ],
            tone: 'warning',
            linkedIssueIds: ['post-peer-outlier'],
            filterMeta: { riskLevel: 'medium', department: 'Commercial', anomalyType: 'Peer Group Outlier' },
          },
          {
            rowId: 'post-emp-marcus-tan',
            cells: [
              'Marcus Tan',
              'Commercial',
              'Unexpected allowance',
              'SGD 2,430',
              'SGD 2,430',
              'Medium',
              'Override',
              { kind: 'reason', title: 'Override reason', detail: 'One-off retention allowance; signed entitlement proof requested.' },
              { kind: 'action-set', actions: [{ label: 'Accept' }, { label: 'Investigate' }, { label: 'Override', tone: 'warning' }] },
            ],
            tone: 'warning',
            linkedIssueIds: ['post-unexpected-allowance'],
            filterMeta: { riskLevel: 'medium', department: 'Commercial', anomalyType: 'Unexpected Allowance' },
          },
          {
            rowId: 'post-emp-nora-goh',
            cells: [
              'Nora Goh',
              'People Ops',
              'New pay component',
              'SGD 980',
              'SGD 980',
              'Medium',
              'Accept',
              { kind: 'reason', title: 'Reason logged', detail: 'Late approval memo attached and acknowledged by People Ops.' },
              { kind: 'action-set', actions: [{ label: 'Accept', tone: 'neutral' }, { label: 'Investigate' }, { label: 'Override' }] },
            ],
            tone: 'warning',
            linkedIssueIds: ['post-new-pay-component'],
            filterMeta: { riskLevel: 'medium', department: 'People Ops', anomalyType: 'New Pay Component' },
          },
          {
            rowId: 'post-emp-adrian-seah',
            cells: [
              'Adrian Seah',
              'Shared Services',
              'Deduction change threshold breach',
              'SGD 5,420',
              'SGD 640',
              'Medium',
              'Review',
              { kind: 'reason', title: 'Reason pending', detail: 'Payroll note not yet attached for manual deduction change.' },
              { kind: 'action-set', actions: [{ label: 'Accept' }, { label: 'Investigate' }, { label: 'Override' }] },
            ],
            tone: 'warning',
            linkedIssueIds: ['post-deduction-change'],
            filterMeta: { riskLevel: 'medium', department: 'Shared Services', anomalyType: 'Deduction Change' },
          },
        ],
      },
      'Anomaly Type View': {
        title: 'Post-Payroll Risk Data',
        caption: '按异常类型聚合 post-payroll case，统计每种 anomaly 的 case 数、影响金额和当前处理状态。',
        columns: ['Anomaly Type', 'Affected Employees', 'Departments', 'Financial Impact', 'Risk Level', 'Current Status'],
        rows: [
          { rowId: 'post-type-net-pay', cells: ['Net Pay Variance', '2', 'Finance Ops', 'SGD 18,900', 'High', 'Investigate'], tone: 'critical', linkedIssueIds: ['post-net-pay-variance'], filterMeta: { riskLevel: 'high', department: 'Finance Ops', anomalyType: 'Net Pay Variance' } },
          { rowId: 'post-type-missing-deduction', cells: ['Missing Deduction', '1', 'Finance Ops', 'SGD 7,860', 'High', 'Investigate'], tone: 'critical', linkedIssueIds: ['post-missing-deduction'], filterMeta: { riskLevel: 'high', department: 'Finance Ops', anomalyType: 'Missing Deduction' } },
          { rowId: 'post-type-unexpected-allowance', cells: ['Unexpected Allowance', '3', 'Commercial', 'SGD 8,760', 'Medium', 'Override review'], tone: 'warning', linkedIssueIds: ['post-unexpected-allowance'], filterMeta: { riskLevel: 'medium', department: 'Commercial', anomalyType: 'Unexpected Allowance' } },
          { rowId: 'post-type-peer-outlier', cells: ['Peer Group Outlier', '2', 'Commercial', 'SGD 3,880', 'Medium', 'Review'], tone: 'warning', linkedIssueIds: ['post-peer-outlier'], filterMeta: { riskLevel: 'medium', department: 'Commercial', anomalyType: 'Peer Group Outlier' } },
          { rowId: 'post-type-new-component', cells: ['New Pay Component', '2', 'People Ops', 'SGD 3,120', 'Medium', 'Evidence pending'], tone: 'warning', linkedIssueIds: ['post-new-pay-component'], filterMeta: { riskLevel: 'medium', department: 'People Ops', anomalyType: 'New Pay Component' } },
          { rowId: 'post-type-tax-variance', cells: ['Tax Amount Variance', '1', 'People Ops', 'SGD 1,280', 'Medium', 'Assigned'], tone: 'warning', linkedIssueIds: ['post-tax-variance'], filterMeta: { riskLevel: 'medium', department: 'People Ops', anomalyType: 'Tax Amount Variance' } },
          { rowId: 'post-type-ot-spike', cells: ['Overtime Spike', '1', 'Operations', 'SGD 1,940', 'Medium', 'Pending evidence'], tone: 'warning', linkedIssueIds: ['post-overtime-spike'], filterMeta: { riskLevel: 'medium', department: 'Operations', anomalyType: 'Overtime Spike' } },
          { rowId: 'post-type-deduction-change', cells: ['Deduction Change', '2', 'Shared Services', 'SGD 2,180', 'Low', 'Review'], tone: 'normal', linkedIssueIds: ['post-deduction-change'], filterMeta: { riskLevel: 'low', department: 'Shared Services', anomalyType: 'Deduction Change' } },
        ],
      },
      Investigate: {
        title: 'Post-Payroll Risk Data',
        caption: '调查队列聚焦仍在处理中或需要补证据的 case，帮助 payroll control 跟踪 investigation 闭环。',
        columns: ['Case', 'Assigned To', 'Current Hypothesis', 'Missing Evidence', 'ETA', 'Risk Level', 'Investigation State', 'Logged Reason'],
        rows: [
          {
            rowId: 'post-investigate-jonathan',
            cells: [
              'Jonathan Yeo / Net pay variance',
              'Payroll Control Lead',
              'Decimal mapping issue in interface feed',
              'Source file + calc log',
              'Today 18:00',
              'High',
              'In progress',
              { kind: 'reason', title: 'Reason logged', detail: 'Investigation opened because blocker threshold was exceeded.' },
            ],
            tone: 'critical',
            linkedIssueIds: ['post-net-pay-variance'],
            filterMeta: { riskLevel: 'high', department: 'Finance Ops', anomalyType: 'Net Pay Variance' },
          },
          {
            rowId: 'post-investigate-ava',
            cells: [
              'Ava Lim / Missing deduction',
              'Compliance Analyst',
              'CPF flag dropped in payroll rule',
              'Rule trace + prior month comparison',
              'Today 17:30',
              'High',
              'In progress',
              { kind: 'reason', title: 'Reason logged', detail: 'Manual accept is blocked until compliance note is added.' },
            ],
            tone: 'critical',
            linkedIssueIds: ['post-missing-deduction'],
            filterMeta: { riskLevel: 'high', department: 'Finance Ops', anomalyType: 'Missing Deduction' },
          },
          {
            rowId: 'post-investigate-darius',
            cells: [
              'Darius Ong / Net pay ceiling breach',
              'Payroll Control Lead',
              'Likely extra zero in one-time payment feed',
              'Source payload + corrected rerun',
              'Today 19:00',
              'High',
              'In progress',
              { kind: 'reason', title: 'Reason logged', detail: 'Absolute ceiling breach acknowledged as approval blocker.' },
            ],
            tone: 'critical',
            linkedIssueIds: ['post-floor-ceiling'],
            filterMeta: { riskLevel: 'high', department: 'Commercial', anomalyType: 'Net Pay Floor/Ceiling' },
          },
          {
            rowId: 'post-investigate-marcus',
            cells: [
              'Marcus Tan / Unexpected allowance',
              'Commercial HRBP',
              'One-off retention allowance',
              'Signed entitlement proof',
              'Tomorrow 10:00',
              'Medium',
              'Pending evidence',
              { kind: 'reason', title: 'Override reason required', detail: 'Override cannot be completed until signed entitlement proof is attached.' },
            ],
            tone: 'warning',
            linkedIssueIds: ['post-unexpected-allowance'],
            filterMeta: { riskLevel: 'medium', department: 'Commercial', anomalyType: 'Unexpected Allowance' },
          },
          {
            rowId: 'post-investigate-nora',
            cells: [
              'Nora Goh / New pay component',
              'People Ops Lead',
              'Late-approved component',
              'Approval memo',
              'Ready now',
              'Medium',
              'Ready to close',
              { kind: 'reason', title: 'Reason logged', detail: 'Approval memo received; case can move to accept.' },
            ],
            tone: 'warning',
            linkedIssueIds: ['post-new-pay-component'],
            filterMeta: { riskLevel: 'medium', department: 'People Ops', anomalyType: 'New Pay Component' },
          },
          {
            rowId: 'post-investigate-ella',
            cells: [
              'Ella Tan / Overtime spike',
              'Ops Analyst',
              'OT import duplicated for rest-day batch',
              'Attendance import log',
              'Tomorrow 11:00',
              'Medium',
              'Pending evidence',
              { kind: 'reason', title: 'Reason pending', detail: 'Attendance log still needed before final accept / override decision.' },
            ],
            tone: 'warning',
            linkedIssueIds: ['post-overtime-spike'],
            filterMeta: { riskLevel: 'medium', department: 'Operations', anomalyType: 'Overtime Spike' },
          },
        ],
      },
      'Audit Trail': {
        title: 'Post-Payroll Risk Data',
        caption: '审计视图集中展示每条异常的处理轨迹，确保 accept / override / unlock 决定都可回溯。',
        columns: ['Log ID', 'Timestamp', 'Actor', 'Case / Output', 'Action Logged', 'Reason Logged', 'Risk Level', 'Immutability Status'],
        rows: [
          { rowId: 'post-audit-0905', cells: ['LOG-0905', '09:05', 'System', 'AI snapshot v3.4', 'Risk scan generated for 486 payslips', 'Initial scan signed and frozen for audit.', 'High', 'Immutable'], tone: 'critical', filterMeta: { riskLevel: 'high', department: 'All Departments', anomalyType: 'AI Output Snapshot' } },
          { rowId: 'post-audit-0912', cells: ['LOG-0912', '09:12', 'Payroll Admin', 'Ava Lim', 'Investigate selected', 'Missing CPF deduction requires compliance validation.', 'High', 'Immutable'], tone: 'critical', linkedIssueIds: ['post-missing-deduction'], filterMeta: { riskLevel: 'high', department: 'Finance Ops', anomalyType: 'Missing Deduction' } },
          { rowId: 'post-audit-0940', cells: ['LOG-0940', '09:40', 'Commercial HRBP', 'Marcus Tan', 'Override requested', 'One-off retention allowance claimed; evidence still pending.', 'Medium', 'Immutable'], tone: 'warning', linkedIssueIds: ['post-unexpected-allowance'], filterMeta: { riskLevel: 'medium', department: 'Commercial', anomalyType: 'Unexpected Allowance' } },
          { rowId: 'post-audit-1015', cells: ['LOG-1015', '10:15', 'People Ops Lead', 'Nora Goh', 'Accept selected', 'Late approval memo received and attached.', 'Medium', 'Immutable'], tone: 'normal', linkedIssueIds: ['post-new-pay-component'], filterMeta: { riskLevel: 'medium', department: 'People Ops', anomalyType: 'New Pay Component' } },
        ],
      },
    },
    currentView: {
      title: 'Post-Payroll Risk Data',
      caption: '按 Department 聚合 post-payroll 异常，先看哪些部门承载了最高暴露与最多待审项目。',
      columns: ['Department', 'High Risk', 'Medium Risk', 'Financial Impact', 'Anomaly Type', 'Risk Level', 'Decision State'],
      rows: [
        { rowId: 'post-dept-finops', cells: ['Finance Ops', '2', '3', 'SGD 21,340', 'Net pay variance + missing deduction', 'High', 'Investigate'], tone: 'critical', linkedIssueIds: ['post-net-pay-variance', 'post-missing-deduction'], filterMeta: { riskLevel: 'high', department: 'Finance Ops', anomalyType: 'Net Pay Variance' } },
        { rowId: 'post-dept-commercial', cells: ['Commercial', '1', '4', 'SGD 11,880', 'Unexpected allowance / peer outlier', 'Medium', 'Override review'], tone: 'warning', linkedIssueIds: ['post-unexpected-allowance', 'post-peer-outlier'], filterMeta: { riskLevel: 'medium', department: 'Commercial', anomalyType: 'Unexpected Allowance' } },
        { rowId: 'post-dept-peopleops', cells: ['People Ops', '1', '3', 'SGD 5,200', 'New pay component + tax variance', 'Medium', 'Evidence pending'], tone: 'warning', linkedIssueIds: ['post-new-pay-component', 'post-tax-variance'], filterMeta: { riskLevel: 'medium', department: 'People Ops', anomalyType: 'New Pay Component' } },
        { rowId: 'post-dept-shared', cells: ['Shared Services', '0', '2', 'SGD 2,180', 'Deduction change threshold breach', 'Low', 'Accept'], tone: 'normal', linkedIssueIds: ['post-deduction-change'], filterMeta: { riskLevel: 'low', department: 'Shared Services', anomalyType: 'Deduction Change' } },
      ],
    },
    tabTables: {
      'Department View': [],
      'Employee View': [
        {
          title: 'Employee Case Notes',
          caption: '逐案补充 baseline、business context 和 reviewer 处理意见，保持和审批动作同频。',
          columns: ['Employee', 'Baseline / Peer', 'Business Context', 'Reviewer Note', 'Next Step'],
          rows: [
            { rowId: 'post-emp-detail-jonathan', cells: ['Jonathan Yeo', '6m avg SGD 12,800', 'Likely input scaling issue', 'Keep blocker until recalc is done', 'Investigate'], tone: 'critical', linkedIssueIds: ['post-net-pay-variance'] },
            { rowId: 'post-emp-detail-ava', cells: ['Ava Lim', 'CPF present in prior month', 'Possible statutory rule miss', 'Needs compliance sign-off', 'Investigate'], tone: 'critical', linkedIssueIds: ['post-missing-deduction'] },
            { rowId: 'post-emp-detail-lina', cells: ['Lina Koh', 'Peer median SGD 8,940', 'Pay is outside grade/site peer band', 'Validate whether role mapping is correct', 'Review'], tone: 'warning', linkedIssueIds: ['post-peer-outlier'] },
            { rowId: 'post-emp-detail-marcus', cells: ['Marcus Tan', 'No prior entitlement record', 'Commercial requested one-off payment', 'Accept only with override memo', 'Override'], tone: 'warning', linkedIssueIds: ['post-unexpected-allowance'] },
            { rowId: 'post-emp-detail-nora', cells: ['Nora Goh', 'No comparable peer issue', 'Late component approval received', 'Evidence now sufficient', 'Accept'], tone: 'normal' },
            { rowId: 'post-emp-detail-adrian', cells: ['Adrian Seah', '6m avg deduction SGD 420', 'Recurring deduction changed sharply this month', 'Confirm whether manual deduction is intended', 'Review'], tone: 'warning', linkedIssueIds: ['post-deduction-change'] },
          ],
        },
      ],
      'Anomaly Type View': [
        {
          title: 'Anomaly Type Breakdown',
          caption: '进一步把 anomaly type 视图拆成 owner、典型根因和处理方式，便于做批量分派。',
          columns: ['Anomaly Type', 'Typical Root Cause', 'Owner Route', 'Cases', 'Financial Impact', 'Recommended Handling'],
          rows: [
            { rowId: 'post-type-detail-net-pay', cells: ['Net Pay Variance', 'Scaling / decimal mapping', 'Payroll Control Lead', '2', 'SGD 18,900', 'Investigate + rerun'], tone: 'critical', linkedIssueIds: ['post-net-pay-variance'] },
            { rowId: 'post-type-detail-missing-deduction', cells: ['Missing Deduction', 'Statutory rule miss', 'Compliance Analyst', '1', 'SGD 7,860', 'Investigate before approval'], tone: 'critical', linkedIssueIds: ['post-missing-deduction'] },
            { rowId: 'post-type-detail-unexpected-allowance', cells: ['Unexpected Allowance', 'No entitlement proof', 'Commercial HRBP', '3', 'SGD 8,760', 'Override only with evidence'], tone: 'warning', linkedIssueIds: ['post-unexpected-allowance'] },
            { rowId: 'post-type-detail-peer-outlier', cells: ['Peer Group Outlier', 'Role / grade / site mismatch', 'Commercial HRBP', '2', 'SGD 3,880', 'Validate mapping'], tone: 'warning', linkedIssueIds: ['post-peer-outlier'] },
            { rowId: 'post-type-detail-tax', cells: ['Tax Amount Variance', 'Tax code / AW handling', 'Tax Specialist', '1', 'SGD 1,280', 'Review tax setup'], tone: 'warning', linkedIssueIds: ['post-tax-variance'] },
            { rowId: 'post-type-detail-ot', cells: ['Overtime Spike', 'Attendance import duplication', 'Ops Analyst', '1', 'SGD 1,940', 'Check attendance log'], tone: 'warning', linkedIssueIds: ['post-overtime-spike'] },
          ],
        },
      ],
      Investigate: [
        {
          title: 'Investigation Checklist',
          caption: '把调查工作拆成 owner、证据和 closure 条件，确保每个 case 都能走到明确结论。',
          columns: ['Case', 'Root Cause Track', 'Evidence Needed', 'Owner', 'Close Condition', 'Current State'],
          rows: [
            { rowId: 'post-investigate-check-jonathan', cells: ['Jonathan Yeo', 'Interface decimal / scaling', 'Source payload, calc rerun', 'Payroll Control Lead', 'Recalculation confirms corrected amount', 'In progress'], tone: 'critical', linkedIssueIds: ['post-net-pay-variance'] },
            { rowId: 'post-investigate-check-ava', cells: ['Ava Lim', 'Statutory deduction rule failure', 'Rule trace, deduction config, prior pay slip', 'Compliance Analyst', 'Deduction corrected or approved exception', 'In progress'], tone: 'critical', linkedIssueIds: ['post-missing-deduction'] },
            { rowId: 'post-investigate-check-marcus', cells: ['Marcus Tan', 'Business exception allowance', 'Signed entitlement proof', 'Commercial HRBP', 'Override reason logged', 'Pending evidence'], tone: 'warning' },
            { rowId: 'post-investigate-check-nora', cells: ['Nora Goh', 'Late pay component approval', 'Approval memo', 'People Ops Lead', 'Audit note attached', 'Ready to close'], tone: 'normal' },
            { rowId: 'post-investigate-check-ella', cells: ['Ella Tan', 'OT import duplication', 'Attendance import log, peer-hour comparison', 'Ops Analyst', 'OT spike explained or corrected', 'Pending evidence'], tone: 'warning', linkedIssueIds: ['post-overtime-spike'] },
            { rowId: 'post-investigate-check-yusuf', cells: ['Yusuf Rahman', 'Tax code or additional wage miss', 'Tax setup trace, prior 6m baseline', 'Tax Specialist', 'Reason for tax drop documented', 'Assigned'], tone: 'warning', linkedIssueIds: ['post-tax-variance'] },
          ],
        },
      ],
      'Audit Trail': [
        {
          title: 'Decision Audit Log',
          caption: '保留每一次调查、接受、override 与解锁动作的时间线，供审计与管理复盘。',
          columns: ['Log ID', 'Timestamp', 'Actor', 'Case', 'Decision / Update', 'Reason Logged', 'Trace Status'],
          rows: [
            { rowId: 'post-audit-log-1', cells: ['LOG-0905', '09:05', 'System', 'Jonathan Yeo', 'Flagged as blocker', 'Threshold exceeded vs 6m baseline', 'Recorded'], tone: 'critical', linkedIssueIds: ['post-net-pay-variance'] },
            { rowId: 'post-audit-log-2', cells: ['LOG-0912', '09:12', 'Payroll Admin', 'Ava Lim', 'Escalated to compliance', 'Missing CPF deduction in current result', 'Recorded'], tone: 'critical', linkedIssueIds: ['post-missing-deduction'] },
            { rowId: 'post-audit-log-3', cells: ['LOG-0940', '09:40', 'Commercial HRBP', 'Marcus Tan', 'Requested override', 'One-off retention allowance claimed', 'Pending evidence'], tone: 'warning', linkedIssueIds: ['post-unexpected-allowance'] },
            { rowId: 'post-audit-log-4', cells: ['LOG-1015', '10:15', 'People Ops Lead', 'Nora Goh', 'Accepted with explanation', 'Late approval memo received', 'Complete'], tone: 'normal', linkedIssueIds: ['post-new-pay-component'] },
          ],
        },
        {
          title: 'AI Output Ledger',
          caption: '把每次 AI 结果产出和阈值包版本固化下来，满足“AI 输出 + 人类决策”双向审计。',
          columns: ['Snapshot ID', 'Generated At', 'Output Type', 'Threshold Pack', 'Result Summary', 'Ledger Status'],
          rows: [
            { rowId: 'post-ledger-ai-1', cells: ['SNAP-APR26-01', '09:05', 'Full anomaly scan', 'THR-v2.8', '13 anomalies across 9 types generated', 'Immutable'], tone: 'critical' },
            { rowId: 'post-ledger-ai-2', cells: ['SNAP-APR26-02', '11:20', 'Post-correction rerun', 'THR-v2.8', '2 blocker cases still open after rerun', 'Immutable'], tone: 'warning' },
            { rowId: 'post-ledger-ai-3', cells: ['SNAP-APR26-03', '11:42', 'Employee comparison refresh', 'THR-v2.8', 'Peer-band and baseline views regenerated', 'Immutable'], tone: 'normal' },
          ],
        },
        {
          title: 'Approval Unlock Conditions',
          caption: '展示哪些 blocker 仍未满足解锁条件，避免审批动作脱离审计证据。',
          columns: ['Blocking Case', 'Current State', 'Required Before Unlock', 'Owner', 'Ready?'],
          rows: [
            { rowId: 'post-unlock-jonathan', cells: ['Jonathan Yeo', 'Investigate', 'Corrected recalc or documented exception', 'Payroll Control Lead', 'No'], tone: 'critical', linkedIssueIds: ['post-net-pay-variance'] },
            { rowId: 'post-unlock-ava', cells: ['Ava Lim', 'Investigate', 'Compliance conclusion logged', 'Compliance Analyst', 'No'], tone: 'critical', linkedIssueIds: ['post-missing-deduction'] },
            { rowId: 'post-unlock-marcus', cells: ['Marcus Tan', 'Override pending', 'Signed entitlement proof', 'Commercial HRBP', 'No'], tone: 'warning' },
            { rowId: 'post-unlock-nora', cells: ['Nora Goh', 'Accepted', 'Audit memo attached', 'People Ops Lead', 'Yes'], tone: 'normal' },
          ],
        },
      ],
    },
    tables: [
      {
        title: 'Anomaly Queue',
        caption: 'Payroll calculation 完成后的最终结果异常总表，是审批门槛的主体。',
        columns: ['Employee', 'Anomaly Type', 'Current Pay', 'Baseline / Peer', 'Financial Impact', 'Risk Level', 'Decision State'],
        rows: [
          { rowId: 'post-detail-jonathan-yeo', cells: ['Jonathan Yeo', 'Net pay variance', 'SGD 512,400', '6m avg SGD 12,800', 'SGD 18,900', 'High', 'Investigate'], tone: 'critical', linkedIssueIds: ['post-net-pay-variance'] },
          { rowId: 'post-detail-ava-lim', cells: ['Ava Lim', 'Missing deduction', 'SGD 8,140', 'CPF missing vs prior', 'SGD 7,860', 'High', 'Investigate'], tone: 'critical', linkedIssueIds: ['post-missing-deduction'] },
          { rowId: 'post-detail-marcus-tan', cells: ['Marcus Tan', 'Unexpected allowance', 'SGD 2,430', 'No entitlement record', 'SGD 2,430', 'Medium', 'Override'], tone: 'warning' },
          { rowId: 'post-detail-nora-goh', cells: ['Nora Goh', 'New pay component', 'SGD 980', 'No HR approval on file', 'SGD 980', 'Medium', 'Accept'], tone: 'warning' },
        ],
      },
    ],
    ai: {
      executiveSummary: '高风险异常已锁定审批门。4 条高风险和 9 条中风险需要处理，当前总暴露金额约 SGD 38,420。',
      outputs: [
        ['High-risk anomaly table', '4'],
        ['Department risk dashboard', '4'],
        ['Employee comparison drill-down', '3'],
        ['Override pending list', '2'],
      ],
      quickActions: ['Accept selected items', 'Investigate flagged anomalies', 'Send executive summary', 'Re-run analysis'],
      rules: [
        ['Net Pay Variance', 'Blocker', '4 cases above threshold'],
        ['Peer Group Outlier', 'Warning', '2 cases exceed configured peer-band standard deviation'],
        ['Missing Deduction', 'Blocker', '2 statutory deductions absent'],
        ['Unexpected Allowance', 'Warning', '3 items lack entitlement record'],
        ['Net Pay Floor / Ceiling', 'Blocker', '1 case breached the absolute pay ceiling'],
        ['Tax Amount Variance', 'Warning', '1 sharp tax drop requires code review'],
        ['Overtime Spike', 'Warning', '1 employee exceeds configured OT deviation'],
        ['New Pay Component', 'Warning', '4 items need HR acknowledgement'],
        ['Deduction Change Threshold', 'Warning', '2 recurring deductions changed materially vs prior period'],
      ],
      anomalies: [
        {
          id: 'post-net-pay-variance',
          severity: 'critical',
          summary: '高风险异常已锁定审批门。4 条高风险异常需要先确认，当前总暴露金额约 SGD 38,420。',
          outputs: ['High-risk anomaly table', 'Approval gate status', 'Exposure summary'],
          aiRecommendation: 'Investigate the high-risk anomalies before unlocking payroll approval.',
          quickActions: ['Investigate flagged anomalies', 'Send executive summary'],
          title: 'Jonathan Yeo',
          detail: 'Likely decimal error in net pay',
          impact: 'Immediate investigation required',
          recommendation: 'Keep approval locked until high-risk anomalies are explicitly acknowledged',
        },
        {
          id: 'post-peer-outlier',
          severity: 'warning',
          summary: '存在与同角色、职级、地点同侪相比明显偏离的 pay result，虽然未必是错误，但需要确认是否属于合理例外。',
          outputs: ['Peer-band outlier list', 'Employee comparison drill-down'],
          aiRecommendation: 'Validate role, grade, and site mapping before accepting peer-group outliers.',
          quickActions: ['Open employee comparison', 'Request manager validation'],
          title: 'Lina Koh',
          detail: 'Pay is outside configured peer band',
          impact: 'Possible mapping or entitlement issue',
          recommendation: 'Validate peer-group context before approval',
        },
        {
          id: 'post-missing-deduction',
          severity: 'critical',
          summary: '存在需要解释原因的 override 场景，未记录原因前不应直接放行审批。',
          outputs: ['Override pending list', 'Decision audit trail'],
          aiRecommendation: 'Require a documented override reason before any approval decision proceeds.',
          quickActions: ['Accept selected items', 'Require override reason'],
          title: 'Ava Lim',
          detail: 'CPF missing from calculated result',
          impact: 'Compliance exposure',
          recommendation: 'Require override reason whenever result is accepted without correction',
        },
        {
          id: 'post-unexpected-allowance',
          severity: 'warning',
          summary: '检测到没有 entitlement record 的 allowance，若属业务例外，应以 override reason 和 supporting document 形式留痕。',
          outputs: ['Allowance exception queue', 'Override pending list'],
          aiRecommendation: 'Allow override only when a signed entitlement proof is attached.',
          quickActions: ['Require override reason', 'Request entitlement proof'],
          title: 'Marcus Tan',
          detail: 'Allowance lacks entitlement record',
          impact: 'Manual exception risk',
          recommendation: 'Keep exception traceable if accepted',
        },
        {
          id: 'post-floor-ceiling',
          severity: 'critical',
          summary: '存在绝对 net pay floor/ceiling breach，这类异常即使 variance 百分比不高，也应优先当作数据输入错误处理。',
          outputs: ['Absolute ceiling breach list', 'Approval gate status'],
          aiRecommendation: 'Investigate any floor/ceiling breach before considering approval unlock.',
          quickActions: ['Investigate flagged anomalies', 'Re-run analysis'],
          title: 'Darius Ong',
          detail: 'Net pay exceeded configured ceiling',
          impact: 'Potential gross overpayment',
          recommendation: 'Treat absolute ceiling breaches as blockers',
        },
        {
          id: 'post-tax-variance',
          severity: 'warning',
          summary: '本期 tax withheld 与过去 6 个月基线相比出现异常下滑，可能是 tax code 或 additional wage 处理错误。',
          outputs: ['Tax variance report', 'Employee comparison drill-down'],
          aiRecommendation: 'Review tax setup and prior-period tax pattern before approval.',
          quickActions: ['Open tax variance report', 'Assign tax specialist'],
          title: 'Yusuf Rahman',
          detail: 'Tax amount dropped sharply vs baseline',
          impact: 'Tax withholding risk',
          recommendation: 'Validate tax code and additional wage handling',
        },
        {
          id: 'post-overtime-spike',
          severity: 'warning',
          summary: 'OT 金额显著高于同职级同岗位同侪标准差范围，需要确认是否由重复导入或异常工时导致。',
          outputs: ['OT spike report', 'Peer-hour comparison'],
          aiRecommendation: 'Check attendance import and OT source records before acceptance.',
          quickActions: ['Open OT spike report', 'Request attendance log'],
          title: 'Ella Tan',
          detail: 'OT exceeded configured deviation band',
          impact: 'Possible overpayment',
          recommendation: 'Confirm OT source before approval',
        },
        {
          id: 'post-new-pay-component',
          severity: 'warning',
          summary: '检测到首次出现的新 pay component，但缺少完整 HR approval 证据，需在接受前补齐说明。',
          outputs: ['New pay component list', 'Decision audit trail'],
          aiRecommendation: 'Attach HR approval evidence before accepting first-time pay components.',
          quickActions: ['Request approval memo', 'Accept selected items'],
          title: 'Nora Goh',
          detail: 'New pay component without prior history',
          impact: 'Needs HR acknowledgement',
          recommendation: 'Keep new component additions auditable',
        },
        {
          id: 'post-deduction-change',
          severity: 'warning',
          summary: 'Recurring deduction 金额与前期相比变化过大，虽然未缺失，但仍可能是输入或规则变更导致的异常。',
          outputs: ['Deduction delta report', 'Department risk dashboard'],
          aiRecommendation: 'Validate whether the deduction delta is intended before approval.',
          quickActions: ['Open deduction delta report', 'Request payroll note'],
          title: 'Adrian Seah',
          detail: 'Deduction amount changed beyond threshold',
          impact: 'Possible deduction error',
          recommendation: 'Review material deduction deltas case by case',
        },
      ],
      actions: ['Accept', 'Investigate', 'Override', 'Re-run Analysis', 'Unlock for Approval'],
    },
  },
]

const requestPages = []
const corPages = [
  {
    id: 'cor-task-collect-info',
    phase: 'COR Task Detail',
    title: 'Contractor Fill in Personal Info.',
    status: 'In Progress',
    accent: 'scope',
    subtitle: 'SD 发起信息收集后，由 contractor 填写个人信息；页面按分组展示进度、缺失项和校验结果。',
    stats: [
      ['Assignee', 'Contractor'],
      ['Due Date', '2026-04-10'],
      ['Remind Date', '2026-04-09'],
      ['Task ID', 'COR-T2'],
    ],
    taskGoal: '完成个人信息与附件填写，并通过提交前预检后交由 SD 在 1.1.5 节点审核。',
    taskActions: ['Save Draft', 'Remind Contractor', 'Submit for Review'],
    formGroups: [
      {
        id: 'basic',
        label: 'Basic Info',
        fields: [
          {
            key: 'name',
            label: 'Name',
            value: 'Muller Hans',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '使用证件上的法定姓名，避免昵称或缩写。',
          },
          {
            key: 'nationality',
            label: 'Nationality',
            value: 'Germany',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '与证件信息保持一致，后续用于合规和合同模板匹配。',
          },
          {
            key: 'identity-type',
            label: 'Identity Type',
            value: 'Australia / Australian Temporary Visa',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '证件类型会影响后续审核规则，请选择最准确类型。',
          },
          {
            key: 'identity-no',
            label: 'Identity No.',
            value: '123123123',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '证件号码需与上传附件中的号码一致。',
          },
          {
            key: 'id-attachment',
            label: 'Identity Card Copy Attachment',
            value: '测试文件.pdf',
            required: true,
            status: 'Uploaded',
            tone: 'ok',
            span: 'full',
            hint: '支持 PDF / JPG / PNG。请确保文件清晰且信息完整可读。',
          },
          {
            key: 'terminate-date',
            label: 'Terminate Date',
            value: 'Not provided',
            required: false,
            status: 'Optional',
            tone: 'neutral',
            hint: '仅在存在终止安排时填写，否则可留空。',
          },
        ],
      },
      {
        id: 'contact',
        label: 'Contact Information',
        fields: [
          {
            key: 'email',
            label: 'Email Address',
            value: 'hans.m@protonmail.de',
            required: false,
            status: 'Completed',
            tone: 'ok',
            hint: '建议使用常用邮箱，用于签署通知和任务提醒。',
          },
          {
            key: 'phone',
            label: 'Phone Number',
            value: '+86 18917911000',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '包含国家区号，格式示例：+86 189XXXXXXX。',
          },
          {
            key: 'residential-country',
            label: 'Residential Country/Region',
            value: 'Germany',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '该字段会影响地址和银行校验规则。',
          },
          {
            key: 'residential-address',
            label: 'Residential Address',
            value: 'Germany 001',
            required: true,
            status: 'Completed',
            tone: 'ok',
            span: 'full',
            hint: '填写可投递的完整街道地址，避免仅填写城市名。',
          },
          {
            key: 'city',
            label: 'City',
            value: 'a',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '建议填写标准城市英文名，便于后续系统匹配。',
          },
          {
            key: 'state',
            label: 'State/Province',
            value: 'Berlin',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '州/省份字段应与邮编和国家保持一致。',
          },
          {
            key: 'post-code',
            label: 'Post Code',
            value: '123456',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '邮编用于地址验证，请确认与城市匹配。',
          },
        ],
      },
      {
        id: 'bank',
        label: 'Bank Information',
        fields: [
          {
            key: 'bank-country',
            label: 'Bank Country/Region',
            value: 'Germany',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '银行国家与收款国家不一致时，可能需要中转行信息。',
          },
          {
            key: 'bank-name',
            label: 'Bank Name',
            value: 'bank name',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '使用银行官方名称，避免简称。',
          },
          {
            key: 'holder-name',
            label: 'Account Holder Name',
            value: 'Muller Hans',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '账户名应与合同签署主体一致。',
          },
          {
            key: 'account-number',
            label: 'Account Number',
            value: 'Not provided',
            required: true,
            status: 'Missing',
            tone: 'critical',
            hint: '缺失时会阻塞 payout 设置，无法提交审核。',
          },
          {
            key: 'bank-id-type',
            label: 'Bank Identifier Type',
            value: 'Not provided',
            required: true,
            status: 'Missing',
            tone: 'warning',
            hint: '例如 IBAN / SWIFT / Local Bank ID，请按国家规范选择。',
          },
          {
            key: 'intermediary-swift',
            label: 'Intermediary Bank SWIFT',
            value: 'Optional',
            required: false,
            status: 'Optional',
            tone: 'neutral',
            hint: '跨境付款场景下建议填写，用于提升到账成功率。',
          },
          {
            key: 'branch-address',
            label: 'Bank Branch Address',
            value: 'bank address',
            required: true,
            status: 'Completed',
            tone: 'ok',
            span: 'full',
            hint: '填写银行分行地址，便于支付链路追踪。',
          },
        ],
      },
      {
        id: 'contract',
        label: 'Contract Info',
        fields: [
          {
            key: 'contract-start',
            label: 'Contract Start Date',
            value: '2026-05-01',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '起始日期应不早于资料确认完成时间。',
          },
          {
            key: 'contract-type',
            label: 'Contract Type',
            value: 'Independent Contractor',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '合同类型将决定模板和审批路径。',
          },
          {
            key: 'service-country',
            label: 'Service Country/Region',
            value: 'Germany',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '服务国家用于选择合同条款和税务规则。',
          },
        ],
      },
      {
        id: 'payment',
        label: 'Payment Setting',
        fields: [
          {
            key: 'currency',
            label: 'Currency',
            value: 'USD',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '请确认与客户结算币种一致。',
          },
          {
            key: 'payment-cycle',
            label: 'Payment Cycle',
            value: 'Monthly',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '付款周期会影响 payroll 截止时间配置。',
          },
          {
            key: 'payment-method',
            label: 'Payment Method',
            value: 'Bank Transfer',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '建议与银行信息类型一致，避免二次确认。',
          },
        ],
      },
    ],
    workspaceSections: [
      {
        title: 'Readiness Snapshot',
        type: 'cards',
        items: [
          { label: 'Required Fields', value: '19 / 21 Completed', tone: 'warning' },
          { label: 'Blockers', value: '2 Open', tone: 'critical' },
          { label: 'Attachments', value: '1 / 1 Uploaded', tone: 'ok' },
          { label: 'Last Update', value: '2026-04-09 17:37', tone: 'neutral' },
        ],
      },
    ],
    contextPanels: [
      {
        title: 'Task Information',
        items: [
          ['Task ID', 'COR-T2'],
          ['Request ID', '202604081501249800'],
          ['Task Type', 'collect_contractor_info (Contractor Fill in Personal Info.)'],
          ['Workflow', 'COR-NC-v1'],
        ],
      },
      {
        title: 'Request Summary',
        items: [
          ['Service', 'COR / New Contractor'],
          ['Location', 'Germany'],
          ['Client', 'DEMO03 / DEMO03'],
          ['Create Time', '2026-04-08 15:04:22'],
        ],
      },
      {
        title: 'Previous Task Outcome',
        items: [
          ['Task', 'Initiate Request'],
          ['Status', 'Done'],
          ['Result', 'Contractor profile created'],
          ['Handoff', 'Proceed to info collection'],
        ],
      },
    ],
    aiPanel: {
      suggestions: [
        '先按国家规则确认 Identity Type 与附件一致，再补齐银行字段。',
        '若 Residence Country 与 Bank Country 不一致，请在提交前补充备注说明。',
      ],
      risks: [
        'Account Number 缺失会阻塞 1.1.5 审核通过。',
        'Bank Identifier Type 未选择会导致付款链路校验失败。',
      ],
      missing: ['Account Number', 'Bank Identifier Type', 'Cross-border explanation note'],
      nextActions: [
        '补齐 Bank Information 后先 Save Draft，再执行 Submit for Review。',
        '使用 AI 生成给 SD 的备注文案，解释跨境收款信息。',
      ],
    },
    tabs: ['Task Workspace'],
    activeTab: 'Task Workspace',
    currentView: {
      title: 'Task Workspace',
      caption: 'COR 任务详情按 taskType 固定渲染，不再依赖 flow template。',
      columns: ['Section', 'Completion', 'Risk'],
      rows: [
        ['Identity', 'Complete', 'None'],
        ['Contact', 'Incomplete', 'Missing phone number'],
        ['Bank Details', 'Incomplete', 'Missing account number'],
      ],
    },
    tables: [],
    ai: {
      executiveSummary: '当前任务处于 contractor 填写阶段，存在 2 个阻塞项；建议先完成提交前预检再提交 SD 审核。',
      outputs: [['Missing fields', '3'], ['Attachment checks', '1']],
      quickActions: ['Save Draft', 'Generate Note for SD', 'Submit for Review'],
      rules: [
        ['Identity Completeness', 'Pass', 'Identity fields are complete'],
        ['Contact Completeness', 'Pass', 'Contact fields are complete'],
        ['Bank Readiness', 'Blocker', 'Account number is missing'],
        ['Cross-border Note', 'Warning', 'Residence and bank country mismatch needs explanation'],
      ],
      anomalies: [
        {
          id: 'cor-bank-missing',
          severity: 'critical',
          summary: '银行账户号缺失，会直接阻塞提交审核。',
          outputs: ['Bank readiness check'],
          aiRecommendation: 'Require account number before completion.',
          quickActions: ['Save Draft'],
          title: 'Missing Bank Account',
          detail: 'Account number missing',
          impact: 'Payment setup risk',
          recommendation: 'Block completion until provided',
        },
        {
          id: 'cor-cross-border-note',
          severity: 'warning',
          summary: '跨境银行信息缺少解释备注，可能触发 SD 退回。',
          outputs: ['Consistency check'],
          aiRecommendation: 'Generate and attach cross-border explanation note before submit.',
          quickActions: ['Generate Note for SD'],
          title: 'Missing Cross-border Note',
          detail: 'No explanation for residence/bank country mismatch',
          impact: 'Review rework risk',
          recommendation: 'Add explanation note before submission',
        },
      ],
      actions: ['Save Draft', 'Remind Contractor', 'Mark Task Complete'],
    },
  },
  {
    id: 'cor-task-create-agreement-send-client',
    phase: 'COR Task Detail',
    title: 'Create Agreement & Send to Client',
    status: 'Draft In Progress',
    accent: 'interface',
    subtitle: 'SD 基于统一模板与 Butter 数据生成协议，完成预览后发送给 Client Review。',
    stats: [
      ['Assignee', 'SD'],
      ['Due Date', '2026-04-10'],
      ['Remind Date', '2026-04-09'],
      ['Task ID', 'COR-T5'],
    ],
    taskGoal: '补齐必填字段后生成协议，在线预览无误后发送给 Client 确认。',
    taskActions: ['Generate Agreement'],
    formWorkspaceTitle: 'Agreement Builder',
    formWorkspaceHint: '先填写必需字段，再生成并预览协议',
    formGroups: [
      {
        id: 'agreement-fields',
        label: 'Agreement Fields',
        fields: [
          {
            key: 'client-name',
            label: 'Client Name',
            value: 'DEMO03 GmbH',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '必填。用于合同抬头和签署方展示。',
          },
          {
            key: 'contractor-name',
            label: 'Contractor Name',
            value: 'MULLER HANS',
            required: true,
            status: 'Auto Filled',
            tone: 'ok',
            hint: '默认由 Account Holder Name 自动转大写，可手动编辑。',
          },
          {
            key: 'registration-number',
            label: 'Registration Number',
            value: 'Optional',
            required: false,
            status: 'Optional',
            tone: 'neutral',
            hint: '可选。无注册号可留空。',
          },
          {
            key: 'company-address',
            label: 'Company Address',
            value: 'Unter den Linden 15, Berlin 10117, Germany',
            required: true,
            status: 'Completed',
            tone: 'ok',
            span: 'full',
            hint: '必填。请填写可用于法律通知的完整注册地址。',
          },
          {
            key: 'client-incorporate-country',
            label: 'Client Incorporate Country',
            value: 'Germany',
            required: true,
            status: 'Completed',
            tone: 'ok',
            hint: '必填。用于合同主体条款与适用法域落位。',
          },
        ],
      },
    ],
    workspaceSections: [
      {
        title: 'Readiness Snapshot',
        caption: '生成协议前需先满足必填字段条件。',
        type: 'cards',
        items: [
          { label: 'Required Fields', value: '4 / 4 Completed', tone: 'ok' },
          { label: 'Optional Fields', value: '1', tone: 'neutral' },
          { label: 'Additional Details', value: '2 Items Editable', tone: 'ok' },
          { label: 'Preview Status', value: 'Ready to generate', tone: 'neutral' },
        ],
      },
      {
        title: 'Additional Key Details',
        caption: '支持直接行内输入 Item 和 Detail，可继续新增补充条款。',
        type: 'agreementDetailsEditor',
        rows: [
          ['Notice Period', '30 calendar days'],
          ['Payment Terms', 'Net 15 after invoice'],
        ],
      },
    ],
    contextPanels: [
      {
        title: 'Task Information',
        items: [
          ['Task ID', 'COR-T5'],
          ['Request ID', '202604081501249800'],
          ['Task Type', 'create_agreement_send_to_client'],
          ['Workflow', 'COR-NC-v1'],
        ],
      },
      {
        title: 'Request Summary',
        items: [
          ['Service', 'COR / New Contractor'],
          ['Location', 'Germany'],
          ['Contractor', 'Muller Hans'],
          ['Client', 'DEMO03 / DEMO03'],
        ],
      },
      {
        title: 'Previous Task Outcome',
        items: [
          ['Task', 'Review Contractor Info'],
          ['Status', 'Done'],
          ['Result', 'Contractor profile approved for agreement drafting'],
          ['Handoff', 'Proceed to agreement generation'],
        ],
      },
      {
        title: 'Integration Status',
        items: [
          ['Provider', 'Butter Contract Engine'],
          ['Retrieval Status', 'Butter data ready'],
          ['Last Generate Time', '-'],
          ['Last Error', '-'],
        ],
      },
    ],
    aiPanel: {
      suggestions: ['必填字段已完整，可直接点击 Generate Agreement 进入在线预览。'],
      risks: ['发送前仍需检查合同抬头、公司地址和核心条款映射是否正确。'],
      missing: ['No blocker'],
      nextActions: ['点击 Generate Agreement；预览确认无误后执行 Send for Review。'],
    },
    tabs: ['Task Workspace'],
    activeTab: 'Task Workspace',
    currentView: {
      title: 'Task Workspace',
      caption: '按“填写 -> 生成 -> 预览 -> 发送”流程组织页面，替代旧的发给 contractor 发送页。',
      columns: ['Stage', 'Progress', 'Remark'],
      rows: [
        ['Fill Required Fields', 'Completed', 'Required inputs are ready'],
        ['Generate Agreement', 'Ready', 'Available directly below the form'],
        ['Online Preview', 'Pending', 'Open after clicking Generate Agreement'],
      ],
    },
    tables: [],
    ai: {
      executiveSummary: '当前页面已满足生成条件，Generate Agreement 应作为填写区后的直接下一步动作。',
      outputs: [['Required fields check', '4'], ['Additional key details', '2']],
      quickActions: ['Generate Agreement', 'Open Preview', 'Send for Review'],
      rules: [
        ['Data Retrieval Readiness', 'Pass', 'Butter baseline data is available'],
        ['Contractor Name Mapping', 'Pass', 'Account holder name converted to uppercase'],
        ['Required Field Gate', 'Pass', 'All required manual fields are completed'],
      ],
      anomalies: [
        {
          id: 'cor-preview-before-send',
          severity: 'info',
          summary: '建议先在线预览协议内容，再发送给 Client Review。',
          outputs: ['Preview recommendation'],
          aiRecommendation: 'Open generated agreement preview and verify key clauses.',
          quickActions: ['Open Preview'],
          title: 'Preview First',
          detail: 'Preview step is pending',
          impact: 'Lower review rework risk',
          recommendation: 'Send for review only after preview validation',
        },
      ],
      actions: ['Generate Agreement', 'Send for Review'],
    },
    agreementPreview: {
      title: 'Independent Contractor Agreement',
      version: 'Draft v2026.04.10',
      sections: [
        {
          heading: 'Parties',
          body:
            'This Independent Contractor Agreement is made between DEMO03 GmbH, a company incorporated in Germany with its registered address at Unter den Linden 15, Berlin 10117, Germany, and MULLER HANS.',
        },
        {
          heading: 'Services',
          body:
            'The Contractor will provide services in Germany under the commercial terms stored in Butter and approved agreement fields.',
        },
        {
          heading: 'Execution Check',
          body:
            'Preview generated from Butter baseline data plus manual agreement fields. Review the party names, company address, and incorporation country before sending for client review.',
        },
      ],
    },
  },
  {
    id: 'cor-task-review-signed-contract',
    phase: 'COR Task Detail',
    title: 'Review Signed Contract',
    status: 'Review Pending',
    accent: 'post',
    subtitle: '审签任务聚焦签署结果、合同版本一致性和归档确认，决定是否进入下一交付节点。',
    stats: [
      ['Assignee', 'SD'],
      ['Due Date', '2026-04-11'],
      ['Remind Date', '2026-04-10'],
      ['Task ID', 'COR-T7'],
    ],
    taskGoal: '确认签署完整性与归档状态，确保审计链路闭环后再完成任务。',
    taskActions: ['Refresh from DocuSign', 'Upload Archive Proof', 'Mark Task Complete'],
    workspaceSections: [
      {
        title: 'Signature Status',
        caption: '按 signer 展示签署时间和状态，作为任务主决策依据。',
        type: 'table',
        columns: ['Level', 'Signer', 'Email', 'Signed Date', 'Status'],
        rows: [
          ['1', 'Bo Li Cheng', 'nancy.pan@biposervice.com', '2026-04-08 15:29:54', 'Completed'],
          ['2', 'Muller Hans', 'hans.m@protonmail.de', '2026-04-08 15:30:45', 'Completed'],
        ],
      },
      {
        title: 'Review Checklist',
        caption: '签署完成后的必检项，确保任务可安全关闭。',
        type: 'table',
        columns: ['Checklist Item', 'Current Status', 'Evidence', 'Decision'],
        rows: [
          ['All required signers completed', 'Pass', '2 / 2 completed', 'Accept'],
          ['Document version consistency', 'Pass', 'v2026.04.09 matched', 'Accept'],
          ['Archive confirmation', 'Pending', 'Archive receipt missing', 'Hold'],
        ],
      },
      {
        title: 'Review Decision Area',
        caption: '执行动作前先确认审查结论。',
        type: 'cards',
        items: [
          { label: 'Current Conclusion', value: 'Cannot close yet', tone: 'warning' },
          { label: 'Blocking Item', value: 'Archive confirmation pending', tone: 'critical' },
          { label: 'Recommended Action', value: 'Upload archive proof', tone: 'ok' },
        ],
      },
    ],
    contextPanels: [
      {
        title: 'Task Information',
        items: [
          ['Task ID', 'COR-T7'],
          ['Request ID', '202604081501249800'],
          ['Task Type', 'review_signed_contract'],
          ['Workflow', 'COR-NC-v1'],
        ],
      },
      {
        title: 'Request Summary',
        items: [
          ['Service', 'COR / New Contractor'],
          ['Location', 'Germany'],
          ['Contractor', 'Muller Hans'],
          ['Create Time', '2026-04-08 15:31:46'],
        ],
      },
          {
            title: 'Previous Task Outcome',
            items: [
              ['Task', 'Create Agreement & Send to Client'],
              ['Status', 'Done'],
              ['Result', 'Agreement sent to client review'],
              ['Handoff', 'Proceed to review'],
            ],
          },
    ],
    aiPanel: {
      suggestions: ['先补齐归档凭证，再关闭当前任务。'],
      risks: ['若未归档直接关闭，审计链路会出现缺口。'],
      missing: ['Archive confirmation receipt'],
      nextActions: ['点击 Upload Archive Proof，完成后再 Mark Task Complete。'],
    },
    tabs: ['Task Workspace'],
    activeTab: 'Task Workspace',
    currentView: {
      title: 'Task Workspace',
      caption: '审签任务按签署状态与审核清单布局，替代原始模板堆叠。',
      columns: ['Review Dimension', 'Result', 'State'],
      rows: [
        ['Signer Completion', '2 / 2 completed', 'Pass'],
        ['Version Consistency', 'v2026.04.09 matched', 'Pass'],
        ['Archive Confirmation', 'Receipt missing', 'Pending'],
      ],
    },
    tables: [],
    ai: {
      executiveSummary: '签署状态已完成，当前阻塞项为归档确认缺失。',
      outputs: [['Signature status', '2'], ['Review checklist', '3']],
      quickActions: ['Refresh from DocuSign', 'Upload Archive Proof'],
      rules: [
        ['Signer Completion', 'Pass', 'All required signers are completed'],
        ['Version Consistency', 'Pass', 'Document version is matched'],
        ['Archive Confirmation', 'Warning', 'Archive proof still pending'],
      ],
      anomalies: [
        {
          id: 'cor-review-checklist',
          severity: 'warning',
          summary: '归档确认未完成，建议补齐凭证后再结束任务。',
          outputs: ['Review checklist'],
          aiRecommendation: 'Upload archive proof before closing task.',
          quickActions: ['Upload Archive Proof'],
          title: 'Archive Pending',
          detail: 'Archive receipt missing',
          impact: 'Audit trace incomplete',
          recommendation: 'Complete archive confirmation first',
        },
      ],
      actions: ['Save Draft', 'Upload Archive Proof', 'Mark Task Complete'],
    },
  },
]

function App() {
  const allPages = [...prePayrollPages, ...corPages, ...requestPages]
  const [activePage, setActivePage] = useState(allPages[0].id)
  const [activeIssueId, setActiveIssueId] = useState(null)
  const [flashRowId, setFlashRowId] = useState(null)
  const [activeSeverity, setActiveSeverity] = useState('all')
  const [activeTab, setActiveTab] = useState(allPages[0].activeTab ?? allPages[0].tabs?.[0] ?? null)
  const [activeSubTab, setActiveSubTab] = useState(null)
  const [activeFormGroup, setActiveFormGroup] = useState(allPages[0].formGroups?.[0]?.id ?? null)
  const [activeFieldKey, setActiveFieldKey] = useState(allPages[0].formGroups?.[0]?.fields?.[0]?.key ?? null)
  const [activeContextModalTitle, setActiveContextModalTitle] = useState(null)
  const [previousOutcomeExpanded, setPreviousOutcomeExpanded] = useState(false)
  const [tableFilters, setTableFilters] = useState({ riskLevel: 'all', department: 'all', anomalyType: 'all' })
  const [expandedGroups, setExpandedGroups] = useState({ prePayroll: true, cor: true, requests: true })
  const [generatedAgreementPages, setGeneratedAgreementPages] = useState({})
  const [reviewRequestedAgreementPages, setReviewRequestedAgreementPages] = useState({})
  const page = allPages.find((item) => item.id === activePage) ?? allPages[0]
  const currentTab = activeTab ?? page.activeTab ?? page.tabs?.[0] ?? null
  const currentSubTabs = getCurrentSubTabs(page, currentTab)
  const currentSubTab = activeSubTab ?? currentSubTabs[0] ?? null
  const currentView = getCurrentSubView(page, currentTab, currentSubTab)
  const currentTables = getCurrentSubTables(page, currentTab, currentSubTab)
  const currentSummaryPanels = getCurrentSummaryPanels(page, currentTab)
  const currentComparisonPanels = getCurrentComparisonPanels(page, currentTab)
  const currentAi = getCurrentSubTabAi(page, currentTab, currentSubTab)
  const analysisAi = page.id === 'client-confirm' ? page.ai : currentAi
  const severityCounts = getSeverityCounts(analysisAi.anomalies)
  const filteredAnomalies =
    activeSeverity === 'all' ? analysisAi.anomalies : analysisAi.anomalies.filter((anomaly) => anomaly.severity === activeSeverity)
  const shouldShowPostPayrollFilters = page.id === 'post-payroll'
  const shouldShowCurrentTabFilters =
    shouldShowPostPayrollFilters && ['Department View', 'Employee View', 'Anomaly Type View'].includes(currentTab)
  const filteredCurrentRows = shouldShowPostPayrollFilters ? filterRows(currentView.rows, tableFilters) : currentView.rows
  const filteredCurrentTables = shouldShowPostPayrollFilters
    ? currentTables.map((table) => ({ ...table, rows: filterRows(table.rows, tableFilters) }))
    : currentTables
  const departmentOptions = shouldShowCurrentTabFilters ? getFilterOptions(currentView.rows, 'department') : []
  const anomalyTypeOptions = shouldShowCurrentTabFilters ? getFilterOptions(currentView.rows, 'anomalyType') : []
  const riskLevelOptions = shouldShowCurrentTabFilters ? getFilterOptions(currentView.rows, 'riskLevel') : []
  const currentFormGroup = page.formGroups?.find((group) => group.id === activeFormGroup) ?? page.formGroups?.[0] ?? null
  const currentFormField = currentFormGroup?.fields?.find((field) => field.key === activeFieldKey) ?? currentFormGroup?.fields?.[0] ?? null
  const readinessSection = page.workspaceSections?.find((section) => section.title === 'Readiness Snapshot') ?? null
  const remainingWorkspaceSections = (page.workspaceSections ?? []).filter((section) => section.title !== 'Readiness Snapshot')
  const topContextPanels = (page.contextPanels ?? []).filter(
    (panel) => panel.title === 'Task Information' || panel.title === 'Request Summary'
  )
  const sideContextPanels = (page.contextPanels ?? []).filter(
    (panel) => panel.title !== 'Previous Task Outcome' && panel.title !== 'Task Information' && panel.title !== 'Request Summary'
  )
  const previousOutcomePanel = (page.contextPanels ?? []).find(
    (panel) => panel.title === 'Previous Task Outcome'
  )
  const activeContextModalPanel = topContextPanels.find((panel) => panel.title === activeContextModalTitle) ?? null
  const isAgreementBuilderPage = page.id === 'cor-task-create-agreement-send-client'
  const agreementGenerated = Boolean(generatedAgreementPages[page.id])
  const agreementSentForReview = Boolean(reviewRequestedAgreementPages[page.id])
  const canGenerateAgreement = true
  const canSendAgreementForReview = agreementGenerated && !agreementSentForReview
  const agreementPreviewSections = isAgreementBuilderPage ? (page.agreementPreview?.sections ?? []) : []
  const displayedReadinessItems =
    isAgreementBuilderPage && readinessSection?.type === 'cards'
      ? readinessSection.items.map((item) => {
          if (item.label === 'Preview Status') {
            return {
              ...item,
              value: agreementGenerated ? 'Generated preview ready' : 'Ready to generate',
            }
          }

          return item
        })
      : readinessSection?.items ?? []

  const navigateToPage = (item) => {
    setActivePage(item.id)
    setActiveIssueId(null)
    setActiveSeverity('all')
    setActiveTab(item.activeTab ?? item.tabs?.[0] ?? null)
    setActiveSubTab(item.subTabsByTab?.[item.activeTab ?? item.tabs?.[0] ?? null]?.[0] ?? null)
    setActiveFormGroup(item.formGroups?.[0]?.id ?? null)
    setActiveFieldKey(item.formGroups?.[0]?.fields?.[0]?.key ?? null)
    setActiveContextModalTitle(null)
    setTableFilters({ riskLevel: 'all', department: 'all', anomalyType: 'all' })
  }

  const handleAgreementBuilderAction = (action) => {
    if (!isAgreementBuilderPage) {
      return
    }

    if (action === 'Generate Agreement') {
      if (!canGenerateAgreement) {
        return
      }

      setGeneratedAgreementPages((current) => ({ ...current, [page.id]: true }))
      setReviewRequestedAgreementPages((current) => ({ ...current, [page.id]: false }))
    }

    if (action === 'Send for Review' && canSendAgreementForReview) {
      setReviewRequestedAgreementPages((current) => ({ ...current, [page.id]: true }))
    }
  }

  const toggleSidebarGroup = (groupKey) => {
    setExpandedGroups((current) => ({ ...current, [groupKey]: !current[groupKey] }))
  }

  useEffect(() => {
    const [firstLinkedRowId] = collectLinkedRowIds(page, activeIssueId, currentTab)

    if (!firstLinkedRowId) {
      return
    }

    const targetRow = document.querySelector(`[data-row-id="${firstLinkedRowId}"]`)

    if (!targetRow) {
      return
    }

    const rafId = window.requestAnimationFrame(() => {
      setFlashRowId(firstLinkedRowId)
      targetRow.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    })

    const timeoutId = window.setTimeout(() => {
      setFlashRowId((currentRowId) => (currentRowId === firstLinkedRowId ? null : currentRowId))
    }, 1400)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.clearTimeout(timeoutId)
    }
  }, [activeIssueId, currentTab, page])

  useEffect(() => {
    if (!activeContextModalTitle) {
      return
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveContextModalTitle(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeContextModalTitle])

  return (
    <div className="prototype-shell">
      <aside className="prototype-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-eyebrow">Butter Prototype</span>
          <h1>Pre-Payroll AI</h1>
        </div>

        <div className="sidebar-group">
          <button
            className="sidebar-group-toggle"
            onClick={() => toggleSidebarGroup('prePayroll')}
            type="button"
            aria-expanded={expandedGroups.prePayroll}
            aria-controls="sidebar-group-pre-payroll"
          >
            <span className="sidebar-label">Pre-Payroll</span>
            <span className={`sidebar-group-caret ${expandedGroups.prePayroll ? 'is-open' : ''}`} aria-hidden="true">
              ▸
            </span>
          </button>
          {expandedGroups.prePayroll ? (
            <div className="sidebar-group-items" id="sidebar-group-pre-payroll">
              {prePayrollPages.map((item, index) => (
                <button
                  key={item.id}
                  className={`sidebar-link ${item.id === activePage ? 'is-active' : ''}`}
                  onClick={() => navigateToPage(item)}
                  type="button"
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{item.title}</strong>
                  <small>{item.phase}</small>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="sidebar-group">
          <button
            className="sidebar-group-toggle"
            onClick={() => toggleSidebarGroup('cor')}
            type="button"
            aria-expanded={expandedGroups.cor}
            aria-controls="sidebar-group-cor"
          >
            <span className="sidebar-label">COR</span>
            <span className={`sidebar-group-caret ${expandedGroups.cor ? 'is-open' : ''}`} aria-hidden="true">
              ▸
            </span>
          </button>
          {expandedGroups.cor ? (
            <div className="sidebar-group-items" id="sidebar-group-cor">
              {corPages.length === 0 ? (
                <div className="sidebar-empty">COR 页面将放在这里</div>
              ) : (
                corPages.map((item, index) => (
                  <button
                    key={item.id}
                    className={`sidebar-link ${item.id === activePage ? 'is-active' : ''}`}
                    onClick={() => navigateToPage(item)}
                    type="button"
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{item.title}</strong>
                    <small>{item.phase}</small>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className="sidebar-group">
          <button
            className="sidebar-group-toggle"
            onClick={() => toggleSidebarGroup('requests')}
            type="button"
            aria-expanded={expandedGroups.requests}
            aria-controls="sidebar-group-requests"
          >
            <span className="sidebar-label">Requests</span>
            <span className={`sidebar-group-caret ${expandedGroups.requests ? 'is-open' : ''}`} aria-hidden="true">
              ▸
            </span>
          </button>
          {expandedGroups.requests ? (
            <div className="sidebar-group-items" id="sidebar-group-requests">
              {requestPages.length === 0 ? (
                <div className="sidebar-empty">新页面将放在这里</div>
              ) : (
                requestPages.map((item, index) => (
                  <button
                    key={item.id}
                    className={`sidebar-link ${item.id === activePage ? 'is-active' : ''}`}
                    onClick={() => navigateToPage(item)}
                    type="button"
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{item.title}</strong>
                    <small>{item.phase}</small>
                  </button>
                ))
              )}
            </div>
          ) : (
            null
          )}
        </div>
      </aside>

      <main className={`prototype-main accent-${page.accent} ${isAgreementBuilderPage ? 'has-floating-action' : ''}`.trim()}>
        <header className="page-header">
          <div className={`status-badge status-${page.accent}`}>{page.status}</div>
          
          <div className="page-header-content">
            <div className="page-header-title-block">
              <span className="page-kicker">
                {page.phase}
                {page.id.startsWith('cor-task-') && page.stats.find(([l]) => l === 'Due Date') ? (
                  <span className="page-due-date">
                    <span className="due-date-label">Due Date:</span> {page.stats.find(([l]) => l === 'Due Date')[1]}
                  </span>
                ) : null}
              </span>
              <h2>{page.title}</h2>
            </div>
            
            {!page.id.startsWith('cor-task-') && (
              <div className="header-metrics-row">
                {page.stats.map(([label, value]) => (
                  <div className="mini-stat" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            )}

            {page.id.startsWith('cor-task-') && topContextPanels.length ? (
              <section className="cor-header-panels" aria-label="Task and request summary">
                {topContextPanels.map((panel) => (
                  <button
                    className="cor-header-link-button"
                    data-context={panel.title === 'Task Information' ? 'task-info' : panel.title === 'Request Summary' ? 'request-summary' : undefined}
                    key={`top-${panel.title}`}
                    onClick={() => setActiveContextModalTitle(panel.title)}
                    type="button"
                  >
                    {panel.title === 'Task Information'
                      ? 'View Task Information'
                      : panel.title === 'Request Summary'
                        ? 'View Request Summary'
                        : panel.title}
                  </button>
                ))}
              </section>
            ) : null}
          </div>
        </header>

        {page.id.startsWith('cor-task-') ? (
          <>
          <div className="cor-task-layout">
            <section className="primary-column">
              {previousOutcomePanel ? (
                <section className={`section-card previous-outcome-panel ${previousOutcomeExpanded ? 'is-expanded' : ''}`}>
                  <button 
                    className="previous-outcome-toggle" 
                    onClick={() => setPreviousOutcomeExpanded(!previousOutcomeExpanded)}
                    aria-expanded={previousOutcomeExpanded}
                    type="button"
                  >
                    <div className="previous-outcome-header">
                      <span className="previous-outcome-icon" aria-hidden="true">✓</span>
                      <h3>{previousOutcomePanel.title}</h3>
                    </div>
                    <span className="previous-outcome-caret" aria-hidden="true">▾</span>
                  </button>
                  {previousOutcomeExpanded && (
                    <div className="previous-outcome-content">
                      <dl className="cor-context-list horizontal-list">
                        {previousOutcomePanel.items.map(([label, value]) => (
                          <div className="context-list-item" key={`${previousOutcomePanel.title}-${label}`}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </section>
              ) : null}

              {readinessSection ? (
                <section className="section-card" key={readinessSection.title}>
                  <div className="section-head">
                    <h3>{readinessSection.title}</h3>
                    <p>{readinessSection.caption}</p>
                  </div>
                  {readinessSection.type === 'cards' ? (
                    <div className="cor-workspace-cards">
                      {displayedReadinessItems.map((item) => (
                        <article className={`cor-workspace-card tone-${item.tone ?? 'neutral'}`} key={`${readinessSection.title}-${item.label}`}>
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="table-shell compact-table">
                      <table>
                        <thead>
                          <tr>
                            {readinessSection.columns.map((column) => (
                              <th key={column}>{column}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {readinessSection.rows.map((row) => (
                            <tr key={`${readinessSection.title}-${row.join('-')}`}>
                              {row.map((cell, index) => (
                                <td key={`${readinessSection.title}-${index}-${cell}`}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ) : null}

              {page.formGroups?.length ? (
                <section className="section-card cor-form-workspace">
                  <div className="section-head compact">
                    <div className="section-title-block">
                      <h3>{page.formWorkspaceTitle ?? 'Muller Hans'}</h3>
                      <p className="section-eyebrow">{page.formWorkspaceHint ?? '按分组填写资料，点击字段查看填写提示'}</p>
                    </div>
                  </div>
                  {page.formGroups.length > 1 ? (
                    <div className="cor-form-tabs" role="tablist" aria-label="Collect contractor information groups">
                      {page.formGroups.map((group) => (
                        <button
                          key={group.id}
                          type="button"
                          role="tab"
                          aria-selected={currentFormGroup?.id === group.id}
                          className={`cor-form-tab ${currentFormGroup?.id === group.id ? 'is-active' : ''}`}
                          onClick={() => {
                            setActiveFormGroup(group.id)
                            setActiveFieldKey(group.fields?.[0]?.key ?? null)
                          }}
                        >
                          {group.label}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {currentFormGroup ? (
                    <div className="cor-form-grid">
                      {currentFormGroup.fields.map((item) => (
                        <button
                          type="button"
                          className={`cor-form-field tone-${item.tone ?? 'neutral'} ${item.span === 'full' ? 'is-full' : ''} ${currentFormField?.key === item.key ? 'is-active' : ''}`.trim()}
                          key={`${currentFormGroup.id}-${item.key}`}
                          onClick={() => setActiveFieldKey(item.key)}
                        >
                          <div className="cor-form-field-head">
                            <span className="cor-form-label">
                              {item.required ? <em>*</em> : null}
                              {item.label}
                            </span>
                          </div>
                          <div className={`cor-form-value ${item.value === 'Not provided' ? 'is-empty' : ''}`}>{item.value}</div>
                          {currentFormField?.key === item.key ? (
                            <p className="cor-field-hint">{item.hint ?? '请按字段要求填写。'}</p>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ) : null}

                </section>
              ) : null}

              {remainingWorkspaceSections.map((section) => (
                <section className="section-card" key={section.title}>
                  <div className="section-head">
                    <h3>{section.title}</h3>
                    <p>{section.caption}</p>
                  </div>
                  {section.type === 'cards' ? (
                    <div className="cor-workspace-cards">
                      {section.items.map((item) => (
                        <article className={`cor-workspace-card tone-${item.tone ?? 'neutral'}`} key={`${section.title}-${item.label}`}>
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </article>
                      ))}
                    </div>
                  ) : section.type === 'formGrid' ? (
                    <div className="cor-form-grid">
                      {section.items.map((item) => (
                        <article
                          className={`cor-form-field tone-${item.tone ?? 'neutral'} ${item.span === 'full' ? 'is-full' : ''}`.trim()}
                          key={`${section.title}-${item.label}`}
                        >
                          <div className="cor-form-field-head">
                            <span className="cor-form-label">
                              {item.required ? <em>*</em> : null}
                              {item.label}
                            </span>
                          </div>
                          <div className={`cor-form-value ${item.value === 'Not provided' ? 'is-empty' : ''}`}>{item.value}</div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="table-shell compact-table">
                      <table>
                        <thead>
                          <tr>
                            {section.columns.map((column) => (
                              <th key={column}>{column}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.rows.map((row) => (
                            <tr key={`${section.title}-${row.join('-')}`}>
                              {row.map((cell, index) => {
                                const key = `${section.title}-${index}-${typeof cell === 'object' ? cell.label ?? index : cell}`
                                return <td key={key}>{renderCellContent(cell)}</td>
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ))}

              {isAgreementBuilderPage ? (
                <section className="section-card agreement-generate-section">
                  <div className="section-head agreement-generate-head">
                    <div>
                      <h3>Agreement Generation</h3>
                      <p>Generate agreement after required fields are complete.</p>
                    </div>
                    <button
                      className={`action-button ${getAgreementBuilderActionTone('Generate Agreement', agreementGenerated)}`}
                      disabled={!canGenerateAgreement}
                      onClick={() => handleAgreementBuilderAction('Generate Agreement')}
                      type="button"
                    >
                      {agreementGenerated ? 'Regenerate Agreement' : 'Generate Agreement'}
                    </button>
                  </div>
                </section>
              ) : null}

              {isAgreementBuilderPage && agreementGenerated ? (
                <section className="section-card agreement-preview-section">
                  <div className="section-head agreement-preview-head">
                    <div>
                      <h3>{page.agreementPreview.title}</h3>
                      <p>
                        合同已生成。请先完成在线预览，再从页面右下角发送给 Client Review。
                      </p>
                    </div>
                  </div>

                  <div className="agreement-preview-meta">
                    <article className="cor-workspace-card tone-ok">
                      <span>Document</span>
                      <strong>{page.agreementPreview.title}</strong>
                    </article>
                    <article className="cor-workspace-card tone-neutral">
                      <span>Version</span>
                      <strong>{page.agreementPreview.version}</strong>
                    </article>
                    <article className="cor-workspace-card tone-neutral">
                      <span>Preview Mode</span>
                      <strong>Online Preview</strong>
                    </article>
                  </div>

                  <div className="agreement-preview-sheet">
                    {agreementPreviewSections.map((section) => (
                      <section className="agreement-preview-block" key={section.heading}>
                        <h4>{section.heading}</h4>
                        <p>{section.body}</p>
                      </section>
                    ))}
                  </div>
                </section>
              ) : null}
            </section>

            <aside className="cor-context-column">
              {sideContextPanels.map((panel) => (
                <section className="section-card cor-context-panel" key={panel.title}>
                  <div className="section-head compact">
                    <div className="section-title-block">
                      <h3>{panel.title}</h3>
                    </div>
                  </div>
                  <dl className="cor-context-list">
                    {panel.items.map(([label, value]) => (
                      <React.Fragment key={`${panel.title}-${label}`}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                </section>
              ))}

              <section className="section-card cor-context-panel cor-ai-panel">
                <div className="section-head compact">
                  <div className="section-title-block">
                    <h3>AI Copilot</h3>
                  </div>
                </div>
                <div className="cor-ai-group">
                  <h4>Suggestions</h4>
                  <ul>
                    {page.aiPanel?.suggestions?.map((item) => (
                      <li key={`suggest-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="cor-ai-group">
                  <h4>Risk Alerts</h4>
                  <ul>
                    {page.aiPanel?.risks?.map((item) => (
                      <li key={`risk-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="cor-ai-group">
                  <h4>Missing / Inconsistent</h4>
                  <ul>
                    {page.aiPanel?.missing?.map((item) => (
                      <li key={`missing-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="cor-ai-group">
                  <h4>Recommended Next Action</h4>
                  <ul>
                    {page.aiPanel?.nextActions?.map((item) => (
                      <li key={`next-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>
            </aside>
          </div>
          </>
        ) : (
        <div className="content-grid">
	          <section className="primary-column">
	            <section className="section-card ai-top-panel">
	              <div className="section-head">
	                <h3>AI Analysis</h3>
                <p>
                  {page.id === 'client-confirm'
                    ? '本次 snapshot package 的整体分析。'
                    : '按 Executive Summary 分条展示总体分析，每条都有对应的产出物和快捷操作；主数据源表仍然是页面主体。'}
                </p>
              </div>
              <div className="ai-summary-line">
                <button className={`severity-pill ${activeSeverity === 'all' ? 'is-active' : ''}`} onClick={() => setActiveSeverity('all')} type="button">
                  All
                </button>
                <button
                  className={`severity-pill is-critical ${activeSeverity === 'critical' ? 'is-active' : ''}`}
                  onClick={() => setActiveSeverity('critical')}
                  type="button"
                >
                  Critical {severityCounts.critical}
                </button>
                <button
                  className={`severity-pill is-warning ${activeSeverity === 'warning' ? 'is-active' : ''}`}
                  onClick={() => setActiveSeverity('warning')}
                  type="button"
                >
                  Warning {severityCounts.warning}
                </button>
                <button className={`severity-pill is-info ${activeSeverity === 'info' ? 'is-active' : ''}`} onClick={() => setActiveSeverity('info')} type="button">
                  Info {severityCounts.info}
                </button>
              </div>
              <div className="table-shell ai-review-shell">
                <table className="ai-review-table">
                  <thead>
                    <tr>
                      <th>Severity</th>
                      <th>Executive Summary</th>
                      <th>Output Artifacts</th>
                      <th>AI Recommendation</th>
                      <th>Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnomalies.map((anomaly) => (
                      <tr key={anomaly.id}>
                        <td>
                          <span className={`severity-badge severity-${anomaly.severity}`}>{anomaly.severity}</span>
                        </td>
                        <td>
                          <button
                            className={`ai-summary-link ${activeIssueId === anomaly.id ? 'is-active' : ''}`}
                            onClick={() => setActiveIssueId(anomaly.id)}
                            type="button"
                          >
                            {anomaly.summary}
                          </button>
                        </td>
                        <td>
                          <div className="artifact-list">
                            {anomaly.outputs?.map((output) => (
                              <div className="artifact-item" key={output}>
                                <button className="artifact-link" type="button">
                                  {output}
                                </button>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="recommendation-text">
                            <p>{anomaly.aiRecommendation}</p>
                          </div>
                        </td>
                        <td>
                          <div className="quick-action-list">
                            {anomaly.quickActions?.map((action) => (
                              <button className="quick-action-chip" key={action} type="button">
                                {action}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
	              </div>
	            </section>

	            {page.id === 'client-confirm' ? (
	              <section className="client-tabs-shell" aria-label="Client package tabs">
	                <div className="client-tab-strip-wrap">
	                  <div className="client-tab-strip" aria-label="Client source data tabs" role="tablist">
	                    {page.tabs.map((tab) => (
                      <button
                        aria-selected={tab === currentTab}
                        className={`client-tab-pill ${tab === currentTab ? 'is-active' : ''}`}
                        key={tab}
                        onClick={() => {
                          setActiveTab(tab)
                          setActiveSubTab(page.subTabsByTab?.[tab]?.[0] ?? null)
                          setActiveSeverity('all')
                          setTableFilters({ riskLevel: 'all', department: 'all', anomalyType: 'all' })
                        }}
                        role="tab"
                        type="button"
                      >
                        {tab}
                      </button>
	                    ))}
	                  </div>
	                </div>
	              </section>
	            ) : null}

	            {/* AI Analysis moved to the top for all pages */}

	            {currentSummaryPanels.length ? (
	              <section className="summary-panel-grid" aria-label="Page highlights">
                {currentSummaryPanels.map((panel) => (
                  <article className="summary-panel" key={panel.title}>
                    <span className="summary-panel-eyebrow">{panel.eyebrow}</span>
                    <h3>{panel.title}</h3>
                    <strong className="summary-panel-value">{panel.value}</strong>
                    <p>{panel.detail}</p>
                    {panel.bullets?.length ? (
                      <ul className="summary-panel-list">
                        {panel.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                    {panel.actions?.length ? (
                      <div className="summary-panel-actions">
                        {panel.actions.map((action) => (
                          <button className="quick-action-chip" key={action} type="button">
                            {action}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </section>
            ) : null}

	            <section className="section-card table-tabs">
	              <div className="section-head compact">
	                <div className="section-title-block">
	                  <h3>{currentView.title}</h3>
	                  <p className="section-eyebrow">Business data surface with active filter</p>
	                </div>
	                {page.id === 'client-confirm' && currentSubTabs.length ? (
	                  <div className="client-subtab-strip" aria-label="Client source data sub tabs" role="tablist">
	                    {currentSubTabs.map((tab) => (
	                      <button
	                        aria-selected={tab === currentSubTab}
	                        className={`client-subtab-pill ${tab === currentSubTab ? 'is-active' : ''}`}
	                        key={tab}
	                        onClick={() => setActiveSubTab(tab)}
	                        role="tab"
	                        type="button"
	                      >
	                        {tab}
	                      </button>
	                    ))}
	                  </div>
	                ) : null}
	                {page.id !== 'client-confirm' ? (
	                  <div className="tab-row" aria-label="Current view tabs" role="tablist">
	                    {page.tabs.map((tab) => (
	                      <button
	                        aria-selected={tab === currentTab}
	                        className={`tab-pill ${tab === currentTab ? 'is-active' : ''}`}
	                        key={tab}
	                        onClick={() => {
	                          setActiveTab(tab)
	                          setActiveSubTab(page.subTabsByTab?.[tab]?.[0] ?? null)
	                          setActiveSeverity('all')
	                          setTableFilters({ riskLevel: 'all', department: 'all', anomalyType: 'all' })
	                        }}
	                        role="tab"
	                        type="button"
	                      >
	                        {tab}
	                      </button>
	                    ))}
	                  </div>
	                ) : null}
	                {page.id !== 'client-confirm' && currentSubTabs.length ? (
	                  <div className="tab-row tab-row-secondary" aria-label="Current sub view tabs" role="tablist">
	                    {currentSubTabs.map((tab) => (
	                      <button
	                        aria-selected={tab === currentSubTab}
	                        className={`tab-pill ${tab === currentSubTab ? 'is-active' : ''}`}
	                        key={tab}
	                        onClick={() => setActiveSubTab(tab)}
	                        role="tab"
	                        type="button"
	                      >
	                        {tab}
	                      </button>
	                    ))}
	                  </div>
	                ) : null}
	              </div>
              {shouldShowCurrentTabFilters ? (
                <div className="table-filter-bar" aria-label="Post-payroll anomaly filters">
                  <div className="filter-group">
                    <span>Risk</span>
                    <div className="filter-pill-row">
                      <button
                        className={`filter-pill ${tableFilters.riskLevel === 'all' ? 'is-active' : ''}`}
                        onClick={() => setTableFilters((current) => ({ ...current, riskLevel: 'all' }))}
                        type="button"
                      >
                        All
                      </button>
                      {riskLevelOptions.map((option) => (
                        <button
                          className={`filter-pill ${tableFilters.riskLevel === option ? 'is-active' : ''}`}
                          key={option}
                          onClick={() => setTableFilters((current) => ({ ...current, riskLevel: option }))}
                          type="button"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="filter-group">
                    <span>Department</span>
                    <select value={tableFilters.department} onChange={(event) => setTableFilters((current) => ({ ...current, department: event.target.value }))}>
                      <option value="all">All departments</option>
                      {departmentOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <span>Anomaly Type</span>
                    <select value={tableFilters.anomalyType} onChange={(event) => setTableFilters((current) => ({ ...current, anomalyType: event.target.value }))}>
                      <option value="all">All anomaly types</option>
                      {anomalyTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : null}
              <p className="current-view-caption">{currentView.caption}</p>
              <div className={`table-shell compact-table ${currentView.stickyLastColumn === false ? '' : 'has-sticky-last-column'}`.trim()}>
                <table>
                  <thead>
                    <tr>
                      {currentView.columns.map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCurrentRows.map((row) => {
                      const normalizedRow = normalizeRow(row)
                      const isLinked = activeIssueId && normalizedRow.linkedIssueIds?.includes(activeIssueId)
                      const linkedIssues = getLinkedIssues(page, normalizedRow.linkedIssueIds)

                      return (
                        <tr
                          className={`${isLinked ? 'row-linked' : ''} ${flashRowId === normalizedRow.rowId ? 'row-flash' : ''}`.trim()}
                          data-row-id={normalizedRow.rowId}
                          key={normalizedRow.rowId ?? normalizedRow.cells.join('-')}
                        >
                          {normalizedRow.cells.map((cell, index) => {
                              const column = currentView.columns[index]
                              const cellClassName = getTableCellClass(column, cell, normalizedRow, index)
                              const key = `${normalizedRow.rowId ?? normalizedRow.cells.join('-')}-${typeof cell === 'object' ? cell.label ?? index : cell}-${index}`

                              return (
                                <td className={cellClassName} key={key}>
                                  {column === 'Flag' ? (
                                    renderCellContent(cell) ? (
                                      <span className="cell-tooltip-anchor">
                                        <span className={`flag-badge flag-${String(renderCellContent(cell)).toLowerCase()}`}>{renderCellContent(cell)}</span>
                                        {normalizedRow.flagReason ? (
                                          <span className="cell-tooltip" role="tooltip">
                                            <span className="cell-tooltip-item">
                                              <strong>{renderCellContent(cell)}</strong>
                                              <span>{normalizedRow.flagReason}</span>
                                            </span>
                                          </span>
                                        ) : null}
                                      </span>
                                    ) : null
                                  ) : index === normalizedRow.cells.length - 1 && linkedIssues.length && supportsIssueTooltip(cell) ? (
                                    <span className="cell-tooltip-anchor">
                                      <span>{renderCellContent(cell)}</span>
                                      <span className="cell-tooltip" role="tooltip">
                                        {linkedIssues.map((issue) => (
                                          <span className="cell-tooltip-item" key={issue.id}>
                                            <strong>{issue.detail}</strong>
                                            <span>{issue.recommendation}</span>
                                          </span>
                                        ))}
                                      </span>
                                    </span>
                                  ) : (
                                    renderCellContent(cell)
                                  )}
                                </td>
                              )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {currentComparisonPanels.length ? (
              <section className="section-card comparison-section">
                <div className="section-head">
                  <h3>Employee Comparison Drill-down</h3>
                  <p>当前员工级 drill-down 直接展示 current result、6 个月基线和 peer group 对比，便于 reviewer 判断异常是数据错误还是合理例外。</p>
                </div>
                <div className="comparison-grid">
                  {currentComparisonPanels.map((panel) => (
                    <article className="comparison-card" key={`${panel.employee}-${panel.anomalyType}`}>
                      <div className="comparison-card-header">
                        <div>
                          <span className="comparison-eyebrow">{panel.anomalyType}</span>
                          <h4>{panel.employee}</h4>
                        </div>
                        <span className="severity-badge severity-info">Drill-down</span>
                      </div>
                      <div className="comparison-bars">
                        {panel.values.map((item) => (
                          <div className="comparison-row" key={`${panel.employee}-${item.label}`}>
                            <div className="comparison-meta">
                              <span>{item.label}</span>
                              <strong>{item.displayValue}</strong>
                            </div>
                            <div className="comparison-track">
                              <span className={`comparison-fill tone-${item.tone ?? 'neutral'}`} style={{ width: item.width }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <p>{panel.note}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {filteredCurrentTables.map((table) => (
              <section className="section-card" key={table.title}>
                <div className="section-head">
                  <h3>{table.title}</h3>
                  <p>{table.caption}</p>
                </div>
                <div className={`table-shell ${table.stickyLastColumn === false ? '' : 'has-sticky-last-column'}`.trim()}>
                  <table>
                    <thead>
                      <tr>
                        {table.columns.map((column) => (
                          <th key={column}>{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row) => {
                        const normalizedRow = normalizeRow(row)
                        const isLinked = activeIssueId && normalizedRow.linkedIssueIds?.includes(activeIssueId)
                        const linkedIssues = getLinkedIssues(page, normalizedRow.linkedIssueIds)

                        return (
                          <tr
                            className={`${isLinked ? 'row-linked' : ''} ${flashRowId === normalizedRow.rowId ? 'row-flash' : ''}`.trim()}
                            data-row-id={normalizedRow.rowId}
                            key={normalizedRow.rowId ?? normalizedRow.cells.join('-')}
                          >
                            {normalizedRow.cells.map((cell, index) => {
                                const column = table.columns[index]
                                const cellClassName = getTableCellClass(column, cell, normalizedRow, index)
                                const key = `${normalizedRow.rowId ?? normalizedRow.cells.join('-')}-${typeof cell === 'object' ? cell.label ?? index : cell}-${index}`

                                return (
                                  <td className={cellClassName} key={key}>
                                    {column === 'Flag' ? (
                                      renderCellContent(cell) ? (
                                        <span className="cell-tooltip-anchor">
                                          <span className={`flag-badge flag-${String(renderCellContent(cell)).toLowerCase()}`}>{renderCellContent(cell)}</span>
                                          {normalizedRow.flagReason ? (
                                            <span className="cell-tooltip" role="tooltip">
                                              <span className="cell-tooltip-item">
                                                <strong>{renderCellContent(cell)}</strong>
                                                <span>{normalizedRow.flagReason}</span>
                                              </span>
                                            </span>
                                          ) : null}
                                        </span>
                                      ) : null
                                    ) : index === normalizedRow.cells.length - 1 && linkedIssues.length && supportsIssueTooltip(cell) ? (
                                      <span className="cell-tooltip-anchor">
                                        <span>{renderCellContent(cell)}</span>
                                        <span className="cell-tooltip" role="tooltip">
                                          {linkedIssues.map((issue) => (
                                            <span className="cell-tooltip-item" key={issue.id}>
                                              <strong>{issue.detail}</strong>
                                              <span>{issue.recommendation}</span>
                                            </span>
                                          ))}
                                        </span>
                                      </span>
                                    ) : (
                                      renderCellContent(cell)
                                    )}
                                  </td>
                                )
                              })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}

          </section>
        </div>
        )}
        
        {!isAgreementBuilderPage ? (
          <div className="page-footer-actions">
            {page.ai.actions.map((action, index) => (
              <button
                key={action}
                className={`action-button ${getActionTone(action, index, page.ai.actions)}`}
                type="button"
              >
                {action}
              </button>
            ))}
          </div>
        ) : null}

        {isAgreementBuilderPage ? (
          <div className="agreement-global-action-bar" role="region" aria-label="Agreement review action">
            <div className="agreement-global-action-copy">
              <strong>
                {agreementSentForReview
                  ? 'Agreement has been sent for review.'
                  : agreementGenerated
                    ? 'Agreement preview is ready for client review.'
                    : 'Generate the agreement to enable client review.'}
              </strong>
              <span>
                {agreementSentForReview
                  ? 'The latest generated agreement is already in the review flow.'
                  : agreementGenerated
                    ? 'Use this page-level action after you finish checking the preview.'
                    : 'Send for Review stays disabled until a clean generated preview is available.'}
              </span>
            </div>
            <button
              className={`action-button ${agreementSentForReview ? 'is-secondary' : 'is-primary'}`}
              disabled={!canSendAgreementForReview}
              onClick={() => handleAgreementBuilderAction('Send for Review')}
              type="button"
            >
              {agreementSentForReview ? 'Sent for Review' : 'Send for Review'}
            </button>
          </div>
        ) : null}

        {activeContextModalPanel ? (
          <div className="cor-modal-backdrop" onClick={() => setActiveContextModalTitle(null)} role="presentation">
            <section
              aria-label={activeContextModalPanel.title}
              aria-modal="true"
              className={`cor-modal ${activeContextModalPanel.title === 'Previous Task Outcome' ? 'is-compact' : ''}`.trim()}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <header className="cor-modal-header">
                <h3>{activeContextModalPanel.title}</h3>
                <button className="cor-modal-close" onClick={() => setActiveContextModalTitle(null)} type="button">
                  ×
                </button>
              </header>
              <dl className="cor-context-list cor-modal-list">
                {activeContextModalPanel.items.map(([label, value]) => (
                  <React.Fragment key={`${activeContextModalPanel.title}-${label}`}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  )
}

export default App
