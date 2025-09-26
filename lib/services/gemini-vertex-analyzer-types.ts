/**
 * Type definitions for Gemini Video Analysis
 */

// Analysis result types
export interface GeminiAnalysisResult {
  video_uri: string;
  language_detected: string;
  metrics_estimated: {
    retention_3s: number;
    retention_8s: number;
    retention_15s: number;
    retention_30s: number;
    rewatch_rate: number;
    like_rate: number;
    comment_rate: number;
    share_rate: number;
    save_rate: number;
    follow_conv: number;
    ctr: number;
    avg_shot_len_sec: number;
    cuts_per_min: number;
    bpm_estimate: number;
  };
  timeline: Array<{
    start: string;
    end: string;
    shot_type: string;
    function: string;
    editing: string[];
    onscreen_text: string;
    objects: string[];
    issues: string[];
  }>;
  copywriting: {
    hook_type: string[];
    subtitle_readability: {
      chars_per_sec: number;
      lines: number;
      contrast_ok: boolean;
      typo_or_filler: string[];
    };
    title_candidates: string[];
  };
  visual: {
    cover_eval: {
      strengths: string[];
      risks: string[];
      suggestions: string[];
    };
    color_tendency: string;
    focus_points: string[];
  };
  emotion_value: {
    curve: Array<{ t: string; emo: string }>;
    triggers: string[];
  };
  commerce: {
    is_commerce: boolean;
    loop_completeness: number;
    proof_types: string[];
    cta_moments: string[];
  };
  risk_compliance: {
    flags: string[];
    alternatives: string[];
  };
  replicable_formula: {
    template: string;
    parameters: string[];
  };
  remake: {
    full_script: {
      shots: Array<{
        id: number;
        duration_sec: number;
        visual_direction: string;
        voiceover: string;
        onscreen_text: string;
        assets: string[];
        sfx_bgm: string;
      }>;
      materials_checklist: string[];
    };
    variants: Array<{
      hook: string;
      script_brief: string;
      why_it_may_work: string;
    }>;
  };
  ab_tests: Array<{
    hypothesis: string;
    test_elements: string[];
    success_metric: string;
    expected_lift?: string;
  }>;
  distribution: {
    post_time_suggestion: string[];
    tags: string[];
    pinned_comment: string;
  };
  series_plan: string[];
  scorecard: {
    hook: number;
    pacing_editing: number;
    info_density: number;
    visual_readability: number;
    emotion_peak: number;
    proof_trust: number;
    share_comment_remix: number;
    niche_fit_search: number;
    compliance_safety: number;
    replicability: number;
    weighted_total: number;
    priority_fixes: string[];
  };
  next_actions: string[];
}

export interface AnalysisOptions {
  accountNiche?: string;
  goal?: string;
  targetPersona?: string;
  productInfo?: string;
  brandTone?: string;
  complianceNotes?: string;
  transcriptText?: string;
  commentsSample?: string;
  postMeta?: string;
  videoDuration?: number; // Duration in seconds, for checking limits
}