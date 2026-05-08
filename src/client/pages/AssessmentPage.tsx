import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface Question {
  id: number;
  text: string;
  dimension: string;
}

interface Assessment {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  questions: Question[];
  scoring: Record<string, any>;
}

interface AssessmentResult {
  label: string;
  description: string;
  score: number;
  maxScore: number;
  percentage: number;
  dimensionScores?: Record<string, number>;
  tier: 'low' | 'moderate' | 'high';
}

const SCALE_LABELS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];

const DIMENSION_LABELS: Record<string, string> = {
  sensory: 'Sensory Sensitivity',
  depth: 'Depth of Processing',
  empathy: 'Emotional Empathy',
  adaptability: 'Adaptability',
  arousal: 'Overstimulation',
  emotional: 'Emotional Intensity',
  social: 'Social Awareness',
  physical: 'Physical Sensitivity',
};

const RESULT_ARTICLES: Record<string, { to: string; label: string }[]> = {
  high: [
    { to: '/articles/what-is-a-highly-sensitive-child', label: 'What Is a Highly Sensitive Child? The Science Behind the Sensitivity' },
    { to: '/articles/why-standard-parenting-advice-fails-sensitive-children', label: 'Why Standard Parenting Advice Fails Sensitive Children' },
    { to: '/articles/creating-a-calm-home-environment-for-your-sensitive-child', label: 'Creating a Calm Home Environment for Your Sensitive Child' },
    { to: '/articles/emotional-intensity-in-hsc-children-why-feelings-are-so-big', label: 'Emotional Intensity in HSC Children: Why Feelings Are So Big' },
  ],
  moderate: [
    { to: '/articles/what-is-a-highly-sensitive-child', label: 'What Is a Highly Sensitive Child? The Science Behind the Sensitivity' },
    { to: '/articles/sensory-processing-in-highly-sensitive-children', label: 'Sensory Processing in Highly Sensitive Children: A Practical Guide' },
    { to: '/articles/the-meltdown-vs-tantrum-distinction-that-changes-everything', label: 'The Meltdown vs. Tantrum Distinction That Changes Everything' },
  ],
  low: [
    { to: '/articles/the-orchid-and-the-dandelion', label: 'The Orchid and the Dandelion: Thomas Boyce\'s Biology of Sensitivity' },
    { to: '/articles/what-is-a-highly-sensitive-child', label: 'What Is a Highly Sensitive Child? The Science Behind the Sensitivity' },
  ],
};

const RESULT_ICONS: Record<string, string> = {
  high: '🌸',
  moderate: '🌿',
  low: '🌱',
};

const RESULT_AFFIRMATIONS: Record<string, string> = {
  high: 'Your child is a true orchid — deeply sensitive, richly perceptive, and capable of extraordinary depth. With the right environment, highly sensitive children thrive in ways that surprise and delight everyone around them.',
  moderate: 'Your child shows meaningful sensitivity in specific areas. Understanding these patterns helps you tailor your approach — and even moderate sensitivity, well-supported, becomes a genuine strength.',
  low: 'Your child appears to be resilient and adaptable across a wide range of environments. That\'s a wonderful foundation. The strategies on OrchidKids can still help you understand and connect more deeply with any child.',
};

