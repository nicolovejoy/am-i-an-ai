import { MatchTemplateService } from '../src/services/match-template-service';

describe('Extended Match Templates', () => {
  describe('getTemplate', () => {
    it('should return template with totalParticipants for existing templates', () => {
      const classic = MatchTemplateService.getTemplate('classic_1v3');
      expect(classic?.totalParticipants).toBe(4);
      expect(classic?.requiredHumans).toBe(1);
      expect(classic?.requiredAI).toBe(3);

      const duo = MatchTemplateService.getTemplate('duo_2v2');
      expect(duo?.totalParticipants).toBe(4);
      expect(duo?.requiredHumans).toBe(2);
      expect(duo?.requiredAI).toBe(2);
    });

    it('should return new templates with variable participant counts', () => {
      // These tests will fail until we add the new templates
      const trio = MatchTemplateService.getTemplate('trio_3v3' as any);
      expect(trio?.totalParticipants).toBe(6);
      expect(trio?.requiredHumans).toBe(3);
      expect(trio?.requiredAI).toBe(3);

      const solo = MatchTemplateService.getTemplate('solo_1v5' as any);
      expect(solo?.totalParticipants).toBe(6);
      expect(solo?.requiredHumans).toBe(1);
      expect(solo?.requiredAI).toBe(5);

      const duel = MatchTemplateService.getTemplate('duel_2v1' as any);
      expect(duel?.totalParticipants).toBe(3);
      expect(duel?.requiredHumans).toBe(2);
      expect(duel?.requiredAI).toBe(1);

      const mega = MatchTemplateService.getTemplate('mega_4v4' as any);
      expect(mega?.totalParticipants).toBe(8);
      expect(mega?.requiredHumans).toBe(4);
      expect(mega?.requiredAI).toBe(4);
    });
  });

  describe('getAllTemplates', () => {
    it('should include all templates including new ones', () => {
      const templates = MatchTemplateService.getAllTemplates();
      const templateTypes = templates.map(t => t.type);
      
      // Existing templates
      expect(templateTypes).toContain('classic_1v3');
      expect(templateTypes).toContain('duo_2v2');
      expect(templateTypes).toContain('admin_custom');
      
      // New templates (will fail until added)
      expect(templateTypes).toContain('trio_3v3');
      expect(templateTypes).toContain('solo_1v5');
      expect(templateTypes).toContain('duel_2v1');
      expect(templateTypes).toContain('mega_4v4');
    });

    it('should have valid participant counts for all templates', () => {
      const templates = MatchTemplateService.getAllTemplates();
      
      templates.forEach((template) => {
        // For non-admin templates, totalParticipants should equal sum of humans and AI
        if (template.type !== 'admin_custom') {
          expect(template.totalParticipants).toBe(
            template.requiredHumans + template.requiredAI
          );
        }
        
        // Check participant count is within valid range (3-8)
        expect(template.totalParticipants).toBeGreaterThanOrEqual(3);
        expect(template.totalParticipants).toBeLessThanOrEqual(8);
      });
    });
  });

  describe('Template validation', () => {
    it('should validate participant distributions', () => {
      const templates = MatchTemplateService.getAllTemplates();
      
      templates.forEach((template) => {
        // At least 1 human required
        expect(template.requiredHumans).toBeGreaterThanOrEqual(1);
        
        // At least 1 AI required (except for potential all-human templates)
        if (template.type !== 'admin_custom') {
          expect(template.requiredAI).toBeGreaterThanOrEqual(1);
        }
      });
    });
  });
});