'use client';

import React, { useState } from 'react';
import { GeminiAnalysisResult } from '@/lib/services/gemini-vertex-analyzer-types';
import { 
  ChevronDown, ChevronRight, Activity, Target, Zap, AlertTriangle, 
  Play, FileText, Palette, Heart, ShoppingBag, Shield, Copy, TestTube,
  Calendar, Tag, BarChart3, CheckCircle, Clock, TrendingUp, Code
} from 'lucide-react';

interface GeminiResultDisplayProps {
  analysis: GeminiAnalysisResult;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
      {isOpen && (
        <div className="p-4 bg-white dark:bg-gray-900">
          {children}
        </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: number | string; unit?: string; color?: string }> = ({ 
  label, value, unit = '%', color = 'blue' 
}) => {
  const percentage = typeof value === 'number' ? value * 100 : parseFloat(value);
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-gray-900 dark:text-white">
          {typeof value === 'number' ? percentage.toFixed(1) : value}
        </span>
        <span className="text-sm text-gray-500">{unit}</span>
      </div>
      {typeof value === 'number' && (
        <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} transition-all`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

export const GeminiResultDisplay: React.FC<GeminiResultDisplayProps> = ({ analysis }) => {
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');
  
  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-4">
      {/* View Mode Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setViewMode('formatted')}
          className={`px-4 py-2 font-medium transition-colors ${
            viewMode === 'formatted'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <BarChart3 className="inline-block w-4 h-4 mr-2" />
          格式化视图
        </button>
        <button
          onClick={() => setViewMode('raw')}
          className={`px-4 py-2 font-medium transition-colors ${
            viewMode === 'raw'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <Code className="inline-block w-4 h-4 mr-2" />
          JSON调试视图
        </button>
      </div>

      {viewMode === 'raw' ? (
        /* Raw JSON Debug View */
        <div className="bg-gray-900 rounded-lg p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold">Gemini Analysis Raw Output (用于调试Prompt)</h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
                // Could add toast notification here
              }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm flex items-center gap-1"
            >
              <Copy className="w-4 h-4" />
              复制JSON
            </button>
          </div>
          <div className="overflow-auto max-h-[800px] bg-black rounded p-4">
            <pre className="text-xs font-mono text-green-400">
              <code>{JSON.stringify(analysis, null, 2)}</code>
            </pre>
          </div>
        </div>
      ) : (
        <>
      {/* 总分卡 */}
      {analysis.scorecard ? (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">综合评分</h2>
            <div className="text-4xl font-bold">{analysis.scorecard.weighted_total || 'N/A'}</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
            <div>Hook强度: {analysis.scorecard.hook || 'N/A'}</div>
            <div>节奏剪辑: {analysis.scorecard.pacing_editing || 'N/A'}</div>
            <div>信息密度: {analysis.scorecard.info_density || 'N/A'}</div>
            <div>视觉可读: {analysis.scorecard.visual_readability || 'N/A'}</div>
            <div>情绪峰值: {analysis.scorecard.emotion_peak || 'N/A'}</div>
          </div>
        </div>
      ) : null}

      {/* 关键指标 */}
      <Section title="关键指标预估" icon={<Activity className="w-5 h-5" />} defaultOpen={true}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="3秒留存" value={analysis.metrics_estimated.retention_3s} color="green" />
          <MetricCard label="完播率" value={analysis.metrics_estimated.retention_30s} color="blue" />
          <MetricCard label="点赞率" value={analysis.metrics_estimated.like_rate} color="purple" />
          <MetricCard label="转粉率" value={analysis.metrics_estimated.follow_conv} color="yellow" />
          <MetricCard label="复播率" value={analysis.metrics_estimated.rewatch_rate} />
          <MetricCard label="评论率" value={analysis.metrics_estimated.comment_rate} />
          <MetricCard label="分享率" value={analysis.metrics_estimated.share_rate} />
          <MetricCard label="收藏率" value={analysis.metrics_estimated.save_rate} />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <MetricCard label="平均镜头时长" value={`${analysis.metrics_estimated.avg_shot_len_sec}`} unit="秒" />
          <MetricCard label="剪辑频率" value={`${analysis.metrics_estimated.cuts_per_min}`} unit="次/分" />
          <MetricCard label="BPM估计" value={`${analysis.metrics_estimated.bpm_estimate}`} unit="" />
        </div>
      </Section>

      {/* 时间轴分析 */}
      <Section title="时间轴拆解" icon={<Clock className="w-5 h-5" />}>
        <div className="space-y-2">
          {analysis.timeline.map((segment, idx) => (
            <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {segment.start} - {segment.end}
                  </span>
                  <span className="text-sm font-medium">{segment.shot_type}</span>
                  <span className="text-xs text-purple-600 dark:text-purple-400">{segment.function}</span>
                </div>
              </div>
              {segment.onscreen_text && (
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  字幕: {segment.onscreen_text}
                </div>
              )}
              {segment.editing.length > 0 && (
                <div className="mt-1 flex gap-1 flex-wrap">
                  {segment.editing.map((edit, i) => (
                    <span key={i} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                      {edit}
                    </span>
                  ))}
                </div>
              )}
              {segment.issues.length > 0 && (
                <div className="mt-1 flex gap-1 flex-wrap">
                  {segment.issues.map((issue, i) => (
                    <span key={i} className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">
                      {issue}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* 文案分析 */}
      <Section title="文案与Hook分析" icon={<FileText className="w-5 h-5" />}>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium mb-2">Hook类型</h4>
            <div className="flex gap-2 flex-wrap">
              {analysis.copywriting.hook_type.map((hook, idx) => (
                <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                  {hook}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">字幕可读性</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                <span className="text-gray-600 dark:text-gray-400">速度:</span> {analysis.copywriting.subtitle_readability.chars_per_sec}字/秒
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                <span className="text-gray-600 dark:text-gray-400">行数:</span> {analysis.copywriting.subtitle_readability.lines}行
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                <span className="text-gray-600 dark:text-gray-400">对比度:</span> 
                {analysis.copywriting.subtitle_readability.contrast_ok ? '✅ 良好' : '⚠️ 需改进'}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">标题候选</h4>
            <ul className="space-y-1">
              {analysis.copywriting.title_candidates.map((title, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">{idx + 1}.</span>
                  <span>{title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* 视觉设计 */}
      <Section title="视觉设计分析" icon={<Palette className="w-5 h-5" />}>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium mb-2">封面评估</h4>
            <div className="grid md:grid-cols-3 gap-2">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                <h5 className="text-green-700 dark:text-green-400 font-medium text-sm mb-1">优势</h5>
                <ul className="text-sm space-y-1">
                  {analysis.visual.cover_eval.strengths.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
                <h5 className="text-yellow-700 dark:text-yellow-400 font-medium text-sm mb-1">风险</h5>
                <ul className="text-sm space-y-1">
                  {analysis.visual.cover_eval.risks.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <h5 className="text-blue-700 dark:text-blue-400 font-medium text-sm mb-1">建议</h5>
                <ul className="text-sm space-y-1">
                  {analysis.visual.cover_eval.suggestions.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">色彩倾向:</span>
              <span className="ml-2 font-medium">{analysis.visual.color_tendency}</span>
            </div>
            <div className="flex-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">焦点元素:</span>
              <span className="ml-2">{analysis.visual.focus_points.join(', ')}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* 情绪价值 */}
      <Section title="情绪价值曲线" icon={<Heart className="w-5 h-5" />}>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium mb-2">情绪变化</h4>
            <div className="flex items-center gap-2 overflow-x-auto">
              {analysis.emotion_value.curve.map((point, idx) => (
                <div key={idx} className="flex items-center">
                  <div className="text-center min-w-[80px]">
                    <div className="text-xs text-gray-500">{point.t}</div>
                    <div className="mt-1 px-2 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded text-sm">
                      {point.emo}
                    </div>
                  </div>
                  {idx < analysis.emotion_value.curve.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">触发因素</h4>
            <div className="flex gap-2 flex-wrap">
              {analysis.emotion_value.triggers.map((trigger, idx) => (
                <span key={idx} className="px-3 py-1 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 rounded-full text-sm">
                  {trigger}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 复刻方案 */}
      <Section title="复刻方案" icon={<Copy className="w-5 h-5" />}>
        <div className="space-y-4">
          {analysis.replicable_formula && (
            <div>
              <h4 className="font-medium mb-2">爆款公式模板</h4>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm">
                {analysis.replicable_formula.template}
              </div>
              {analysis.replicable_formula.parameters && analysis.replicable_formula.parameters.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {analysis.replicable_formula.parameters.map((param, idx) => (
                    <span key={idx} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                      {param}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {analysis.remake?.full_script?.shots && analysis.remake.full_script.shots.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">完整复刻脚本</h4>
              <div className="space-y-2">
                {analysis.remake.full_script.shots.map((shot) => (
                  <div key={shot.id} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">镜头 #{shot.id}</span>
                      <span className="text-sm text-gray-500">{shot.duration_sec}秒</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div><span className="text-gray-600 dark:text-gray-400">视觉:</span> {shot.visual_direction}</div>
                      <div><span className="text-gray-600 dark:text-gray-400">口播:</span> {shot.voiceover}</div>
                      <div><span className="text-gray-600 dark:text-gray-400">字幕:</span> {shot.onscreen_text}</div>
                      <div><span className="text-gray-600 dark:text-gray-400">音效:</span> {shot.sfx_bgm}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.remake?.variants && analysis.remake.variants.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">变体方案</h4>
              <div className="grid md:grid-cols-3 gap-3">
                {analysis.remake.variants.map((variant, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <div className="font-medium text-sm mb-1">{variant.hook}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">{variant.script_brief}</div>
                    <div className="text-xs text-green-600 dark:text-green-400">{variant.why_it_may_work}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* A/B测试建议 */}
      <Section title="A/B测试计划" icon={<TestTube className="w-5 h-5" />}>
        <div className="space-y-2">
          {analysis.ab_tests.map((test, idx) => (
            <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded p-3">
              <div className="font-medium text-sm mb-1">{test.hypothesis}</div>
              <div className="flex gap-2 mb-1">
                {test.test_elements.map((elem, i) => (
                  <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {elem}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>指标: {test.success_metric}</span>
                {test.expected_lift && <span className="text-green-600 dark:text-green-400">预期提升: {test.expected_lift}</span>}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 发布策略 */}
      <Section title="发布与分发策略" icon={<Calendar className="w-5 h-5" />}>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium mb-2">最佳发布时间</h4>
            <div className="flex gap-2">
              {analysis.distribution.post_time_suggestion.map((time, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                  {time}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">推荐标签</h4>
            <div className="flex gap-2 flex-wrap">
              {analysis.distribution.tags.map((tag, idx) => (
                <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">置顶评论</h4>
            <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">{analysis.distribution.pinned_comment}</p>
          </div>
        </div>
      </Section>

      {/* 系列规划 */}
      <Section title="系列内容规划" icon={<TrendingUp className="w-5 h-5" />}>
        <div className="grid md:grid-cols-2 gap-2">
          {analysis.series_plan.map((plan, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-gray-500">{idx + 1}.</span>
              <span className="text-sm">{plan}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 风险合规 */}
      {(analysis.risk_compliance.flags.length > 0 || analysis.risk_compliance.alternatives.length > 0) && (
        <Section title="风险与合规" icon={<Shield className="w-5 h-5" />}>
          <div className="space-y-3">
            {analysis.risk_compliance.flags.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">风险提示</h4>
                <div className="flex gap-2 flex-wrap">
                  {analysis.risk_compliance.flags.map((flag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {analysis.risk_compliance.alternatives.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">替代方案</h4>
                <ul className="space-y-1">
                  {analysis.risk_compliance.alternatives.map((alt, idx) => (
                    <li key={idx} className="text-sm">• {alt}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* 下一步行动 */}
      <Section title="优先改进事项" icon={<CheckCircle className="w-5 h-5" />}>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">紧急优化</h4>
            <ul className="space-y-2">
              {analysis.scorecard.priority_fixes.map((fix, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                  <span className="text-sm">{fix}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2 text-green-600 dark:text-green-400">本周待办</h4>
            <ul className="space-y-2">
              {analysis.next_actions.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span className="text-sm">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
        </>
      )}
    </div>
  );
};