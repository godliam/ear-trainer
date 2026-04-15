# Ear Trainer - 听力训练器

一个基于 Electron + React + TypeScript 开发的音乐听力训练桌面应用，帮助你提升音高识别和和弦听辨能力。

## ✨ 功能特性

### 🎵 单音训练 (Note Training)
- 随机播放单个音符，在钢琴键盘上找出对应的音
- 支持多种乐器音色：钢琴、吉他、短笛
- 可选择调号（大调/小调）或完全随机
- 可自定义音高范围（A2-A6）
- 实时显示正确答案和答题记录
- 自动播放3次提示音，帮助记忆

### 🎹 和弦听辨 (Chord Training)
- 播放三和弦，在键盘上选择组成该和弦的三个音
- 支持所有自然大调和自然小调的顺阶三和弦
- 包含根位、第一转位、第二转位
- 智能和弦识别系统，自动判断你选择的和弦名称
- 显示详细的答题历史和错题记录

### 🎼 和弦识别 (Chord Identification)
- 自由选择任意音符组合，实时识别和弦名称
- 支持多种演奏方式：
  - **柱式和弦**：同时播放所有音符
  - **分解和弦**：按不同节奏型（四分、八分、十六分音符）依次播放
- 支持多种方向：上行、下行、往复（上至下/下至上）
- 五线谱实时显示，自动选择高音谱号或低音谱号
- 历史记录功能，保存每次识别的和弦

## 🛠️ 技术栈

- **框架**: Electron + React 18 + TypeScript
- **路由**: React Router v6 (HashRouter)
- **状态管理**: Zustand
- **音频引擎**: Tone.js
- **乐谱渲染**: VexFlow
- **国际化**: i18next (支持中文/英文)
- **构建工具**: electron-vite

## 📦 安装与运行

### 前置要求
- Node.js >= 16
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 打包应用
```bash
npm run package
```

## 📁 项目结构

```
ear-trainer/
├── src/
│   ├── main/              # Electron 主进程
│   │   └── index.ts
│   ├── preload/           # 预加载脚本
│   │   └── index.ts
│   └── renderer/          # React 渲染进程
│       ├── components/    # React 组件
│       │   ├── InstrumentSelector.tsx
│       │   ├── KeySelector.tsx
│       │   ├── OctaveRangeSelector.tsx
│       │   ├── PianoKeyboard.tsx
│       │   ├── StaffNotation.tsx
│       │   ├── TrainingSidebar.tsx
│       │   └── ...
│       ├── pages/         # 页面组件
│       │   ├── Home.tsx
│       │   ├── SingleNoteTraining.tsx
│       │   ├── ChordTraining.tsx
│       │   └── ChordIdentification.tsx
│       ├── store/         # 状态管理
│       │   ├── useAppStore.ts
│       │   └── useTrainingStore.ts
│       ├── utils/         # 工具函数
│       │   ├── audio.ts      # 音频处理
│       │   ├── music.ts      # 音乐理论计算
│       │   └── chordRecognition.ts  # 和弦识别算法
│       ├── i18n/          # 国际化
│       └── styles/        # 全局样式
├── package.json
├── tsconfig.json
└── electron.vite.config.ts
```

## 📄 License

MIT

## 🙏 致谢

- [Tone.js](https://tonejs.github.io/) - Web Audio 框架
- [VexFlow](https://vexflow.com/) - 乐谱渲染引擎
- [Zustand](https://zustand-demo.pmnd.rs/) - 轻量级状态管理

---

**享受音乐，提升听力！🎶**
