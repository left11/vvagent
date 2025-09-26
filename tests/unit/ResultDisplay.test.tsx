import { render, screen, fireEvent } from '@testing-library/react';
import ResultDisplay from '@/app/components/ResultDisplay';
import { AnalysisResult } from '@/lib/types';

describe('ResultDisplay', () => {
  const mockOnExport = jest.fn();
  
  const mockAnalysisResult: AnalysisResult = {
    videoInfo: {
      id: 'test-123',
      originalUrl: 'https://www.douyin.com/video/123',
      title: '测试视频标题',
      author: '测试作者',
      duration: 125,
      downloadedAt: new Date(),
      gcsUrl: 'gs://bucket/video.mp4',
      fileSize: 5242880
    },
    insights: {
      hooks: [
        '强烈的视觉冲击开场',
        '设置悬念引发好奇',
        '使用流行音乐节奏'
      ],
      visualElements: [
        '高对比度色彩搭配',
        '快速剪辑节奏',
        '文字动画效果'
      ],
      audioAnalysis: '背景音乐节奏感强，与画面切换完美配合',
      pacing: '快速剪辑，每2-3秒切换场景',
      engagementTactics: [
        '设置评论互动点',
        '引导用户分享',
        '制造讨论话题'
      ],
      viralFactors: [
        '情感共鸣',
        '视觉冲击',
        '音乐洗脑'
      ]
    },
    recommendations: [
      '优化前3秒的视觉冲击力',
      '增加互动引导文案',
      '使用更多特效转场',
      '控制视频时长在15-20秒'
    ]
  };

  beforeEach(() => {
    mockOnExport.mockClear();
  });

  it('returns null when no analysis result', () => {
    const { container } = render(<ResultDisplay onExport={mockOnExport} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays analysis result title', () => {
    render(<ResultDisplay analysisResult={mockAnalysisResult} onExport={mockOnExport} />);
    expect(screen.getByText('分析结果')).toBeInTheDocument();
  });

  it('displays video information', () => {
    render(<ResultDisplay analysisResult={mockAnalysisResult} onExport={mockOnExport} />);
    
    expect(screen.getByText(/测试视频标题/)).toBeInTheDocument();
    expect(screen.getByText(/测试作者/)).toBeInTheDocument();
    expect(screen.getByText(/2:05/)).toBeInTheDocument(); // 125 seconds = 2:05
    expect(screen.getByText(/5.00 MB/)).toBeInTheDocument(); // 5242880 bytes = 5 MB
  });

  it('displays tabs correctly', () => {
    render(<ResultDisplay analysisResult={mockAnalysisResult} onExport={mockOnExport} />);
    
    expect(screen.getByText('概览')).toBeInTheDocument();
    expect(screen.getByText('详细分析')).toBeInTheDocument();
    expect(screen.getByText('优化建议')).toBeInTheDocument();
  });

  it('switches between tabs', () => {
    render(<ResultDisplay analysisResult={mockAnalysisResult} onExport={mockOnExport} />);
    
    // Default should be overview
    expect(screen.getByText('爆款要素')).toBeInTheDocument();
    
    // Click on details tab
    fireEvent.click(screen.getByText('详细分析'));
    expect(screen.getByText('开场钩子分析')).toBeInTheDocument();
    
    // Click on recommendations tab
    fireEvent.click(screen.getByText('优化建议'));
    expect(screen.getByText('基于分析的优化建议')).toBeInTheDocument();
  });

  it('displays viral factors in overview tab', () => {
    render(<ResultDisplay analysisResult={mockAnalysisResult} onExport={mockOnExport} />);
    
    expect(screen.getByText('情感共鸣')).toBeInTheDocument();
    expect(screen.getByText('视觉冲击')).toBeInTheDocument();
    expect(screen.getByText('音乐洗脑')).toBeInTheDocument();
  });

  it('displays visual elements in overview tab', () => {
    render(<ResultDisplay analysisResult={mockAnalysisResult} onExport={mockOnExport} />);
    
    expect(screen.getByText('高对比度色彩搭配')).toBeInTheDocument();
    expect(screen.getByText('快速剪辑节奏')).toBeInTheDocument();
    expect(screen.getByText('文字动画效果')).toBeInTheDocument();
  });

  it('displays hooks in overview tab', () => {
    render(<ResultDisplay analysisResult={mockAnalysisResult} onExport={mockOnExport} />);
    
    expect(screen.getByText('强烈的视觉冲击开场')).toBeInTheDocument();
    expect(screen.getByText('设置悬念引发好奇')).toBeInTheDocument();
  });

  it('displays engagement tactics in overview tab', () => {
    render(<ResultDisplay analysisResult={mockAnalysisResult} onExport={mockOnExport} />);
    
    expect(screen.getByText('设置评论互动点')).toBeInTheDocument();
    expect(screen.getByText('引导用户分享')).toBeInTheDocument();
  });

  it('displays detailed analysis in details tab', () => {
    render(<ResultDisplay analysisResult={mockAnalysisResult} onExport={mockOnExport} />);
    
    fireEvent.click(screen.getByText('详细分析'));
    
    expect(screen.getByText('音频分析')).toBeInTheDocument();
    expect(screen.getByText('节奏分析')).toBeInTheDocument();
    expect(screen.getByText('视觉元素详解')).toBeInTheDocument();
    expect(screen.getByText('互动策略详解')).toBeInTheDocument();
    expect(screen.getByText(mockAnalysisResult.insights.audioAnalysis)).toBeInTheDocument();
    expect(screen.getByText(mockAnalysisResult.insights.pacing)).toBeInTheDocument();
  });

  it('displays recommendations in recommendations tab', () => {
    render(<ResultDisplay analysisResult={mockAnalysisResult} onExport={mockOnExport} />);
    
    fireEvent.click(screen.getByText('优化建议'));
    
    mockAnalysisResult.recommendations.forEach(recommendation => {
      expect(screen.getByText(recommendation)).toBeInTheDocument();
    });
  });

  it('shows export dropdown when clicking export button', () => {
    render(<ResultDisplay analysisResult={mockAnalysisResult} onExport={mockOnExport} />);
    
    const exportButton = screen.getByText('导出').closest('button');
    fireEvent.click(exportButton!);
    
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('Markdown')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('calls onExport with correct format when clicking export option', () => {
    render(<ResultDisplay analysisResult={mockAnalysisResult} onExport={mockOnExport} />);
    
    const exportButton = screen.getByText('导出').closest('button');
    fireEvent.click(exportButton!);
    
    fireEvent.click(screen.getByText('JSON'));
    expect(mockOnExport).toHaveBeenCalledWith('json');
    
    fireEvent.click(exportButton!);
    fireEvent.click(screen.getByText('Markdown'));
    expect(mockOnExport).toHaveBeenCalledWith('markdown');
    
    fireEvent.click(exportButton!);
    fireEvent.click(screen.getByText('PDF'));
    expect(mockOnExport).toHaveBeenCalledWith('pdf');
  });

  it('closes export dropdown after selecting format', () => {
    render(<ResultDisplay analysisResult={mockAnalysisResult} onExport={mockOnExport} />);
    
    const exportButton = screen.getByText('导出').closest('button');
    fireEvent.click(exportButton!);
    
    expect(screen.getByText('JSON')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('JSON'));
    
    // Dropdown should be closed
    expect(screen.queryByRole('button', { name: 'JSON' })).not.toBeInTheDocument();
  });

  it('displays quick tips in recommendations tab', () => {
    render(<ResultDisplay analysisResult={mockAnalysisResult} onExport={mockOnExport} />);
    
    fireEvent.click(screen.getByText('优化建议'));
    
    expect(screen.getByText(/前3秒必须有强视觉冲击或悬念/)).toBeInTheDocument();
    expect(screen.getByText(/使用当前流行的音乐和节奏/)).toBeInTheDocument();
    expect(screen.getByText(/设置互动点，引导用户评论/)).toBeInTheDocument();
    expect(screen.getByText(/控制视频长度在15-30秒最佳/)).toBeInTheDocument();
  });
});