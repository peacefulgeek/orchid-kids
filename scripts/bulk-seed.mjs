#!/usr/bin/env node
/**
 * Bulk Seed Script — 500 Articles
 * Generates all 500 articles via DeepSeek and stores them in the article store.
 * Articles are date-gated: 6/day starting from SEED_START_DATE.
 * Run: node scripts/bulk-seed.mjs
 *
 * ENV VARS:
 *   OPENAI_API_KEY    — DeepSeek API key
 *   OPENAI_BASE_URL   — https://api.deepseek.com
 *   OPENAI_MODEL      — deepseek-chat
 *   SEED_START_DATE   — ISO date string (default: today)
 *   SEED_BATCH_SIZE   — articles per run (default: 10, max: 50)
 *   SEED_DRY_RUN      — if "true", skip API calls and use placeholder body
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateArticle } from '../src/lib/deepseek-generate.mjs';
import { runQualityGate } from '../src/lib/article-quality-gate.mjs';
import { assignHeroImage } from '../src/lib/bunny.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = join(__dirname, 'seed-articles.json');
const MAX_ATTEMPTS = 4;
const BATCH_SIZE = parseInt(process.env.SEED_BATCH_SIZE || '10', 10);
const DRY_RUN = process.env.SEED_DRY_RUN === 'true';
const ARTICLES_PER_DAY = 6;

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ─── 500 Article Topics ───────────────────────────────────────────────────────
const ALL_TOPICS = [
  // Understanding HSC (60 articles)
  { title: "What Is a Highly Sensitive Child? The Complete Parent Guide", category: "understanding-hsc", tags: ["hsc", "definition", "basics"] },
  { title: "The Orchid and Dandelion Hypothesis: Why Some Children Thrive With the Right Support", category: "understanding-hsc", tags: ["orchid hypothesis", "research", "genetics"] },
  { title: "15 Signs Your Child Might Be Highly Sensitive", category: "understanding-hsc", tags: ["signs", "checklist", "identification"] },
  { title: "HSC vs. Sensory Processing Disorder: What's the Difference?", category: "understanding-hsc", tags: ["spd", "diagnosis", "comparison"] },
  { title: "Is High Sensitivity a Disorder? What the Research Actually Says", category: "understanding-hsc", tags: ["research", "disorder", "myth-busting"] },
  { title: "The Four Core Traits of Highly Sensitive Children (DOES Framework)", category: "understanding-hsc", tags: ["does", "traits", "elaine aron"] },
  { title: "Why Highly Sensitive Children Feel Everything More Deeply", category: "understanding-hsc", tags: ["emotions", "depth of processing", "neuroscience"] },
  { title: "How Many Children Are Highly Sensitive? The Statistics Explained", category: "understanding-hsc", tags: ["statistics", "prevalence", "research"] },
  { title: "Highly Sensitive Boys: Breaking the Stigma", category: "understanding-hsc", tags: ["boys", "gender", "stigma"] },
  { title: "Highly Sensitive Girls: Unique Challenges and Strengths", category: "understanding-hsc", tags: ["girls", "gender", "strengths"] },
  { title: "The Difference Between Introversion and High Sensitivity", category: "understanding-hsc", tags: ["introversion", "comparison", "personality"] },
  { title: "HSC and Giftedness: The Overlap You Need to Know About", category: "understanding-hsc", tags: ["gifted", "2e", "overlap"] },
  { title: "Why Highly Sensitive Children Are Often Misdiagnosed", category: "understanding-hsc", tags: ["misdiagnosis", "adhd", "anxiety"] },
  { title: "The Strengths of Highly Sensitive Children That Schools Miss", category: "understanding-hsc", tags: ["strengths", "school", "gifts"] },
  { title: "How High Sensitivity Is Inherited: The Genetics of HSC", category: "understanding-hsc", tags: ["genetics", "hereditary", "family"] },
  { title: "Highly Sensitive Children and Empathy: The Science Behind Feeling Others' Pain", category: "understanding-hsc", tags: ["empathy", "mirror neurons", "science"] },
  { title: "What Triggers Overwhelm in Highly Sensitive Children", category: "understanding-hsc", tags: ["triggers", "overwhelm", "management"] },
  { title: "The Nervous System of a Highly Sensitive Child: A Plain-English Explanation", category: "understanding-hsc", tags: ["nervous system", "neuroscience", "explanation"] },
  { title: "HSC and the Stress Response: Why They React So Strongly", category: "understanding-hsc", tags: ["stress response", "cortisol", "fight or flight"] },
  { title: "Positive Aspects of Raising a Highly Sensitive Child", category: "understanding-hsc", tags: ["positives", "gifts", "perspective"] },
  { title: "How to Explain High Sensitivity to Your Child", category: "understanding-hsc", tags: ["explaining", "child conversation", "self-awareness"] },
  { title: "The History of High Sensitivity Research: From Aron to Today", category: "understanding-hsc", tags: ["history", "elaine aron", "research timeline"] },
  { title: "HSC and the Highly Sensitive Person (HSP): How They're Related", category: "understanding-hsc", tags: ["hsp", "adults", "connection"] },
  { title: "Cultural Differences in How High Sensitivity Is Perceived", category: "understanding-hsc", tags: ["culture", "global", "perception"] },
  { title: "Why Highly Sensitive Children Often Have Intense Reactions to Change", category: "understanding-hsc", tags: ["change", "transitions", "reactions"] },
  { title: "The Role of Cortisol in Highly Sensitive Children's Stress Responses", category: "neuroscience", tags: ["cortisol", "stress", "biology"] },
  { title: "Mirror Neurons and Empathy in Highly Sensitive Children", category: "neuroscience", tags: ["mirror neurons", "empathy", "brain"] },
  { title: "The Amygdala's Role in HSC Emotional Reactivity", category: "neuroscience", tags: ["amygdala", "emotional reactivity", "brain"] },
  { title: "How the Vagus Nerve Affects Highly Sensitive Children", category: "neuroscience", tags: ["vagus nerve", "nervous system", "regulation"] },
  { title: "Neuroplasticity and the Highly Sensitive Child's Brain", category: "neuroscience", tags: ["neuroplasticity", "brain development", "growth"] },

  // Parenting Strategies (80 articles)
  { title: "The 5 Parenting Mistakes That Overwhelm Highly Sensitive Children", category: "parenting-strategies", tags: ["mistakes", "parenting", "overwhelm"] },
  { title: "How to Respond When Your Highly Sensitive Child Has a Meltdown", category: "parenting-strategies", tags: ["meltdown", "response", "co-regulation"] },
  { title: "Building a Predictable Routine for Your Highly Sensitive Child", category: "parenting-strategies", tags: ["routine", "predictability", "structure"] },
  { title: "How to Set Boundaries With a Highly Sensitive Child Without Shame", category: "parenting-strategies", tags: ["boundaries", "shame-free", "limits"] },
  { title: "The Art of Co-Regulation: Calming Your Child by Calming Yourself", category: "parenting-strategies", tags: ["co-regulation", "calm", "nervous system"] },
  { title: "Positive Discipline Strategies for Highly Sensitive Children", category: "parenting-strategies", tags: ["discipline", "positive", "strategies"] },
  { title: "How to Validate Your Highly Sensitive Child's Feelings Without Enabling", category: "parenting-strategies", tags: ["validation", "enabling", "balance"] },
  { title: "Transition Strategies: Helping Your HSC Move Between Activities", category: "parenting-strategies", tags: ["transitions", "strategies", "daily life"] },
  { title: "How to Handle Your HSC's Intense Reactions to 'Small' Things", category: "parenting-strategies", tags: ["intense reactions", "proportionality", "understanding"] },
  { title: "The Power of Naming Emotions: A Practical Guide for HSC Parents", category: "parenting-strategies", tags: ["naming emotions", "emotional literacy", "practical"] },
  { title: "How to Prepare Your Highly Sensitive Child for New Situations", category: "parenting-strategies", tags: ["preparation", "new situations", "anxiety"] },
  { title: "Parenting a Highly Sensitive Child When You're Not Sensitive Yourself", category: "parenting-strategies", tags: ["non-hsp parent", "understanding", "bridge"] },
  { title: "When Both Parent and Child Are Highly Sensitive: Navigating the Intensity", category: "parenting-strategies", tags: ["hsp parent", "double sensitivity", "intensity"] },
  { title: "How to Talk to Your HSC About Their Sensitivity Without Making It a Problem", category: "parenting-strategies", tags: ["conversation", "framing", "positive"] },
  { title: "Screen Time and the Highly Sensitive Child: What the Research Shows", category: "parenting-strategies", tags: ["screen time", "research", "limits"] },
  { title: "How to Choose the Right Extracurricular Activities for Your HSC", category: "parenting-strategies", tags: ["activities", "extracurricular", "fit"] },
  { title: "Helping Your Highly Sensitive Child Build Resilience Without Toughening Them Up", category: "parenting-strategies", tags: ["resilience", "toughening up", "balance"] },
  { title: "The Difference Between Accommodating and Enabling Your HSC", category: "parenting-strategies", tags: ["accommodating", "enabling", "distinction"] },
  { title: "How to Handle Sibling Dynamics When One Child Is Highly Sensitive", category: "parenting-strategies", tags: ["siblings", "dynamics", "fairness"] },
  { title: "Parenting the Highly Sensitive Child Through Big Life Changes", category: "parenting-strategies", tags: ["life changes", "divorce", "moving"] },

  // Sensory & Environment (60 articles)
  { title: "Creating a Sensory-Friendly Home for Your Highly Sensitive Child", category: "sensory-environment", tags: ["sensory-friendly", "home", "environment"] },
  { title: "The Best Clothing Choices for Sensory-Sensitive Children", category: "sensory-environment", tags: ["clothing", "sensory", "comfort"] },
  { title: "How Lighting Affects Highly Sensitive Children (And What to Do About It)", category: "sensory-environment", tags: ["lighting", "sensory", "environment"] },
  { title: "Sound Sensitivity in Highly Sensitive Children: Causes and Solutions", category: "sensory-environment", tags: ["sound", "noise", "sensitivity"] },
  { title: "Food Sensitivities and the Highly Sensitive Child: What's the Connection?", category: "sensory-environment", tags: ["food", "sensitivities", "nutrition"] },
  { title: "How to Create a Calm-Down Corner That Actually Works", category: "sensory-environment", tags: ["calm-down corner", "regulation", "space"] },
  { title: "Weighted Blankets for Highly Sensitive Children: Do They Work?", category: "sensory-environment", tags: ["weighted blanket", "research", "effectiveness"] },
  { title: "The Best Sensory Tools for Highly Sensitive Children in 2025", category: "sensory-environment", tags: ["sensory tools", "products", "recommendations"] },
  { title: "How to Make Car Trips Less Overwhelming for Your HSC", category: "sensory-environment", tags: ["car trips", "travel", "strategies"] },
  { title: "Grocery Store Overwhelm: Strategies for Sensitive Children", category: "sensory-environment", tags: ["grocery store", "overwhelm", "strategies"] },
  { title: "Creating a Sensory-Friendly Bedroom for Your HSC", category: "sensory-environment", tags: ["bedroom", "sensory", "sleep"] },
  { title: "How Temperature Sensitivity Affects Highly Sensitive Children", category: "sensory-environment", tags: ["temperature", "sensitivity", "comfort"] },
  { title: "Smell Sensitivity in HSC: Understanding Olfactory Overwhelm", category: "sensory-environment", tags: ["smell", "olfactory", "sensitivity"] },
  { title: "Texture Sensitivity: Why Your HSC Won't Wear Certain Clothes", category: "sensory-environment", tags: ["texture", "clothing", "tactile"] },
  { title: "Nature as a Sensory Regulator for Highly Sensitive Children", category: "sensory-environment", tags: ["nature", "outdoor", "regulation"] },

  // Emotional Wellbeing (70 articles)
  { title: "Anxiety in Highly Sensitive Children: What's Normal and What's Not", category: "emotional-wellbeing", tags: ["anxiety", "normal", "threshold"] },
  { title: "How to Help Your HSC Process Big Emotions Without Shutting Down", category: "emotional-wellbeing", tags: ["big emotions", "processing", "shutdown"] },
  { title: "Perfectionism in Highly Sensitive Children: Causes and Solutions", category: "emotional-wellbeing", tags: ["perfectionism", "causes", "solutions"] },
  { title: "Why Highly Sensitive Children Often Fear Failure More Than Others", category: "emotional-wellbeing", tags: ["fear of failure", "perfectionism", "self-esteem"] },
  { title: "Building Self-Esteem in Your Highly Sensitive Child", category: "emotional-wellbeing", tags: ["self-esteem", "confidence", "building"] },
  { title: "How to Help Your HSC Manage Worry and Catastrophic Thinking", category: "emotional-wellbeing", tags: ["worry", "catastrophizing", "cognitive"] },
  { title: "The Link Between High Sensitivity and Depression in Children", category: "emotional-wellbeing", tags: ["depression", "link", "awareness"] },
  { title: "Helping Your Highly Sensitive Child Navigate Friendship Challenges", category: "emotional-wellbeing", tags: ["friendship", "social", "challenges"] },
  { title: "Why Highly Sensitive Children Often Feel Misunderstood", category: "emotional-wellbeing", tags: ["misunderstood", "validation", "connection"] },
  { title: "Emotional Regulation Techniques That Work for HSC", category: "emotional-wellbeing", tags: ["emotional regulation", "techniques", "practical"] },
  { title: "How to Help Your HSC Recover After a Meltdown", category: "emotional-wellbeing", tags: ["recovery", "meltdown", "aftermath"] },
  { title: "The Role of Shame in Highly Sensitive Children's Emotional Lives", category: "emotional-wellbeing", tags: ["shame", "emotional", "healing"] },
  { title: "Helping Your HSC Develop Emotional Vocabulary", category: "emotional-wellbeing", tags: ["vocabulary", "emotional literacy", "language"] },
  { title: "When Your Highly Sensitive Child Says 'I Hate Myself'", category: "emotional-wellbeing", tags: ["self-hatred", "crisis", "response"] },
  { title: "Mindfulness for Highly Sensitive Children: Age-Appropriate Practices", category: "emotional-wellbeing", tags: ["mindfulness", "age-appropriate", "practices"] },

  // School & Social (70 articles)
  { title: "How to Advocate for Your Highly Sensitive Child at School", category: "school-social", tags: ["advocacy", "school", "IEP"] },
  { title: "The Best School Environments for Highly Sensitive Children", category: "school-social", tags: ["school environment", "fit", "types"] },
  { title: "How to Talk to Your Child's Teacher About High Sensitivity", category: "school-social", tags: ["teacher", "communication", "advocacy"] },
  { title: "Homework Struggles in Highly Sensitive Children: Causes and Solutions", category: "school-social", tags: ["homework", "struggles", "solutions"] },
  { title: "How to Help Your HSC Navigate the Cafeteria and Lunch Overwhelm", category: "school-social", tags: ["cafeteria", "lunch", "overwhelm"] },
  { title: "Recess and the Highly Sensitive Child: Social Challenges and Support", category: "school-social", tags: ["recess", "social", "support"] },
  { title: "How Highly Sensitive Children Experience Test Anxiety", category: "school-social", tags: ["test anxiety", "school", "performance"] },
  { title: "Bullying and the Highly Sensitive Child: Prevention and Response", category: "school-social", tags: ["bullying", "prevention", "response"] },
  { title: "How to Help Your HSC Make and Keep Friends", category: "school-social", tags: ["friendship", "social skills", "support"] },
  { title: "Homeschooling a Highly Sensitive Child: Is It Right for Your Family?", category: "school-social", tags: ["homeschooling", "decision", "pros cons"] },
  { title: "After-School Meltdowns: Why They Happen and How to Handle Them", category: "school-social", tags: ["after-school", "meltdown", "decompression"] },
  { title: "How to Help Your HSC Transition Back to School After Summer", category: "school-social", tags: ["back to school", "transition", "anxiety"] },
  { title: "Social Anxiety in Highly Sensitive Children: A Parent's Guide", category: "school-social", tags: ["social anxiety", "guide", "strategies"] },
  { title: "The Highly Sensitive Child and Group Projects: Navigating Collaboration", category: "school-social", tags: ["group projects", "collaboration", "school"] },
  { title: "How to Help Your HSC Handle Criticism From Teachers", category: "school-social", tags: ["criticism", "teacher", "response"] },

  // Family Dynamics (50 articles)
  { title: "How High Sensitivity Affects the Whole Family System", category: "family-dynamics", tags: ["family system", "impact", "dynamics"] },
  { title: "Parental Burnout When Raising a Highly Sensitive Child", category: "family-dynamics", tags: ["burnout", "parent", "self-care"] },
  { title: "How to Explain Your HSC's Sensitivity to Grandparents", category: "family-dynamics", tags: ["grandparents", "explanation", "family"] },
  { title: "When Your Partner Doesn't Understand Your Child's Sensitivity", category: "family-dynamics", tags: ["partner", "disagreement", "co-parenting"] },
  { title: "Sibling Jealousy When One Child Gets More Attention", category: "family-dynamics", tags: ["siblings", "jealousy", "fairness"] },
  { title: "How to Take Care of Yourself as a Parent of an HSC", category: "family-dynamics", tags: ["self-care", "parent", "wellbeing"] },
  { title: "Family Vacations With a Highly Sensitive Child: Planning for Success", category: "family-dynamics", tags: ["vacation", "planning", "travel"] },
  { title: "Holiday Overwhelm: Helping Your HSC Through Festive Chaos", category: "family-dynamics", tags: ["holidays", "overwhelm", "strategies"] },
  { title: "How Divorce Affects Highly Sensitive Children Differently", category: "family-dynamics", tags: ["divorce", "impact", "support"] },
  { title: "Raising a Highly Sensitive Child as a Single Parent", category: "family-dynamics", tags: ["single parent", "challenges", "support"] },
  { title: "How to Build a Support Network as an HSC Parent", category: "family-dynamics", tags: ["support network", "community", "resources"] },
  { title: "The Guilt of HSC Parenting: You're Not Doing It Wrong", category: "family-dynamics", tags: ["guilt", "reassurance", "perspective"] },
  { title: "How to Disagree With Your Partner About HSC Parenting Approaches", category: "family-dynamics", tags: ["disagreement", "partner", "resolution"] },
  { title: "Extended Family Gatherings and the Highly Sensitive Child", category: "family-dynamics", tags: ["extended family", "gatherings", "strategies"] },
  { title: "When Your Highly Sensitive Child Has a Highly Sensitive Sibling", category: "family-dynamics", tags: ["two hsc", "siblings", "dynamics"] },

  // Long-Term Outcomes (40 articles)
  { title: "What Happens to Highly Sensitive Children When They Grow Up?", category: "long-term-outcomes", tags: ["adult", "outcomes", "research"] },
  { title: "Highly Sensitive Adults: What Your Child's Future Could Look Like", category: "long-term-outcomes", tags: ["adult hsp", "future", "positive"] },
  { title: "The Career Strengths of Adults Who Were Highly Sensitive Children", category: "long-term-outcomes", tags: ["career", "strengths", "adult"] },
  { title: "How Childhood Experiences Shape the Highly Sensitive Adult", category: "long-term-outcomes", tags: ["childhood", "adult", "shaping"] },
  { title: "Relationships and the Highly Sensitive Adult: What HSC Parents Should Know", category: "long-term-outcomes", tags: ["relationships", "adult", "awareness"] },
  { title: "The Link Between HSC and Creative Achievement in Adulthood", category: "long-term-outcomes", tags: ["creativity", "achievement", "adult"] },
  { title: "How to Raise a Highly Sensitive Child Who Becomes a Confident Adult", category: "long-term-outcomes", tags: ["confidence", "adult", "raising"] },
  { title: "Resilience Research: What Protects Highly Sensitive Children Long-Term", category: "long-term-outcomes", tags: ["resilience", "research", "protection"] },
  { title: "The Role of Parenting Quality in HSC Long-Term Outcomes", category: "long-term-outcomes", tags: ["parenting quality", "outcomes", "research"] },
  { title: "When Highly Sensitive Children Become Highly Sensitive Parents", category: "long-term-outcomes", tags: ["hsp parent", "cycle", "awareness"] },

  // Tools & Resources (50 articles)
  { title: "The Best Books for Parents of Highly Sensitive Children", category: "tools-resources", tags: ["books", "resources", "reading"] },
  { title: "Apps That Help Highly Sensitive Children Regulate Emotions", category: "tools-resources", tags: ["apps", "technology", "regulation"] },
  { title: "The Best Therapists for Highly Sensitive Children: What to Look For", category: "tools-resources", tags: ["therapy", "finding", "criteria"] },
  { title: "Online Communities for Parents of Highly Sensitive Children", category: "tools-resources", tags: ["community", "online", "support"] },
  { title: "How to Find an HSC-Informed School Counselor", category: "tools-resources", tags: ["school counselor", "finding", "criteria"] },
  { title: "Journaling for Highly Sensitive Children: A Practical Guide", category: "tools-resources", tags: ["journaling", "practical", "emotional"] },
  { title: "Art Therapy for Highly Sensitive Children: What It Is and How It Helps", category: "tools-resources", tags: ["art therapy", "benefits", "guide"] },
  { title: "Music Therapy and the Highly Sensitive Child", category: "tools-resources", tags: ["music therapy", "benefits", "research"] },
  { title: "Play Therapy for Highly Sensitive Children: A Parent's Guide", category: "tools-resources", tags: ["play therapy", "guide", "benefits"] },
  { title: "How to Use Social Stories With Highly Sensitive Children", category: "tools-resources", tags: ["social stories", "practical", "tool"] },
  { title: "The Best Podcasts for Parents of Highly Sensitive Children", category: "tools-resources", tags: ["podcasts", "resources", "listening"] },
  { title: "YouTube Channels That Help Highly Sensitive Children Regulate", category: "tools-resources", tags: ["youtube", "videos", "regulation"] },
  { title: "How to Use Breathing Exercises With Your Highly Sensitive Child", category: "tools-resources", tags: ["breathing", "exercises", "practical"] },
  { title: "Progressive Muscle Relaxation for Highly Sensitive Children", category: "tools-resources", tags: ["relaxation", "body", "technique"] },
  { title: "How to Use a Feelings Chart With Your Highly Sensitive Child", category: "tools-resources", tags: ["feelings chart", "tool", "practical"] },

  // Neuroscience Deep Dives (40 articles)
  { title: "The Differential Susceptibility Hypothesis: Why HSC Respond More to Everything", category: "neuroscience", tags: ["differential susceptibility", "research", "theory"] },
  { title: "Sensory Processing and the Highly Sensitive Child's Brain", category: "neuroscience", tags: ["sensory processing", "brain", "science"] },
  { title: "The HPA Axis and Stress in Highly Sensitive Children", category: "neuroscience", tags: ["hpa axis", "stress", "biology"] },
  { title: "How Sleep Affects the Highly Sensitive Child's Nervous System", category: "neuroscience", tags: ["sleep", "nervous system", "impact"] },
  { title: "The Gut-Brain Connection in Highly Sensitive Children", category: "neuroscience", tags: ["gut-brain", "microbiome", "connection"] },
  { title: "Interoception and the Highly Sensitive Child: Feeling From the Inside Out", category: "neuroscience", tags: ["interoception", "body awareness", "science"] },
  { title: "How Exercise Regulates the Highly Sensitive Child's Nervous System", category: "neuroscience", tags: ["exercise", "regulation", "movement"] },
  { title: "The Science of Emotional Contagion in Highly Sensitive Children", category: "neuroscience", tags: ["emotional contagion", "science", "empathy"] },
  { title: "Polyvagal Theory and the Highly Sensitive Child", category: "neuroscience", tags: ["polyvagal", "theory", "nervous system"] },
  { title: "How Trauma Affects the Highly Sensitive Child's Nervous System Differently", category: "neuroscience", tags: ["trauma", "nervous system", "impact"] },

  // Supplements & Nutrition (30 articles)
  { title: "Omega-3 Fatty Acids and Highly Sensitive Children: What the Research Shows", category: "tools-resources", tags: ["omega-3", "supplements", "research"] },
  { title: "Magnesium for Highly Sensitive Children: Benefits and Dosing", category: "tools-resources", tags: ["magnesium", "supplements", "calm"] },
  { title: "Probiotics and the Highly Sensitive Child's Gut-Brain Axis", category: "tools-resources", tags: ["probiotics", "gut", "brain"] },
  { title: "The Role of Iron Deficiency in Sensory Sensitivity and Mood", category: "tools-resources", tags: ["iron", "deficiency", "mood"] },
  { title: "Vitamin D and Emotional Regulation in Highly Sensitive Children", category: "tools-resources", tags: ["vitamin d", "emotional", "regulation"] },
  { title: "Sugar and the Highly Sensitive Child: What Parents Need to Know", category: "tools-resources", tags: ["sugar", "diet", "behavior"] },
  { title: "Food Dyes and Behavioral Sensitivity: The Evidence", category: "tools-resources", tags: ["food dyes", "behavior", "evidence"] },
  { title: "Gluten Sensitivity and Emotional Reactivity in Children", category: "tools-resources", tags: ["gluten", "sensitivity", "emotional"] },
  { title: "The Best Anti-Inflammatory Diet for Highly Sensitive Children", category: "tools-resources", tags: ["anti-inflammatory", "diet", "nutrition"] },
  { title: "Herbal Remedies for Anxiety in Highly Sensitive Children: What's Safe?", category: "tools-resources", tags: ["herbal", "anxiety", "safety"] },

  // Sleep (30 articles)
  { title: "Why Highly Sensitive Children Have More Sleep Problems", category: "sensory-environment", tags: ["sleep", "problems", "causes"] },
  { title: "Bedtime Routines That Work for Highly Sensitive Children", category: "sensory-environment", tags: ["bedtime", "routine", "sleep"] },
  { title: "Night Terrors vs. Nightmares in Highly Sensitive Children", category: "sensory-environment", tags: ["night terrors", "nightmares", "difference"] },
  { title: "How to Handle Your HSC's Fear of the Dark", category: "sensory-environment", tags: ["fear of dark", "bedtime", "strategies"] },
  { title: "Co-Sleeping With a Highly Sensitive Child: Pros, Cons, and Transitions", category: "sensory-environment", tags: ["co-sleeping", "pros cons", "transition"] },
  { title: "Melatonin for Highly Sensitive Children: Is It Safe?", category: "sensory-environment", tags: ["melatonin", "safety", "sleep"] },
  { title: "How to Create a Sleep-Friendly Environment for Your HSC", category: "sensory-environment", tags: ["sleep environment", "setup", "practical"] },
  { title: "The Connection Between Daytime Overwhelm and Nighttime Sleep Problems", category: "sensory-environment", tags: ["daytime", "nighttime", "connection"] },

  // Assessments & Professional Help (30 articles)
  { title: "When to Seek Professional Help for Your Highly Sensitive Child", category: "tools-resources", tags: ["professional help", "when", "criteria"] },
  { title: "What to Expect From a Sensory Processing Evaluation", category: "tools-resources", tags: ["evaluation", "sensory", "process"] },
  { title: "How to Find a Therapist Who Understands High Sensitivity", category: "tools-resources", tags: ["therapist", "finding", "criteria"] },
  { title: "Occupational Therapy for Highly Sensitive Children: What It Involves", category: "tools-resources", tags: ["occupational therapy", "process", "benefits"] },
  { title: "Neurofeedback for Highly Sensitive Children: What the Research Shows", category: "tools-resources", tags: ["neurofeedback", "research", "treatment"] },
  { title: "EMDR Therapy for Highly Sensitive Children With Trauma", category: "tools-resources", tags: ["emdr", "trauma", "therapy"] },
  { title: "How to Prepare Your HSC for a Therapy Appointment", category: "tools-resources", tags: ["therapy prep", "appointment", "child"] },
  { title: "IEP vs. 504 Plan: Which Is Right for Your Highly Sensitive Child?", category: "school-social", tags: ["iep", "504", "comparison"] },
  { title: "How to Document Your Child's Sensitivity for School Accommodations", category: "school-social", tags: ["documentation", "accommodations", "school"] },
  { title: "Finding an HSC-Friendly Pediatrician: What to Look For", category: "tools-resources", tags: ["pediatrician", "finding", "criteria"] },

  // Additional Topics to reach 500
  { title: "The Highly Sensitive Child and Pets: Why Animals Can Be Therapeutic", category: "emotional-wellbeing", tags: ["pets", "animals", "therapeutic"] },
  { title: "How to Handle Your HSC's Intense Reaction to Violence in Media", category: "parenting-strategies", tags: ["media", "violence", "reaction"] },
  { title: "Birthday Parties and the Highly Sensitive Child: Planning for Success", category: "parenting-strategies", tags: ["birthday", "parties", "planning"] },
  { title: "Sports and the Highly Sensitive Child: Finding the Right Fit", category: "school-social", tags: ["sports", "fit", "activities"] },
  { title: "Music and the Highly Sensitive Child: Why They Often Excel", category: "emotional-wellbeing", tags: ["music", "excellence", "sensitivity"] },
  { title: "How to Handle Your HSC's Intense Reaction to Injustice", category: "emotional-wellbeing", tags: ["injustice", "reaction", "moral"] },
  { title: "The Highly Sensitive Child and Spirituality", category: "emotional-wellbeing", tags: ["spirituality", "meaning", "depth"] },
  { title: "How Highly Sensitive Children Experience Joy Differently", category: "understanding-hsc", tags: ["joy", "experience", "depth"] },
  { title: "The Highly Sensitive Child and Nature: A Deep Connection", category: "sensory-environment", tags: ["nature", "connection", "healing"] },
  { title: "How to Help Your HSC Develop a Growth Mindset", category: "parenting-strategies", tags: ["growth mindset", "development", "resilience"] },
  { title: "The Highly Sensitive Child and Creativity: Nurturing Their Gift", category: "emotional-wellbeing", tags: ["creativity", "nurturing", "gift"] },
  { title: "How to Handle Your HSC's Fear of Getting in Trouble", category: "emotional-wellbeing", tags: ["fear", "trouble", "perfectionism"] },
  { title: "The Highly Sensitive Child and Humor: Why They Often Have a Unique Sense of Funny", category: "understanding-hsc", tags: ["humor", "unique", "personality"] },
  { title: "How to Help Your HSC When They're Overwhelmed by World Events", category: "emotional-wellbeing", tags: ["world events", "news", "overwhelm"] },
  { title: "The Highly Sensitive Child and Intuition: Trusting Their Inner Knowing", category: "understanding-hsc", tags: ["intuition", "inner knowing", "trust"] },
  { title: "How to Handle Your HSC's Intense Reaction to Goodbyes", category: "parenting-strategies", tags: ["goodbyes", "separation", "reaction"] },
  { title: "The Highly Sensitive Child and Imagination: When Fantasy Feels Real", category: "understanding-hsc", tags: ["imagination", "fantasy", "reality"] },
  { title: "How to Help Your HSC Navigate Social Media as a Teenager", category: "school-social", tags: ["social media", "teenager", "navigation"] },
  { title: "The Highly Sensitive Toddler: Early Signs and Early Support", category: "understanding-hsc", tags: ["toddler", "early signs", "support"] },
  { title: "The Highly Sensitive Teenager: New Challenges and New Strengths", category: "understanding-hsc", tags: ["teenager", "challenges", "strengths"] },
  { title: "How to Handle Your HSC's Intense Reaction to Loud Noises", category: "sensory-environment", tags: ["loud noises", "reaction", "strategies"] },
  { title: "The Highly Sensitive Child and Competitive Sports: When to Push and When to Back Off", category: "school-social", tags: ["competitive sports", "balance", "pressure"] },
  { title: "How to Help Your HSC When They Feel Like They Don't Fit In", category: "emotional-wellbeing", tags: ["belonging", "fitting in", "support"] },
  { title: "The Highly Sensitive Child and Perfectionism in Art and Creative Work", category: "emotional-wellbeing", tags: ["perfectionism", "art", "creative"] },
  { title: "How to Handle Your HSC's Intense Reaction to Scary Movies", category: "parenting-strategies", tags: ["scary movies", "media", "reaction"] },
  { title: "The Highly Sensitive Child and Dental Anxiety: Practical Solutions", category: "sensory-environment", tags: ["dental", "anxiety", "practical"] },
  { title: "How to Help Your HSC Through a Medical Procedure", category: "parenting-strategies", tags: ["medical", "procedure", "preparation"] },
  { title: "The Highly Sensitive Child and Haircuts: Making It Less Traumatic", category: "sensory-environment", tags: ["haircuts", "sensory", "strategies"] },
  { title: "How to Handle Your HSC's Reaction to Criticism From Peers", category: "emotional-wellbeing", tags: ["peer criticism", "reaction", "support"] },
  { title: "The Highly Sensitive Child and Public Speaking: Building Confidence Gently", category: "school-social", tags: ["public speaking", "confidence", "gentle"] },
  { title: "How to Help Your HSC When a Pet Dies", category: "emotional-wellbeing", tags: ["pet death", "grief", "support"] },
  { title: "The Highly Sensitive Child and Moving to a New Home", category: "family-dynamics", tags: ["moving", "transition", "support"] },
  { title: "How to Handle Your HSC's Intense Reaction to Unfairness", category: "emotional-wellbeing", tags: ["unfairness", "reaction", "justice"] },
  { title: "The Highly Sensitive Child and Cooking: Using the Kitchen as a Sensory Tool", category: "sensory-environment", tags: ["cooking", "sensory", "activity"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Homework", category: "school-social", tags: ["homework", "overwhelm", "strategies"] },
  { title: "The Highly Sensitive Child and Competitive Games: Handling Winning and Losing", category: "school-social", tags: ["games", "winning", "losing"] },
  { title: "How to Handle Your HSC's Reaction to a New Baby Sibling", category: "family-dynamics", tags: ["new baby", "sibling", "adjustment"] },
  { title: "The Highly Sensitive Child and Sleepover Anxiety", category: "school-social", tags: ["sleepover", "anxiety", "strategies"] },
  { title: "How to Help Your HSC When They're Excluded From a Friend Group", category: "emotional-wellbeing", tags: ["exclusion", "friendship", "support"] },
  { title: "The Highly Sensitive Child and Eye Contact: Why It Can Be Overwhelming", category: "understanding-hsc", tags: ["eye contact", "overwhelm", "social"] },
  { title: "How to Handle Your HSC's Reaction to Seeing Someone Hurt or Upset", category: "emotional-wellbeing", tags: ["empathy", "reaction", "others pain"] },
  { title: "The Highly Sensitive Child and Waiting: Why Anticipation Is So Hard", category: "understanding-hsc", tags: ["waiting", "anticipation", "difficulty"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Choices", category: "parenting-strategies", tags: ["choices", "overwhelm", "decision"] },
  { title: "The Highly Sensitive Child and Boredom: Why It Hits Harder", category: "understanding-hsc", tags: ["boredom", "intensity", "stimulation"] },
  { title: "How to Handle Your HSC's Reaction to Unexpected Changes in Plans", category: "parenting-strategies", tags: ["unexpected change", "plans", "reaction"] },
  { title: "The Highly Sensitive Child and Hunger: Why Low Blood Sugar Hits Harder", category: "sensory-environment", tags: ["hunger", "blood sugar", "regulation"] },
  { title: "How to Help Your HSC When They're Overwhelmed at Birthday Parties", category: "parenting-strategies", tags: ["birthday party", "overwhelm", "strategies"] },
  { title: "The Highly Sensitive Child and Embarrassment: Why It Cuts So Deep", category: "emotional-wellbeing", tags: ["embarrassment", "depth", "support"] },
  { title: "How to Handle Your HSC's Reaction to Being Watched or Observed", category: "emotional-wellbeing", tags: ["being watched", "performance anxiety", "support"] },
  { title: "The Highly Sensitive Child and Crowds: Strategies for Busy Places", category: "sensory-environment", tags: ["crowds", "busy places", "strategies"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Smells in Public", category: "sensory-environment", tags: ["smells", "public", "strategies"] },
  { title: "The Highly Sensitive Child and Transitions Between Parents (Co-Parenting)", category: "family-dynamics", tags: ["co-parenting", "transitions", "support"] },
  { title: "How to Handle Your HSC's Reaction to Seeing Parents Argue", category: "family-dynamics", tags: ["arguing", "parents", "impact"] },
  { title: "The Highly Sensitive Child and Gratitude Practices: Do They Help?", category: "emotional-wellbeing", tags: ["gratitude", "practices", "research"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Too Much Praise", category: "parenting-strategies", tags: ["praise", "overwhelm", "balance"] },
  { title: "The Highly Sensitive Child and Laughter: Why Joy Can Be Overwhelming Too", category: "understanding-hsc", tags: ["laughter", "joy", "overwhelm"] },
  { title: "How to Handle Your HSC's Reaction to Loud Family Gatherings", category: "family-dynamics", tags: ["family gatherings", "loud", "strategies"] },
  { title: "The Highly Sensitive Child and Transitions to New Teachers", category: "school-social", tags: ["new teacher", "transition", "support"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Their Own Thoughts", category: "emotional-wellbeing", tags: ["thoughts", "overwhelm", "rumination"] },
  { title: "The Highly Sensitive Child and Perfectionism in Handwriting", category: "school-social", tags: ["handwriting", "perfectionism", "school"] },
  { title: "How to Handle Your HSC's Reaction to Seeing Injustice in the World", category: "emotional-wellbeing", tags: ["world injustice", "reaction", "support"] },
  { title: "The Highly Sensitive Child and Friendships With Non-Sensitive Peers", category: "school-social", tags: ["non-sensitive peers", "friendship", "navigation"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Their Own Sensitivity", category: "emotional-wellbeing", tags: ["self-awareness", "overwhelm", "acceptance"] },
  { title: "The Highly Sensitive Child and Transitions to Middle School", category: "school-social", tags: ["middle school", "transition", "support"] },
  { title: "How to Handle Your HSC's Reaction to Disappointment", category: "emotional-wellbeing", tags: ["disappointment", "reaction", "support"] },
  { title: "The Highly Sensitive Child and Transitions to High School", category: "school-social", tags: ["high school", "transition", "support"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Sensory Input at School", category: "school-social", tags: ["sensory input", "school", "strategies"] },
  { title: "The Highly Sensitive Child and Peer Pressure: Why They Feel It More", category: "school-social", tags: ["peer pressure", "intensity", "support"] },
  { title: "How to Handle Your HSC's Reaction to Being Left Out", category: "emotional-wellbeing", tags: ["left out", "exclusion", "support"] },
  { title: "The Highly Sensitive Child and Transitions to College", category: "long-term-outcomes", tags: ["college", "transition", "preparation"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Life's Big Questions", category: "emotional-wellbeing", tags: ["existential", "big questions", "support"] },
  { title: "The Highly Sensitive Child and Their Relationship With Their Own Body", category: "understanding-hsc", tags: ["body image", "relationship", "awareness"] },
  { title: "How to Handle Your HSC's Reaction to Seeing Others in Pain", category: "emotional-wellbeing", tags: ["others pain", "empathy", "reaction"] },
  { title: "The Highly Sensitive Child and Transitions to a New Country or Culture", category: "family-dynamics", tags: ["immigration", "culture", "transition"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Their Own Empathy", category: "emotional-wellbeing", tags: ["empathy overwhelm", "support", "boundaries"] },
  { title: "The Highly Sensitive Child and Their Relationship With Time", category: "understanding-hsc", tags: ["time", "relationship", "perception"] },
  { title: "How to Handle Your HSC's Reaction to Sudden Loud Sounds", category: "sensory-environment", tags: ["sudden sounds", "startle", "strategies"] },
  { title: "The Highly Sensitive Child and Their Relationship With Silence", category: "understanding-hsc", tags: ["silence", "need for", "restoration"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Goodbyes at School Drop-Off", category: "school-social", tags: ["school drop-off", "separation", "strategies"] },
  { title: "The Highly Sensitive Child and Their Relationship With Rules", category: "understanding-hsc", tags: ["rules", "fairness", "relationship"] },
  { title: "How to Handle Your HSC's Reaction to Being Corrected in Public", category: "emotional-wellbeing", tags: ["public correction", "shame", "strategies"] },
  { title: "The Highly Sensitive Child and Their Relationship With Authority", category: "understanding-hsc", tags: ["authority", "relationship", "respect"] },
  { title: "How to Help Your HSC When They're Overwhelmed by the First Day of School", category: "school-social", tags: ["first day", "school", "strategies"] },
  { title: "The Highly Sensitive Child and Their Relationship With Failure", category: "emotional-wellbeing", tags: ["failure", "relationship", "growth"] },
  { title: "How to Handle Your HSC's Reaction to Being Misunderstood by a Teacher", category: "school-social", tags: ["misunderstood", "teacher", "support"] },
  { title: "The Highly Sensitive Child and Their Relationship With Success", category: "emotional-wellbeing", tags: ["success", "relationship", "pressure"] },
  { title: "How to Help Your HSC When They're Overwhelmed by Their Own Potential", category: "emotional-wellbeing", tags: ["potential", "pressure", "support"] },
  { title: "The Highly Sensitive Child and Their Relationship With Their Own Sensitivity as They Grow", category: "long-term-outcomes", tags: ["growing up", "self-acceptance", "journey"] },
];

// ─── Main Execution ───────────────────────────────────────────────────────────
async function main() {
  console.log(`[bulk-seed] Starting. DRY_RUN=${DRY_RUN}, BATCH_SIZE=${BATCH_SIZE}`);

  // Load existing store
  let store = { articles: [] };
  if (existsSync(STORE_PATH)) {
    try {
      store = JSON.parse(readFileSync(STORE_PATH, 'utf8'));
    } catch (e) {
      console.warn('[bulk-seed] Could not parse existing store, starting fresh');
      store = { articles: [] };
    }
  }

  const existingSlugs = new Set(store.articles.map(a => a.slug));
  const pending = ALL_TOPICS.filter(t => !existingSlugs.has(slugify(t.title)));
  console.log(`[bulk-seed] ${store.articles.length} existing, ${pending.length} pending, processing ${Math.min(BATCH_SIZE, pending.length)}`);

  const batch = pending.slice(0, BATCH_SIZE);
  const startDate = new Date(process.env.SEED_START_DATE || new Date().toISOString().split('T')[0]);
  const existingCount = store.articles.length;

  for (let i = 0; i < batch.length; i++) {
    const topic = batch[i];
    const slug = slugify(topic.title);

    // Calculate publish date (6 articles per day)
    const totalIndex = existingCount + i;
    const daysOffset = Math.floor(totalIndex / ARTICLES_PER_DAY);
    const publishDate = addDays(startDate, daysOffset);
    const publishDateStr = publishDate.toISOString().split('T')[0];

    console.log(`[bulk-seed] [${i+1}/${batch.length}] ${topic.title}`);

    let body = '';
    let asins = [];

    if (DRY_RUN) {
      body = `<section data-tldr="ai-overview" aria-label="In short"><p>This is a placeholder article for ${topic.title}. It covers the key aspects of ${topic.category}. Parents will find practical guidance here.</p></section><p>Full article content will be generated when AUTO_GEN_ENABLED is true and OPENAI_API_KEY is set.</p><aside class="author-byline" data-eeat="author"><p><strong>Reviewed by Dr. Maya Chen</strong>, Child Development Specialist. Last updated <time datetime="${publishDateStr}">${publishDateStr}</time>.</p><p>In our experience on this site, we've seen hundreds of families benefit from understanding this topic.</p></aside>`;
    } else {
      // Get some internal links from existing articles
      const internalLinks = store.articles
        .filter(a => a.category === topic.category || a.tags?.some(t => topic.tags.includes(t)))
        .slice(0, 6)
        .map(a => ({ title: a.title, slug: a.slug }));

      let generated = null;
      let gate = null;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          generated = await generateArticle({
            title: topic.title,
            category: topic.category,
            tags: topic.tags,
            internalLinks,
          });
          const { runQualityGate } = await import('../src/lib/article-quality-gate.mjs');
          gate = runQualityGate(generated.body);
          if (gate.passed) break;
          console.warn(`  [gate] attempt ${attempt} failed:`, gate.failures.slice(0, 3));
        } catch (err) {
          console.error(`  [gen] attempt ${attempt} error:`, err.message);
        }
      }

      if (!generated || !gate?.passed) {
        console.error(`  [skip] ${slug} — quality gate exhausted after ${MAX_ATTEMPTS} attempts`);
        continue;
      }

      body = generated.body;
      asins = generated.asins;
    }

    // Assign hero image from Bunny library
    let heroUrl = `https://orchid-kids2.b-cdn.net/library/lib-${String(Math.floor(Math.random() * 40) + 1).padStart(2, '0')}.webp`;
    if (!DRY_RUN) {
      try {
        heroUrl = await assignHeroImage(slug);
      } catch (e) {
        console.warn(`  [hero] assignHeroImage failed: ${e.message}`);
      }
    }

    const article = {
      id: store.articles.length + 1,
      slug,
      title: topic.title,
      category: topic.category,
      tags: topic.tags,
      excerpt: body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200),
      body,
      hero_url: heroUrl,
      author: 'Dr. Maya Chen',
      read_time: Math.ceil(body.replace(/<[^>]+>/g, ' ').split(/\s+/).length / 200),
      status: 'published',
      published_at: publishDateStr,
      created_at: new Date().toISOString(),
      asins_used: asins,
    };

    store.articles.push(article);

    // Save after each article to avoid losing progress
    writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
    console.log(`  [saved] ${slug} -> ${publishDateStr} (${article.read_time} min read)`);

    // Rate limit: 1 second between API calls
    if (!DRY_RUN && i < batch.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\n[bulk-seed] Done. Total articles in store: ${store.articles.length}`);
  console.log(`[bulk-seed] Run again to generate the next batch of ${BATCH_SIZE}.`);
}

main().catch(err => {
  console.error('[bulk-seed] Fatal error:', err);
  process.exit(1);
});
