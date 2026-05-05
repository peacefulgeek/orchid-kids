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
}

const SCALE_LABELS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];

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
      { id: 3, text: 'My child doesn\'t do well with big changes.', dimension: 'adaptability' },
      { id: 4, text: 'My child notices and is bothered by subtle odors.', dimension: 'sensory' },
      { id: 5, text: 'My child has a fussy appetite and is particular about the texture or taste of food.', dimension: 'sensory' },
      { id: 6, text: 'My child is hard to get to sleep after an exciting day.', dimension: 'arousal' },
      { id: 7, text: 'My child doesn\'t do well with a lot of commotion.', dimension: 'arousal' },
      { id: 8, text: 'My child is deeply moved by music, art, or nature.', dimension: 'depth' },
      { id: 9, text: 'My child is very intuitive and seems to know things without being told.', dimension: 'depth' },
      { id: 10, text: 'My child has a rich and complex inner life.', dimension: 'depth' },
      { id: 11, text: 'My child is very empathetic and feels others\' emotions deeply.', dimension: 'empathy' },
      { id: 12, text: 'My child is deeply affected by violence or cruelty in movies or news.', dimension: 'empathy' },
      { id: 13, text: 'My child asks deep questions about life, death, and the meaning of things.', dimension: 'depth' },
      { id: 14, text: 'My child is very conscientious and has a strong sense of right and wrong.', dimension: 'depth' },
      { id: 15, text: 'My child is overwhelmed by crowded, noisy places like malls or parties.', dimension: 'arousal' },
      { id: 16, text: 'My child is very bothered by loud noises.', dimension: 'sensory' },
      { id: 17, text: 'My child notices subtle changes in their environment that others miss.', dimension: 'depth' },
      { id: 18, text: 'My child is very affected by other people\'s moods.', dimension: 'empathy' },
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

    if (scoring.low && scoring.moderate && scoring.high) {
      const scaledScore = Math.round((totalScore / maxScore) * 80);
      if (scaledScore <= (scoring.low.max ?? 35)) {
        label = scoring.low.label;
        description = scoring.low.description;
      } else if (scaledScore <= (scoring.moderate.max ?? 55)) {
        label = scoring.moderate.label;
        description = scoring.moderate.description;
      } else {
        label = scoring.high.label;
        description = scoring.high.description;
      }
    }

    setResult({ label, description, score: totalScore, maxScore, percentage, dimensionScores });
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

  const progress = assessment
    ? Math.round((Object.keys(answers).length / assessment.questions.length) * 100)
    : 0;

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
              Question {currentQ + 1} of {assessment.questions.length}
              {Object.keys(answers).length > 0 && ` • ${Object.keys(answers).length} answered`}
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

            {currentQ < assessment.questions.length - 1 ? (
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
                disabled={Object.keys(answers).length < assessment.questions.length}
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
          <div className={`result-hero result-${result.percentage >= 70 ? 'high' : result.percentage >= 40 ? 'moderate' : 'low'}`}>
            <div className="result-hero-content">
              <span className="result-eyebrow">Your Results</span>
              <h1>{result.label}</h1>
              <div className="result-score-ring">
                <svg viewBox="0 0 120 120" className="result-ring-svg">
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
                  <text x="60" y="68" textAnchor="middle" fill="white" fontSize="22" fontWeight="700">
                    {result.percentage}%
                  </text>
                </svg>
              </div>
            </div>
          </div>

          <div className="result-body">
            <div className="result-description">
              <p>{result.description}</p>
            </div>

            {result.dimensionScores && Object.keys(result.dimensionScores).length > 0 && (
              <div className="result-dimensions">
                <h2>Sensitivity by Dimension</h2>
                <div className="dimension-bars">
                  {Object.entries(result.dimensionScores).map(([dim, score]) => (
                    <div key={dim} className="dimension-bar-row">
                      <span className="dimension-label">{dim.replace(/-/g, ' ')}</span>
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
              </div>
            )}

            <div className="result-next-steps">
              <h2>Recommended Reading</h2>
              <p>Based on your results, these articles may be most helpful for your family:</p>
              <div className="result-articles-grid">
                <Link to="/articles/what-is-a-highly-sensitive-child" className="result-article-link">
                  What Is a Highly Sensitive Child? The Science Behind the Sensitivity →
                </Link>
                <Link to="/articles/why-standard-parenting-advice-fails-sensitive-children" className="result-article-link">
                  Why Standard Parenting Advice Fails Sensitive Children →
                </Link>
                <Link to="/articles/creating-a-calm-home-environment-for-your-sensitive-child" className="result-article-link">
                  Creating a Calm Home Environment for Your Sensitive Child →
                </Link>
              </div>
            </div>

            <div className="result-actions">
              <Link to="/assessments" className="btn-primary">Take Another Assessment</Link>
              <Link to="/articles" className="btn-secondary">Browse All Articles</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssessmentPage;
