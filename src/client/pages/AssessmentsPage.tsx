import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Assessment {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  hero_url?: string;
  question_count?: number;
  time_minutes?: number;
  questions?: any[];
}

const CATEGORY_ICONS: Record<string, string> = {
  'understanding-hsc': '🌸',
  'sensory-environment': '🎯',
  'family-dynamics': '🏡',
  'emotional-wellbeing': '💛',
  'parenting-strategies': '🌿',
  'school-social': '📚',
  'tools-resources': '🛠️',
  'long-term': '🌱',
  'long-term-outcomes': '🌱',
};

const CATEGORY_LABELS: Record<string, string> = {
  'understanding-hsc': 'Understanding HSC',
  'sensory-environment': 'Sensory & Environment',
  'family-dynamics': 'Family Dynamics',
  'emotional-wellbeing': 'Emotional Wellbeing',
  'parenting-strategies': 'Parenting Strategies',
  'school-social': 'School & Social',
  'tools-resources': 'Tools & Resources',
  'long-term': 'Long-Term Outcomes',
  'long-term-outcomes': 'Long-Term Outcomes',
};

// Fallback static assessments if API is unavailable
const STATIC_ASSESSMENTS: Assessment[] = [
  {
    id: 1,
    slug: 'is-my-child-highly-sensitive',
    title: 'Is My Child Highly Sensitive? The HSC Screening Assessment',
    description: "Based on Elaine Aron's research, this 20-question assessment helps you understand whether your child may be highly sensitive and what that means for your family.",
    category: 'understanding-hsc',
    questions: Array(20).fill(null),
  },
  {
    id: 2,
    slug: 'sensory-profile-assessment',
    title: 'Sensory Profile Assessment for Highly Sensitive Children',
    description: 'Identify which sensory channels are most sensitive for your child — tactile, auditory, visual, olfactory, or interoceptive — and get targeted strategies for each.',
    category: 'sensory-environment',
    questions: Array(15).fill(null),
  },
  {
    id: 3,
    slug: 'family-stress-load-assessment',
    title: 'Family Stress Load Assessment',
    description: 'Highly sensitive children are more affected by family stress than other children. This assessment helps you identify the stress load in your family system and where to focus first.',
    category: 'family-dynamics',
    questions: Array(10).fill(null),
  },
];

export function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/assessments')
      .then((r) => r.json())
      .then((data) => {
        setAssessments(Array.isArray(data) && data.length > 0 ? data : STATIC_ASSESSMENTS);
        setLoading(false);
      })
      .catch(() => {
        setAssessments(STATIC_ASSESSMENTS);
        setLoading(false);
      });
  }, []);

  return (
    <div className="assessments-list-page">
      {/* Hero */}
      <div className="assessment-hero">
        <div className="assessment-hero-content">
          <span className="assessment-eyebrow">✦ Self-Assessment Tools</span>
          <h1>Understand Your Child's Sensitivity</h1>
          <p>
            These research-informed assessments help you understand your child's unique sensory
            and emotional profile — so you can design environments and strategies that actually work.
          </p>
        </div>
      </div>

      {/* Assessments grid */}
      {loading ? (
        <div className="assessment-loading">
          <div className="loading-spinner" />
          <p>Loading assessments…</p>
        </div>
      ) : (
        <div className="assessment-grid">
          {assessments.map((a) => (
            <div key={a.slug} className="assessment-card">
              <div className="assessment-card-icon">
                {CATEGORY_ICONS[a.category] ?? '📋'}
              </div>
              <div className="assessment-card-body">
                <span className="assessment-card-category">
                  {CATEGORY_LABELS[a.category] ?? a.category.replace(/-/g, ' ')}
                </span>
                <h2>{a.title}</h2>
                <p>{a.description}</p>
                <div className="assessment-card-meta">
                  <span>{a.question_count ?? a.questions?.length ?? '?'} questions</span>
                  <span>~{a.time_minutes ?? Math.ceil((a.question_count ?? a.questions?.length ?? 10) * 0.5)} min</span>
                </div>
              </div>
              <Link
                to={`/assessments/${a.slug}`}
                className="btn-primary assessment-start-btn"
              >
                Start Assessment →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="assessment-disclaimer">
        <p>
          <strong>Note:</strong> These assessments are educational tools based on published research,
          not clinical diagnostic instruments. They are designed to help parents understand their
          child's temperament and identify useful strategies. For clinical concerns, please consult
          a qualified healthcare professional.
        </p>
      </div>

      {/* Why assessments section */}
      <div className="assessments-why-section">
        <div className="assessments-why-content">
          <h2>Why Self-Assessment Matters</h2>
          <p>
            Understanding your child's specific sensory and emotional profile is the first step toward
            designing environments and strategies that actually work. Generic parenting advice is written
            for the average child. Your child is not average — they are an orchid, and orchids require
            specific conditions to thrive.
          </p>
          <p>
            These assessments are grounded in the research of Elaine Aron, Thomas Boyce, and Michael
            Pluess — the scientists who have done the most to understand what makes highly sensitive
            children different, and what they need to flourish.
          </p>
          <div className="assessments-why-cards">
            <div className="why-card">
              <span className="why-card-icon">🔬</span>
              <h3>Research-Based</h3>
              <p>Questions derived from validated sensitivity scales used in peer-reviewed research.</p>
            </div>
            <div className="why-card">
              <span className="why-card-icon">🎯</span>
              <h3>Actionable</h3>
              <p>Results include specific, practical strategies tailored to your child's profile.</p>
            </div>
            <div className="why-card">
              <span className="why-card-icon">🔒</span>
              <h3>Private</h3>
              <p>No account required. Results are stored anonymously and never shared.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssessmentsPage;
