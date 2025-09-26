import { render, screen } from '@testing-library/react';
import StatusDisplay from '@/app/components/StatusDisplay';
import { ProcessingStatus } from '@/lib/types';

describe('StatusDisplay', () => {
  it('displays parsing status correctly', () => {
    render(<StatusDisplay status="parsing" />);
    
    expect(screen.getByText(/正在解析链接/)).toBeInTheDocument();
    expect(screen.getByText(/约 2-5 秒/)).toBeInTheDocument();
  });

  it('displays downloading status with progress', () => {
    render(<StatusDisplay status="downloading" progress={50} />);
    
    expect(screen.getByText(/正在下载视频/)).toBeInTheDocument();
    expect(screen.getByText(/50%/)).toBeInTheDocument();
    expect(screen.getByText(/约 10-30 秒/)).toBeInTheDocument();
  });

  it('displays uploading status with progress', () => {
    render(<StatusDisplay status="uploading" progress={75} />);
    
    expect(screen.getByText(/正在上传到云存储/)).toBeInTheDocument();
    expect(screen.getByText(/75%/)).toBeInTheDocument();
    expect(screen.getByText(/约 5-15 秒/)).toBeInTheDocument();
  });

  it('displays analyzing status correctly', () => {
    render(<StatusDisplay status="analyzing" />);
    
    expect(screen.getByText(/正在分析视频内容/)).toBeInTheDocument();
    expect(screen.getByText(/约 15-30 秒/)).toBeInTheDocument();
  });

  it('displays completed status correctly', () => {
    render(<StatusDisplay status="completed" />);
    
    expect(screen.getByText(/分析完成/)).toBeInTheDocument();
    expect(screen.queryByText(/约/)).not.toBeInTheDocument();
  });

  it('displays error status correctly', () => {
    render(<StatusDisplay status="error" />);
    
    expect(screen.getByText(/处理失败/)).toBeInTheDocument();
  });

  it('displays idle status correctly', () => {
    render(<StatusDisplay status="idle" />);
    
    expect(screen.getByText(/等待中/)).toBeInTheDocument();
  });

  it('shows parsed URL when provided', () => {
    const testUrl = 'https://www.douyin.com/video/123456';
    render(<StatusDisplay status="downloading" parsedUrl={testUrl} />);
    
    expect(screen.getByText(/解析的视频链接/)).toBeInTheDocument();
    expect(screen.getByText(testUrl)).toBeInTheDocument();
  });

  it('displays progress bar for downloading status', () => {
    const { container } = render(<StatusDisplay status="downloading" progress={60} />);
    
    const progressBar = container.querySelector('[style*="width: 60%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('displays progress bar for uploading status', () => {
    const { container } = render(<StatusDisplay status="uploading" progress={40} />);
    
    const progressBar = container.querySelector('[style*="width: 40%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('does not show progress bar for parsing status', () => {
    render(<StatusDisplay status="parsing" progress={50} />);
    
    expect(screen.queryByText(/50%/)).not.toBeInTheDocument();
  });

  it('does not show progress bar for analyzing status', () => {
    render(<StatusDisplay status="analyzing" progress={50} />);
    
    expect(screen.queryByText(/50%/)).not.toBeInTheDocument();
  });

  it('shows processing steps indicator during processing', () => {
    render(<StatusDisplay status="downloading" />);
    
    expect(screen.getByText('解析')).toBeInTheDocument();
    expect(screen.getByText('下载')).toBeInTheDocument();
    expect(screen.getByText('上传')).toBeInTheDocument();
    expect(screen.getByText('分析')).toBeInTheDocument();
  });

  it('does not show processing steps for idle status', () => {
    render(<StatusDisplay status="idle" />);
    
    expect(screen.queryByText('解析')).not.toBeInTheDocument();
  });

  it('does not show processing steps for completed status', () => {
    render(<StatusDisplay status="completed" />);
    
    const steps = screen.queryAllByText(/^(解析|下载|上传|分析)$/);
    expect(steps).toHaveLength(0);
  });

  it('does not show processing steps for error status', () => {
    render(<StatusDisplay status="error" />);
    
    const steps = screen.queryAllByText(/^(解析|下载|上传|分析)$/);
    expect(steps).toHaveLength(0);
  });

  it('highlights current step in processing indicator', () => {
    const { rerender } = render(<StatusDisplay status="parsing" />);
    
    // Check parsing is active
    let activeStep = screen.getByText('1').closest('div');
    expect(activeStep).toHaveClass('bg-blue-600');
    
    // Move to downloading
    rerender(<StatusDisplay status="downloading" />);
    activeStep = screen.getByText('2').closest('div');
    expect(activeStep).toHaveClass('bg-blue-600');
    
    // Move to uploading
    rerender(<StatusDisplay status="uploading" />);
    activeStep = screen.getByText('3').closest('div');
    expect(activeStep).toHaveClass('bg-blue-600');
    
    // Move to analyzing
    rerender(<StatusDisplay status="analyzing" />);
    activeStep = screen.getByText('4').closest('div');
    expect(activeStep).toHaveClass('bg-blue-600');
  });

  it('shows completed steps with checkmark', () => {
    render(<StatusDisplay status="uploading" />);
    
    // Parsing and downloading should be completed
    const completedSteps = screen.getAllByText('✓');
    expect(completedSteps).toHaveLength(2);
  });
});