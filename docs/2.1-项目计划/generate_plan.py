"""
生成《流知·Flownote 软件开发计划》.docx
"""
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_ORIENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import datetime

doc = Document()

# ========== 页面设置 ==========
for section in doc.sections:
    section.top_margin = Cm(2.54)
    section.bottom_margin = Cm(2.54)
    section.left_margin = Cm(3.18)
    section.right_margin = Cm(3.18)

style = doc.styles['Normal']
font = style.font
font.name = '宋体'
font.size = Pt(12)
style.element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
style.paragraph_format.line_spacing = 1.5

def set_cell_font(cell, text, bold=False, size=10.5, name='宋体'):
    """设置单元格字体"""
    cell.text = ''
    p = cell.paragraphs[0]
    run = p.add_run(text)
    run.font.name = name
    run.font.size = Pt(size)
    run.font.bold = bold
    run.element.rPr.rFonts.set(qn('w:eastAsia'), name)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER

def add_heading_styled(doc, text, level=1):
    """添加带样式的标题"""
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        run.font.name = '黑体'
        run.element.rPr.rFonts.set(qn('w:eastAsia'), '黑体')
    return h

def add_para(doc, text, bold=False, indent=False, size=12):
    """添加段落"""
    p = doc.add_paragraph()
    if indent:
        p.paragraph_format.first_line_indent = Pt(24)
    run = p.add_run(text)
    run.font.name = '宋体'
    run.font.size = Pt(size)
    run.font.bold = bold
    run.element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
    return p

def set_table_border(table):
    """设置表格边框"""
    tbl = table._tbl
    tblPr = tbl.tblPr if tbl.tblPr is not None else OxmlElement('w:tblPr')
    borders = OxmlElement('w:tblBorders')
    for border_name in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
        border = OxmlElement(f'w:{border_name}')
        border.set(qn('w:val'), 'single')
        border.set(qn('w:sz'), '4')
        border.set(qn('w:color'), '000000')
        borders.append(border)
    tblPr.append(borders)

# ==================== 封面 ====================
for _ in range(6):
    doc.add_paragraph()

title_p = doc.add_paragraph()
title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = title_p.add_run('流知·Flownote\n一体化知识与任务协作平台')
run.font.name = '黑体'
run.font.size = Pt(26)
run.font.bold = True
run.element.rPr.rFonts.set(qn('w:eastAsia'), '黑体')

doc.add_paragraph()

sub_p = doc.add_paragraph()
sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = sub_p.add_run('软件开发计划')
run.font.name = '黑体'
run.font.size = Pt(22)
run.font.bold = True
run.element.rPr.rFonts.set(qn('w:eastAsia'), '黑体')

for _ in range(4):
    doc.add_paragraph()

info_items = [
    f'文档版本：v1.0',
    f'编制日期：{datetime.date.today().strftime("%Y年%m月%d日")}',
    '小组编号：2024LJSE03',
    '小组成员：全坤、肖昌珅、XXX、XXX',
]
for item in info_items:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(item)
    run.font.name = '宋体'
    run.font.size = Pt(14)
    run.element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')

doc.add_page_break()

# ==================== 修订历史 ====================
add_heading_styled(doc, '文档修订历史', 1)

table = doc.add_table(rows=4, cols=6)
table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_border(table)

headers = ['版本', '日期', '修订人', '修订内容', '审核人', '备注']
for i, h in enumerate(headers):
    set_cell_font(table.rows[0].cells[i], h, bold=True)

