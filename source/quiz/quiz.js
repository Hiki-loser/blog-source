(function initQuiz() {
  const root = document.getElementById('indie-quiz-root');
  if (!root) return;

  // ── 题目数据 ──────────────────────────────────────────────
  // outer/inner/feel/think: 1 表示该选项为此维度 +1 分

  const QUESTIONS = [
    {
      title: '1. 周五下班，朋友临时约你出门。你的第一反应是？',
      options: [
        { text: '立刻换衣服，出门！有什么比 Friday night 更重要', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '想了三秒，问"去哪？几个人？几点回？"再决定', outer: 1, inner: 0, feel: 0, think: 1 },
        { text: '内心有一点小挣扎，最终还是找了个借口婉拒', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '直接说"今天不想动"，毫无愧疚感', outer: 0, inner: 1, feel: 0, think: 1 }
      ]
    },
    {
      title: '2. 你在网上看到一篇文章，观点和你完全相反。你的反应？',
      options: [
        { text: '截图发给朋友："你看这个人说的！"准备开骂', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '认真读完，在评论区写了一段很长的回复', outer: 1, inner: 0, feel: 0, think: 1 },
        { text: '越读越难受，关掉，但那个观点在脑子里转了好几天', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '快速扫完，判断论据是否成立，然后放下', outer: 0, inner: 1, feel: 0, think: 1 }
      ]
    },
    {
      title: '3. 有人问你"你最近怎么样"，你的回答最可能是？',
      options: [
        { text: '滔滔不绝说了五件事', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '"还行，你呢？"然后把话题转给对方', outer: 1, inner: 0, feel: 0, think: 1 },
        { text: '"嗯……还行吧"，心里其实有很多，但说不出口', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '给出一个精准但简短的答案，比如"在做一件新事情"', outer: 0, inner: 1, feel: 0, think: 1 }
      ]
    },
    {
      title: '4. 你独处的时候，最常做什么？',
      options: [
        { text: '刷视频/社交媒体，顺便转发几条觉得有趣的东西', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '做一件具体的事：整理文件、研究某个问题、学东西', outer: 0, inner: 1, feel: 0, think: 1 },
        { text: '发呆，或者写点什么，情绪到了才动', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '规划、复盘、想接下来要做的事', outer: 1, inner: 0, feel: 0, think: 1 }
      ]
    },
    {
      title: '5. 你最近经历了一件挺难受的事。你会？',
      options: [
        { text: '找人说，说完就好很多了', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '一个人消化，消化完再决定要不要告诉别人', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '理性分析原因和后果，想清楚了就不难受了', outer: 0, inner: 1, feel: 0, think: 1 },
        { text: '先行动——出去走走、换个环境、转移注意力', outer: 1, inner: 0, feel: 0, think: 1 }
      ]
    },
    {
      title: '6. 你更擅长哪种表达？',
      options: [
        { text: '当面说，我的语气和表情能把感受传递得更准确', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '写下来，写的时候才能真正整理清楚我在想什么', outer: 0, inner: 1, feel: 0, think: 1 },
        { text: '两种都行，但喜欢在合适的时机说，不喜欢被追问', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '列出来，条理清晰地讲，感情色彩对我来说是噪音', outer: 1, inner: 0, feel: 0, think: 1 }
      ]
    },
    {
      title: '7. 你最理想的工作状态是？',
      options: [
        { text: '和一群人同在一个空间各干各的，有人就有能量', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '独立项目，自己掌控节奏，汇报结果就好', outer: 0, inner: 1, feel: 0, think: 1 },
        { text: '有高质量的合作，但也有完全属于自己的时间', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '带一个团队，指挥调度，看着事情被推进', outer: 1, inner: 0, feel: 0, think: 1 }
      ]
    },
    {
      title: '8. 你做决定时，更信任？',
      options: [
        { text: '直觉。那个"不对劲"或"就是它"的感觉几乎从没错过', outer: 0, inner: 0, feel: 1, think: 0 },
        { text: '数据和逻辑。感觉会骗人，推理不会', outer: 0, inner: 0, feel: 0, think: 1 },
        { text: '两者——我先跟着感觉走，再用逻辑验证它', outer: 0, inner: 0, feel: 1, think: 0 },
        { text: '两者——我先做逻辑分析，再问自己感觉上接不接受', outer: 0, inner: 0, feel: 0, think: 1 }
      ]
    },
    {
      title: '9. 你参加一个不太熟悉的饭局，入座后你会？',
      options: [
        { text: '主动找人搭话，十分钟内和至少两个人聊起来', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '先观察，找一个最有意思的人，只和他聊', outer: 0, inner: 1, feel: 0, think: 1 },
        { text: '跟着别人的话题走，尽量不冷场，但全程有点累', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '安静坐着，等有人来找我说话，专心吃饭也不错', outer: 0, inner: 1, feel: 1, think: 0 }
      ]
    },
    {
      title: '10. 你最害怕在亲密关系中出现哪种场景？',
      options: [
        { text: '对方变得疏远，不再主动联系我', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '我说了一句真心话，对方没有接住，甚至笑了', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '我们的关系陷入某种重复的模式，出不去', outer: 0, inner: 1, feel: 0, think: 1 },
        { text: '对方做了一个重大决定，却没有提前告诉我', outer: 1, inner: 0, feel: 0, think: 1 }
      ]
    },
    {
      title: '11. 如果你的情绪是一种天气，你最常是？',
      options: [
        { text: '晴转多云，变化快，但很少阴天', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '多云间晴，偶尔有大风，内部比外表复杂', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '稳定的晴天，偶尔一场大雨，雨后更清澈', outer: 1, inner: 0, feel: 0, think: 1 },
        { text: '深秋恒温，有自己的节律，不太受外部干扰', outer: 0, inner: 1, feel: 0, think: 1 }
      ]
    },
    {
      title: '12. 你刚认识一个新朋友，你最先注意到他/她的？',
      options: [
        { text: '他说话时的眼神和表情——我从这里读人', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '他在讲什么、怎么讲——内容和逻辑更告诉我他是谁', outer: 0, inner: 0, feel: 0, think: 1 },
        { text: '他在人群里的状态——是放松还是有防备', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '他的选择和习惯——从细节判断一个人更准确', outer: 0, inner: 1, feel: 0, think: 1 }
      ]
    },
    {
      title: '13. 对你来说，"休息"意味着？',
      options: [
        { text: '和人待在一起，轻松地聊天，不用干活', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '一个人，安静，不被打扰，什么都不需要输出', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '做一件低强度但有成果的事，比如整理、烹饪、散步', outer: 0, inner: 1, feel: 0, think: 1 },
        { text: '把所有待办都清空，然后做一件纯粹想做的事', outer: 1, inner: 0, feel: 0, think: 1 }
      ]
    },
    {
      title: '14. 有人当众批评了你，你事后的内心活动是？',
      options: [
        { text: '很受伤，反复回想当时的画面，需要一段时间才能平复', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '当时有点懵，后来冷静下来分析他说得对不对', outer: 0, inner: 1, feel: 0, think: 1 },
        { text: '当下就想反击，忍住了，但找人说了个遍', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '观察其他人的反应，心里默默给这段关系重新打了分', outer: 1, inner: 0, feel: 0, think: 1 }
      ]
    },
    {
      title: '15. 你在读一本书，哪种感觉最让你觉得"值了"？',
      options: [
        { text: '某个人物让我哭了，或者某段描写让我心里发酸', outer: 0, inner: 0, feel: 1, think: 0 },
        { text: '某个观点颠覆了我原来的认知，我要重新想很多事', outer: 0, inner: 0, feel: 0, think: 1 },
        { text: '我在某个人物身上看到了我自己，有点不舒服但很真实', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '书里提供了一个我从没想过的框架，我立刻想用它分析现实', outer: 1, inner: 0, feel: 0, think: 1 }
      ]
    },
    {
      title: '16. 你和一个好朋友发生了误会，你会倾向于？',
      options: [
        { text: '尽快当面谈清楚，不舒服的感觉一天都受不了', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '先自己想清楚，等情绪平了再找对方聊', outer: 0, inner: 1, feel: 0, think: 1 },
        { text: '等对方来找我，我先不动，看他怎么处理', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '发一条信息试探一下，根据他的回应决定下一步', outer: 1, inner: 0, feel: 0, think: 1 }
      ]
    },
    {
      title: '17. 你觉得自己最大的优势是？',
      options: [
        { text: '我能快速感受到一个环境/一个人的真实氛围，比别人敏锐', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '我能在混乱中找到秩序，理清楚到底发生了什么', outer: 0, inner: 0, feel: 0, think: 1 },
        { text: '我能让人觉得舒服，愿意在我面前放松', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '我能把复杂的事情拆解清楚，然后一步步做到', outer: 1, inner: 0, feel: 0, think: 1 }
      ]
    },
    {
      title: '18. 当你"卡住"了（做不下去、没有动力），你通常需要？',
      options: [
        { text: '有人推我一把，或者约我出去，换个环境就好了', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '一段没有任何要求的独处时间，让我自己找回来', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '弄清楚为什么卡住了，找到根本原因，解决掉', outer: 0, inner: 1, feel: 0, think: 1 },
        { text: '先做一件很小但能完成的事，找回掌控感', outer: 1, inner: 0, feel: 0, think: 1 }
      ]
    },
    {
      title: '19. 你对"未来"的态度更接近？',
      options: [
        { text: '我对未来有很多想象，但懒得规划，顺着走就好', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '未来让我有点焦虑，我更喜欢专注于当下能掌控的事', outer: 0, inner: 1, feel: 0, think: 1 },
        { text: '我有一个大方向，不一定具体，但那个感觉很重要', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '我在脑子里有好几个版本的未来，在做推演', outer: 1, inner: 0, feel: 0, think: 1 }
      ]
    },
    {
      title: '20. 你觉得"了解一个人"，最核心的方式是？',
      options: [
        { text: '看他在高压下怎么反应，那才是真实的', outer: 0, inner: 0, feel: 0, think: 1 },
        { text: '看他对待不重要的人怎么样——服务员、陌生人', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '和他长时间待在一起，不说话也行，看他的状态', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '和他深谈一次，什么都能问，什么都愿意答', outer: 1, inner: 0, feel: 0, think: 1 }
      ]
    },
    {
      title: '21. 如果生命只剩最后一年，你最不能接受的是？',
      options: [
        { text: '没来得及和重要的人把话说清楚', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '还有很多想做的事没做，计划还没执行完', outer: 1, inner: 0, feel: 0, think: 1 },
        { text: '一直活在别人的期待里，没有真正为自己活过', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '到死都没想明白一些真正重要的问题', outer: 0, inner: 1, feel: 0, think: 1 }
      ]
    },
    {
      title: '22. 最后一题，你选了这套测试的原因最可能是？',
      options: [
        { text: '朋友发给我的，反正没事做就测一下', outer: 1, inner: 0, feel: 1, think: 0 },
        { text: '标题吸引了我，觉得可能有点意思', outer: 0, inner: 1, feel: 1, think: 0 },
        { text: '我对这类测试有研究，想看看设计得怎样', outer: 0, inner: 1, feel: 0, think: 1 },
        { text: '我想了解自己，一直在找有深度的测试工具', outer: 1, inner: 0, feel: 0, think: 1 }
      ]
    }
  ];

  // ── 结果类型 ──────────────────────────────────────────────

  const RESULTS = {
    outer_feel: {
      emoji: '🌊', name: '海浪型',
      tagline: '「你走到哪里，哪里就有温度」',
      desc: '你是那种进入一个房间、气氛就会有所不同的人。不是因为你多会表演，而是因为你<strong>真实感受到了，所以真实表达出来</strong>——那种热情不是表演出来的，是溢出来的。你对情绪的感知极度灵敏，能在别人开口之前就感觉到他今天"不对劲"；也能在沉默的饭桌上找到一句话，让气氛活过来。',
      desc2: '你最享受的状态是<strong>流动</strong>——在人和人之间，在事件和事件之间，在情绪的起伏之间。停下来对你来说反而更累。但你有一个容易忽视的代价：你消耗自己太快，有时是在用真实的感情换取表面的热闹。',
      blind: '你以为自己很了解别人的感受，但有时候你读到的是你自己的投射。',
      gift: '退潮不是失去，是在为下一次涨潮积蓄。'
    },
    outer_think: {
      emoji: '⚡', name: '电弧型',
      tagline: '「你的思维一旦触碰到合适的人，就会产生真实的火花」',
      desc: '你是那种能在一场对话里推进五个层次的人。你享受交流，但不是为了联结——你享受<strong>思维的碰撞和摩擦</strong>。你喜欢辩论，不是因为喜欢赢，而是因为在摩擦中才能真正想清楚一件事。你把讨论当成思考工具，把他人的反驳当成验证自己想法的最佳方式。',
      desc2: '外部世界对你来说是一个巨大的素材库——人、事件、观点——你的眼睛一直在扫描，随时在建立连接，随时在更新你的推论。你最大的魅力在于<strong>快</strong>：快速反应，快速判断，快速决策。但这个快也是你的陷阱——你有时对别人没有给出"够快"的回应感到不耐烦。',
      blind: '不是每一场对话都是竞赛。让别人的思维有时间跟上来。',
      gift: '你思考得最清楚的时候，往往是在一段关系里真正停下来倾听的时候。'
    },
    outer_balanced: {
      emoji: '🎭', name: '导演型',
      tagline: '「你看见的不是眼前的样子，而是它应该成为的样子」',
      desc: '你对"现实"有一种天然的不满足——不是愤怒，而是<strong>看见可能性的冲动</strong>。你能同时兼顾情感和逻辑，这让你在人群中成为一个奇特的存在：你既能理解为什么事情会走到现在这一步，也能设计出一条让它变得更好的路径。当别人还在讨论问题，你已经在心里排好了下一幕的分镜。',
      desc2: '你的能量是向外的，你需要舞台——可以是一个项目、一段关系、一个你在推进的事。你在推动事情发生时才感到真正活着，旁观让你焦虑。你的挑战是<strong>控制欲</strong>：你对结果有太清晰的预期，当别人偏离了"剧本"，你的第一反应不是好奇，而是想纠正。',
      blind: '最好的故事，往往有你没想到的转折。给世界留一点即兴发挥的空间。',
      gift: '你能让一群方向不同的人，找到愿意一起往前走的理由。'
    },
    balanced_feel: {
      emoji: '🌿', name: '根系型',
      tagline: '「你是那种让人觉得\'待在你旁边就够了\'的存在」',
      desc: '你对情感世界的理解有一种深度，不是通过分析，而是通过<strong>共生</strong>。你能感受到别人感受不到的细微——某句话背后的疲惫，某个眼神里的不安，某段沉默里的东西。你不一定说出来，但你接住了，那个接住本身让对方觉得被照顾。',
      desc2: '你是外内均衡的，这意味着你既不逃进内心，也不把自己全部暴露在外——你有一种天然的分寸感，知道什么时候该往前，什么时候该退。你的危险地带是<strong>过度承接</strong>：你替别人承担了太多情绪重量，久而久之你的根会疲惫。',
      blind: '允许自己也有"今天什么都不想给"的时刻，那不是冷漠，是自我保护。',
      gift: '这个世界充满了很多人在说话，但懂得沉默地陪伴的人越来越少。你是其中之一。'
    },
    balanced_balanced: {
      emoji: '🪞', name: '棱镜型',
      tagline: '「你是少数能同时持有多种矛盾并且不崩溃的人」',
      desc: '你是最难被定义的类型，但这不是缺点，是稀有性。在四个方向上你都不偏——你既能进入感受里，也能退出来分析；你既能主动输出，也能安静吸收。这让你在面对复杂情境时，比大多数人多一个维度的自由：<strong>你可以选择用哪种方式应对，而不是被某种方式驱动。</strong>',
      desc2: '你是好的倾听者，也是好的表达者；你是理性的，也是感性的；你能一个人待很久，也能融入人群。这种流动性让你极度适应不同环境，但也可能让你有时困惑：我到底是什么样的人？棱镜的本质是：光进来时是白色的，出去时是彩色的。你不"是"哪种颜色，你<strong>折射</strong>出所有颜色。',
      blind: '你太擅长理解所有立场，导致你很难坚持一个自己的位置。',
      gift: '不需要找到"真正的自己"，流动本身就是你的形态。'
    },
    balanced_think: {
      emoji: '🔭', name: '望远镜型',
      tagline: '「你总是在看别人还没有注意到的那个方向」',
      desc: '你思维的最大特点是<strong>跨度</strong>——你很少只看当下这件事，你会自动把它放进一个更大的坐标系里，和远处的事物建立连接，然后得出一个别人觉得"你怎么想到的？"的结论。你不是冷漠的人，但你处理世界的方式是理解而非感受。当别人在哭的时候，你在想为什么——不是冷血，是你的同情心经过了大脑中转了一次。',
      desc2: '你的平衡能力让你既能独处也能社交，但你在每一种状态里都保持着某种程度的观察者距离——你很少完全"进入"一个场景，你在场但你在看。你最大的挑战：太擅长看清一件事的走向，反而有时会失去"天真地试一试"的冲动。',
      blind: '你的望远镜能看很远，但别忘了偶尔放下来，看看脚下的地面。',
      gift: '你能在事情发生之前就感知到它的走向，预判往往准确——但你不怎么说，因为你知道说了也没人信。'
    },
    inner_feel: {
      emoji: '🕯️', name: '烛光型',
      tagline: '「你是那种会在深夜被人想起来的存在」',
      desc: '你的感受像火焰，不往外扩散，但极度真实、极度温热。你不是一个大声的人，但你是一个深入的人。你建立的关系数量少，但质量高——每一段你愿意认真对待的关系，都是你用真实的自己换来的。你给出去的东西太珍贵，所以你会仔细挑谁值得。',
      desc2: '你内心有一个非常丰富的世界，大多数人只看到你安静的外壳。你不喜欢被要求表演热情，你的热情是真实触碰到某件事时自然燃起的，强迫不来。你最大的隐秘痛苦：有时候你有很多话想说，但找不到一个你觉得能真正接住的人。',
      blind: '找到一个"无论你说什么我都不会觉得奇怪"的人。找到了就别轻易放手。',
      gift: '这个世界不缺热闹，缺的是真实的温度。你是后者。'
    },
    inner_balanced: {
      emoji: '🗝️', name: '锁匠型',
      tagline: '「你是那种看起来普通，但走近了就会发现内部极度精密的人」',
      desc: '你是一个有节奏的人。不是慢，是<strong>有节奏</strong>。你做决定前需要足够的信息，你说话前需要确认那句话真的是你要说的，你信任一个人前需要足够的时间。旁边的人可能觉得你"难以靠近"，但真正进入过你的人知道：那个门开了之后，里面是全然的接纳。',
      desc2: '你在感受和思维之间维持着一种微妙的内部平衡，不让任何一方完全接管。你既不会"凭感觉就冲"，也不会"分析完就冷漠"——你在用两者共同对准那把锁的缺口。你的挑战：你的节奏会让人等待，有些人等不了那么久就离开了，然后你会怀疑自己是否太慢。',
      blind: '慢不是问题，是筛选机制。',
      gift: '一旦你理解了一个人或一件事，你能找到真正核心的那个切入点，别人找了半天没找到的，你能直接开锁。'
    },
    inner_think: {
      emoji: '🌑', name: '暗星型',
      tagline: '「你是引力场，不是舞台灯」',
      desc: '你是这九种类型里最容易被误解的一种。表面上，你安静、克制、不主动表达情感、对世界保持距离。但这不是因为你没有感受，恰恰相反——你感受得很深，但你选择把感受转化成理解，而不是表达。你的内心是一个持续运转的精密系统，大部分时候在自处，偶尔输出，但每一次输出都很准。',
      desc2: '你有一种非常罕见的特质：<strong>你不需要被认可也能保持稳定</strong>。别人的评价、他人的视线、社会的标准——这些对你来说都是可以考量但不必服从的变量。你知道自己在哪里，那个"知道"是你的核心。你的独立让你强大，但也可能让你在需要帮助时无法开口。',
      blind: '暗星不是没有光，它只是把光都留给了足够靠近的人。',
      gift: '在一个大家都在向外拼命的时代，你是少数真正知道自己内部长什么样的人。'
    }
  };

  // ── 状态管理 ──────────────────────────────────────────────

  const state = {
    index: 0,
    answers: Array(QUESTIONS.length).fill(null) // null | option index
  };

  // ── 计分引擎 ──────────────────────────────────────────────

  function computeScores() {
    let outer = 0, inner = 0, feel = 0, think = 0;
    state.answers.forEach((optIdx, qIdx) => {
      if (optIdx === null) return;
      const opt = QUESTIONS[qIdx].options[optIdx];
      outer += opt.outer;
      inner += opt.inner;
      feel += opt.feel;
      think += opt.think;
    });
    return { outer, inner, feel, think };
  }

  function determineType() {
    const s = computeScores();
    let energyKey, processKey;

    if (s.outer >= s.inner + 3) energyKey = 'outer';
    else if (s.inner >= s.outer + 3) energyKey = 'inner';
    else energyKey = 'balanced';

    if (s.feel >= s.think + 3) processKey = 'feel';
    else if (s.think >= s.feel + 3) processKey = 'think';
    else processKey = 'balanced';

    return { key: `${energyKey}_${processKey}`, scores: s };
  }

  // ── 进度 ──────────────────────────────────────────────────

  function answeredCount() {
    return state.answers.filter(a => a !== null).length;
  }

  function progressPercent() {
    return Math.round((answeredCount() / QUESTIONS.length) * 100);
  }

  // ── 标签显示 ──────────────────────────────────────────────

  function optionTags(opt) {
    const tags = [];
    if (opt.outer) tags.push('外');
    if (opt.inner) tags.push('内');
    if (opt.feel) tags.push('感');
    if (opt.think) tags.push('思');
    if (tags.length === 0) return '';
    return `<span class="quiz-tag">+${tags.join('·')}</span>`;
  }

  // ── 视图渲染 ──────────────────────────────────────────────

  function renderQuestionView() {
    const q = QUESTIONS[state.index];
    const canPrev = state.index > 0;
    const hasAnswer = state.answers[state.index] !== null;
    const total = QUESTIONS.length;

    root.innerHTML = `
      <section class="quiz-shell">
        <header class="quiz-head">
          <h2 class="quiz-title">🧬 你是哪种「存在方式」？</h2>
          <p class="quiz-subtitle">一场关于你如何活着的测试 · ${total} 题 · 双维度积分</p>
        </header>

        <div class="quiz-progress-wrap">
          <div class="quiz-progress-meta">
            <span>第 ${state.index + 1} / ${total} 题</span>
            <span>完成度 ${progressPercent()}%</span>
          </div>
          <div class="quiz-progress-bar">
            <div class="quiz-progress-value" style="width:${progressPercent()}%"></div>
          </div>
        </div>

        <h3 class="quiz-question">${q.title}</h3>
        <div class="quiz-options">
          ${q.options.map((opt, i) => {
            const active = state.answers[state.index] === i;
            return `
              <button class="quiz-option ${active ? 'active' : ''}" data-opt="${i}">
                <span class="quiz-option-text">${opt.text}</span>
                ${optionTags(opt)}
              </button>
            `;
          }).join('')}
        </div>

        <footer class="quiz-footer">
          <button class="quiz-btn" data-action="prev" ${canPrev ? '' : 'disabled'}>← 上一题</button>
          <button class="quiz-btn quiz-btn-primary" data-action="next" ${hasAnswer ? '' : 'disabled'}>
            ${state.index === total - 1 ? '查看结果 →' : '下一题 →'}
          </button>
          <button class="quiz-btn quiz-btn-ghost" data-action="restart">重新开始</button>
        </footer>
      </section>
    `;

    bindEvents();
  }

  function renderResultView() {
    const { key, scores } = determineType();
    const result = RESULTS[key];

    // 3x3 矩阵
    const grid = [
      ['outer_feel',    'outer_balanced',    'outer_think'],
      ['balanced_feel', 'balanced_balanced', 'balanced_think'],
      ['inner_feel',    'inner_balanced',    'inner_think']
    ];
    const colLabels = ['偏感受', '感/思均衡', '偏思维'];
    const rowLabels = ['偏外', '外/内均衡', '偏内'];

    let gridHTML = '<div class="quiz-matrix">';
    gridHTML += '<div class="quiz-matrix-corner"></div>';
    colLabels.forEach(l => { gridHTML += `<div class="quiz-matrix-hdr">${l}</div>`; });
    grid.forEach((row, ri) => {
      gridHTML += `<div class="quiz-matrix-hdr quiz-matrix-rhdr">${rowLabels[ri]}</div>`;
      row.forEach(cell => {
        const r = RESULTS[cell];
        const isSelf = cell === key;
        gridHTML += `
          <div class="quiz-matrix-cell ${isSelf ? 'self' : ''}">
            <span class="quiz-matrix-emoji">${r.emoji}</span>
            <span class="quiz-matrix-name">${r.name}</span>
            ${isSelf ? '<span class="quiz-marker">◀ 你在这里</span>' : ''}
          </div>
        `;
      });
    });
    gridHTML += '</div>';

    // 得分详情
    const scoreHTML = `
      <div class="quiz-score-detail">
        <div class="quiz-score-item"><span>外向输出</span><strong>${scores.outer}</strong></div>
        <div class="quiz-score-item"><span>内向积蓄</span><strong>${scores.inner}</strong></div>
        <div class="quiz-score-item"><span>感受驱动</span><strong>${scores.feel}</strong></div>
        <div class="quiz-score-item"><span>思维驱动</span><strong>${scores.think}</strong></div>
      </div>
      <p class="quiz-axis-result">
        能量轴：${scores.outer >= scores.inner + 3 ? '偏外' : scores.inner >= scores.outer + 3 ? '偏内' : '均衡'}
        &nbsp;·&nbsp;
        处理轴：${scores.feel >= scores.think + 3 ? '偏感' : scores.think >= scores.feel + 3 ? '偏思' : '均衡'}
      </p>
    `;

    root.innerHTML = `
      <section class="quiz-shell">
        <header class="quiz-head">
          <h2 class="quiz-title">你的测试结果</h2>
          <p class="quiz-subtitle">两个轴之间没有优劣，每个组合里都有礼物，也有功课。</p>
        </header>

        <div class="quiz-result-card">
          <div class="quiz-result-head">
            <span class="quiz-result-emoji">${result.emoji}</span>
            <div>
              <h3 class="quiz-result-name">${result.name}</h3>
              <p class="quiz-result-tagline">${result.tagline}</p>
            </div>
          </div>
          <div class="quiz-result-body">
            <p>${result.desc}</p>
            <p>${result.desc2}</p>
            <div class="quiz-result-insight">
              <p><strong>🔍 你的盲区：</strong>${result.blind}</p>
              <p><strong>🎁 给你的话：</strong>${result.gift}</p>
            </div>
          </div>
        </div>

        ${scoreHTML}
        ${gridHTML}

        <footer class="quiz-footer">
          <button class="quiz-btn quiz-btn-primary" data-action="restart">再测一次</button>
        </footer>
      </section>
    `;

    bindEvents();
  }

  // ── 事件绑定 ──────────────────────────────────────────────

  function bindEvents() {
    root.querySelectorAll('[data-opt]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.answers[state.index] = parseInt(btn.getAttribute('data-opt'));
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
        if (state.answers[state.index] === null) return;
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

  // ── 启动 ──────────────────────────────────────────────────

  renderQuestionView();
})();