// Static fallback data
const STATIC_ASSESSMENTS: Record<string, Assessment> = {
  'is-my-child-highly-sensitive': {
    id: 1,
    slug: 'is-my-child-highly-sensitive',
    title: 'Is My Child Highly Sensitive? The HSC Screening Assessment',
    description: "Based on Elaine Aron's research, this 20-question assessment helps you understand whether your child may be highly sensitive.",
    category: 'understanding-hsc',
    questions: [
      { id: 1, text: 'My child is bothered by scratchy clothing, seams in socks, or tags in shirts.', dimension: 'sensory' },
      { id: 2, text: 'My child is very sensitive to pain.', dimension: 'sensory' },
      { id: 3, text: "My child doesn't do well with big changes.", dimension: 'adaptability' },
      { id: 4, text: 'My child notices and is bothered by subtle odors.', dimension: 'sensory' },
      { id: 5, text: 'My child has a fussy appetite and is particular about the texture or taste of food.', dimension: 'sensory' },
      { id: 6, text: 'My child is hard to get to sleep after an exciting day.', dimension: 'arousal' },
      { id: 7, text: "My child doesn't do well with a lot of commotion.", dimension: 'arousal' },
      { id: 8, text: 'My child is deeply moved by music, art, or nature.', dimension: 'depth' },
      { id: 9, text: 'My child is very intuitive and seems to know things without being told.', dimension: 'depth' },
      { id: 10, text: 'My child has a rich and complex inner life.', dimension: 'depth' },
      { id: 11, text: "My child is very empathetic and feels others' emotions deeply.", dimension: 'empathy' },
      { id: 12, text: 'My child is deeply affected by violence or cruelty in movies or news.', dimension: 'empathy' },
      { id: 13, text: 'My child asks deep questions about life, death, and the meaning of things.', dimension: 'depth' },
      { id: 14, text: 'My child is very conscientious and has a strong sense of right and wrong.', dimension: 'depth' },
      { id: 15, text: 'My child is overwhelmed by crowded, noisy places like malls or parties.', dimension: 'arousal' },
      { id: 16, text: 'My child is very bothered by loud noises.', dimension: 'sensory' },
      { id: 17, text: 'My child notices subtle changes in their environment that others miss.', dimension: 'depth' },
      { id: 18, text: "My child is very affected by other people's moods.", dimension: 'empathy' },
      { id: 19, text: 'My child has difficulty transitioning from one activity to another.', dimension: 'adaptability' },
      { id: 20, text: 'My child has very strong emotional reactions — both positive and negative.', dimension: 'empathy' },
    ],
    scoring: {
      low: { min: 0, max: 35, label: 'Low Sensitivity', description: 'Your child shows few signs of high sensitivity. They may be what researchers call a "dandelion child" — resilient and adaptable across a wide range of environments. The strategies on this site may still be useful, but your child is likely to thrive in a wide range of conditions.' },
      moderate: { min: 36, max: 55, label: 'Moderate Sensitivity', description: 'Your child shows some signs of high sensitivity. They may benefit from some of the strategies on this site, particularly around transitions and emotional intensity. Pay attention to which specific areas score highest for your child.' },
      high: { min: 56, max: 80, label: 'High Sensitivity', description: 'Your child shows strong signs of high sensitivity. Understanding this trait and designing their environment accordingly can make a significant difference in their wellbeing and flourishing. The investment in a good environment pays off more for highly sensitive children than for any other group.' },
    },
  },
};