revisions = [
    ['v1.0', datetime.date.today().strftime('%Y-%m-%d'), '全坤', '初稿编制', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
]
for r, row_data in enumerate(revisions):
    for c, text in enumerate(row_data):
        set_cell_font(table.rows[r+1].cells[c], text)

doc.add_paragraph()

# ==================== 目录占位 ====================
add_heading_styled(doc, '目录', 1)
add_para(doc, '（请在Word中插入自动目录：引用 → 目录 → 自动目录）', indent=True)
doc.add_page_break()

# ==================== 1. 引言 ====================
add_heading_styled(doc, '1  引言', 1)

add_heading_styled(doc, '1.1  项目概述', 2)
add_para(doc, '本项目"流知·Flownote"是一款面向个人用户与小团队的一体化知识与任务协作平台。'
    '系统旨在打破笔记记录、知识整理、任务管理之间的信息孤岛，构建从"碎片捕获→知识结构化→任务执行"'
    '的闭环工作流。系统采用B/S架构，提供便签记录、知识管理（含双向链接）、任务看板、番茄钟等核心功能。', indent=True)

add_heading_styled(doc, '1.2  项目范围', 2)
add_para(doc, '本计划涵盖流知·Flownote系统从设计、编码实现、测试到部署交付的完整软件开发生命周期。'
    '其中需求分析阶段已在前期完成（见《需求规格说明》文档），本计划重点覆盖系统设计、实现、测试与交付阶段。'
    'v1.0 MVP版本范围包括：便签CRUD与时间线、便签转知识页面、双向链接（含反链查询）、'
    '知识图谱基础可视化、任务看板、番茄钟计时器、用户认证。', indent=True)

add_heading_styled(doc, '1.3  项目交付物', 2)
deliverables = [
    '软件开发计划（本文档）',
    '系统设计文档（含架构设计、数据库设计、接口设计）',
    '可运行的MVP系统（源代码与部署说明）',
    '验证与反馈报告',
    '验收测试计划与测试用例',
    '用户手册与部署文档',
    '课堂报告PPT',
]
for d in deliverables:
    p = doc.add_paragraph(d, style='List Bullet')
    for run in p.runs:
        run.font.name = '宋体'
        run.font.size = Pt(12)
        run.element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')

add_heading_styled(doc, '1.4  术语与缩写', 2)
term_table = doc.add_table(rows=8, cols=3)
term_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_border(term_table)
for i, h in enumerate(['缩写/术语', '全称', '说明']):
    set_cell_font(term_table.rows[0].cells[i], h, bold=True)

terms = [
    ['WBS', 'Work Breakdown Structure', '工作分解结构'],
    ['MVP', 'Minimum Viable Product', '最小可行产品'],
    ['PERT', 'Program Evaluation and Review Technique', '计划评审技术'],
    ['RAM', 'Responsibility Assignment Matrix', '责任分配矩阵'],
    ['SRS', 'Software Requirements Specification', '需求规格说明'],
    ['CI/CD', 'Continuous Integration / Continuous Delivery', '持续集成/持续交付'],
    ['SPP', 'Software Project Plan', '软件开发计划'],
]
for r, row_data in enumerate(terms):
    for c, text in enumerate(row_data):
        set_cell_font(term_table.rows[r+1].cells[c], text)

add_heading_styled(doc, '1.5  参考文献', 2)
refs = [
    'ISO/IEC/IEEE 24748-5:2017 - Software Development Planning',
    '武汉大学计算机学院课程设计报告书写规范（修订版）2019-02-26',
    '小组实践项目《需求分析与需求规格说明》',
    '毛新军《软件工程实践教程》',
]
for ref in refs:
    p = doc.add_paragraph(ref, style='List Bullet')
    for run in p.runs:
        run.font.name = '宋体'
        run.font.size = Pt(12)
        run.element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')

doc.add_page_break()

# ==================== 2. 工作内容（WBS） ====================
add_heading_styled(doc, '2  工作内容（WBS）', 1)

add_para(doc, '本节使用工作分解结构（WBS）描述为完成可交付成果需要做的各项活动与工作任务。'
    'WBS采用面向交付物的分解方式，将项目工作逐层分解为可管理的工作包。', indent=True)

add_heading_styled(doc, '2.1  WBS结构总览', 2)

wbs_data = [
    ['1.0', '项目管理', '', ''],
    ['1.1', '', '项目启动与计划制定', ''],
    ['1.2', '', '项目监控与进度跟踪', ''],
    ['1.3', '', '项目收尾与总结', ''],
    ['2.0', '需求分析', '', ''],
    ['2.1', '', '需求捕获与分析', '(已完成)'],
    ['2.2', '', '需求规格说明撰写', '(已完成)'],
    ['2.3', '', '需求评审与修订', '(已完成)'],
    ['3.0', '系统设计', '', ''],
    ['3.1', '', '系统架构设计', '架构图、技术选型'],
    ['3.2', '', '数据库设计', 'ER图、表结构设计'],
    ['3.3', '', 'REST API接口设计', '接口规范文档'],
    ['3.4', '', '前端UI/UX设计', '页面原型、组件设计'],
    ['4.0', '编码实现', '', ''],
    ['4.1', '', '开发环境搭建', '代码仓库、CI配置'],
    ['4.2', '', '用户认证模块', '注册、登录、JWT'],
    ['4.3', '', '便签模块', 'CRUD、时间线、分享'],
    ['4.4', '', '知识管理模块', 'Wiki编辑、双向链接、图谱'],
    ['4.5', '', '任务管理模块', '看板、任务CRUD、番茄钟'],
    ['4.6', '', '前端整合', '状态管理、路由、组件'],
    ['4.7', '', '模块集成与联调', '前后端联调、API对接'],
    ['5.0', '测试', '', ''],
    ['5.1', '', '单元测试', '核心模块单元测试'],
    ['5.2', '', '集成测试', '接口集成测试'],
    ['5.3', '', '系统测试', '端到端功能测试'],
    ['5.4', '', '验收测试', '按验收标准测试'],
    ['6.0', '部署与交付', '', ''],
    ['6.1', '', '部署环境搭建', '服务器/容器配置'],
    ['6.2', '', '系统部署与上线', ''],
    ['6.3', '', '用户文档编写', '用户手册、部署说明'],
    ['6.4', '', '交付评审与总结', ''],
]

wbs_table = doc.add_table(rows=len(wbs_data)+1, cols=4)
wbs_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_border(wbs_table)

for i, h in enumerate(['WBS编号', '阶段', '工作包/活动', '交付物/备注']):
    set_cell_font(wbs_table.rows[0].cells[i], h, bold=True, size=10)

for r, row_data in enumerate(wbs_data):
    for c, text in enumerate(row_data):
        set_cell_font(wbs_table.rows[r+1].cells[c], text, size=10)

# Set column widths
for row in wbs_table.rows:
    row.cells[0].width = Cm(2.0)
    row.cells[1].width = Cm(2.5)
    row.cells[2].width = Cm(5.5)
    row.cells[3].width = Cm(5.0)

doc.add_page_break()

# ==================== 3. 进度安排 ====================
add_heading_styled(doc, '3  进度安排', 1)

add_heading_styled(doc, '3.1  估算方法说明', 2)
add_para(doc, '本计划采用两种估算方法进行工作量与历时估算，以避免单一方法的偏差：', indent=True)

add_para(doc, '方法一：专家判定平均法（Delphi法）', bold=True)
add_para(doc, '基于项目组4名成员各自独立估算后取加权平均值。每位成员根据自身技术能力与经验，'
    '分别估算每个工作包的工作量（人日），再由组长组织讨论，消除极端偏差后取均值。'
    '参考依据包括：前期需求分析文档、选题汇报中的参考项目分析、团队成员技术栈掌握情况。', indent=True)

add_para(doc, '方法二：PERT三值估算法', bold=True)
add_para(doc, '对每个工作包估算乐观值(O)、最可能值(M)、悲观值(P)，使用公式 '
    'E = (O + 4M + P) / 6 计算期望工期。标准差 σ = (P - O) / 6，'
    '用于后续风险评估。', indent=True)

add_heading_styled(doc, '3.2  工作量估算表', 2)

# Estimation data: [WBS, Activity, O(optimistic), M(most likely), P(pessimistic), E(expected), Expert_avg]
est_data = [
    ['1.1', '项目启动与计划', '1', '1.5', '2', '1.5', '1.5'],
    ['1.2', '项目监控（全程）', '3', '4', '6', '4.2', '4'],
    ['1.3', '项目收尾', '1', '1.5', '2', '1.5', '1.5'],
    ['3.1', '系统架构设计', '2', '3', '5', '3.2', '3'],
    ['3.2', '数据库设计', '1.5', '2', '3', '2.1', '2'],
    ['3.3', 'API接口设计', '1', '2', '3', '2.0', '2'],
    ['3.4', '前端UI/UX设计', '2', '3', '5', '3.2', '3.5'],
    ['4.1', '开发环境搭建', '0.5', '1', '1.5', '1.0', '1'],
    ['4.2', '用户认证模块', '1', '1.5', '3', '1.7', '1.5'],
    ['4.3', '便签模块', '2', '2.5', '4', '2.7', '2.5'],
    ['4.4', '知识管理模块', '3', '3.5', '5', '3.7', '3.5'],
    ['4.5', '任务管理模块', '3', '3.5', '5', '3.7', '3.5'],
    ['4.6', '前端整合', '2.5', '3.5', '5', '3.6', '3.5'],
    ['4.7', '模块集成联调', '2', '3', '4', '3.0', '3'],
    ['5.1', '单元测试', '1.5', '2', '3', '2.1', '2'],
    ['5.2', '集成测试', '1.5', '2', '3', '2.1', '2'],
    ['5.3', '系统测试', '2', '2.5', '4', '2.6', '2.5'],
    ['5.4', '验收测试', '1.5', '2', '3', '2.1', '2'],
    ['6.1', '部署环境搭建', '0.5', '1', '2', '1.1', '1'],
    ['6.2', '系统部署上线', '1', '1.5', '2', '1.5', '1.5'],
    ['6.3', '用户文档编写', '1', '1.5', '2', '1.5', '1.5'],
    ['6.4', '交付评审总结', '1', '1', '2', '1.2', '1'],
]

est_table = doc.add_table(rows=len(est_data)+2, cols=8)
est_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_border(est_table)

est_headers = ['WBS', '活动名称', '乐观O\n(人日)', '最可能M\n(人日)', '悲观P\n(人日)', 'PERT期望\nE(人日)', '专家判定\n(人日)', '采用值\n(人日)']
for i, h in enumerate(est_headers):
    set_cell_font(est_table.rows[0].cells[i], h, bold=True, size=9)

total_adopted = 0
for r, row_data in enumerate(est_data):
    for c, text in enumerate(row_data):
        set_cell_font(est_table.rows[r+1].cells[c], text, size=9)
    # 采用值 = 专家判定和PERT的加权平均(0.5+0.5)，向上取整0.5
    expert_val = float(row_data[6])
    pert_val = float(row_data[5])
    adopted = round((expert_val + pert_val) / 2 * 2) / 2  # round to nearest 0.5
    set_cell_font(est_table.rows[r+1].cells[7], str(adopted), size=9)
    total_adopted += adopted

# Total row
total_row = len(est_data) + 1
set_cell_font(est_table.rows[total_row].cells[0], '合计', bold=True, size=9)
for c in range(1, 8):
    set_cell_font(est_table.rows[total_row].cells[c], '', size=9)
set_cell_font(est_table.rows[total_row].cells[7], str(total_adopted), bold=True, size=9)

add_para(doc, f'估算总工作量：约 {total_adopted:.1f} 人日。按4人团队并行开发计算，预估项目总历时期约 {total_adopted/4:.0f} 个工作日（约 {total_adopted/4/5:.0f} 周）。', indent=True)

doc.add_page_break()

add_heading_styled(doc, '3.3  任务网络图（活动前后序关系）', 2)
add_para(doc, '以下表格描述各活动之间的前后序依赖关系，对应的任务网络图请使用项目管理工具'
    '（如 Microsoft Project、OmniPlan 或在线工具如 draw.io）绘制。', indent=True)

# Dependency table
dep_data = [
    ['A', '1.1', '项目启动与计划', '-', '项目开始'],
    ['B', '3.1', '系统架构设计', 'A', '计划批准后启动'],
    ['C', '3.2', '数据库设计', 'B', '架构确定后'],
    ['D', '3.3', 'API接口设计', 'B', '架构确定后'],
    ['E', '3.4', '前端UI/UX设计', 'B', '架构确定后'],
    ['F', '4.1', '开发环境搭建', 'A', '与设计并行'],
    ['G', '4.2', '用户认证模块', 'C, D, F', '接口+环境就绪'],
    ['H', '4.3', '便签模块', 'C, D, F', '接口+环境就绪'],
    ['I', '4.4', '知识管理模块', 'C, D, F', '接口+环境就绪'],
    ['J', '4.5', '任务管理模块', 'C, D, F', '接口+环境就绪'],
    ['K', '4.6', '前端整合', 'E, G, H', 'UI设计+核心模块完成'],
    ['L', '4.7', '模块集成联调', 'G, H, I, J, K', '所有模块编码完成'],
    ['M', '5.1', '单元测试', 'G, H, I, J', '各模块编码完成'],
    ['N', '5.2', '集成测试', 'L, M', '联调+单测完成'],
    ['O', '5.3', '系统测试', 'N', '集成测试通过'],
    ['P', '5.4', '验收测试', 'O', '系统测试通过'],
    ['Q', '6.1', '部署环境搭建', 'O', '系统测试基本通过'],
    ['R', '6.2', '系统部署上线', 'P, Q', '验收测试+环境就绪'],
    ['S', '6.3', '用户文档编写', 'O', '系统功能稳定后'],
    ['T', '1.2', '项目监控（全程）', 'A', '贯穿全程'],
    ['U', '1.3', '项目收尾', 'R, S', '所有工作完成'],
]

dep_table = doc.add_table(rows=len(dep_data)+1, cols=5)
dep_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_border(dep_table)

for i, h in enumerate(['活动代号', 'WBS', '活动名称', '前置活动', '说明']):
    set_cell_font(dep_table.rows[0].cells[i], h, bold=True, size=9)

for r, row_data in enumerate(dep_data):
    for c, text in enumerate(row_data):
        set_cell_font(dep_table.rows[r+1].cells[c], text, size=9)

add_para(doc, '说明：任务网络图（活动节点图/箭线图）请使用专业项目管理工具绘制后插入此处。'
    '关键路径分析基于上述依赖关系，关键路径为：A→B→C/D→G/H/I/J→L→N→O→P→R，'
    '总浮动时间为0的活动构成关键路径。', indent=True)

doc.add_page_break()

add_heading_styled(doc, '3.4  甘特图（进度计划）', 2)
add_para(doc, '以下为各活动的时间安排，以2026年7月3日为系统交付日期进行倒排。'
    '甘特图请使用项目管理工具绘制后插入此处，下表中标注了各阶段的起止时间。', indent=True)

# Schedule table
today = datetime.date.today()
sched_data = [
    ['1. 计划与设计阶段', '5.28 - 6.04', '7天', 'A, B, C, D, E, F'],
    ['  项目启动与计划', '5.28 - 5.29', '1.5天', 'A'],
    ['  系统架构设计', '5.29 - 5.31', '3天', 'B'],
    ['  数据库+接口+UI设计', '5.31 - 6.04', '5天', 'C, D, E'],
    ['  开发环境搭建', '5.30 - 5.31', '1天', 'F'],
    ['2. 编码实现阶段', '6.04 - 6.18', '14天', 'G, H, I, J, K'],
    ['  用户认证模块', '6.04 - 6.06', '2天', 'G'],
    ['  便签模块', '6.04 - 6.08', '4天', 'H'],
    ['  知识管理模块', '6.06 - 6.12', '6天', 'I'],
    ['  任务管理模块', '6.06 - 6.12', '6天', 'J'],
    ['  前端整合', '6.10 - 6.18', '8天', 'K'],
    ['3. 集成与联调', '6.16 - 6.20', '4天', 'L'],
    ['4. 测试阶段', '6.20 - 6.28', '8天', 'M, N, O'],
    ['  单元测试', '6.20 - 6.23', '3天', 'M'],
    ['  集成测试', '6.23 - 6.25', '2天', 'N'],
    ['  系统测试', '6.25 - 6.28', '3天', 'O'],
    ['5. 验收测试与部署', '6.28 - 7.03', '5天', 'P, Q, R, S'],
    ['  验收测试', '6.28 - 6.30', '2天', 'P'],
    ['  部署上线', '7.01 - 7.02', '1.5天', 'Q, R'],
    ['  文档完善与交付', '7.01 - 7.03', '2天', 'S, U'],
]

sched_table = doc.add_table(rows=len(sched_data)+1, cols=4)
sched_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_border(sched_table)

for i, h in enumerate(['阶段/活动', '起止时间', '历时', '涉及WBS']):
    set_cell_font(sched_table.rows[0].cells[i], h, bold=True, size=10)

for r, row_data in enumerate(sched_data):
    is_phase = row_data[0] and not row_data[0].startswith('  ')
    for c, text in enumerate(row_data):
        set_cell_font(sched_table.rows[r+1].cells[c], text, bold=is_phase, size=10)

add_para(doc, '关键里程碑：', bold=True)
milestones = [
    'M1 - 6月1日：课堂报告（开发计划汇报）',
    'M2 - 6月5日：计划文档修订提交',
    'M3 - 6月13日：MVP系统提交（可运行原型）',
    'M4 - 6月20日：模块集成完成，进入测试阶段',
    'M5 - 6月28日：系统测试完成，进入验收测试',
    'M6 - 7月3日：系统交付',
]
for m in milestones:
    p = doc.add_paragraph(m, style='List Bullet')
    for run in p.runs:
        run.font.name = '宋体'
        run.font.size = Pt(12)
        run.element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')

doc.add_page_break()

# ==================== 4. 人员职责分配 ====================
add_heading_styled(doc, '4  人员职责分配（责任矩阵）', 1)

add_para(doc, '本节使用RACI矩阵（Responsible执行、Accountable负责、Consulted咨询、Informed知情）'
    '描述项目组成员在各活动中的角色与职责。', indent=True)

ram_headers = ['WBS', '活动名称', '全坤\n(组长)', '肖昌珅', '成员3', '成员4']

ram_data = [
    ['1.1', '项目启动与计划', 'A/R', 'C', 'C', 'C'],
    ['1.2', '项目监控（全程）', 'A/R', 'I', 'I', 'I'],
    ['1.3', '项目收尾', 'A/R', 'R', 'R', 'R'],
    ['3.1', '系统架构设计', 'A/R', 'R', 'C', 'C'],
    ['3.2', '数据库设计', 'A', 'R', 'C', 'C'],
    ['3.3', 'API接口设计', 'R', 'A/R', 'C', 'C'],
    ['3.4', '前端UI/UX设计', 'C', 'A/R', 'R', 'C'],
    ['4.1', '开发环境搭建', 'R', 'A/R', 'C', 'C'],
    ['4.2', '用户认证模块', 'I', 'A/R', 'C', 'C'],
    ['4.3', '便签模块', 'A', 'R', 'C', 'C'],
    ['4.4', '知识管理模块', 'A/R', 'C', 'R', 'C'],
    ['4.5', '任务管理模块', 'C', 'C', 'A/R', 'R'],
    ['4.6', '前端整合', 'C', 'A/R', 'R', 'R'],
    ['4.7', '模块集成联调', 'A/R', 'R', 'R', 'R'],
    ['5.1', '单元测试', 'R', 'R', 'R', 'R'],
    ['5.2', '集成测试', 'A/R', 'R', 'R', 'R'],
    ['5.3', '系统测试', 'A/R', 'R', 'R', 'R'],
    ['5.4', '验收测试', 'A/R', 'R', 'C', 'C'],
    ['6.1', '部署环境搭建', 'R', 'A/R', 'C', 'C'],
    ['6.2', '系统部署上线', 'A/R', 'R', 'I', 'I'],
    ['6.3', '用户文档编写', 'R', 'R', 'R', 'R'],
    ['6.4', '交付评审总结', 'A/R', 'R', 'R', 'R'],
]

ram_table = doc.add_table(rows=len(ram_data)+2, cols=6)
ram_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_border(ram_table)

for i, h in enumerate(ram_headers):
    set_cell_font(ram_table.rows[0].cells[i], h, bold=True, size=9)

for r, row_data in enumerate(ram_data):
    for c, text in enumerate(row_data):
        set_cell_font(ram_table.rows[r+1].cells[c], text, size=9)

# Legend
legend_row = len(ram_data) + 1
set_cell_font(ram_table.rows[legend_row].cells[0], '图例：', bold=True, size=9)
set_cell_font(ram_table.rows[legend_row].cells[1], 'R=执行  A=负责  C=咨询  I=知情', size=9)

add_para(doc, '说明：成员3、成员4姓名待补充。"A/R"表示同一人既负责又执行。'
    '组长（全坤）担任项目经理角色，总体负责项目协调与进度管控。', indent=True)

doc.add_page_break()

# ==================== 5. 风险管理 ====================
add_heading_styled(doc, '5  风险管理', 1)

add_para(doc, '本节使用风险信息表描述项目实施过程中可能的风险及其管理方法。'
    '风险等级 = 发生概率 × 影响程度，其中高(H)=3、中(M)=2、低(L)=1。', indent=True)

add_heading_styled(doc, '5.1  风险信息表', 2)

risk_headers = ['风险\n编号', '风险描述', '概率\n(H/M/L)', '影响\n(H/M/L)', '风险\n等级', '应对策略', '负责人']

risk_data = [
    ['R1', '团队成员技术栈不匹配——参考项目使用Go/Flutter等，'
     '团队成员熟悉Node.js/Vue，学习成本高导致进度延迟', 'M', 'H', '高',
     '技术选型阶段优先选择团队熟悉的技术栈（Node.js + Vue + PostgreSQL）；'
     '仅参考开源项目的数据模型和UI设计，不直接移植代码；预留2天缓冲期', '全坤'],
    ['R2', 'MVP范围蔓延——在开发过程中不断增加新功能，导致核心功能延期', 'H', 'H', '高',
     '严格按照需求优先级实施，超出v1.0范围的功能记入需求池待后续版本；'
     '每周评审需求变更；组长有权驳回MVP范围外的功能请求', '全坤'],
    ['R3', '双向链接实现复杂度高——Logseq的反链机制数据结构复杂，可能超出时间预算', 'M', 'M', '中',
     'MVP阶段简化实现：先做一对一双向链接和反链列表展示，不追求全局图谱和复杂可视化；'
     '使用fuse.js做前端模糊搜索，避免后端复杂的图数据库', '肖昌珅'],
    ['R4', '团队成员时间冲突——6月正值期末，其他课程的大作业/考试可能挤压开发时间', 'H', 'H', '高',
     '提前识别6月各课程截止日期，合理错峰安排任务；每天30分钟站会同步进度；'
     '关键路径活动安排2人备份；预留3天缓冲期', '全坤'],
    ['R5', '第三方依赖不稳定——使用的开源UI库或编辑器组件可能存在bug或版本不兼容', 'M', 'M', '中',
     '优先选择成熟稳定的UI组件库（Ant Design Vue / Element Plus）；'
     '冻结依赖版本；对关键第三方组件提前进行兼容性验证', '肖昌珅'],
    ['R6', '知识图谱可视化性能问题——ECharts渲染大量节点时可能卡顿', 'L', 'M', '低',
     'MVP阶段仅展示当前页面的直接链接（≤50个节点），不做全局图谱；'
     '节点数超过阈值时自动切换为列表视图', '成员3'],
    ['R7', '部署环境差异——本地开发环境与目标部署环境不一致导致上线故障', 'M', 'M', '中',
     '使用Docker容器化部署，确保环境一致性；提前在目标环境进行部署演练；'
     '编写详细的部署文档和配置文件', '成员4'],
    ['R8', '需求理解偏差——团队成员对需求规格说明的理解不一致', 'M', 'M', '中',
     '每个模块开始编码前进行需求对焦会议；参照SRS中的用例场景描述；'
     'QA小组评审反馈的问题逐一确认', '全坤'],
]

risk_table = doc.add_table(rows=len(risk_data)+1, cols=7)
risk_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_border(risk_table)

for i, h in enumerate(risk_headers):
    set_cell_font(risk_table.rows[0].cells[i], h, bold=True, size=8)

for r, row_data in enumerate(risk_data):
    for c, text in enumerate(row_data):
        set_cell_font(risk_table.rows[r+1].cells[c], text, size=8)

add_heading_styled(doc, '5.2  风险监控机制', 2)
add_para(doc, '项目期间通过以下机制持续监控风险状态：', indent=True)
risk_monitor = [
    '每周五下午进行风险评审会议，更新风险状态和应对措施；',
    '使用风险燃尽图跟踪风险项的消除进度；',
    '当新风险出现或已有风险等级提升时，及时更新风险登记表并通知全体成员；',
    '在每日站会中报告与风险相关的问题和阻塞项。',
]
for item in risk_monitor:
    p = doc.add_paragraph(item, style='List Bullet')
    for run in p.runs:
        run.font.name = '宋体'
        run.font.size = Pt(12)
        run.element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')

doc.add_page_break()

# ==================== 6. 验收测试计划 ====================
add_heading_styled(doc, '6  验收测试计划', 1)

add_para(doc, '本验收测试计划旨在确保"流知·Flownote"系统在交付前满足需求规格说明中定义的'
    '功能需求与非功能需求。验收测试将于系统测试完成后进行（预计6月28日-6月30日），'
    '在7月3日系统交付前完成。', indent=True)

add_heading_styled(doc, '6.1  验收测试需求', 2)
add_para(doc, '验收测试需求源自《需求规格说明》中优先级为"高"的功能需求，验收准则如下：', indent=True)

at_req_headers = ['测试\n标识', '测试内容', '对应需求', '测试目的', '进度安排']
at_req_data = [
    ['AT-001', '用户注册与登录', 'FR-001, FR-002',
     '验证用户可以注册账号并登录系统，JWT令牌正常工作', '6.28'],
    ['AT-002', '便签创建与时间线展示', 'FR-003~FR-008',
     '验证用户可以创建、查看、编辑、删除便签，时间线按时间倒序展示', '6.28'],
    ['AT-003', '便签分享链接生成', 'FR-009, FR-010',
     '验证用户可生成便签分享链接，外部用户可通过链接查看便签内容', '6.28'],
    ['AT-004', '便签转知识页面', 'FR-011',
     '验证用户可将便签转化为知识页面，转换后保留原始内容与标签', '6.28'],
    ['AT-005', '知识页面编辑与双向链接', 'FR-012~FR-014',
     '验证支持Markdown编辑、[[语法触发链接选择器、链接自动建立双向关系', '6.29'],
    ['AT-006', '反向链接列表展示', 'FR-014',
     '验证知识页面底部展示所有指向当前页面的反向链接', '6.29'],
    ['AT-007', '知识图谱基础可视化', 'FR-015',
     '验证当前页面的直接链接关系以节点-边图形式展示（≤50节点）', '6.29'],
    ['AT-008', '任务创建与管理', 'FR-017~FR-020',
     '验证用户可创建任务、设置优先级与截止日期、拖拽移动任务状态', '6.29'],
    ['AT-009', '看板视图', 'FR-021~FR-023',
     '验证看板支持"待办/进行中/已完成"三列，支持拖拽操作', '6.29'],
    ['AT-010', '番茄钟计时器', 'FR-024',
     '验证番茄钟支持25分钟倒计时，完成后弹窗提醒', '6.30'],
    ['AT-011', '系统异常处理', 'NFR-007~NFR-010',
     '验证非法输入有提示、网络异常有重试机制、关键操作后撤功能', '6.30'],
    ['AT-012', '响应性能', 'NFR-001~NFR-004',
     '验证便签CRUD响应≤2秒、知识页面加载≤3秒、搜索≤3秒', '6.30'],
]

at_req_table = doc.add_table(rows=len(at_req_data)+1, cols=5)
at_req_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_border(at_req_table)

for i, h in enumerate(at_req_headers):
    set_cell_font(at_req_table.rows[0].cells[i], h, bold=True, size=9)

for r, row_data in enumerate(at_req_data):
    for c, text in enumerate(row_data):
        set_cell_font(at_req_table.rows[r+1].cells[c], text, size=9)

doc.add_page_break()

add_heading_styled(doc, '6.2  测试人员安排', 2)

tester_headers = ['角色', '姓名', '职责', '参与时间']
tester_data = [
    ['测试负责人', '全坤（组长）', '统筹验收测试计划、编写测试报告、确认测试通过标准', '6.28-6.30'],
    ['测试执行人', '肖昌珅', '执行便签模块、知识管理模块验收测试用例', '6.28-6.30'],
    ['测试执行人', '成员3', '执行任务管理模块、看板模块验收测试用例', '6.28-6.30'],
    ['测试执行人', '成员4', '执行用户认证、性能测试、异常处理测试', '6.28-6.30'],
    ['用户代表', '待定', '从用户视角进行探索性测试，提供体验反馈', '6.29-6.30'],
]

tester_table = doc.add_table(rows=len(tester_data)+1, cols=4)
tester_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_border(tester_table)

for i, h in enumerate(tester_headers):
    set_cell_font(tester_table.rows[0].cells[i], h, bold=True, size=10)

for r, row_data in enumerate(tester_data):
    for c, text in enumerate(row_data):
        set_cell_font(tester_table.rows[r+1].cells[c], text, size=10)

add_heading_styled(doc, '6.3  测试进度安排', 2)
add_para(doc, '验收测试时间窗口：2026年6月28日 - 6月30日（共3天），确保在7月3日系统交付前完成。', indent=True)

at_sched_headers = ['日期', '时间段', '活动', '参与人员']
at_sched_data = [
    ['6.28', '09:00-12:00', 'AT-001~AT-004 便签模块验收测试', '全坤、肖昌珅'],
    ['6.28', '14:00-17:00', '问题修复与回归测试', '全组'],
    ['6.29', '09:00-12:00', 'AT-005~AT-009 知识+任务模块验收测试', '全坤、成员3、成员4'],
    ['6.29', '14:00-17:00', '用户代表探索性测试', '全组 + 用户代表'],
    ['6.29', '19:00-21:00', '问题修复与回归测试', '全组'],
    ['6.30', '09:00-12:00', 'AT-010~AT-012 番茄钟+异常+性能测试', '全组'],
    ['6.30', '14:00-17:00', '最终问题修复、测试报告撰写', '全坤、肖昌珅'],
]

at_sched_table = doc.add_table(rows=len(at_sched_data)+1, cols=4)
at_sched_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_border(at_sched_table)

for i, h in enumerate(at_sched_headers):
    set_cell_font(at_sched_table.rows[0].cells[i], h, bold=True, size=10)

for r, row_data in enumerate(at_sched_data):
    for c, text in enumerate(row_data):
        set_cell_font(at_sched_table.rows[r+1].cells[c], text, size=10)

add_heading_styled(doc, '6.4  测试标准', 2)
add_para(doc, '验收测试通过标准：', bold=True)
pass_criteria = [
    '所有高优先级功能需求（AT-001~AT-012）的测试用例100%通过；',
    '无致命（Blocker）和严重（Critical）级别的缺陷未关闭；',
    '主要（Major）级别缺陷不超过3个，且有明确的修复计划和责任人；',
    '所有已关闭缺陷经过回归测试验证；',
    '性能指标满足NFR-001~NFR-004中的要求；',
    '用户代表体验测试无重大可用性问题。',
]
for item in pass_criteria:
    p = doc.add_paragraph(item, style='List Bullet')
    for run in p.runs:
        run.font.name = '宋体'
        run.font.size = Pt(12)
        run.element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')

add_para(doc, '缺陷严重等级定义：', bold=True)
defect_levels = [
    'Blocker（致命）：系统崩溃、数据丢失、安全漏洞，必须立即修复；',
    'Critical（严重）：核心功能无法使用，无可用替代方案；',
    'Major（主要）：功能部分不可用或结果错误，存在替代方案；',
    'Minor（次要）：界面瑕疵、提示不友好等，不影响功能使用。',
]
for item in defect_levels:
    p = doc.add_paragraph(item, style='List Bullet')
    for run in p.runs:
        run.font.name = '宋体'
        run.font.size = Pt(12)
        run.element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')

doc.add_page_break()

add_heading_styled(doc, '6.5  测试环境', 2)

env_headers = ['环境要素', '配置要求']
env_data = [
    ['服务器OS', 'Ubuntu 22.04 LTS / Windows Server 2022'],
    ['Web服务器', 'Nginx 1.24+ 反向代理'],
    ['应用服务器', 'Node.js 20 LTS + Express.js'],
    ['数据库', 'PostgreSQL 16.x'],
    ['客户端浏览器', 'Chrome 120+, Edge 120+, Firefox 120+'],
    ['测试网络', '局域网环境（100Mbps+）'],
    ['容器运行时', 'Docker 24+ / Docker Compose v2'],
    ['测试工具', 'Postman / Jest / Cypress / Lighthouse'],
    ['监控工具', '浏览器DevTools Performance Profiler / k6'],
]

env_table = doc.add_table(rows=len(env_data)+1, cols=2)
env_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_border(env_table)

for i, h in enumerate(env_headers):
    set_cell_font(env_table.rows[0].cells[i], h, bold=True, size=10)

for r, row_data in enumerate(env_data):
    for c, text in enumerate(row_data):
        set_cell_font(env_table.rows[r+1].cells[c], text, size=10)

env_table.rows[0].cells[0].width = Cm(4)
env_table.rows[0].cells[1].width = Cm(12)

add_heading_styled(doc, '6.6  测试用例（概要）', 2)
add_para(doc, '以下为验收测试用例概要。详细测试用例（含前置条件、操作步骤、预期结果）见单独文档《验收测试用例》。', indent=True)

tc_headers = ['用例ID', '测试标识', '测试场景', '预期结果', '优先级']
tc_data = [
    ['TC-001', 'AT-001', '新用户通过注册页面创建账号', '账号创建成功，自动跳转至登录后主页', '高'],
    ['TC-002', 'AT-001', '已注册用户使用正确密码登录', '登录成功，获取JWT令牌，跳转主页', '高'],
    ['TC-003', 'AT-001', '使用错误密码登录', '提示"用户名或密码错误"，不暴露具体原因', '中'],
    ['TC-004', 'AT-002', '创建一条包含标签的便签', '便签出现在时间线顶部，标签可点击筛选', '高'],
    ['TC-005', 'AT-002', '编辑已有便签的内容', '保存后内容更新，显示最后修改时间', '高'],
    ['TC-006', 'AT-002', '删除一条便签', '便签进入回收站（30天后永久删除）', '高'],
    ['TC-007', 'AT-003', '生成便签的分享链接', '生成唯一URL，复制后可分享', '高'],
    ['TC-008', 'AT-004', '将便签转为知识页面', '创建新知识页面，内容继承便签文本和标签', '高'],
    ['TC-009', 'AT-005', '在知识页面中输入[[触发链接选择器', '弹出搜索框，支持模糊搜索其他页面', '高'],
    ['TC-010', 'AT-005', '选择一个页面建立链接', '文本中插入链接标记，数据库中建立双向关联', '高'],
    ['TC-011', 'AT-006', '查看被链接页面的反链列表', '底部显示所有引用当前页面的链接', '高'],
    ['TC-012', 'AT-008', '在看板中新建任务', '任务卡片出现在"待办"列', '高'],
    ['TC-013', 'AT-009', '将任务从"待办"拖拽到"进行中"', '任务状态更新，列中位置保持', '高'],
    ['TC-014', 'AT-010', '启动25分钟番茄钟计时', '倒计时开始，显示剩余时间', '高'],
    ['TC-015', 'AT-010', '番茄钟结束时', '弹窗提醒，播放提示音', '高'],
    ['TC-016', 'AT-011', '提交空便签内容', '前端提示"内容不能为空"，不发送请求', '中'],
    ['TC-017', 'AT-012', '创建100条便签后加载时间线', '首页时间线加载时间≤2秒', '中'],
]

tc_table = doc.add_table(rows=len(tc_data)+1, cols=5)
tc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_border(tc_table)

for i, h in enumerate(tc_headers):
    set_cell_font(tc_table.rows[0].cells[i], h, bold=True, size=9)

for r, row_data in enumerate(tc_data):
    for c, text in enumerate(row_data):
        set_cell_font(tc_table.rows[r+1].cells[c], text, size=9)

doc.add_page_break()

# ==================== 7. 子计划 ====================
add_heading_styled(doc, '7  子计划', 1)

add_heading_styled(doc, '7.1  软件质量保证计划', 2)
add_para(doc, '本项目质量保证措施包括：', indent=True)
qa_items = [
    '代码审查：每个Pull Request需至少1人Review后合并；',
    '编码规范：遵循ESLint + Prettier统一代码风格，提交前自动格式化；',
    '版本控制：使用Git，采用Git Flow分支策略（main/develop/feature分支）；',
    '持续集成：每次Push触发自动构建与基础测试；',
    '文档与代码同步：接口变更时同步更新API文档（Swagger/OpenAPI）；',
    '缺陷管理：使用GitHub Issues跟踪缺陷，关联提交记录。',
]
for item in qa_items:
    p = doc.add_paragraph(item, style='List Bullet')
    for run in p.runs:
        run.font.name = '宋体'
        run.font.size = Pt(12)
        run.element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')

add_heading_styled(doc, '7.2  软件配置管理计划', 2)
add_para(doc, '配置管理策略如下：', indent=True)
scm_items = [
    '代码仓库：GitHub私有仓库，https://github.com/LJSE03/flownote；',
    '分支策略：main（稳定发布）、develop（开发主线）、feature/*（功能分支）；',
    '版本命名：语义化版本号 MAJOR.MINOR.PATCH；',
    '构建产物：Docker镜像，标签与Git Tag对应；',
    '文档版本：与代码版本同步，放在仓库docs/目录中。',
]
for item in scm_items:
    p = doc.add_paragraph(item, style='List Bullet')
    for run in p.runs:
        run.font.name = '宋体'
        run.font.size = Pt(12)
        run.element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')

add_heading_styled(doc, '7.3  项目管理与沟通计划', 2)
add_para(doc, '项目沟通与协调机制：', indent=True)
comm_items = [
    '每日站会：每天晚上21:00线上同步（15分钟），通报进度、困难、今日计划；',
    '每周评审：每周五17:00进行周进度评审与风险更新（30分钟）；',
    '文档协作：使用腾讯文档/飞书进行文档协同编辑；',
    '即时沟通：微信群用于日常问题讨论与决议；',
    '对外汇报：按课程要求准备课堂报告（6月1日）。',
]
for item in comm_items:
    p = doc.add_paragraph(item, style='List Bullet')
    for run in p.runs:
        run.font.name = '宋体'
        run.font.size = Pt(12)
        run.element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')

doc.add_page_break()

add_heading_styled(doc, '7.4  项目开发工具与环境', 2)

tool_headers = ['类别', '工具/技术', '版本', '用途']
tool_data = [
    ['前端框架', 'Vue 3 + TypeScript', '3.4+', '构建用户界面'],
    ['UI组件库', 'Ant Design Vue', '4.x', '提供UI组件'],
    ['Markdown编辑器', 'ByteMD / Vditor', '-', '知识页面Markdown编辑'],
    ['图可视化', 'ECharts', '5.x', '知识图谱可视化'],
    ['后端框架', 'Node.js + Express.js', '20 LTS', 'REST API服务'],
    ['数据库', 'PostgreSQL', '16.x', '主要数据存储'],
    ['ORM', 'Prisma / TypeORM', '-', '数据库访问层'],
    ['认证', 'JWT + bcrypt', '-', '用户认证'],
    ['搜索', 'fuse.js / flexsearch', '-', '前端模糊搜索'],
    ['容器化', 'Docker + Docker Compose', '24+', '环境标准化与部署'],
    ['版本控制', 'Git + GitHub', '-', '代码管理与协作'],
    ['CI/CD', 'GitHub Actions', '-', '自动化构建与测试'],
    ['API文档', 'Swagger / OpenAPI', '3.0', '接口文档自动生成'],
    ['测试', 'Jest + Cypress', '-', '单元测试与端到端测试'],
    ['项目管理', 'GitHub Projects', '-', '任务看板与进度跟踪'],
    ['绘图工具', 'draw.io / ProcessOn', '-', 'WBS/甘特图/网络图/ER图等'],
]

tool_table = doc.add_table(rows=len(tool_data)+1, cols=4)
tool_table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_border(tool_table)

for i, h in enumerate(tool_headers):
    set_cell_font(tool_table.rows[0].cells[i], h, bold=True, size=10)

for r, row_data in enumerate(tool_data):
    for c, text in enumerate(row_data):
        set_cell_font(tool_table.rows[r+1].cells[c], text, size=10)

doc.add_paragraph()

# ==================== 8. 附录 ====================
add_heading_styled(doc, '附录A  图表制作说明', 1)
add_para(doc, '以下图表需使用项目管理工具软件制作后插入本文档：', indent=True)
charts = [
    '图1：WBS工作分解结构图（树状图/层次图）—— 见第2节',
    '图2：任务网络图（PDM前导图/ADM箭线图）—— 见第3.3节，标注关键路径',
    '图3：甘特图（Gantt Chart）—— 见第3.4节，以7月3日为交付日期',
]
for item in charts:
    p = doc.add_paragraph(item, style='List Number')
    for run in p.runs:
        run.font.name = '宋体'
        run.font.size = Pt(12)
        run.element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')

add_para(doc, '推荐工具：Microsoft Project（甘特图+网络图）、draw.io/ProcessOn（WBS树状图+网络图）、'
    'Excel（甘特图简易版）。所有图表请使用矢量格式或高清截图插入。', indent=True)

# ==================== 保存 ====================
output_path = r'd:\Desktop\学习\2026课程学习\软件工程\notebook项目\2.1项目计划\2024LJSE03-flownote-软件开发计划.docx'
doc.save(output_path)
print(f'文档已生成: {output_path}')
