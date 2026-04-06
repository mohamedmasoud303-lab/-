import { CodeIssue } from './types';

export class ArchitectureValidator {
  async validateModularity(files: string[]): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    for (const file of files) {
      // 1. Check for monolithic code (e.g., files > 500 lines)
      // In a real scenario, we'd read the file content and count lines
      // const lineCount = await countLines(file);
      // if (lineCount > 500) {
      //   issues.push({
      //     file,
      //     severity: 'medium',
      //     type: 'debt',
      //     description: `Monolithic file detected: ${file} has ${lineCount} lines. Consider splitting into smaller modules.`,
      //     suggestion: 'Refactor into smaller components or services.'
      //   });
      // }

      // 2. Check for DDD principles (e.g., business logic in components)
      // In a real scenario, we'd use regex or AST to detect complex logic in components
      // if (file.includes('/components/') && content.includes('supabase.from(')) {
      //   issues.push({
      //     file,
      //     severity: 'high',
      //     type: 'debt',
      //     description: `Business logic detected in component: ${file} should use a service for data fetching.`,
      //     suggestion: 'Move data fetching logic to a service in src/services/api/.'
      //   });
      // }
    }

    return issues;
  }
}
