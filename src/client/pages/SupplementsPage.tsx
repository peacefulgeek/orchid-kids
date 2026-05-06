import React, { useState } from 'react';

const CDN = 'https://orchid-kids2.b-cdn.net';
const TAG = 'spankyspinola-20';

interface Supplement {
  name: string;
  category: string;
  benefit: string;
  evidence: 'Strong' | 'Moderate' | 'Emerging' | 'Traditional';
  dosage: string;
  caution?: string;
  asin?: string;
  image?: string;
}

const SUPPLEMENTS: Supplement[] = [
  // ─── Minerals ────────────────────────────────────────────────────────────────
  { name: 'Magnesium Glycinate', category: 'Minerals', benefit: 'Calms the nervous system, improves sleep, reduces anxiety and muscle tension. One of the most evidence-backed supplements for sensitive nervous systems.', evidence: 'Strong', dosage: '100–200mg elemental magnesium before bed', caution: 'Start low. Loose stools at high doses.', asin: 'B00YOIWS8M' },
  { name: 'Magnesium L-Threonate', category: 'Minerals', benefit: 'Crosses the blood-brain barrier more effectively than other forms. Supports memory, learning, and cognitive function.', evidence: 'Moderate', dosage: '1,500–2,000mg/day (provides ~144mg elemental Mg)', asin: 'B00DMFNPQE' },
  { name: 'Zinc Bisglycinate', category: 'Minerals', benefit: 'Essential for neurotransmitter function, immune health, and sensory processing. Deficiency linked to increased anxiety and sensory sensitivity.', evidence: 'Moderate', dosage: '5–10mg/day for children', caution: 'Do not exceed recommended dose. Take with food.', asin: 'B07CBJQZPQ' },
  { name: 'Iron (Ferrous Bisglycinate)', category: 'Minerals', benefit: 'Iron deficiency is common in sensitive children and linked to restless legs, poor sleep, and increased emotional reactivity. Test before supplementing.', evidence: 'Strong', dosage: 'Per lab results and pediatrician guidance', caution: 'Always test ferritin levels first. Iron overload is harmful.', asin: 'B00CKWGQCO' },
  { name: 'Selenium', category: 'Minerals', benefit: 'Supports thyroid function and antioxidant defense. Low selenium linked to anxiety and mood dysregulation.', evidence: 'Moderate', dosage: '20–55mcg/day for children', caution: 'Do not exceed upper limit. Brazil nuts are a food source.', asin: 'B001G7QR72' },
  { name: 'Calcium (Calcium Citrate)', category: 'Minerals', benefit: 'Works synergistically with magnesium for nervous system function. Citrate form is better absorbed than carbonate.', evidence: 'Moderate', dosage: '500–1000mg/day, taken with Vitamin D', asin: 'B000GG87WY' },
  { name: 'Chromium Picolinate', category: 'Minerals', benefit: 'Supports blood sugar regulation, which directly affects mood stability and emotional reactivity in sensitive children.', evidence: 'Moderate', dosage: '25–50mcg/day for children', asin: 'B00GSTXKQM' },
  { name: 'Iodine', category: 'Minerals', benefit: 'Essential for thyroid function and brain development. Deficiency is more common than recognized and affects mood and cognitive function.', evidence: 'Moderate', dosage: 'Per pediatrician guidance; food sources preferred', caution: 'Test thyroid function before supplementing.', asin: 'B00BJKZFWM' },
  { name: 'Copper (low dose)', category: 'Minerals', benefit: 'Required for dopamine and norepinephrine synthesis. Imbalance (too high or too low) affects mood and sensory processing.', evidence: 'Emerging', dosage: '0.5–1mg/day; usually obtained from diet', caution: 'Copper/zinc balance is important. Test before supplementing.', asin: 'B07BBBMFVZ' },
  { name: 'Manganese', category: 'Minerals', benefit: 'Cofactor for superoxide dismutase and neurotransmitter metabolism. Involved in sensory processing pathways.', evidence: 'Emerging', dosage: '1–2mg/day from food sources preferred', caution: 'Excess manganese is neurotoxic. Food sources are safer.', asin: 'B07BBBMFVZ' },

  // ─── Vitamins ─────────────────────────────────────────────────────────────────
  { name: 'Vitamin D3 + K2', category: 'Vitamins', benefit: 'Vitamin D deficiency is epidemic and directly linked to anxiety, depression, and immune dysregulation. K2 ensures calcium goes to bones, not arteries.', evidence: 'Strong', dosage: '1,000–2,000 IU D3/day for children; test 25-OH-D levels', caution: 'Test levels before supplementing. Take with fat.', asin: 'B00JGCBGIQ' },
  { name: 'Vitamin B6 (P5P form)', category: 'Vitamins', benefit: "Pyridoxal-5-phosphate is the active form of B6. Essential for serotonin, GABA, and dopamine synthesis. Particularly relevant for children with anxiety and sensory sensitivity.", evidence: 'Strong', dosage: '10–25mg/day P5P for children', caution: 'High doses (>100mg) can cause nerve damage. Stay within range.', asin: 'B00CKWGQCO' },
  { name: 'Vitamin B12 (Methylcobalamin)', category: 'Vitamins', benefit: 'Methylcobalamin is the active form. Essential for myelin formation, nervous system function, and methylation. Deficiency causes neurological symptoms.', evidence: 'Strong', dosage: '500–1,000mcg/day sublingual for children', asin: 'B00CKWGQCO' },
  { name: 'Folate (Methylfolate, not Folic Acid)', category: 'Vitamins', benefit: 'Active folate (5-MTHF) is critical for neurotransmitter synthesis and methylation. MTHFR gene variants (common) impair folic acid conversion.', evidence: 'Strong', dosage: '400–800mcg methylfolate/day', caution: 'Use methylfolate, not synthetic folic acid, especially if MTHFR variant suspected.', asin: 'B00VGBXFIG' },
  { name: 'Vitamin B1 (Thiamine)', category: 'Vitamins', benefit: 'Essential for energy metabolism in the brain. Deficiency causes irritability, anxiety, and cognitive fog.', evidence: 'Moderate', dosage: '10–25mg/day for children', asin: 'B00CKWGQCO' },
  { name: 'Vitamin B2 (Riboflavin)', category: 'Vitamins', benefit: 'Required for mitochondrial function and activation of B6 and folate. Deficiency linked to migraines and mood dysregulation.', evidence: 'Moderate', dosage: '10–25mg/day for children', asin: 'B00CKWGQCO' },
  { name: 'Vitamin B3 (Niacinamide)', category: 'Vitamins', benefit: 'Niacinamide (not niacin) supports GABA receptors and has anxiolytic properties. Used historically for anxiety and sleep.', evidence: 'Moderate', dosage: '100–250mg niacinamide/day for children', caution: 'Use niacinamide form, not niacin (which causes flushing).', asin: 'B07BBBMFVZ' },
  { name: 'Vitamin B5 (Pantothenic Acid)', category: 'Vitamins', benefit: 'Essential for adrenal function and stress hormone production. Supports the stress response system.', evidence: 'Moderate', dosage: '50–100mg/day for children', asin: 'B00CKWGQCO' },
  { name: 'Vitamin C (Buffered)', category: 'Vitamins', benefit: 'Antioxidant and cofactor for neurotransmitter synthesis. Buffered form (calcium ascorbate) is gentler on sensitive stomachs.', evidence: 'Moderate', dosage: '250–500mg/day for children', asin: 'B00CKWGQCO' },
  { name: 'Vitamin E (Mixed Tocopherols)', category: 'Vitamins', benefit: 'Antioxidant protection for neural tissue. Mixed tocopherols (not just alpha-tocopherol) provide broader protection.', evidence: 'Moderate', dosage: '50–100 IU/day for children', caution: 'Use mixed tocopherols. High-dose alpha-tocopherol alone may be counterproductive.', asin: 'B00CKWGQCO' },
  { name: 'Vitamin A (Retinol)', category: 'Vitamins', benefit: 'Essential for nervous system development and immune function. Deficiency affects sensory processing.', evidence: 'Moderate', dosage: '1,000–2,000 IU/day from food or supplement', caution: 'Do not exceed upper limits. Preformed retinol only from supplements.', asin: 'B00CKWGQCO' },
  { name: 'Choline (CDP-Choline or Alpha-GPC)', category: 'Vitamins', benefit: 'Precursor to acetylcholine, the neurotransmitter of attention and learning. Essential for brain development.', evidence: 'Moderate', dosage: '100–250mg/day CDP-choline for children', asin: 'B07BBBMFVZ' },
  { name: 'Inositol', category: 'Vitamins', benefit: 'Acts on serotonin and GABA receptors. Research supports its use for anxiety, OCD-like behaviors, and panic. Well-tolerated.', evidence: 'Moderate', dosage: '500mg–2g/day for children (start low)', asin: 'B07BBBMFVZ' },
  { name: 'Biotin (B7)', category: 'Vitamins', benefit: 'Required for fatty acid synthesis and neurological function. Deficiency linked to neurological symptoms.', evidence: 'Moderate', dosage: '100–300mcg/day for children', asin: 'B00CKWGQCO' },

  // ─── Omega Fatty Acids ────────────────────────────────────────────────────────
  { name: 'Omega-3 (EPA + DHA)', category: 'Omega Fatty Acids', benefit: 'The most evidence-backed supplement for child brain development, mood, and behavior. EPA reduces inflammation and supports emotional regulation; DHA builds brain structure.', evidence: 'Strong', dosage: '500–1,000mg EPA+DHA/day for children', caution: 'Use molecularly distilled fish oil to minimize mercury. Algae-based for vegetarians.', asin: 'B07BBBMFVZ' },
  { name: 'DHA (Algae-Based)', category: 'Omega Fatty Acids', benefit: 'Plant-based DHA from algae — the original source of omega-3 in fish. Ideal for vegetarian or vegan families.', evidence: 'Strong', dosage: '200–500mg DHA/day for children', asin: 'B07BBBMFVZ' },
  { name: 'GLA (Evening Primrose Oil)', category: 'Omega Fatty Acids', benefit: 'Gamma-linolenic acid supports anti-inflammatory pathways and skin barrier function. Useful for sensitive children with eczema or inflammatory conditions.', evidence: 'Moderate', dosage: '500–1,000mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Phosphatidylserine', category: 'Omega Fatty Acids', benefit: 'Phospholipid component of neural cell membranes. Supports cognitive function, stress response, and ADHD-like symptoms.', evidence: 'Moderate', dosage: '100–200mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Phosphatidylcholine', category: 'Omega Fatty Acids', benefit: 'Supports cell membrane integrity and acetylcholine production. Important for nervous system function.', evidence: 'Moderate', dosage: '500–1,000mg/day for children', asin: 'B07BBBMFVZ' },

  // ─── Amino Acids ──────────────────────────────────────────────────────────────
  { name: 'L-Theanine', category: 'Amino Acids', benefit: 'Promotes calm alertness without sedation. Increases alpha brain waves and GABA. Found naturally in green tea. Well-studied for anxiety in children.', evidence: 'Strong', dosage: '100–200mg/day for children', caution: 'Generally very well tolerated. May enhance effects of sedatives.', asin: 'B07BBBMFVZ' },
  { name: 'GABA (Gamma-Aminobutyric Acid)', category: 'Amino Acids', benefit: "The brain's primary inhibitory neurotransmitter. Oral GABA has limited blood-brain barrier crossing, but may work via gut-brain axis. Calming effect.", evidence: 'Moderate', dosage: '100–250mg/day for children', caution: 'Pharmaceutical GABA has limited evidence for crossing BBB. Pharma-GABA form may be more effective.', asin: 'B07BBBMFVZ' },
  { name: 'L-Tryptophan', category: 'Amino Acids', benefit: 'Precursor to serotonin and melatonin. Supports mood, sleep, and emotional regulation. More direct than 5-HTP for some children.', evidence: 'Moderate', dosage: '500–1,000mg/day for children (with carbohydrate)', caution: 'Do not combine with SSRIs or MAOIs. Take away from protein meals.', asin: 'B07BBBMFVZ' },
  { name: '5-HTP (5-Hydroxytryptophan)', category: 'Amino Acids', benefit: 'Direct precursor to serotonin. Supports mood, sleep onset, and emotional regulation. More potent than tryptophan.', evidence: 'Moderate', dosage: '25–50mg/day for children (start very low)', caution: 'Do not combine with SSRIs, MAOIs, or other serotonergic agents. Start very low.', asin: 'B07BBBMFVZ' },
  { name: 'L-Tyrosine', category: 'Amino Acids', benefit: 'Precursor to dopamine, norepinephrine, and thyroid hormones. Supports focus, motivation, and stress resilience.', evidence: 'Moderate', dosage: '250–500mg/day for children', caution: 'Avoid if child has phenylketonuria (PKU). Take away from protein meals.', asin: 'B07BBBMFVZ' },
  { name: 'Glycine', category: 'Amino Acids', benefit: 'Inhibitory neurotransmitter and sleep promoter. Improves sleep quality and reduces anxiety. Very well tolerated.', evidence: 'Moderate', dosage: '1–3g/day for children', asin: 'B07BBBMFVZ' },
  { name: 'N-Acetyl Cysteine (NAC)', category: 'Amino Acids', benefit: 'Precursor to glutathione (master antioxidant). Supports OCD-like behaviors, anxiety, and oxidative stress in sensitive nervous systems.', evidence: 'Moderate', dosage: '300–600mg/day for children', caution: 'May cause nausea at higher doses. Take with food.', asin: 'B07BBBMFVZ' },
  { name: 'L-Glutamine', category: 'Amino Acids', benefit: 'Gut-healing amino acid that also serves as a GABA precursor. Supports gut-brain axis health in sensitive children.', evidence: 'Moderate', dosage: '1–3g/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Taurine', category: 'Amino Acids', benefit: 'Inhibitory amino acid that modulates GABA and glycine receptors. Calming, anti-anxiety, and neuroprotective.', evidence: 'Moderate', dosage: '250–500mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'L-Carnitine', category: 'Amino Acids', benefit: 'Supports mitochondrial energy production in brain cells. Useful for children with fatigue, brain fog, and attention difficulties.', evidence: 'Moderate', dosage: '250–500mg/day for children', asin: 'B07BBBMFVZ' },

  // ─── Adaptogens ───────────────────────────────────────────────────────────────
  { name: 'Ashwagandha (KSM-66)', category: 'Adaptogens', benefit: 'The most studied adaptogen for stress and anxiety. Reduces cortisol, supports thyroid function, and improves sleep quality. KSM-66 is the most researched extract.', evidence: 'Strong', dosage: '150–300mg KSM-66/day for children', caution: 'Avoid in thyroid conditions without medical supervision. Not for pregnant women.', asin: 'B07BBBMFVZ' },
  { name: 'Rhodiola Rosea', category: 'Adaptogens', benefit: 'Adaptogen that reduces stress-induced fatigue and improves resilience. Particularly useful for the exhaustion that follows overstimulation.', evidence: 'Moderate', dosage: '50–100mg/day for children (standardized to 3% rosavins)', caution: 'Stimulating for some children. Give in morning. Avoid in bipolar disorder.', asin: 'B07BBBMFVZ' },
  { name: 'Holy Basil (Tulsi)', category: 'Adaptogens', benefit: 'Ayurvedic adaptogen with anti-anxiety and anti-inflammatory properties. Supports cortisol balance and cognitive function.', evidence: 'Moderate', dosage: '150–300mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Eleuthero (Siberian Ginseng)', category: 'Adaptogens', benefit: 'Mild adaptogen that supports stress resilience and immune function. Gentler than Panax ginseng for children.', evidence: 'Moderate', dosage: '100–200mg/day for children', caution: 'Avoid in children under 12 without supervision.', asin: 'B07BBBMFVZ' },
  { name: 'Schisandra Berry', category: 'Adaptogens', benefit: 'Five-flavor berry used in TCM for stress resilience, liver support, and cognitive function. Adaptogenic and neuroprotective.', evidence: 'Moderate', dosage: '100–200mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Astragalus', category: 'Adaptogens', benefit: 'Immune-modulating adaptogen with anti-inflammatory properties. Supports the immune system in children prone to illness from stress.', evidence: 'Moderate', dosage: '150–300mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Maca Root', category: 'Adaptogens', benefit: 'Andean adaptogen that supports energy, mood, and hormonal balance. Nutritionally dense with minerals and amino acids.', evidence: 'Moderate', dosage: '500–1,000mg/day for children', caution: 'Avoid in hormone-sensitive conditions.', asin: 'B07BBBMFVZ' },
  { name: 'Licorice Root (DGL)', category: 'Adaptogens', benefit: 'DGL (deglycyrrhizinated) licorice supports adrenal function and gut health. Useful for children with adrenal fatigue patterns.', evidence: 'Moderate', dosage: '150–300mg DGL/day for children', caution: 'Use DGL form only. Whole licorice root can raise blood pressure.', asin: 'B07BBBMFVZ' },

  // ─── Herbs for Calm & Sleep ───────────────────────────────────────────────────
  { name: 'Lemon Balm (Melissa officinalis)', category: 'Calming Herbs', benefit: 'Gentle nervine herb with GABA-modulating properties. Reduces anxiety, improves sleep, and calms the nervous system. Well-studied in children.', evidence: 'Moderate', dosage: '80–160mg extract/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Passionflower (Passiflora incarnata)', category: 'Calming Herbs', benefit: 'Increases GABA levels in the brain. Reduces anxiety and improves sleep quality. Comparable to some pharmaceutical anxiolytics in studies.', evidence: 'Moderate', dosage: '100–200mg/day for children', caution: 'May cause drowsiness. Do not combine with sedatives.', asin: 'B07BBBMFVZ' },
  { name: 'Valerian Root', category: 'Calming Herbs', benefit: 'GABA-modulating herb for sleep and anxiety. Most effective for sleep onset. Paradoxically stimulating in some children.', evidence: 'Moderate', dosage: '100–200mg/day for children (bedtime)', caution: 'May cause paradoxical excitement in some children. Start with low dose.', asin: 'B07BBBMFVZ' },
  { name: 'Chamomile (German)', category: 'Calming Herbs', benefit: 'Gentle nervine and anti-inflammatory herb. Apigenin binds GABA receptors. Safe for young children as tea or extract.', evidence: 'Moderate', dosage: 'Tea: 1-2 cups/day. Extract: 50-100mg/day for children', caution: 'Avoid in ragweed allergy.', asin: 'B07BBBMFVZ' },
  { name: 'Lavender (Silexan)', category: 'Calming Herbs', benefit: 'Oral lavender oil (Silexan) has strong clinical evidence for anxiety reduction. Works via calcium channel modulation, not sedation.', evidence: 'Strong', dosage: '80mg Silexan/day for older children (10+)', caution: 'Silexan is the studied oral form. Aromatherapy has different evidence base.', asin: 'B07BBBMFVZ' },
  { name: 'Skullcap (Scutellaria lateriflora)', category: 'Calming Herbs', benefit: 'Traditional nervine herb that modulates GABA receptors. Reduces anxiety and nervous system excitability.', evidence: 'Emerging', dosage: '100–200mg/day for children', caution: 'Ensure product is free of germander contamination (liver toxicity risk).', asin: 'B07BBBMFVZ' },
  { name: 'California Poppy', category: 'Calming Herbs', benefit: 'Gentle nervine (not related to opium poppy). Reduces anxiety and promotes sleep without addiction risk.', evidence: 'Traditional', dosage: '100–200mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Hops (Humulus lupulus)', category: 'Calming Herbs', benefit: 'Sedative herb that works synergistically with valerian. Supports sleep onset and reduces nervous tension.', evidence: 'Moderate', dosage: '100–200mg/day for children (bedtime)', caution: 'May cause drowsiness. Not for children under 6.', asin: 'B07BBBMFVZ' },
  { name: 'Kava Kava', category: 'Calming Herbs', benefit: 'Potent anxiolytic herb with strong clinical evidence. Kavalactones modulate GABA receptors. Not recommended for children under 18.', evidence: 'Strong', dosage: 'Adults only: 70–250mg kavalactones/day', caution: 'NOT recommended for children. Liver toxicity risk with excessive use. Adults only.', asin: 'B07BBBMFVZ' },
  { name: 'Motherwort (Leonurus cardiaca)', category: 'Calming Herbs', benefit: 'Traditional nervine for anxiety, palpitations, and nervous tension. Particularly useful for anxiety with physical symptoms.', evidence: 'Traditional', dosage: '100–200mg/day for older children (12+)', caution: 'Avoid in pregnancy. Not for young children.', asin: 'B07BBBMFVZ' },

  // ─── TCM Herbs ────────────────────────────────────────────────────────────────
  { name: 'Suan Zao Ren (Ziziphus Seed)', category: 'TCM Herbs', benefit: 'Primary TCM herb for insomnia and anxiety. Nourishes Heart and Liver yin. Clinically studied for sleep and anxiety in modern research.', evidence: 'Moderate', dosage: '3–9g dried seed/day or equivalent extract', asin: 'B07BBBMFVZ' },
  { name: 'Bai Zi Ren (Biota Seed)', category: 'TCM Herbs', benefit: 'TCM herb for calming the mind, nourishing Heart yin, and supporting sleep. Often combined with Suan Zao Ren.', evidence: 'Traditional', dosage: '3–9g dried seed/day or equivalent extract', asin: 'B07BBBMFVZ' },
  { name: 'Yuan Zhi (Polygala Root)', category: 'TCM Herbs', benefit: 'TCM herb for calming the mind and supporting cognitive function. Modern research shows neuroprotective and anxiolytic properties.', evidence: 'Moderate', dosage: '3–9g dried root/day or equivalent extract', asin: 'B07BBBMFVZ' },
  { name: 'He Huan Pi (Mimosa Bark)', category: 'TCM Herbs', benefit: 'TCM herb known as "collective happiness bark." Used for anxiety, depression, and emotional dysregulation.', evidence: 'Traditional', dosage: '6–15g dried bark/day or equivalent extract', asin: 'B07BBBMFVZ' },
  { name: 'Long Yan Rou (Longan Fruit)', category: 'TCM Herbs', benefit: 'TCM tonic for Heart and Spleen qi. Supports memory, sleep, and emotional stability. Gentle enough for children.', evidence: 'Traditional', dosage: '9–15g dried fruit/day or as food', asin: 'B07BBBMFVZ' },
  { name: 'Fu Shen (Poria with Pine Root)', category: 'TCM Herbs', benefit: 'TCM herb for calming the mind and supporting the nervous system. Gentler than Fu Ling alone for anxious children.', evidence: 'Traditional', dosage: '9–15g/day or equivalent extract', asin: 'B07BBBMFVZ' },
  { name: 'Bai Shao (White Peony Root)', category: 'TCM Herbs', benefit: 'Nourishes Liver blood and yin. Used for emotional sensitivity, irritability, and muscle tension in sensitive children.', evidence: 'Traditional', dosage: '6–15g/day or equivalent extract', asin: 'B07BBBMFVZ' },
  { name: 'Dang Gui (Angelica Sinensis)', category: 'TCM Herbs', benefit: 'Nourishes blood and supports emotional regulation. Used in TCM for children with blood deficiency patterns showing anxiety and poor sleep.', evidence: 'Traditional', dosage: '3–9g/day or equivalent extract', caution: 'Avoid in acute illness. Consult TCM practitioner.', asin: 'B07BBBMFVZ' },
  { name: 'Huang Qi (Astragalus)', category: 'TCM Herbs', benefit: 'Tonifies Wei qi (defensive energy) and supports immune function. Used for children who are frequently ill from stress.', evidence: 'Moderate', dosage: '9–30g/day or equivalent extract', asin: 'B07BBBMFVZ' },
  { name: 'Ren Shen (Panax Ginseng)', category: 'TCM Herbs', benefit: 'Tonifies qi and supports cognitive function. Used in TCM for children with qi deficiency patterns. More stimulating than American ginseng.', evidence: 'Moderate', dosage: '1–3g/day for children (use cautiously)', caution: 'Can be stimulating. Use American ginseng for a gentler effect. Not for children under 10.', asin: 'B07BBBMFVZ' },
  { name: 'Xi Yang Shen (American Ginseng)', category: 'TCM Herbs', benefit: 'Gentler than Panax ginseng. Tonifies qi and yin, supports cognitive function and stress resilience without overstimulation.', evidence: 'Moderate', dosage: '1–3g/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Ling Zhi (Reishi Mushroom)', category: 'TCM Herbs', benefit: 'The "mushroom of immortality." Immune-modulating, anti-inflammatory, and calming. Supports sleep and reduces anxiety.', evidence: 'Moderate', dosage: '1–3g/day dried mushroom or equivalent extract', asin: 'B07BBBMFVZ' },
  { name: 'Chai Hu (Bupleurum)', category: 'TCM Herbs', benefit: 'TCM herb for Liver qi stagnation — the pattern associated with emotional repression, frustration, and anxiety in sensitive children.', evidence: 'Traditional', dosage: '3–9g/day or equivalent extract', caution: 'Consult TCM practitioner for appropriate formula.', asin: 'B07BBBMFVZ' },

  // ─── Mushrooms ────────────────────────────────────────────────────────────────
  { name: "Lion's Mane (Hericium erinaceus)", category: 'Medicinal Mushrooms', benefit: 'Stimulates Nerve Growth Factor (NGF) production. Supports cognitive function, focus, and nervous system repair. Emerging evidence for anxiety reduction.', evidence: 'Moderate', dosage: '500–1,000mg/day for children (dual-extract)', asin: 'B07BBBMFVZ' },
  { name: 'Reishi (Ganoderma lucidum)', category: 'Medicinal Mushrooms', benefit: 'Immune-modulating, anti-inflammatory, and calming. Supports sleep quality and reduces anxiety. One of the most studied medicinal mushrooms.', evidence: 'Moderate', dosage: '500–1,000mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Chaga (Inonotus obliquus)', category: 'Medicinal Mushrooms', benefit: 'Potent antioxidant and immune modulator. Reduces oxidative stress in the nervous system. Anti-inflammatory.', evidence: 'Emerging', dosage: '500–1,000mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Cordyceps', category: 'Medicinal Mushrooms', benefit: 'Supports energy production and oxygen utilization. Useful for children with fatigue and low energy from chronic stress.', evidence: 'Moderate', dosage: '500–1,000mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Turkey Tail (Trametes versicolor)', category: 'Medicinal Mushrooms', benefit: 'Immune-modulating mushroom with prebiotic properties. Supports gut microbiome health, which directly affects mood and anxiety.', evidence: 'Moderate', dosage: '500–1,000mg/day for children', asin: 'B07BBBMFVZ' },

  // ─── Gut Health ───────────────────────────────────────────────────────────────
  { name: 'Probiotics (Multi-strain)', category: 'Gut Health', benefit: "The gut-brain axis is central to emotional regulation. Specific strains (Lactobacillus rhamnosus, L. helveticus, Bifidobacterium longum) have clinical evidence for anxiety reduction.", evidence: 'Strong', dosage: '5–20 billion CFU/day, multi-strain', caution: 'Refrigerate. Start slowly to avoid digestive upset.', asin: 'B07BBBMFVZ' },
  { name: 'Lactobacillus rhamnosus (JB-1)', category: 'Gut Health', benefit: 'The most studied probiotic for anxiety and mood. Reduces anxiety-like behavior and alters GABA receptor expression in animal models.', evidence: 'Moderate', dosage: '1–10 billion CFU/day', asin: 'B07BBBMFVZ' },
  { name: 'Bifidobacterium longum (1714)', category: 'Gut Health', benefit: 'Clinical evidence for stress reduction and improved cognitive performance under stress in humans.', evidence: 'Moderate', dosage: '1–10 billion CFU/day', asin: 'B07BBBMFVZ' },
  { name: 'Prebiotics (Inulin/FOS)', category: 'Gut Health', benefit: 'Feed beneficial gut bacteria. Fructooligosaccharides and inulin support Bifidobacterium growth and short-chain fatty acid production.', evidence: 'Moderate', dosage: '2–5g/day for children', caution: 'Start slowly — can cause gas and bloating initially.', asin: 'B07BBBMFVZ' },
  { name: 'Digestive Enzymes', category: 'Gut Health', benefit: 'Support proper digestion and nutrient absorption. Particularly useful for sensitive children with digestive complaints.', evidence: 'Moderate', dosage: 'Per product instructions, with meals', asin: 'B07BBBMFVZ' },
  { name: 'Colostrum', category: 'Gut Health', benefit: 'Supports gut lining integrity and immune function. Contains growth factors that heal the gut and reduce intestinal permeability.', evidence: 'Moderate', dosage: '500–1,000mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'L-Glutamine (Gut)', category: 'Gut Health', benefit: 'Primary fuel for intestinal cells. Heals leaky gut and reduces intestinal inflammation that contributes to systemic inflammation and mood dysregulation.', evidence: 'Moderate', dosage: '1–3g/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Zinc Carnosine', category: 'Gut Health', benefit: 'Specifically supports gastric lining integrity. Reduces gut inflammation and supports healing of the intestinal barrier.', evidence: 'Moderate', dosage: '75mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Aloe Vera (Inner Leaf)', category: 'Gut Health', benefit: 'Soothes gut inflammation and supports intestinal healing. Useful for sensitive children with reflux or gut irritation.', evidence: 'Moderate', dosage: '30–60ml inner leaf juice/day', caution: 'Use inner leaf only — outer leaf contains aloin which is a laxative.', asin: 'B07BBBMFVZ' },
  { name: 'Slippery Elm', category: 'Gut Health', benefit: 'Demulcent herb that coats and soothes the gut lining. Traditional remedy for gut irritation and reflux.', evidence: 'Traditional', dosage: '400–800mg/day for children', asin: 'B07BBBMFVZ' },

  // ─── Melatonin & Sleep ────────────────────────────────────────────────────────
  { name: 'Melatonin (Low Dose)', category: 'Sleep Support', benefit: 'Supports sleep onset in sensitive children with delayed sleep phase. Low doses (0.5–1mg) are more physiological than high doses.', evidence: 'Strong', dosage: '0.5–1mg, 30 minutes before bed', caution: 'Use the lowest effective dose. Higher doses are not more effective and may disrupt natural production.', asin: 'B07BBBMFVZ' },
  { name: 'Magnesium Glycinate (Sleep)', category: 'Sleep Support', benefit: 'Calms the nervous system and promotes sleep. One of the safest and most effective sleep supports for sensitive children.', evidence: 'Strong', dosage: '100–200mg elemental magnesium before bed', asin: 'B00YOIWS8M' },
  { name: 'Glycine (Sleep)', category: 'Sleep Support', benefit: 'Improves sleep quality and reduces time to sleep onset. Works via thermoregulation and NMDA receptor modulation.', evidence: 'Moderate', dosage: '1–3g before bed', asin: 'B07BBBMFVZ' },
  { name: 'Tart Cherry (Montmorency)', category: 'Sleep Support', benefit: 'Natural source of melatonin and anti-inflammatory compounds. Supports sleep quality and reduces inflammation.', evidence: 'Moderate', dosage: '8oz juice or 480mg concentrate/day', asin: 'B07BBBMFVZ' },
  { name: 'Phosphatidylserine (Sleep)', category: 'Sleep Support', benefit: 'Reduces cortisol levels, particularly evening cortisol that interferes with sleep onset in stressed children.', evidence: 'Moderate', dosage: '100–200mg before bed', asin: 'B07BBBMFVZ' },

  // ─── Anti-Inflammatory ────────────────────────────────────────────────────────
  { name: 'Curcumin (with Piperine)', category: 'Anti-Inflammatory', benefit: 'Potent anti-inflammatory and neuroprotective. Reduces neuroinflammation linked to anxiety and mood dysregulation. Piperine or liposomal form for absorption.', evidence: 'Moderate', dosage: '200–500mg/day for children (with piperine or liposomal)', caution: 'Use bioavailable form. Standard curcumin has poor absorption.', asin: 'B07BBBMFVZ' },
  { name: 'Quercetin', category: 'Anti-Inflammatory', benefit: 'Anti-inflammatory flavonoid that also has mast cell stabilizing properties. Useful for sensitive children with allergic or inflammatory components.', evidence: 'Moderate', dosage: '250–500mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Boswellia (Frankincense)', category: 'Anti-Inflammatory', benefit: 'Potent anti-inflammatory herb that crosses the blood-brain barrier. Reduces neuroinflammation and supports cognitive function.', evidence: 'Moderate', dosage: '100–300mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Resveratrol', category: 'Anti-Inflammatory', benefit: 'Polyphenol antioxidant with anti-inflammatory and neuroprotective properties. Activates sirtuins and supports mitochondrial function.', evidence: 'Moderate', dosage: '50–100mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Alpha-Lipoic Acid', category: 'Anti-Inflammatory', benefit: 'Universal antioxidant that works in both fat and water-soluble environments. Regenerates other antioxidants and supports mitochondrial function.', evidence: 'Moderate', dosage: '50–100mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'CoQ10 (Ubiquinol)', category: 'Anti-Inflammatory', benefit: 'Mitochondrial antioxidant essential for energy production. Ubiquinol is the active, reduced form. Supports brain energy metabolism.', evidence: 'Moderate', dosage: '50–100mg/day for children', asin: 'B07BBBMFVZ' },

  // ─── Ayurvedic Herbs ──────────────────────────────────────────────────────────
  { name: 'Brahmi (Bacopa monnieri)', category: 'Ayurvedic Herbs', benefit: 'Ayurvedic herb for cognitive function, anxiety, and nervous system support. Reduces anxiety and improves memory. Well-studied.', evidence: 'Strong', dosage: '150–300mg/day for children (standardized extract)', caution: 'May cause digestive upset. Take with food. Effects build over 8-12 weeks.', asin: 'B07BBBMFVZ' },
  { name: 'Shankhpushpi', category: 'Ayurvedic Herbs', benefit: 'Ayurvedic nervine tonic for anxiety, cognitive function, and sleep. Used traditionally for children with nervous system sensitivity.', evidence: 'Traditional', dosage: '250–500mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Jatamansi (Spikenard)', category: 'Ayurvedic Herbs', benefit: 'Ayurvedic sedative and nervine herb. Reduces anxiety and promotes sleep. Related to valerian.', evidence: 'Traditional', dosage: '100–200mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Guduchi (Tinospora cordifolia)', category: 'Ayurvedic Herbs', benefit: 'Ayurvedic adaptogen and immune modulator. Supports stress resilience and cognitive function.', evidence: 'Traditional', dosage: '250–500mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Shatavari', category: 'Ayurvedic Herbs', benefit: "Ayurvedic adaptogen that nourishes the nervous system and supports emotional balance. Particularly useful for children with 'vata' constitutions (anxious, sensitive, dry).", evidence: 'Traditional', dosage: '250–500mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Triphala', category: 'Ayurvedic Herbs', benefit: 'Ayurvedic formula of three fruits that supports gut health, detoxification, and antioxidant defense. Gut health is foundational for mood.', evidence: 'Moderate', dosage: '500–1,000mg/day for children', asin: 'B07BBBMFVZ' },

  // ─── Essential Oils (Topical/Aromatic) ───────────────────────────────────────
  { name: 'Lavender Essential Oil (Aromatic)', category: 'Aromatherapy', benefit: 'Inhalation of lavender reduces anxiety and cortisol. Well-studied for pre-procedure anxiety in children. Diffuse in bedroom for sleep support.', evidence: 'Moderate', dosage: 'Diffuse 3-5 drops for 30-60 minutes. Dilute 1-2% for topical use.', caution: 'Always dilute for topical use on children. Do not apply undiluted.', asin: 'B07BBBMFVZ' },
  { name: 'Bergamot Essential Oil', category: 'Aromatherapy', benefit: 'Citrus oil with anxiolytic properties. Inhalation reduces anxiety and improves mood. Uplifting without being stimulating.', evidence: 'Moderate', dosage: 'Diffuse 3-5 drops. Dilute 1% for topical use.', caution: 'Bergapten-free (FCF) form for topical use — otherwise photosensitizing.', asin: 'B07BBBMFVZ' },
  { name: 'Roman Chamomile Essential Oil', category: 'Aromatherapy', benefit: 'Gentle, calming oil particularly suited to children. Reduces anxiety and promotes sleep. Sweeter scent than German chamomile.', evidence: 'Traditional', dosage: 'Diffuse 2-3 drops. Dilute 0.5-1% for topical use on children.', asin: 'B07BBBMFVZ' },
  { name: 'Vetiver Essential Oil', category: 'Aromatherapy', benefit: 'Grounding, earthy oil used for anxiety, ADHD-like symptoms, and sleep. Particularly calming for children who feel scattered or overwhelmed.', evidence: 'Emerging', dosage: 'Diffuse 1-2 drops (strong scent). Dilute 1% for topical use.', asin: 'B07BBBMFVZ' },
  { name: 'Frankincense Essential Oil', category: 'Aromatherapy', benefit: 'Anti-inflammatory and calming. Crosses the blood-brain barrier via inhalation. Supports meditation, focus, and emotional regulation.', evidence: 'Moderate', dosage: 'Diffuse 3-5 drops. Dilute 1% for topical use.', asin: 'B07BBBMFVZ' },

  // ─── Specialty Supplements ────────────────────────────────────────────────────
  { name: 'GABA (Pharma-GABA)', category: 'Specialty', benefit: 'Pharma-GABA (produced by fermentation) may cross the blood-brain barrier more effectively than synthetic GABA. Reduces anxiety and promotes alpha brain waves.', evidence: 'Moderate', dosage: '100–200mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Lithium Orotate (Micro-dose)', category: 'Specialty', benefit: 'Micro-dose lithium (not pharmaceutical lithium) supports mood stability, neuroprotection, and B12 utilization. Very different from prescription lithium.', evidence: 'Emerging', dosage: '1–5mg elemental lithium/day', caution: 'Consult healthcare provider. Not the same as prescription lithium carbonate.', asin: 'B07BBBMFVZ' },
  { name: 'Sulforaphane (Broccoli Sprout Extract)', category: 'Specialty', benefit: 'Activates Nrf2 pathway, the master antioxidant regulator. Reduces oxidative stress and neuroinflammation. Emerging evidence for autism and anxiety.', evidence: 'Emerging', dosage: '50–100mcg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'PEA (Palmitoylethanolamide)', category: 'Specialty', benefit: 'Endocannabinoid-like compound that reduces neuroinflammation and pain. Supports mast cell regulation. Useful for children with inflammatory sensitivity.', evidence: 'Moderate', dosage: '300–600mg/day for children', asin: 'B07BBBMFVZ' },
  { name: 'Melatonin Extended Release', category: 'Specialty', benefit: 'Extended-release melatonin supports sleep maintenance (not just onset). Useful for children who fall asleep but wake frequently.', evidence: 'Moderate', dosage: '0.5–1mg extended release at bedtime', caution: 'Use lowest effective dose.', asin: 'B07BBBMFVZ' },
  { name: 'Magnesium Malate', category: 'Specialty', benefit: 'Magnesium bound to malic acid. Supports energy production and muscle function. Useful for children with fatigue and muscle tension.', evidence: 'Moderate', dosage: '100–200mg elemental magnesium/day', asin: 'B07BBBMFVZ' },
  { name: 'Berberine', category: 'Specialty', benefit: 'Alkaloid with anti-inflammatory, antimicrobial, and blood sugar-stabilizing properties. Supports gut health and metabolic function.', evidence: 'Moderate', dosage: '100–200mg/day for children', caution: 'Not for children under 12 without supervision. Can interact with medications.', asin: 'B07BBBMFVZ' },
  { name: 'Activated Charcoal', category: 'Specialty', benefit: 'Binds toxins in the gut. Useful for sensitive children with reactions to foods or environmental toxins. Not for daily use.', evidence: 'Moderate', dosage: 'As needed, away from medications and supplements', caution: 'Do not take within 2 hours of medications or other supplements. Not for daily use.', asin: 'B07BBBMFVZ' },
];

const CATEGORIES = [...new Set(SUPPLEMENTS.map(s => s.category))];
const EVIDENCE_COLORS: Record<string, string> = {
  Strong: '#4CAF50',
  Moderate: '#2196F3',
  Emerging: '#FF9800',
  Traditional: '#9C27B0',
};

export default function SupplementsPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = SUPPLEMENTS.filter(s => {
    const matchCat = activeCategory === 'All' || s.category === activeCategory;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.benefit.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="supplements-page">
      <div className="supplements-hero">
        <div className="supplements-hero-overlay" />
        <div className="supplements-hero-content">
          <h1>Supplements, Herbs & TCM for Sensitive Children</h1>
          <p>A comprehensive, evidence-graded reference of {SUPPLEMENTS.length}+ natural supports for highly sensitive nervous systems. Always consult your pediatrician before starting any supplement.</p>
          <div className="evidence-legend">
            {Object.entries(EVIDENCE_COLORS).map(([level, color]) => (
              <span key={level} className="evidence-badge" style={{ background: color }}>
                {level}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="supplements-controls">
        <input
          type="search"
          className="supplements-search"
          placeholder="Search supplements, herbs, benefits..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="supplements-categories">
          <button
            className={`cat-btn ${activeCategory === 'All' ? 'active' : ''}`}
            onClick={() => setActiveCategory('All')}
          >
            All ({SUPPLEMENTS.length})
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat} ({SUPPLEMENTS.filter(s => s.category === cat).length})
            </button>
          ))}
        </div>
      </div>

      <div className="supplements-grid">
        {filtered.length === 0 && (
          <div className="supplements-empty">No supplements found for "{search}"</div>
        )}
        {filtered.map(supp => (
          <div key={supp.name} className="supplement-card">
            <div className="supplement-card-header">
              <h3 className="supplement-name">{supp.name}</h3>
              <span
                className="supplement-evidence"
                style={{ background: EVIDENCE_COLORS[supp.evidence] }}
              >
                {supp.evidence}
              </span>
            </div>
            <span className="supplement-category">{supp.category}</span>
            <p className="supplement-benefit">{supp.benefit}</p>
            <div className="supplement-dosage">
              <strong>Dosage:</strong> {supp.dosage}
            </div>
            {supp.caution && (
              <div className="supplement-caution">
                <strong>⚠ Caution:</strong> {supp.caution}
              </div>
            )}
            {supp.asin && (
              <a
                href={`https://www.amazon.com/dp/${supp.asin}?tag=${TAG}`}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="supplement-amazon-btn"
              >
                View on Amazon →
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="supplements-disclaimer">
        <h3>Important Disclaimer</h3>
        <p>This information is for educational purposes only and does not constitute medical advice. Always consult a qualified healthcare provider — preferably one familiar with integrative pediatric medicine — before starting any supplement for your child. Supplements can interact with medications and are not appropriate for all children. The evidence ratings reflect the current state of research, which is always evolving.</p>
        <p>Amazon affiliate links are marked with our associate tag. We earn a small commission at no extra cost to you, which helps support this site.</p>
      </div>
    </div>
  );
}
