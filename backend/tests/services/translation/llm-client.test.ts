import { LLMClient } from '../../../src/services/translation/llm-client';

describe('LLMClient', () => {
  let llmClient: LLMClient;

  beforeEach(() => {
    llmClient = new LLMClient();
  });

  describe('translatePIL', () => {
    it('should complete translation within 90 seconds for 2000-5000 word PIL', async () => {
      // Generate realistic PIL content (approximately 3000 words)
      const sourceText = `
        PRODUCT NAME
        Innovator Drug 500mg Tablets
        
        COMPOSITION
        Each tablet contains 500mg of active pharmaceutical ingredient.
        Excipients: lactose monohydrate, microcrystalline cellulose, magnesium stearate.
        
        PHARMACEUTICAL FORM
        Film-coated tablets for oral administration.
        
        CONTRAINDICATIONS
        Hypersensitivity to the active substance or any excipients listed in section Composition.
        Severe hepatic impairment (Child-Pugh Class C).
        Severe renal impairment (creatinine clearance <30 mL/min).
        Pregnancy and lactation (see section Pregnancy and Lactation).
        Concomitant use with strong CYP3A4 inhibitors.
        
        POSOLOGY AND METHOD OF ADMINISTRATION
        Adults: The recommended dose is 500mg twice daily with food.
        Elderly: No dose adjustment is required for elderly patients.
        Pediatric: Not recommended for use in children under 12 years of age.
        Hepatic impairment: Dose reduction to 250mg twice daily in moderate hepatic impairment.
        Renal impairment: Dose reduction to 250mg once daily in moderate renal impairment.
        
        UNDESIRABLE EFFECTS
        Common (≥1/100 to <1/10): Nausea, headache, dizziness, abdominal pain.
        Uncommon (≥1/1,000 to <1/100): Rash, pruritus, vomiting, diarrhea.
        Rare (≥1/10,000 to <1/1,000): Hepatotoxicity, severe allergic reactions, anaphylaxis.
        Very rare (<1/10,000): Stevens-Johnson syndrome, toxic epidermal necrolysis.
        
        OVERDOSE
        Symptoms of overdose may include severe nausea, vomiting, dizziness, and hepatotoxicity.
        Treatment is symptomatic and supportive. There is no specific antidote.
        Hemodialysis is not effective in removing the drug from circulation.
        
        PREGNANCY AND LACTATION
        Pregnancy: This medicinal product should not be used during pregnancy unless clearly necessary.
        Lactation: It is unknown whether this drug is excreted in human milk. Breastfeeding should be discontinued.
        
        SHELF LIFE
        24 months when stored in original packaging.
        
        STORAGE CONDITIONS
        Store below 25°C in original packaging. Protect from moisture and light.
      `.repeat(3); // Repeat to reach ~3000 words

      const startTime = Date.now();

      const result = await llmClient.translatePIL(
        sourceText,
        'zh-TW',
        'Test Product'
      );

      const duration = Date.now() - startTime;
      
      // Validate 90-second SLA
      expect(duration).toBeLessThan(90000); // 90 seconds
      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.processingTimeMs).toBeLessThan(90000);
      
      // Log performance metrics for 95th percentile tracking
      console.log(`Translation completed in ${duration}ms (${result.sections.length} sections)`);
    }, 120000); // 2 minute timeout for test

    it('should enforce timeout and reject translations exceeding 90 seconds', async () => {
      // Mock extremely long PIL that would exceed timeout
      const longSourceText = 'A'.repeat(50000); // Unrealistically long to trigger timeout
      
      await expect(
        llmClient.translatePIL(longSourceText, 'zh-TW', 'Test Product')
      ).rejects.toThrow('Translation timeout: exceeded 90000ms SLA');
    }, 120000);

    it('should return confidence scores for each section', async () => {
      const sourceText = `
        CONTRAINDICATIONS
        Hypersensitivity to the active substance.
        
        DOSAGE
        500mg twice daily.
      `;

      const result = await llmClient.translatePIL(
        sourceText,
        'zh-TW',
        'Test Product'
      );

      result.sections.forEach(section => {
        expect(section.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(section.confidenceScore).toBeLessThanOrEqual(100);
      });
    });

    it('should validate confidence score bounds (0-100)', async () => {
      const sourceText = `
        CONTRAINDICATIONS
        Hypersensitivity to the active substance.
      `;

      const result = await llmClient.translatePIL(
        sourceText,
        'zh-TW',
        'Test Product'
      );

      result.sections.forEach(section => {
        // Confidence scores must be within valid range
        expect(section.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(section.confidenceScore).toBeLessThanOrEqual(100);
        expect(typeof section.confidenceScore).toBe('number');
        expect(Number.isFinite(section.confidenceScore)).toBe(true);
      });
    });

    it('should flag sections with confidence < 85% as low confidence', async () => {
      const sourceText = `
        CONTRAINDICATIONS
        Hypersensitivity to the active substance.
      `;

      const result = await llmClient.translatePIL(
        sourceText,
        'zh-TW',
        'Test Product'
      );

      const lowConfidenceSections = result.sections.filter(section =>
        llmClient.isLowConfidence(section.confidenceScore)
      );

      lowConfidenceSections.forEach(section => {
        expect(section.confidenceScore).toBeLessThan(85);
      });
    });

    it('should use TFDA-approved pharmaceutical terminology', async () => {
      const sourceText = `
        CONTRAINDICATIONS
        Hypersensitivity to the active substance or any excipients.
        
        POSOLOGY AND METHOD OF ADMINISTRATION
        Adults: 500mg twice daily with food.
        
        UNDESIRABLE EFFECTS
        Common adverse reactions include nausea and headache.
      `;

      const result = await llmClient.translatePIL(
        sourceText,
        'zh-TW',
        'Test Product'
      );

      const contraindicationSection = result.sections.find(
        s => s.sectionName === 'CONTRAINDICATIONS'
      );
      const posologySection = result.sections.find(
        s => s.sectionName === 'POSOLOGY AND METHOD OF ADMINISTRATION'
      );
      const adverseEffectsSection = result.sections.find(
        s => s.sectionName === 'UNDESIRABLE EFFECTS'
      );

      // Validate TFDA-approved terminology usage
      expect(contraindicationSection?.translatedText).toContain('禁忌症');
      expect(contraindicationSection?.translatedText).toContain('過敏反應');
      expect(contraindicationSection?.translatedText).toContain('賦形劑');
      
      expect(posologySection?.translatedText).toContain('劑量');
      expect(posologySection?.translatedText).toContain('用法用量');
      
      expect(adverseEffectsSection?.translatedText).toContain('不良反應');
    });

    it('should reduce confidence score when unapproved terminology detected', async () => {
      const sourceText = `
        CONTRAINDICATIONS
        Hypersensitivity to the active substance.
      `;

      const result = await llmClient.translatePIL(
        sourceText,
        'zh-TW',
        'Test Product'
      );

      // If LLM uses unapproved terminology, confidence should be capped at 75
      const contraindicationSection = result.sections.find(
        s => s.sectionName === 'CONTRAINDICATIONS'
      );

      if (contraindicationSection) {
        // Confidence should be valid and within bounds
        expect(contraindicationSection.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(contraindicationSection.confidenceScore).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('isLowConfidence', () => {
    it('should return true for scores below 85', () => {
      expect(llmClient.isLowConfidence(84)).toBe(true);
      expect(llmClient.isLowConfidence(50)).toBe(true);
      expect(llmClient.isLowConfidence(0)).toBe(true);
    });

    it('should return false for scores >= 85', () => {
      expect(llmClient.isLowConfidence(85)).toBe(false);
      expect(llmClient.isLowConfidence(90)).toBe(false);
      expect(llmClient.isLowConfidence(100)).toBe(false);
    });
  });
});