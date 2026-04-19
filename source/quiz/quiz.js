(function initIndependentQuiz() {
  const root = document.getElementById('indie-quiz-root');
  if (!root) return;

  const QUESTIONS = [
    {
      title: '当你打开 IDE 的第一件事通常是？',
      options: [
        { text: '先列目标和实现步骤，再写代码', type: 'strategist' },
        { text: '先写起来，边做边调整', type: 'sprinter' },
        { text: '先读文档和源码，再开始动手', type: 'researcher' },
        { text: '先和同伴对齐方案', type: 'collaborator' }
      ]
    },
    {
      title: '卡住 40 分钟后，你更可能？',
      options: [
        { text: '拆小问题并逐个验证', type: 'strategist' },
        { text: '先换思路快速试错', type: 'sprinter' },
        { text: '查 issue、标准文档和讨论帖', type: 'researcher' },
        { text: '找同事 Pair Programming', type: 'collaborator' }
      ]
    },
    {
      title: '你最喜欢的任务类型是？',
      options: [
        { text: '架构设计/模块抽象', type: 'strategist' },
        { text: '功能开发/性能优化', type: 'sprinter' },
        { text: '调研新技术/验证方案', type: 'researcher' },
        { text: '跨团队协作推进项目', type: 'collaborator' }
      ]
    },
    {
      title: '你怎么看待学习新技术？',
      options: [
        { text: '只学能放进当前路线图的', type: 'strategist' },
        { text: '先上手，能跑就有价值', type: 'sprinter' },
        { text: '系统学习，理解原理优先', type: 'researcher' },
        { text: '先看团队是否需要并推广', type: 'collaborator' }
      ]
    },
    {
      title: '面对 Code Review 评论，你会？',
      options: [
        { text: '回到设计目标看是否一致', type: 'strategist' },
        { text: '快速改完再迭代', type: 'sprinter' },
        { text: '补充依据并记录经验', type: 'researcher' },
        { text: '主动沟通达成共识', type: 'collaborator' }
      ]
    },
    {
      title: '你更认同哪种成就感？',
      options: [
        { text: '系统更稳定、边界更清晰', type: 'strategist' },
        { text: '版本按期上线、反馈立竿见影', type: 'sprinter' },
        { text: '把复杂问题讲明白', type: 'researcher' },
        { text: '团队效率明显提升', type: 'collaborator' }
      ]
    },
    {
      title: '如果只能保留一个习惯，你选？',
      options: [
        { text: '任务前写简短设计说明', type: 'strategist' },
        { text: '每日小步提交 + 快速回归', type: 'sprinter' },
        { text: '每周技术笔记与复盘', type: 'researcher' },
        { text: '每次迭代主动同步风险', type: 'collaborator' }
      ]
    },
    {
      title: '你理想中的“强者状态”是？',
      options: [
        { text: '能把复杂系统做得可靠可扩展', type: 'strategist' },
        { text: '能高质量、高速度连续交付', type: 'sprinter' },
        { text: '能看透原理并给出最佳实践', type: 'researcher' },
        { text: '能把个人战力放大成团队战力', type: 'collaborator' }
      ]
    }
  ];

  const RESULTS = {
    strategist: {
      title: '🧭 规划型学习者（Strategist）',
      desc: '你擅长先建模再执行，适合承担系统设计、技术路线规划和复杂需求拆解。',
      tips: ['给每个迭代保留 15% 探索空间', '避免过度前置设计，保持小步验证', '将抽象沉淀为可复用模板']
    },
    sprinter: {
      title: '⚡ 冲刺型实践者（Sprinter）',
      desc: '你行动力极强，适合需求攻坚、快速交付和性能优化场景。',
      tips: ['给关键变更补最小测试集', '每次冲刺后做 10 分钟复盘', '把高频重复动作脚本化']
    },
    researcher: {
      title: '🔬 研究型深耕者（Researcher）',
      desc: '你善于追根溯源，适合做底层原理、方案评估和知识体系建设。',
      tips: ['先定义“够用深度”再深入', '调研结论尽量输出可执行清单', '用实例把抽象概念落地']
    },
    collaborator: {
      title: '🤝 协同型推动者（Collaborator）',
      desc: '你擅长沟通和协作，适合跨团队推进、项目管理和工程协同优化。',
      tips: ['明确决策边界，避免会议过载', '争议问题先对齐目标再对齐方案', '沉淀统一术语和协作模板']
    }
  };

  const state = {
    index: 0,
    answers: Array(QUESTIONS.length).fill(null)
  };

  function score() {
    const s = { strategist: 0, sprinter: 0, researcher: 0, collaborator: 0 };
    state.answers.forEach((t) => {
      if (t) s[t] += 1;
    });
    return s;
  }

  function finalType() {
    const s = score();
    return Object.keys(s).sort((a, b) => s[b] - s[a])[0] || 'strategist';
  }

  function progressPercent() {
    const answered = state.answers.filter(Boolean).length;
    return Math.round((answered / QUESTIONS.length) * 100);
  }

  function optionItem(option, idx) {
    const checked = state.answers[state.index] === option.type;
    return `
      <button type="button" class="quiz-option ${checked ? 'active' : ''}" data-opt="${option.type}" data-idx="${idx}">
        ${option.text}
      </button>
    `;
  }

  function renderQuestionView() {
    const q = QUESTIONS[state.index];
    const canPrev = state.index > 0;
    const hasAnswer = Boolean(state.answers[state.index]);

    root.innerHTML = `
      <section class="quiz-shell">
        <header class="quiz-head">
          <h2 class="quiz-title">学习风格趣味测试</h2>
          <p class="quiz-subtitle">共 ${QUESTIONS.length} 题，约 2 分钟，结果仅用于娱乐与自我观察。</p>
          <div class="quiz-intro">模块特性：独立样式、独立脚本、独立题库，不依赖站点配置。</div>
        </header>

        <div class="quiz-progress-wrap">
          <div class="quiz-progress-meta">
            <span>第 ${state.index + 1} / ${QUESTIONS.length} 题</span>
            <span>完成度 ${progressPercent()}%</span>
          </div>
          <div class="quiz-progress-bar">
            <div class="quiz-progress-value" style="width:${progressPercent()}%"></div>
          </div>
        </div>

        <h3 class="quiz-question">${q.title}</h3>
        <div class="quiz-options">
          ${q.options.map(optionItem).join('')}
        </div>

        <footer class="quiz-footer">
          <button type="button" class="quiz-btn" data-action="prev" ${canPrev ? '' : 'disabled'}>上一题</button>
          <button type="button" class="quiz-btn quiz-btn-primary" data-action="next" ${hasAnswer ? '' : 'disabled'}>${state.index === QUESTIONS.length - 1 ? '查看结果' : '下一题'}</button>
          <button type="button" class="quiz-btn" data-action="restart">重新开始</button>
        </footer>
      </section>
    `;

    bindEvents();
  }

  function renderResultView() {
    const t = finalType();
    const result = RESULTS[t];
    const s = score();

    root.innerHTML = `
      <section class="quiz-shell">
        <header class="quiz-head">
          <h2 class="quiz-title">测试结果</h2>
          <p class="quiz-subtitle">你的主风格已经生成，可作为接下来学习和工作安排的参考。</p>
        </header>

        <div class="quiz-result">
          <h3>${result.title}</h3>
          <p>${result.desc}</p>
          <ul class="quiz-result-list">
            ${result.tips.map((tip) => `<li>${tip}</li>`).join('')}
          </ul>
          <p>得分分布：规划 ${s.strategist} / 冲刺 ${s.sprinter} / 研究 ${s.researcher} / 协同 ${s.collaborator}</p>
        </div>

        <footer class="quiz-footer">
          <button type="button" class="quiz-btn quiz-btn-primary" data-action="restart">再测一次</button>
        </footer>
      </section>
    `;

    bindEvents();
  }

  function bindEvents() {
    root.querySelectorAll('[data-opt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.answers[state.index] = btn.getAttribute('data-opt');
        renderQuestionView();
      });
    });

    const prev = root.querySelector('[data-action="prev"]');
    const next = root.querySelector('[data-action="next"]');
    const restart = root.querySelector('[data-action="restart"]');

    if (prev) {
      prev.addEventListener('click', () => {
        if (state.index > 0) {
          state.index -= 1;
          renderQuestionView();
        }
      });
    }

    if (next) {
      next.addEventListener('click', () => {
        if (!state.answers[state.index]) return;
        if (state.index === QUESTIONS.length - 1) {
          renderResultView();
          return;
        }
        state.index += 1;
        renderQuestionView();
      });
    }

    if (restart) {
      restart.addEventListener('click', () => {
        state.index = 0;
        state.answers = Array(QUESTIONS.length).fill(null);
        renderQuestionView();
      });
    }
  }

  renderQuestionView();
})();
