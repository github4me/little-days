# 亲子早教 · Parent-led play

## 产品建议

定位为家长的离线活动口袋卡，不是宝宝的屏幕课程。优先验证家长是否觉得“容易开始、愿意重复”，不以宝宝完成率、连续打卡或屏幕停留时间衡量成功。

目前包含 24 张中英双语活动卡：按已满月龄默认列出所有适龄项目，每个已满月龄至少 6 项可选，支持本机收藏及自愿每日打卡。分组为 0–1、1–2、2–3、3–5、5–7……23–25 月，包含起始月龄、不包含结束月龄（首版覆盖未满 25 个月）。没有可用生日或已超范围时要求手选浏览，不假装个性化。手选月龄不改宝宝档案。

“生活场景”已替换为独立的“日常照护”，不再显示原场景筛选排。照护包括体温、洗澡、脸/手/皮肤褶皱清洁、口腔、指甲；不是早教任务或必须每日进行的事项。体温保存原始摄氏读数、测量方式、带时区时间及备注，其他项目保存时间和备注。保存按钮执行前不持久化草稿。可编辑、确认后删除；每类最近 5 次默认可见，更早历史可展开。

照护历史以可选 `State.careRecords` 保存在原有本地数据及备份内。新版本兼容旧版缺省此字段的备份；含此字段的新备份需用支持照护记录的版本恢复（旧版本会拒绝，不会静默丢弃）。恢复旧备份会整体替换当前照护历史，恢复确认总数包括照护记录。收藏和早教打卡仍不包含在照护记录备份中。

家长可直接点“今天做过”，点按即本地保存，再点可取消误打卡；不设连续天数、排名、完成率或奖励。每项每天只记一次“做过”，不是训练次数、时长或达标记录。按本机日历日切换今日状态，旧日期的数据保留（本版不提供历史浏览）。打卡失败不显示成功；读取失败不会覆盖原数据，提供重试。收藏和打卡不纳入现有照护记录备份，界面明确提示。

每张卡只保留准备材料、两个步骤、安全提醒和参考链接。洗澡场景采用离开浴盆并擦干后的互动；首版不做水温实验、进食游戏、小零件游戏、付费课程、视频、AI动态生成活动或发展评分。时间是可缩短的建议，不是训练目标。月龄分组是编辑性筛选，不代表临床验证的适用边界或“敏感期”。

后续建议先请儿科/儿童发展专业人员审阅内容，收集家长的自愿反馈，再扩充吃饭前后等场景、特殊需要适配和活动替换。商业化放在内容与体验验证之后，不把基本安全说明设为付费功能。

## 内容依据与限制

资料用于原则参考，卡片为简短整理改写，没有复制图片/视频，也不代表来源机构背书。已核对日期：2026-09-08。首版不是筛查、诊断或治疗方案，未经过临床验证。

- [WHO 屏幕与活动建议](https://www.who.int/news-room/detail/24-04-2019-to-grow-up-healthy-children-need-to-sit-less-and-play-more)：婴儿及 1 岁儿童不建议久坐屏幕时间；不能简单归纳成所有机构一致的“18 个月线”。这里采用家长先读、放下手机再互动的产品策略。
- [AAP 新生儿视觉](https://www.healthychildren.org/English/ages-stages/baby/Pages/Developmental-Milestones-1-Month.aspx)：黑白或高对比图案可作为近距离注视的可选素材，优先真人互动，不宣称改善智力/视力。不用手机向宝宝展示卡片。
- [NIH 清醒趴卧](https://safetosleep.nichd.nih.gov/reduce-risk/tummy-time)：只在宝宝清醒且成人看护时进行，短时开始、逐步增加。卡片不是每日运动处方；一次打卡不代表满足每日活动建议。困倦即停止并回到安全的仰卧睡眠空间。
- [UNICEF 家长日常建议](https://www.unicef.org/parenting/child-development/baby-tips)：面对面注视、共读原则。
- [UNICEF 玩耍活动](https://www.unicef.org/parenting/child-care/21-learning-activities-babies-and-toddlers)：散步中观察、聆听原则。
- [CDC 2 个月活动建议](https://www.cdc.gov/act-early/milestones/2-months.html)：回应声音、照护中的交流、观察疲倦信号。
- [CDC 9 个月活动建议](https://www.cdc.gov/act-early/milestones/9-months.html)：躲猫猫、容器取放的活动原则。
- [CDC 1 岁活动建议](https://www.cdc.gov/act-early/milestones/1-year.html)：照护叙述与跟随孩子指认。
- [CDC 18 个月活动建议](https://www.cdc.gov/act-early/milestones/18-months.html)：简单选择与假装游戏。
- [CDC 4 个月](https://www.cdc.gov/act-early/milestones/4-months.html)、[6 个月](https://www.cdc.gov/act-early/milestones/6-months.html)、[15 个月](https://www.cdc.gov/act-early/milestones/15-months.html)：自主伸手、地面活动、参与简单家务和动作儿歌。更细的月龄段是编辑分组，不是来源机构给出的逐月训练计划。
- [healthdirect 体温计](https://www.healthdirect.gov.au/types-of-thermometer)、[发热](https://www.healthdirect.gov.au/fever-and-high-temperature-in-children)：记录不替代就医；未满 3 个月且体温达到 38°C 应紧急就医；呼吸困难、难唤醒或抽搐立即求助。应用不测温、不调整不同部位的读数、不诊断，不给出用药剂量。25–45°C 是防输入错误的存储范围，不是正常体温范围。
- [NHS 洗澡、清洁与指甲](https://www.nhs.uk/baby/caring-for-a-newborn/washing-and-bathing-your-baby/)、[口腔护理](https://www.nhs.uk/baby/babys-development/teething/looking-after-your-babys-teeth/)：按需护理、水边全程成人看护、萌牙后开始刷牙。牙膏选择提示遵循当地牙医建议，不把英国剂量建议默认推广到所有地区。

全部保留成人看护说明；不要求提前达到里程碑。早产/特殊需要的适龄判断、发展担忧或技能退步应咨询专业人员。本模块没有孕周信息，不自动计算矫正月龄。

## Implementation

- `src/learning.ts`: typed bilingual catalog, calendar-age filtering, validated local-date keys and known activity IDs.
- `src/PlayLearning.tsx`: fifth navigation tab; compact expandable cards and single-row setting controls. No new native dependencies.
- `src/storage.ts` / `.web.ts`: favorites in a separate local key, play check-ins in one separate key per local date; no network upload or background notifications. Favorites and play check-ins are not included in existing record backups, as disclosed in the page.
- `src/DailyCare.tsx` / `src/care.ts` / `src/domain.ts`: care form and history, validated time/readings/methods, optional persisted and backed-up `careRecords` array. Existing `entries` and their statistics are unchanged.
- Source links open only on user request and require network access. Reading cards, recommendations and favorites work offline. Corrupt/unavailable favorite storage is reported rather than silently overwritten.
- Calendar months use completed month anniversaries, clamped to the month's last day. Check-ins use local calendar dates, not elapsed 24-hour periods; dates and IDs are validated before reading/writing. Old-day writes cannot replace the current day's displayed state.

Validation: TypeScript, 30 unit tests and browser flows including age boundaries, at least six options at each supported age, English/Chinese, favorite/check-in persistence, care create/edit/confirmed-delete, history folding, failed saves, and actual care backup download/import round trip. Narrow layouts are inspected. Native SQLite persistence and parent usability still need an iPhone check.

Family sharing remains a separate unapproved technical plan. This implementation adds no Azure service, login or shared data behavior.
