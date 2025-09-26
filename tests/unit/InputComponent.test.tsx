import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InputComponent from '@/app/components/InputComponent';

describe('InputComponent', () => {
  const mockOnAnalyze = jest.fn();

  beforeEach(() => {
    mockOnAnalyze.mockClear();
  });

  it('renders input field and analyze button', () => {
    render(<InputComponent onAnalyze={mockOnAnalyze} disabled={false} />);
    
    expect(screen.getByLabelText(/抖音视频链接或口令/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /分析/i })).toBeInTheDocument();
  });

  it('displays placeholder text', () => {
    render(<InputComponent onAnalyze={mockOnAnalyze} disabled={false} />);
    
    const textarea = screen.getByPlaceholderText(/输入抖音链接/i);
    expect(textarea).toBeInTheDocument();
  });

  it('validates empty input', async () => {
    render(<InputComponent onAnalyze={mockOnAnalyze} disabled={false} />);
    
    const button = screen.getByRole('button', { name: /分析/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/请输入抖音链接或口令/i)).toBeInTheDocument();
    });
    
    expect(mockOnAnalyze).not.toHaveBeenCalled();
  });

  it('validates invalid TikTok URL', async () => {
    render(<InputComponent onAnalyze={mockOnAnalyze} disabled={false} />);
    
    const textarea = screen.getByLabelText(/抖音视频链接或口令/i);
    await userEvent.type(textarea, 'https://www.youtube.com/watch?v=123');
    
    const button = screen.getByRole('button', { name: /分析/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/请输入有效的抖音链接或分享口令/i)).toBeInTheDocument();
    });
    
    expect(mockOnAnalyze).not.toHaveBeenCalled();
  });

  it('accepts valid Douyin URL', async () => {
    render(<InputComponent onAnalyze={mockOnAnalyze} disabled={false} />);
    
    const textarea = screen.getByLabelText(/抖音视频链接或口令/i);
    await userEvent.type(textarea, 'https://www.douyin.com/video/123456');
    
    const button = screen.getByRole('button', { name: /分析/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockOnAnalyze).toHaveBeenCalledWith('https://www.douyin.com/video/123456');
    });
  });

  it('accepts valid TikTok URL', async () => {
    render(<InputComponent onAnalyze={mockOnAnalyze} disabled={false} />);
    
    const textarea = screen.getByLabelText(/抖音视频链接或口令/i);
    await userEvent.type(textarea, 'https://www.tiktok.com/@user/video/123456');
    
    const button = screen.getByRole('button', { name: /分析/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockOnAnalyze).toHaveBeenCalledWith('https://www.tiktok.com/@user/video/123456');
    });
  });

  it('accepts share text with Douyin keyword', async () => {
    render(<InputComponent onAnalyze={mockOnAnalyze} disabled={false} />);
    
    const shareText = '复制此链接，打开抖音，查看视频 https://v.douyin.com/abc123';
    const textarea = screen.getByLabelText(/抖音视频链接或口令/i);
    await userEvent.type(textarea, shareText);
    
    const button = screen.getByRole('button', { name: /分析/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockOnAnalyze).toHaveBeenCalledWith(shareText);
    });
  });

  it('disables button when disabled prop is true', () => {
    render(<InputComponent onAnalyze={mockOnAnalyze} disabled={true} />);
    
    const button = screen.getByRole('button', { name: /分析/i });
    expect(button).toBeDisabled();
  });

  it('shows clear button when input has value', async () => {
    render(<InputComponent onAnalyze={mockOnAnalyze} disabled={false} />);
    
    const textarea = screen.getByLabelText(/抖音视频链接或口令/i);
    await userEvent.type(textarea, 'test input');
    
    const clearButton = screen.getByRole('button', { name: /清除/i });
    expect(clearButton).toBeInTheDocument();
    
    fireEvent.click(clearButton);
    
    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });

  it('shows loading state when analyzing', async () => {
    const slowAnalyze = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<InputComponent onAnalyze={slowAnalyze} disabled={false} />);
    
    const textarea = screen.getByLabelText(/抖音视频链接或口令/i);
    await userEvent.type(textarea, 'https://www.douyin.com/video/123');
    
    const button = screen.getByRole('button', { name: /分析/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/分析中/i)).toBeInTheDocument();
    });
  });

  it('handles paste button click', async () => {
    const mockClipboardText = 'https://www.douyin.com/video/123';
    Object.assign(navigator, {
      clipboard: {
        readText: jest.fn().mockResolvedValue(mockClipboardText)
      }
    });
    
    render(<InputComponent onAnalyze={mockOnAnalyze} disabled={false} />);
    
    const pasteButton = screen.getByTitle(/粘贴/i);
    fireEvent.click(pasteButton);
    
    await waitFor(() => {
      const textarea = screen.getByLabelText(/抖音视频链接或口令/i);
      expect(textarea).toHaveValue(mockClipboardText);
    });
  });

  it('clears validation error when input changes', async () => {
    render(<InputComponent onAnalyze={mockOnAnalyze} disabled={false} />);
    
    const button = screen.getByRole('button', { name: /分析/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/请输入抖音链接或口令/i)).toBeInTheDocument();
    });
    
    const textarea = screen.getByLabelText(/抖音视频链接或口令/i);
    await userEvent.type(textarea, 'https://www.douyin.com/video/123');
    
    await waitFor(() => {
      expect(screen.queryByText(/请输入抖音链接或口令/i)).not.toBeInTheDocument();
    });
  });
});