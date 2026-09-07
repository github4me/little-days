# 小日子 · Little Days

婴儿成长记录的单机离线版（Expo / React Native / TypeScript）。Windows PC 开发，iPhone 真机使用。不需要账号、后端、共享服务或照片权限。

## 已实现

- 宝宝姓名、出生日期、性别、内置头像；深浅色模式持久保存。
- 奶瓶/亲喂记录，实际奶量快捷输入，可选结束时间；尿、便、混合尿布。
- 一键入睡/醒来、补录与修改，重启后按时间戳恢复计时。
- 体重、身长、头围及 WHO 官方男/女 0–24 月百分位参考线（本地内置）。
- 文字里程碑、备注、历史筛选、编辑、删除和即时撤销。
- 7/30 天奶量、睡眠和尿布汇总；跨日拆分睡眠，重叠区间去重。
- 本地一次性延时提醒、每日固定时间提醒、静音和取消。
- JSON 导出/导入，严格验证，替换前保留恢复副本。

## Windows 上启动

1. 安装 Node.js LTS（建议 Node 24 LTS）、Git、VS Code。
2. 解压本项目，在包含 `package.json` 的文件夹打开 PowerShell：

```powershell
npm ci
npm start
```

3. iPhone 安装与项目 SDK 57 兼容的 Expo Go。电脑和手机连接同一个 Wi-Fi，在手机相机扫描终端二维码。首次安装依赖和加载开发包需要联网。
4. 第一次打开：进入「我的」，填写宝宝名字、出生日期（YYYY-MM-DD）和性别。
5. 如 Windows 防火墙提示，请仅允许开发网络所需的专用网络访问。局域网无法连接时，可在可信网络使用 Expo 的 tunnel 模式；这会通过中转传送开发包，项目没有向服务器上传照护记录的代码。

如果 App Store 的 Expo Go 版本不兼容 SDK 57，不要随意升级/降级单个包。使用下面的 EAS 内部分发构建，或整体对齐 Expo SDK 与 Expo Go。

### 先在 PC 查看界面

```powershell
npm run web
```

浏览器预览只供开发测试：数据保存在该浏览器的 localStorage，与 iPhone 数据独立；清除浏览器数据会丢失预览记录。网页不支持本地手机通知。手机安装版使用 SQLite。

### 安装为独立 iPhone App

Expo Go 是开发工具。日常使用、关掉电脑后独立启动和通知验收，应使用签名的独立安装包。

准备 Expo 账号和适用的 Apple Developer 账号后：

```powershell
npx eas-cli login
npx eas-cli build:configure
npx eas-cli device:create
npx eas-cli build --platform ios --profile preview
```

按向导配置团队、签名与设备，使用 EAS 返回的安装链接安装。`app.json` 中的 bundleIdentifier 可在第一次正式构建前改为自己的唯一标识；已有数据后不要随意更改应用身份。这里没有创建云项目、登录账户、上传构建或申请签名。

参考：[Expo 云端开发构建](https://docs.expo.dev/develop/development-builds/introduction/)、[内部测试分发](https://docs.expo.dev/build/internal-distribution/)。

## 使用说明

- 首页「睡了」立即保存入睡时间；「醒了」结束当前睡眠。补录用卡片下方入口。
- 喂奶快捷数量只是输入选项，不是喂养建议。亲喂时长不转换成毫升。
- 「记录」可筛选全部五类事件，按发生日期查找；完整备份不受列表分页限制。
- 「成长」查看实测曲线、日常趋势和文字里程碑；标准曲线只覆盖 0–24 月，不向外推算。
- 提醒在「我的」设置。延时提醒从点击添加时算起，只响一次；新记录不会自动重置。每日提醒按设备当地时间触发，免打扰/专注模式和系统通知权限可能影响呈现。没有实现自动作息建议或自动喂养间隔规则。
- 「导出备份文件」后在 iPhone 分享菜单选择「存储到文件」，自行选择位置。应用不会自动上传备份；选择 iCloud 等位置时，由用户选择的系统服务处理。
- 导入前会预览姓名与记录数量，确认后整体替换，不合并。可通过「查看上次替换前的数据」回退一份。恢复不改变当前已安排的提醒。
- 备份为未加密 JSON，包含宝宝档案与所有记录，不含主题偏好、系统通知计划。换机、卸载前保存备份。

## 时间与数据边界

事件用带时区的 ISO 时间保存。显示、日期筛选和每日汇总使用当前设备时区（墨尔本设备会采用当地夏令时），旅行改变设备时区会重新分配日统计。生日是无时区的日历日期。手动编辑精度为分钟，首页即时计时保存到毫秒。

睡眠按实际时间差计算，统计合并重叠睡眠区间；进行中睡眠只统计至当前时刻。没有记录的天不等同于实际没有进食或睡眠。

WHO 参考来源、原始表格校验和与绘图口径详见 `docs/WHO-SOURCES.md`。曲线只用于趋势展示，不做诊断、精确百分位计算或早产矫正月龄判断。

手机数据存在应用沙盒 SQLite；无业务网络请求、登录、遥测或远程推送代码。系统级设备备份遵循手机系统设置，不等于应用有云同步。

## 验证

```powershell
npm run verify
npm run export:ios
npm run export:web
```

- `verify`：TypeScript + 数据/统计/WHO 参考单元测试。
- `export:ios`：生成 iOS JavaScript/Hermes 资源包；不是 IPA 编译、签名或真机验证。
- 浏览器回归脚本在 `tests/`；见 `docs/VALIDATION.md`。

## 项目结构

- `App.tsx`：首页、记录、统计、成长和页面切换。
- `src/EntryEditor.tsx`：五类记录表单与原生时间选择器。
- `src/Settings.tsx`：档案、通知、备份恢复。
- `src/domain.ts`：版本化数据模型、校验与统计。
- `src/storage.ts`：SQLite 事务保存与恢复副本；`.web.ts` 是开发预览实现。
- `src/backup.ts`：手机文件选择与导出。
- `src/reminders.ts`：设备本地通知，不获取推送 token。
- `src/growth.ts`、`assets/who/`：本地 WHO 参考数据。

## 当前范围

这是 0.1.0 开发交付版，不是已签名安装包。没有家庭共享、照片、后端、自动重置提醒、锁屏组件。需要 iPhone 实测通知、原生日期选择、SQLite 重启保存、文件选择/导出，以及最终签名安装流程。
