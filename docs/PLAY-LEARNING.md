# 亲子玩学 · First release

## 产品建议

定位为家长的离线活动口袋卡，不是宝宝的屏幕课程。优先验证家长是否觉得“容易开始、愿意重复”，不以宝宝完成率、连续打卡或屏幕停留时间衡量成功。

首版包含 11 张中英双语活动卡：按已满月龄（0–23 个月）每天选两张，按安静互动、日常照护、地垫玩耍、出门散步筛选，支持本机收藏。每日点子按本地日期稳定选择，不是通知推送。没有可用生日或已超范围时要求手选浏览，不假装个性化。手选月龄不改宝宝档案。

每张卡只保留准备材料、两个步骤、安全提醒和参考链接。洗澡场景采用离开浴盆并擦干后的互动；首版不做水温实验、进食游戏、小零件游戏、付费课程、视频、AI动态生成活动或发展评分。时间是可缩短的建议，不是训练目标。月龄分组是编辑性筛选，不代表临床验证的适用边界或“敏感期”。

后续建议先请儿科/儿童发展专业人员审阅内容，收集家长的自愿反馈，再扩充吃饭前后等场景、特殊需要适配和活动替换。商业化放在内容与体验验证之后，不把基本安全说明设为付费功能。

## 内容依据与限制

资料用于原则参考，卡片为简短整理改写，没有复制图片/视频，也不代表来源机构背书。已核对日期：2026-09-08。首版不是筛查、诊断或治疗方案，未经过临床验证。

- [WHO 屏幕与活动建议](https://www.who.int/news-room/detail/24-04-2019-to-grow-up-healthy-children-need-to-sit-less-and-play-more)：婴儿及 1 岁儿童不建议久坐屏幕时间；不能简单归纳成所有机构一致的“18 个月线”。这里采用家长先读、放下手机再互动的产品策略。
- [UNICEF 家长日常建议](https://www.unicef.org/parenting/child-development/baby-tips)：面对面注视、共读原则。
- [UNICEF 玩耍活动](https://www.unicef.org/parenting/child-care/21-learning-activities-babies-and-toddlers)：散步中观察、聆听原则。
- [CDC 2 个月活动建议](https://www.cdc.gov/act-early/milestones/2-months.html)：回应声音、照护中的交流、观察疲倦信号。
- [CDC 9 个月活动建议](https://www.cdc.gov/act-early/milestones/9-months.html)：躲猫猫、容器取放的活动原则。
- [CDC 1 岁活动建议](https://www.cdc.gov/act-early/milestones/1-year.html)：照护叙述与跟随孩子指认。
- [CDC 18 个月活动建议](https://www.cdc.gov/act-early/milestones/18-months.html)：简单选择与假装游戏。

全部保留成人看护说明；不要求提前达到里程碑。早产/特殊需要的适龄判断、发展担忧或技能退步应咨询专业人员。本模块没有孕周信息，不自动计算矫正月龄。

## Implementation

- `src/learning.ts`: typed bilingual catalog, calendar-age filtering, deterministic local-date recommendations and favorite validation.
- `src/PlayLearning.tsx`: fifth navigation tab; compact expandable cards and single-row setting controls. No new native dependencies.
- `src/storage.ts` / `.web.ts`: favorites in a separate local key; no care-record schema changes, network upload or background notifications. Favorites are not included in existing record backups, as disclosed in the page.
- Source links open only on user request and require network access. Reading cards, recommendations and favorites work offline. Corrupt/unavailable favorite storage is reported rather than silently overwritten.
- Calendar months use completed month anniversaries, clamped to the month's last day; daily picks use the local calendar date, not elapsed 24-hour periods.

Validation: run TypeScript, unit tests, web export and browser flows including no-birthday selection, age switching, empty categories, English/Chinese, source visibility and favorite persistence. Inspect narrow light/dark layouts. Native SQLite persistence and parent usability still need an iPhone check.

Family sharing remains a separate unapproved technical plan. This implementation adds no Azure service, login or shared data behavior.
