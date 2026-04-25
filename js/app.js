/* ============================================
   DistillLab - Knowledge Distillation Lab
   Vue 3 Application Logic
   ============================================ */

const { createApp } = Vue;

createApp({
  data() {
    return {
      currentPage: 'home',
      isScrolled: false,
      currentTheory: 'soft-label',
      visualMode: 'loss',
      
      // 导航
      navItems: [
        { id: 'home',     label: '首页' },
        { id: 'theory',   label: '原理' },
        { id: 'playground',label: '实验' },
        { id: 'compare',  label: '对比' },
      ],
      
      // 特性
      features: [
        {
          icon: '🌡️',
          title: '温度调优',
          desc: '交互式调整温度参数 T，观察软标签分布变化，理解高温如何平滑输出。'
        },
        {
          icon: '📊',
          title: '训练可视化',
          desc: '实时绘制 Loss 曲线与准确率变化，直观感受蒸馏过程的收敛效果。'
        },
        {
          icon: '⚖️',
          title: '损失权重平衡',
          desc: '调节 α 参数，探索软标签损失与硬标签损失的最佳平衡点。'
        },
        {
          icon: '🔬',
          title: '方法对比',
          desc: '对比 Logit-based、Feature-based、Attention Transfer 等蒸馏方法。'
        },
      ],
      
      // 理论标签页
      theoryTabs: [
        { id: 'soft-label', label: '软标签原理' },
        { id: 'loss',       label: '损失函数' },
        { id: 'methods',    label: '蒸馏方法' },
      ],
      
      // 温度参数演示
      temperature: 4,
      logits: [3.2, 1.5, -0.8, 0.3],
      
      // Alpha 参数
      alpha: 0.7,
      
      // 蒸馏方法
      distillMethods: [
        {
          icon: '🎲',
          name: 'Logit Distillation',
          desc: '最经典的蒸馏方法，Student 学习 Teacher 的输出概率分布。通过 KL 散度衡量分布差异。',
          complexity: '低',
          effect: '高'
        },
        {
          icon: '🧠',
          name: 'Feature Distillation',
          desc: 'Student 学习 Teacher 的中间层特征表示。适合需要保留 Teacher 推理过程信息的场景。',
          complexity: '中',
          effect: '高'
        },
        {
          icon: '👁️',
          name: 'Attention Transfer',
          desc: 'Student 复制 Teacher 的注意力图。特别适合 Transformer 类模型，保留注意力模式。',
          complexity: '中',
          effect: '高'
        },
        {
          icon: '📐',
          name: 'Relation Distillation',
          desc: '学习样本间的关系结构，保留 Teacher 的嵌入空间拓扑。适合检索、排序任务。',
          complexity: '高',
          effect: '高'
        },
        {
          icon: '🎭',
          name: 'Progressive Distillation',
          desc: '分阶段蒸馏，先学习简单知识再逐步深入。适合大模型到小模型的极端压缩。',
          complexity: '高',
          effect: '非常高'
        },
      ],
      
      // 实验场参数
      teacherModel: 'bert-large',
      studentModel: 'distilbert',
      playTemp: 4,
      playAlpha: 0.7,
      learningRate: 3,
      epochs: 10,
      isTraining: false,
      isTrained: false,
      trainedAccuracy: 0,
      teacherAccuracy: 92.4,
      trainLossData: [],
      trainAccData: [],
      trainChart: null,
      
      // 对比数据
      compareData: [
        {
          icon: '🎲',
          method: 'Logit Distillation',
          compress: '10-50x',
          compressClass: 'high',
          accuracy: '95-98%',
          cost: '低',
          scenario: '通用压缩，快速部署，资源受限环境'
        },
        {
          icon: '🧠',
          method: 'Feature Distillation',
          compress: '5-20x',
          compressClass: 'medium',
          accuracy: '96-99%',
          cost: '中',
          scenario: '需要保留推理路径，可解释性需求'
        },
        {
          icon: '👁️',
          method: 'Attention Transfer',
          compress: '5-15x',
          compressClass: 'medium',
          accuracy: '95-98%',
          cost: '中',
          scenario: 'Transformer 架构，视觉任务，NLU/NLG'
        },
        {
          icon: '📐',
          method: 'Relation Distillation',
          compress: '3-10x',
          compressClass: 'low',
          accuracy: '97-99%',
          cost: '高',
          scenario: '检索系统，相似度计算，嵌入学习'
        },
        {
          icon: '🎭',
          method: 'Progressive Distillation',
          compress: '50-100x',
          compressClass: 'high',
          accuracy: '90-95%',
          cost: '高',
          scenario: '极端压缩，边缘设备，极低延迟需求'
        },
      ],
    };
  },
  
  computed: {
    // 软标签概率计算
    softProbs() {
      const scaledLogits = this.logits.map(l => l / this.temperature);
      const maxLogit = Math.max(...scaledLogits);
      const expLogits = scaledLogits.map(l => Math.exp(l - maxLogit));
      const sumExp = expLogits.reduce((a, b) => a + b, 0);
      return expLogits.map(e => e / sumExp);
    },
    
    // 温度洞察
    tempInsight() {
      if (this.temperature <= 2) {
        return '低温度时，概率分布尖锐，Student 主要学习 Teacher 的预测结果，接近硬标签。适合 Teacher 本身准确率很高的场景。';
      } else if (this.temperature <= 8) {
        return '中等温度下，概率分布平滑，Student 能学习到 Teacher 对各类别的置信度差异。这是最常用的设置。';
      } else {
        return '高温度使概率分布趋于均匀，所有类别的概率差距被拉平。过度高温会丢失有效信息。';
      }
    },
    
    // Alpha 洞察
    alphaInsight() {
      const softPercent = (this.alpha * 100).toFixed(0);
      const hardPercent = ((1 - this.alpha) * 100).toFixed(0);
      
      if (this.alpha <= 0.3) {
        return `软标签仅占 ${softPercent}%，Student 主要依赖真实标签学习。蒸馏效果有限，但训练稳定，适合蒸馏效果不明显的任务。`;
      } else if (this.alpha <= 0.7) {
        return `软标签 ${softPercent}%，硬标签 ${hardPercent}%。平衡蒸馏与真实监督，是实践中最常用的设置。`;
      } else {
        return `软标签高达 ${softPercent}%，Student 深度模仿 Teacher。适合数据充足、Teacher 质量极高的场景。`;
      }
    },
    
    // 模型压缩比
    compressionRatio() {
      const ratios = {
        'bert-large-distilbert': 5,
        'bert-large-bert-small': 24,
        'bert-large-mobilebert': 14,
        'gpt2-medium-distilbert': 5,
        'gpt2-medium-bert-small': 24,
        'gpt2-medium-mobilebert': 14,
        'resnet152-distilbert': 4,
        'resnet152-bert-small': 4,
        'resnet152-mobilebert': 2,
      };
      const key = `${this.teacherModel}-${this.studentModel}`;
      return ratios[key] || 10;
    },
    
    // 参数减少比例
    paramReduction() {
      return Math.round((1 - 1 / this.compressionRatio) * 100);
    },
  },
  
  methods: {
    handleScroll() {
      this.isScrolled = window.scrollY > 40;
    },
    
    async runDistillation() {
      if (this.isTraining) return;
      
      this.isTraining = true;
      this.isTrained = false;
      this.trainLossData = [];
      this.trainAccData = [];
      
      // 模拟训练过程
      const epochs = this.epochs;
      const baseAcc = 75 + Math.random() * 10;
      const targetAcc = 88 + Math.random() * 5;
      
      for (let i = 0; i < epochs; i++) {
        await new Promise(resolve => setTimeout(resolve, 150));
        
        const progress = (i + 1) / epochs;
        const loss = 2.5 * Math.exp(-3 * progress) + 0.1 + Math.random() * 0.1;
        const acc = baseAcc + (targetAcc - baseAcc) * (1 - Math.exp(-4 * progress)) + Math.random() * 2;
        
        this.trainLossData.push(loss);
        this.trainAccData.push(acc);
        
        this.updateChart();
      }
      
      this.trainedAccuracy = this.trainAccData[this.trainAccData.length - 1];
      this.isTraining = false;
      this.isTrained = true;
    },
    
    updateChart() {
      const canvas = document.getElementById('trainChart');
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const data = this.visualMode === 'loss' ? this.trainLossData : this.trainAccData;
      
      // 简单绘制
      const width = canvas.width = canvas.offsetWidth;
      const height = canvas.height = canvas.offsetHeight;
      
      ctx.clearRect(0, 0, width, height);
      
      if (data.length < 2) return;
      
      const padding = 40;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;
      
      const maxVal = Math.max(...data) * 1.1;
      const minVal = Math.min(...data) * 0.9;
      const range = maxVal - minVal;
      
      // 绘制网格
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight * i / 4);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }
      
      // 绘制曲线
      ctx.beginPath();
      ctx.strokeStyle = this.visualMode === 'loss' ? '#f472b6' : '#34d399';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      data.forEach((val, i) => {
        const x = padding + (i / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((val - minVal) / range) * chartHeight;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      
      ctx.stroke();
      
      // 绘制点
      ctx.fillStyle = this.visualMode === 'loss' ? '#f472b6' : '#34d399';
      data.forEach((val, i) => {
        const x = padding + (i / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((val - minVal) / range) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    },
    
    initRadarChart() {
      const canvas = document.getElementById('radarChart');
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 40;
      
      const labels = ['压缩率', '精度保持', '训练速度', '泛化能力', '实现难度'];
      const datasets = [
        { label: 'Logit', color: '#6366f1', data: [8, 9, 10, 8, 10] },
        { label: 'Feature', color: '#06b6d4', data: [6, 9, 7, 9, 7] },
        { label: 'Attention', color: '#10b981', data: [6, 8, 7, 8, 7] },
      ];
      
      // 绘制背景
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.lineWidth = 1;
      
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * i / 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // 绘制轴线
      labels.forEach((label, i) => {
        const angle = (Math.PI * 2 * i / labels.length) - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // 标签
        const labelX = centerX + (radius + 25) * Math.cos(angle);
        const labelY = centerY + (radius + 25) * Math.sin(angle);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Space Grotesk';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, labelX, labelY);
      });
      
      // 绘制数据
      datasets.forEach(dataset => {
        ctx.beginPath();
        ctx.fillStyle = dataset.color + '30';
        ctx.strokeStyle = dataset.color;
        ctx.lineWidth = 2;
        
        dataset.data.forEach((val, i) => {
          const angle = (Math.PI * 2 * i / labels.length) - Math.PI / 2;
          const r = radius * val / 10;
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    },
  },
  
  mounted() {
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    
    // 延迟初始化雷达图
    setTimeout(() => {
      if (this.currentPage === 'compare') {
        this.initRadarChart();
      }
    }, 100);
  },
  
  watch: {
    currentPage(newPage) {
      if (newPage === 'compare') {
        this.$nextTick(() => {
          setTimeout(() => this.initRadarChart(), 100);
        });
      }
    },
    
    visualMode() {
      if (this.isTrained) {
        this.$nextTick(() => this.updateChart());
      }
    },
  },
  
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  },
}).mount('#app');
