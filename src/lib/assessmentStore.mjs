/**
 * assessmentStore.mjs
 * Built-in assessments data — works without a database.
 */

export const ASSESSMENTS = [
  {
    id: 1,
    slug: 'is-my-child-highly-sensitive',
    title: 'Is My Child Highly Sensitive?',
    description: 'Based on Elaine Aron\'s validated HSC scale, this assessment helps you understand whether your child shows the core characteristics of high sensitivity — and what that means for your parenting approach.',
    category: 'understanding-hsc',
    hero_url: '/images/hero-assessment.jpg',
    question_count: 15,
    time_minutes: 5,
    questions: [
      {
        id: 1,
        text: 'My child is bothered by scratchy clothing, seams in socks, or tags in shirts.',
        type: 'scale',
        dimension: 'sensory'
      },
      {
        id: 2,
        text: 'My child notices and is bothered by subtle sounds — a clock ticking, a distant conversation, background music.',
        type: 'scale',
        dimension: 'sensory'
      },
      {
        id: 3,
        text: 'My child has a particularly deep, complex inner life and rich imagination.',
        type: 'scale',
        dimension: 'depth'
      },
      {
        id: 4,
        text: 'My child is deeply moved by music, art, or nature — more so than other children their age.',
        type: 'scale',
        dimension: 'depth'
      },
      {
        id: 5,
        text: 'My child is very aware of other people\'s moods and is deeply affected by others\' emotions.',
        type: 'scale',
        dimension: 'empathy'
      },
      {
        id: 6,
        text: 'My child becomes overwhelmed in busy, noisy, or chaotic environments.',
        type: 'scale',
        dimension: 'overstimulation'
      },
      {
        id: 7,
        text: 'My child asks deep, philosophical questions for their age — about life, death, fairness, or meaning.',
        type: 'scale',
        dimension: 'depth'
      },
      {
        id: 8,
        text: 'My child has a hard time with transitions — moving from one activity to another.',
        type: 'scale',
        dimension: 'overstimulation'
      },
      {
        id: 9,
        text: 'My child is very conscientious — they care deeply about doing things right and feel bad when they make mistakes.',
        type: 'scale',
        dimension: 'depth'
      },
      {
        id: 10,
        text: 'My child is startled easily by sudden noises or unexpected events.',
        type: 'scale',
        dimension: 'sensory'
      },
      {
        id: 11,
        text: 'My child notices subtle changes — a slight shift in a parent\'s mood, a minor change in routine, a new smell.',
        type: 'scale',
        dimension: 'subtleties'
      },
      {
        id: 12,
        text: 'My child performs worse (or refuses to try) when being observed or evaluated.',
        type: 'scale',
        dimension: 'overstimulation'
      },
      {
        id: 13,
        text: 'My child is deeply affected by violence, cruelty, or injustice — in real life or in media.',
        type: 'scale',
        dimension: 'empathy'
      },
      {
        id: 14,
        text: 'My child needs more time to decompress after a busy or stimulating day.',
        type: 'scale',
        dimension: 'overstimulation'
      },
      {
        id: 15,
        text: 'My child is very perceptive — they notice things about people and situations that others miss.',
        type: 'scale',
        dimension: 'subtleties'
      }
    ],
    scoring: {
      scale: [
        { min: 0, max: 25, label: 'Low Sensitivity', description: 'Your child shows few signs of high sensitivity. They may have a more resilient, adaptable nervous system that handles stimulation and change with relative ease. This is a strength in many environments.', color: '#4CAF50', recommendations: ['Focus on providing consistent, loving structure', 'Encourage exploration and challenge', 'Standard parenting approaches are likely working well for your family'] },
        { min: 26, max: 45, label: 'Moderate Sensitivity', description: 'Your child shows some characteristics of high sensitivity in certain areas. They may benefit from some environmental adjustments and additional support in specific situations, while being generally adaptable.', color: '#FF9800', recommendations: ['Pay attention to which situations are most challenging', 'Build in some quiet downtime after busy periods', 'Validate their feelings while also building their coping skills'] },
        { min: 46, max: 60, label: 'High Sensitivity', description: 'Your child shows strong characteristics of high sensitivity. Their nervous system processes information deeply and thoroughly, which can be both a gift and a challenge. With the right environment and understanding, highly sensitive children thrive.', color: '#8A6080', recommendations: ['Read Elaine Aron\'s "The Highly Sensitive Child"', 'Focus on environmental design — reduce unnecessary stimulation', 'Build in daily quiet and recovery time', 'Connect with other parents of sensitive children', 'Reframe the trait as a gift, not a deficit'] }
      ]
    },
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    slug: 'sensory-sensitivity-profile',
    title: 'Your Child\'s Sensory Sensitivity Profile',
    description: 'Identify which sensory channels are most sensitive for your child — sight, sound, touch, smell, taste, or movement — and get targeted strategies for each.',
    category: 'sensory-environment',
    hero_url: '/images/hero-sensory.jpg',
    question_count: 20,
    time_minutes: 7,
    questions: [
      { id: 1, text: 'My child is bothered by bright lights, sunlight, or fluorescent lighting.', type: 'scale', dimension: 'visual' },
      { id: 2, text: 'My child is distracted or upset by visual clutter or busy environments.', type: 'scale', dimension: 'visual' },
      { id: 3, text: 'My child is bothered by background noise that others seem to ignore.', type: 'scale', dimension: 'auditory' },
      { id: 4, text: 'My child is startled or upset by sudden loud noises.', type: 'scale', dimension: 'auditory' },
      { id: 5, text: 'My child objects to certain clothing textures, seams, or tags.', type: 'scale', dimension: 'tactile' },
      { id: 6, text: 'My child dislikes being touched unexpectedly or lightly.', type: 'scale', dimension: 'tactile' },
      { id: 7, text: 'My child is bothered by certain smells that others don\'t notice.', type: 'scale', dimension: 'olfactory' },
      { id: 8, text: 'My child refuses foods based on smell before even tasting them.', type: 'scale', dimension: 'olfactory' },
      { id: 9, text: 'My child is very particular about food textures, temperatures, or mixed foods.', type: 'scale', dimension: 'gustatory' },
      { id: 10, text: 'My child has a limited range of foods they will eat.', type: 'scale', dimension: 'gustatory' },
      { id: 11, text: 'My child dislikes swings, slides, or activities involving movement.', type: 'scale', dimension: 'vestibular' },
      { id: 12, text: 'My child gets motion sick easily in cars, boats, or planes.', type: 'scale', dimension: 'vestibular' },
      { id: 13, text: 'My child seems unaware of their own body position or bumps into things.', type: 'scale', dimension: 'proprioceptive' },
      { id: 14, text: 'My child craves deep pressure — tight hugs, heavy blankets, being squeezed.', type: 'scale', dimension: 'proprioceptive' },
      { id: 15, text: 'My child is bothered by temperature changes — too hot or too cold.', type: 'scale', dimension: 'interoceptive' },
      { id: 16, text: 'My child has difficulty recognizing when they are hungry, thirsty, or tired.', type: 'scale', dimension: 'interoceptive' },
      { id: 17, text: 'My child is overwhelmed by environments with multiple sensory inputs at once.', type: 'scale', dimension: 'integration' },
      { id: 18, text: 'My child needs more time to recover after sensory-rich experiences.', type: 'scale', dimension: 'integration' },
      { id: 19, text: 'My child seeks out certain sensory experiences intensely (spinning, crashing, etc.).', type: 'scale', dimension: 'seeking' },
      { id: 20, text: 'My child has sensory experiences that are calming and regulating for them.', type: 'scale', dimension: 'seeking' }
    ],
    scoring: {
      dimensions: {
        visual: { label: 'Visual', icon: '👁️', strategies: ['Use warm, indirect lighting instead of overhead fluorescents', 'Reduce visual clutter in key spaces', 'Allow sunglasses outdoors', 'Create visually calm study spaces'] },
        auditory: { label: 'Auditory', icon: '👂', strategies: ['Provide noise-canceling headphones for busy environments', 'Use white noise or nature sounds for sleep', 'Give advance warning before loud activities', 'Create quiet zones in the home'] },
        tactile: { label: 'Touch', icon: '🤚', strategies: ['Remove tags from clothing, use seamless socks', 'Let your child choose their own clothing', 'Provide deep pressure through hugs or weighted blankets', 'Warn before unexpected touch'] },
        olfactory: { label: 'Smell', icon: '👃', strategies: ['Use unscented products where possible', 'Ventilate cooking smells', 'Allow your child to smell foods before eating', 'Be aware of strong perfumes or cleaning products'] },
        gustatory: { label: 'Taste/Food', icon: '👅', strategies: ['Use the exposure ladder — gradual, pressure-free food introduction', 'Always provide a safe food at meals', 'Respect texture aversions without judgment', 'Consult a feeding therapist if needed'] },
        vestibular: { label: 'Movement/Balance', icon: '🌀', strategies: ['Introduce movement activities gradually', 'Allow your child to control the pace of movement', 'Provide stable seating with feet on the floor', 'Consider occupational therapy evaluation'] },
        proprioceptive: { label: 'Body Awareness', icon: '💪', strategies: ['Provide heavy work activities (carrying, pushing, pulling)', 'Use weighted vests or lap pads', 'Encourage physical activities with body awareness', 'Consider OT evaluation for significant difficulties'] },
        interoceptive: { label: 'Internal Awareness', icon: '❤️', strategies: ['Use visual hunger/thirst/tiredness scales', 'Build in regular check-ins about body states', 'Practice body scan exercises', 'Maintain consistent meal and sleep schedules'] },
        integration: { label: 'Sensory Integration', icon: '🧩', strategies: ['Reduce multi-sensory environments when possible', 'Build in sensory breaks throughout the day', 'Create a personalized sensory diet with an OT', 'Prepare your child before entering busy environments'] },
        seeking: { label: 'Sensory Seeking', icon: '🔍', strategies: ['Provide safe outlets for sensory seeking', 'Channel seeking behaviors into appropriate activities', 'Use sensory seeking as a regulation tool', 'Understand seeking as a nervous system need, not misbehavior'] }
      }
    },
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    slug: 'emotional-regulation-readiness',
    title: 'Emotional Regulation Readiness Assessment',
    description: 'Understand where your child is in their emotional regulation development and get targeted strategies to build their capacity to feel deeply without being overwhelmed.',
    category: 'emotional-wellbeing',
    hero_url: '/images/hero-emotional.jpg',
    question_count: 12,
    time_minutes: 5,
    questions: [
      { id: 1, text: 'My child can name more than 5 different emotions with some precision.', type: 'scale', dimension: 'vocabulary' },
      { id: 2, text: 'My child can identify where they feel emotions in their body.', type: 'scale', dimension: 'body_awareness' },
      { id: 3, text: 'My child can recognize when they are getting close to overwhelm before it happens.', type: 'scale', dimension: 'self_awareness' },
      { id: 4, text: 'My child has at least one reliable strategy they use to calm down.', type: 'scale', dimension: 'strategies' },
      { id: 5, text: 'My child can ask for help when they are overwhelmed.', type: 'scale', dimension: 'help_seeking' },
      { id: 6, text: 'My child recovers from upsets within 20-30 minutes.', type: 'scale', dimension: 'recovery' },
      { id: 7, text: 'My child can talk about their feelings after they have calmed down.', type: 'scale', dimension: 'reflection' },
      { id: 8, text: 'My child understands that their feelings are valid, even if their behavior needs to change.', type: 'scale', dimension: 'self_compassion' },
      { id: 9, text: 'My child can distinguish between their own feelings and others\' feelings.', type: 'scale', dimension: 'boundaries' },
      { id: 10, text: 'My child has a calm-down space or toolkit they use proactively.', type: 'scale', dimension: 'tools' },
      { id: 11, text: 'My child can maintain friendships despite emotional intensity.', type: 'scale', dimension: 'social' },
      { id: 12, text: 'My child shows improvement in emotional regulation over the past year.', type: 'scale', dimension: 'growth' }
    ],
    scoring: {
      scale: [
        { min: 0, max: 20, label: 'Early Development', description: 'Your child is in the early stages of emotional regulation development. This is completely normal — regulation is a skill that develops over years. Focus on building the foundational skills: emotional vocabulary, body awareness, and co-regulation.', color: '#FF9800', recommendations: ['Focus on emotional vocabulary — name feelings precisely', 'Practice body scans and body awareness exercises', 'Be the external regulator — your calm is their calm', 'Read books about emotions together', 'Don\'t expect self-regulation yet — co-regulation comes first'] },
        { min: 21, max: 36, label: 'Building Capacity', description: 'Your child is developing their regulation skills and showing real progress. They have some tools and awareness, but still need significant support in challenging situations. Focus on expanding their toolkit and building self-awareness.', color: '#2196F3', recommendations: ['Expand their sensory toolkit', 'Practice regulation strategies during calm times', 'Help them identify their early warning signs', 'Build in proactive regulation — sensory breaks, quiet time', 'Celebrate regulation wins explicitly'] },
        { min: 37, max: 48, label: 'Strong Foundation', description: 'Your child has developed a solid foundation of emotional regulation skills. They have vocabulary, awareness, and strategies. Continue building on this foundation and helping them apply their skills in increasingly challenging situations.', color: '#4CAF50', recommendations: ['Support independent use of their toolkit', 'Help them advocate for their needs in new environments', 'Introduce mindfulness practices', 'Discuss the neuroscience of emotions in age-appropriate ways', 'Celebrate their growth and the journey ahead'] }
      ]
    },
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    slug: 'school-environment-fit',
    title: 'School Environment Fit Assessment',
    description: 'Evaluate how well your child\'s current school environment fits their sensitive nervous system — and identify specific areas where accommodations could make a significant difference.',
    category: 'school-social',
    hero_url: '/images/hero-school.jpg',
    question_count: 14,
    time_minutes: 6,
    questions: [
      { id: 1, text: 'My child\'s teacher understands and accommodates their sensitivity.', type: 'scale', dimension: 'teacher' },
      { id: 2, text: 'My child\'s classroom has manageable sensory conditions (lighting, noise, visual complexity).', type: 'scale', dimension: 'sensory' },
      { id: 3, text: 'My child has access to a quiet space when they need to decompress.', type: 'scale', dimension: 'sensory' },
      { id: 4, text: 'My child receives adequate transition warnings and preparation for schedule changes.', type: 'scale', dimension: 'transitions' },
      { id: 5, text: 'My child\'s intellectual needs are being met — they are appropriately challenged.', type: 'scale', dimension: 'academic' },
      { id: 6, text: 'My child feels safe and accepted by their peers.', type: 'scale', dimension: 'social' },
      { id: 7, text: 'My child is not being bullied or excluded because of their sensitivity.', type: 'scale', dimension: 'social' },
      { id: 8, text: 'My child has at least one genuine friend at school.', type: 'scale', dimension: 'social' },
      { id: 9, text: 'My child\'s school day includes some unstructured, low-demand time.', type: 'scale', dimension: 'schedule' },
      { id: 10, text: 'My child is not significantly more dysregulated after school than before.', type: 'scale', dimension: 'regulation' },
      { id: 11, text: 'My child\'s school communicates proactively about challenges and changes.', type: 'scale', dimension: 'communication' },
      { id: 12, text: 'My child expresses positive feelings about school at least some of the time.', type: 'scale', dimension: 'wellbeing' },
      { id: 13, text: 'My child\'s school performance reflects their actual capability.', type: 'scale', dimension: 'academic' },
      { id: 14, text: 'I feel heard and respected when I advocate for my child\'s needs at school.', type: 'scale', dimension: 'partnership' }
    ],
    scoring: {
      scale: [
        { min: 0, max: 25, label: 'Poor Fit', description: 'Your child\'s current school environment is significantly mismatched with their sensitive nervous system. This is likely contributing to stress, dysregulation, and underperformance. Immediate advocacy and possibly a change of environment may be needed.', color: '#F44336', recommendations: ['Request an urgent meeting with the teacher and school counselor', 'Document specific challenges and their impact', 'Research 504 plans or IEP options', 'Consider whether a different school environment might be a better fit', 'Connect with a parent advocate if needed'] },
        { min: 26, max: 42, label: 'Partial Fit', description: 'Your child\'s school environment has some strengths but significant gaps. There are specific areas where targeted advocacy and accommodations could make a meaningful difference. Focus on the lowest-scoring areas first.', color: '#FF9800', recommendations: ['Identify the two or three most impactful areas for improvement', 'Schedule a meeting with the teacher to share what you\'ve learned', 'Bring specific, actionable accommodation requests', 'Build a positive relationship with the teacher before making demands', 'Follow up regularly and document progress'] },
        { min: 43, max: 56, label: 'Good Fit', description: 'Your child\'s school environment is reasonably well-matched to their needs. There may be specific areas for improvement, but the overall fit is supportive. Focus on maintaining and strengthening what is working.', color: '#4CAF50', recommendations: ['Express appreciation to teachers who are doing well', 'Address remaining gaps proactively', 'Help your child develop self-advocacy skills', 'Stay engaged with the school community', 'Share what works with next year\'s teacher'] }
      ]
    },
    created_at: new Date().toISOString()
  },
  {
    id: 5,
    slug: 'parent-sensitivity-self-assessment',
    title: 'Are You a Sensitive Parent?',
    description: 'Many parents of sensitive children are sensitive themselves. Understanding your own sensitivity helps you parent more effectively and take better care of yourself.',
    category: 'family-dynamics',
    hero_url: '/images/hero-family.jpg',
    question_count: 12,
    time_minutes: 5,
    questions: [
      { id: 1, text: 'I am easily overwhelmed by loud noises, bright lights, or chaotic environments.', type: 'scale', dimension: 'sensory' },
      { id: 2, text: 'I am deeply affected by others\' emotions — I often absorb how others are feeling.', type: 'scale', dimension: 'empathy' },
      { id: 3, text: 'I need more time alone to decompress after social or stimulating situations.', type: 'scale', dimension: 'recovery' },
      { id: 4, text: 'I am deeply moved by music, art, nature, or beauty.', type: 'scale', dimension: 'depth' },
      { id: 5, text: 'I am very conscientious and notice when I\'ve made mistakes or hurt others.', type: 'scale', dimension: 'conscientiousness' },
      { id: 6, text: 'I process experiences deeply — I think about things long after they\'ve happened.', type: 'scale', dimension: 'processing' },
      { id: 7, text: 'I am startled easily by sudden noises or unexpected events.', type: 'scale', dimension: 'sensory' },
      { id: 8, text: 'I feel overwhelmed when I have too much to do in too little time.', type: 'scale', dimension: 'overstimulation' },
      { id: 9, text: 'I find it hard to perform at my best when being observed or evaluated.', type: 'scale', dimension: 'performance' },
      { id: 10, text: 'I have a rich inner life and vivid imagination.', type: 'scale', dimension: 'depth' },
      { id: 11, text: 'I notice subtleties in environments and social situations that others seem to miss.', type: 'scale', dimension: 'subtleties' },
      { id: 12, text: 'I am deeply affected by violence, cruelty, or injustice in the world.', type: 'scale', dimension: 'empathy' }
    ],
    scoring: {
      scale: [
        { min: 0, max: 20, label: 'Low Sensitivity', description: 'You show few characteristics of high sensitivity. You may have a more resilient, adaptable nervous system that handles stimulation and change with relative ease. Your child\'s sensitivity may feel puzzling because it is genuinely different from your own experience.', color: '#4CAF50', recommendations: ['Invest in understanding your child\'s experience from the inside', 'Read first-person accounts from sensitive adults', 'Practice curiosity rather than frustration when your child\'s reactions differ from yours', 'Your resilience is a gift — model it without expecting your child to match it'] },
        { min: 21, max: 36, label: 'Moderate Sensitivity', description: 'You show some characteristics of high sensitivity. You likely have some intuitive understanding of your child\'s experience, while also having areas where your nervous systems differ significantly.', color: '#2196F3', recommendations: ['Notice which of your child\'s challenges you understand intuitively', 'Be curious about the areas where their experience differs from yours', 'Build your own regulation practice to support your child\'s regulation', 'Connect with other parents who share your level of sensitivity'] },
        { min: 37, max: 48, label: 'High Sensitivity', description: 'You are likely highly sensitive yourself. This gives you deep intuitive understanding of your child\'s experience — and also creates specific challenges. Your own regulation is the foundation of your child\'s regulation.', color: '#8A6080', recommendations: ['Prioritize your own regulation practice — it is not selfish, it is essential', 'Be aware of emotional resonance — when you absorb your child\'s distress', 'Build in daily decompression time for yourself', 'Connect with other sensitive parents who understand your experience', 'Read "The Highly Sensitive Person" by Elaine Aron for yourself', 'Consider therapy with a therapist who understands HSP adults'] }
      ]
    },
    created_at: new Date().toISOString()
  }
];

export function getAssessments() {
  return ASSESSMENTS.map(a => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    description: a.description,
    category: a.category,
    hero_url: a.hero_url,
    question_count: a.question_count,
    time_minutes: a.time_minutes,
    created_at: a.created_at,
  }));
}

export function getAssessmentBySlug(slug) {
  return ASSESSMENTS.find(a => a.slug === slug) || null;
}