export function AssessmentPage() {
  const { slug } = useParams<{ slug: string }>();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [step, setStep] = useState<'quiz' | 'result'>('quiz');
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/assessments/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.slug) {
          setAssessment(data);
        } else {
          setAssessment(STATIC_ASSESSMENTS[slug] ?? null);
        }
        setLoading(false);
      })
      .catch(() => {
        setAssessment(STATIC_ASSESSMENTS[slug ?? ''] ?? null);
        setLoading(false);
      });
  }, [slug]);

  function handleAnswer(questionId: number, value: number) {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    if (currentQ < (assessment?.questions.length ?? 0) - 1) {
      setTimeout(() => setCurrentQ((q) => q + 1), 280);
    }
  }

  function calculateResult() {
    if (!assessment) return;
    const qs = assessment.questions;
    const totalScore = qs.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
    const maxScore = qs.length * 4;
    const percentage = Math.round((totalScore / maxScore) * 100);

    // Dimension scores
    const dimensionScores: Record<string, number> = {};
    const dimensionCounts: Record<string, number> = {};
    for (const q of qs) {
      if (!dimensionScores[q.dimension]) {
        dimensionScores[q.dimension] = 0;
        dimensionCounts[q.dimension] = 0;
      }
      dimensionScores[q.dimension] += answers[q.id] ?? 0;
      dimensionCounts[q.dimension]++;
    }
    for (const dim of Object.keys(dimensionScores)) {
      dimensionScores[dim] = Math.round(
        (dimensionScores[dim] / (dimensionCounts[dim] * 4)) * 100
      );
    }

    const scoring = assessment.scoring;
    let label = '';
    let description = '';
    let tier: 'low' | 'moderate' | 'high' = 'moderate';

    if (scoring.low && scoring.moderate && scoring.high) {
      const scaledScore = Math.round((totalScore / maxScore) * 80);
      if (scaledScore <= (scoring.low.max ?? 35)) {
        label = scoring.low.label;
        description = scoring.low.description;
        tier = 'low';
      } else if (scaledScore <= (scoring.moderate.max ?? 55)) {
        label = scoring.moderate.label;
        description = scoring.moderate.description;
        tier = 'moderate';
      } else {
        label = scoring.high.label;
        description = scoring.high.description;
        tier = 'high';
      }
    }

    setResult({ label, description, score: totalScore, maxScore, percentage, dimensionScores, tier });
    setStep('result');

    fetch('/api/assessments/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessment_slug: assessment.slug,
        answers,
        score: totalScore,
        result_label: label,
      }),
    }).catch(() => {});

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = assessment?.questions.length ?? 0;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  if (loading) {
    return (
      <div className="assessment-loading">
        <div className="loading-spinner" />
        <p>Loading assessment…</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="not-found">
        <div className="not-found-code">404</div>
        <h1>Assessment Not Found</h1>
        <p>This assessment doesn't exist or has been removed.</p>
        <Link to="/assessments" className="btn-primary">← Back to Assessments</Link>
      </div>
    );
  }

  return (
    <div className="assessment-page">
      {step === 'quiz' && (
        <div className="quiz-container">
          <div className="quiz-header">
            <Link to="/assessments" className="quiz-back-btn">← Back to Assessments</Link>
            <h1>{assessment.title}</h1>
            <div className="quiz-progress-bar">
              <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="quiz-progress-text">
              Question {currentQ + 1} of {totalQuestions}
              {answeredCount > 0 && ` • ${answeredCount} answered`}
            </p>
          </div>

          <div className="quiz-question-card">
            <div className="quiz-question-number">Question {currentQ + 1}</div>
            <p className="quiz-question-text">{assessment.questions[currentQ]?.text}</p>

            <div className="quiz-scale">
              {SCALE_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  className={`quiz-scale-btn ${answers[assessment.questions[currentQ]?.id] === idx ? 'selected' : ''}`}
                  onClick={() => handleAnswer(assessment.questions[currentQ]?.id, idx)}
                >
                  <span className="quiz-scale-value">{idx}</span>
                  <span className="quiz-scale-label">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="quiz-navigation">
            <button
              className="btn-secondary"
              onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
              disabled={currentQ === 0}
            >
              ← Previous
            </button>

            {currentQ < totalQuestions - 1 ? (
              <button
                className="btn-primary"
                onClick={() => setCurrentQ((q) => q + 1)}
                disabled={answers[assessment.questions[currentQ]?.id] === undefined}
              >
                Next →
              </button>
            ) : (
              <button
                className="btn-primary btn-submit"
                onClick={calculateResult}
                disabled={answeredCount < totalQuestions}
              >
                See My Results →
              </button>
            )}
          </div>

          <div className="quiz-dots">
            {assessment.questions.map((q, idx) => (
              <button
                key={q.id}
                className={`quiz-dot ${idx === currentQ ? 'active' : ''} ${answers[q.id] !== undefined ? 'answered' : ''}`}
                onClick={() => setCurrentQ(idx)}
                aria-label={`Go to question ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div className="result-container">
          {/* ── Hero ── */}
          <div className={`result-hero result-tier-${result.tier}`}>
            <div className="result-hero-bg" />
            <div className="result-hero-content">
              <div className="result-icon">{RESULT_ICONS[result.tier]}</div>
              <span className="result-eyebrow">Your Results Are In</span>
              <h1 className="result-title">{result.label}</h1>
              <p className="result-subtitle">{assessment.title}</p>

              <div className="result-score-ring">
                <svg viewBox="0 0 120 120" className="result-ring-svg" aria-hidden="true">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="50"
                    fill="none"
                    stroke="white"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - result.percentage / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                  <text x="60" y="64" textAnchor="middle" fill="white" fontSize="22" fontWeight="700">
                    {result.percentage}%
                  </text>
                  <text x="60" y="80" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="9">
                    sensitivity
                  </text>
                </svg>
              </div>
            </div>
          </div>

          {/* ── Affirmation ── */}
          <div className="result-affirmation">
            <div className="result-affirmation-inner">
              <p>{RESULT_AFFIRMATIONS[result.tier]}</p>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="result-body">

            {/* What This Means */}
            <div className="result-card result-meaning">
              <div className="result-card-header">
                <span className="result-card-icon">💡</span>
                <h2>What This Means for Your Child</h2>
              </div>
              <p>{result.description}</p>
            </div>

            {/* Dimension Scores */}
            {result.dimensionScores && Object.keys(result.dimensionScores).length > 0 && (
              <div className="result-card result-dimensions">
                <div className="result-card-header">
                  <span className="result-card-icon">📊</span>
                  <h2>Sensitivity by Dimension</h2>
                </div>
                <p className="result-dimensions-intro">
                  Here's how your child's sensitivity breaks down across different areas:
                </p>
                <div className="dimension-bars">
                  {Object.entries(result.dimensionScores)
                    .sort(([, a], [, b]) => b - a)
                    .map(([dim, score]) => (
                      <div key={dim} className="dimension-bar-row">
                        <span className="dimension-label">
                          {DIMENSION_LABELS[dim] || dim.replace(/-/g, ' ')}
                        </span>
                        <div className="dimension-bar-track">
                          <div
                            className={`dimension-bar-fill ${score >= 70 ? 'high' : score >= 40 ? 'moderate' : 'low'}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className="dimension-score">{score}%</span>
                      </div>
                    ))}
                </div>
                <p className="result-dimensions-note">
                  The dimensions with the highest scores are where your child is most sensitive — and where small environmental changes can make the biggest difference.
                </p>
              </div>
            )}

            {/* Recommended Reading */}
            <div className="result-card result-reading">
              <div className="result-card-header">
                <span className="result-card-icon">📚</span>
                <h2>Recommended Reading for You</h2>
              </div>
              <p>Based on your results, these articles will be most helpful for your family right now:</p>
              <div className="result-articles-grid">
                {(RESULT_ARTICLES[result.tier] || RESULT_ARTICLES.moderate).map((article) => (
                  <Link key={article.to} to={article.to} className="result-article-link">
                    <span className="result-article-arrow">→</span>
                    {article.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="result-card result-nextsteps">
              <div className="result-card-header">
                <span className="result-card-icon">🌱</span>
                <h2>Your Next Steps</h2>
              </div>
              <div className="result-steps-list">
                <div className="result-step">
                  <span className="result-step-num">1</span>
                  <div>
                    <strong>Read the foundational articles</strong> above — they'll give you the language and framework to understand what you're seeing in your child.
                  </div>
                </div>
                <div className="result-step">
                  <span className="result-step-num">2</span>
                  <div>
                    <strong>Take another assessment</strong> — each one focuses on a different dimension of sensitivity. Together they give you a complete picture.
                  </div>
                </div>
                <div className="result-step">
                  <span className="result-step-num">3</span>
                  <div>
                    <strong>Explore our Supplements &amp; Tools page</strong> — research-backed resources that many families of sensitive children find genuinely helpful.
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="result-actions">
              <Link to="/assessments" className="btn-primary">Take Another Assessment</Link>
              <Link to="/articles" className="btn-secondary">Browse All Articles</Link>
              <Link to="/supplements" className="btn-outline">Explore Tools &amp; Supplements</Link>
            </div>

            {/* Share Encouragement */}
            <div className="result-share-note">
              <p>
                You took the time to understand your child better. That alone makes you an exceptional parent.
                Share OrchidKids with another parent who might need this — it costs nothing and could change everything for their family.
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default AssessmentPage;
