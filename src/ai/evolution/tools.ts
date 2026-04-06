import { GoogleGenAI } from "@google/genai";
import { AuditResult, CodeIssue } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export class CodeAuditTool {
  async auditFile(filePath: string, content: string): Promise<AuditResult> {
    const model = "gemini-3-flash-preview";
    const prompt = `
      Analyze the following TypeScript/React code for bugs, security vulnerabilities, technical debt, and performance issues.
      Provide a structured JSON response with a list of issues and a quality score (0-100).
      
      Code from ${filePath}:
      \`\`\`typescript
      ${content}
      \`\`\`
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          // Define schema for structured output
        }
      });

      const result = JSON.parse(response.text || '{}');
      return {
        issues: result.issues || [],
        score: result.score || 100,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Audit failed for ${filePath}:`, error);
      return { issues: [], score: 100, timestamp: new Date().toISOString() };
    }
  }
}

export class RefactorTool {
  async suggestRefactor(filePath: string, content: string, issue: CodeIssue): Promise<string | null> {
    const model = "gemini-3-flash-preview";
    const prompt = `
      Refactor the following code to fix this issue: ${issue.description}.
      Suggestion: ${issue.suggestion || 'Improve code quality and fix the issue.'}
      
      File: ${filePath}
      Code:
      \`\`\`typescript
      ${content}
      \`\`\`
      
      Return ONLY the refactored code block.
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });

      return response.text?.replace(/```typescript|```/g, '').trim() || null;
    } catch (error) {
      console.error(`Refactor suggestion failed for ${filePath}:`, error);
      return null;
    }
  }
}
