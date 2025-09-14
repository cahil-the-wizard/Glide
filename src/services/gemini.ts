import { GoogleGenerativeAI } from '@google/generative-ai';

// This should come from environment variables
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'your-gemini-api-key';

const genAI = new GoogleGenerativeAI(API_KEY);

const GLIDE_PROMPT = `You are **Glide**, a task companion that helps users overcome overwhelm and take action.

**Instructions**
* When a user gives you a large, vague, or overwhelming task, do the following:
   * Generate a **short, motivating title** (2–5 words).
   * Make it **action-oriented** (e.g., *Start Your Portfolio*, *Book Your Trip*, *Organize Workspace*).
   * Break the task into the **optimal number of steps** — clear, motivating, and not overwhelming.

**Step Format**
Each step must follow this structure:
**Step X: [Action]** (⏳ Time estimate)
* Clear directive, bolded.
* ⏳ Time estimate (realistic, in minutes).
* 🔗 Helpful resources/links (if relevant).
* ✍️💡✅ Motivating tip or practical advice.
* *Completion cue:* short phrase signaling done.

**Style Guidelines**
* Start with the **title on its own line**.
* Use **checklist-style output** (compact, easy to scan).
* Each step: **2–4 short bullet points only**.
* Keep tone **supportive and motivating**.
* Steps should feel **efficient and doable** — enough to cover thoroughly, but not split too much.

**Example Input**
"I need to sign up for healthcare in Vancouver"

**Example Output**
**Title: Enroll in BC Healthcare**
**Step 1: Confirm Eligibility** (⏳ 5 min)
* Check BC residency rules.
* 🔗 Link to eligibility page.
* 💡 Quick check avoids delays.
* Completion cue: ✅ Eligibility confirmed

**Step 2: Gather Documents** (⏳ 10–15 min)
* ID, proof of residency, immigration docs if needed.
* ✍️ Keep them in one folder.
* Completion cue: ✅ Docs ready to upload

**Step 3: Apply Online** (⏳ 20 min)
* 🔗 Link to MSP application form.
* Fill in details + upload docs.
* Completion cue: ✅ Application submitted

**Step 4: Track Start Date** (⏳ 5 min)
* Coverage begins after wait period.
* Mark calendar reminder.
* Completion cue: ✅ Start date noted

Now break down this user's task:`;

export interface ParsedStep {
  stepNumber: number;
  title: string;
  timeEstimate: string;
  description: string;
  completionCue: string;
}

export interface ParsedFlow {
  title: string;
  steps: ParsedStep[];
}

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  async breakdownTask(userTask: string): Promise<ParsedFlow> {
    try {
      const prompt = `${GLIDE_PROMPT}\n\n"${userTask}"`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return this.parseResponse(text);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Failed to break down task. Please try again.');
    }
  }

  private parseResponse(text: string): ParsedFlow {
    try {
      const lines = text.split('\n').filter(line => line.trim());

      // Extract title (first line that starts with "Title:" or "**Title:")
      let title = 'Your Task Breakdown';
      const titleMatch = text.match(/\*\*Title:\s*(.+?)\*\*/i) || text.match(/Title:\s*(.+)/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }

      // Extract steps
      const steps: ParsedStep[] = [];
      const stepRegex = /\*\*Step (\d+):\s*(.+?)\*\*\s*\(⏳\s*(.+?)\)/g;

      let match;
      while ((match = stepRegex.exec(text)) !== null) {
        const stepNumber = parseInt(match[1]);
        const stepTitle = match[2].trim();
        const timeEstimate = match[3].trim();

        // Find the content between this step and the next
        const stepStart = match.index;
        const nextStepMatch = stepRegex.exec(text);
        const stepEnd = nextStepMatch ? nextStepMatch.index : text.length;
        stepRegex.lastIndex = stepStart + match[0].length; // Reset for next iteration

        const stepContent = text.substring(stepStart + match[0].length, stepEnd);

        // Extract description (everything except completion cue)
        const completionCueMatch = stepContent.match(/Completion cue:\s*(.+)/i);
        let completionCue = '✅ Step completed';
        if (completionCueMatch) {
          completionCue = completionCueMatch[1].trim();
        }

        // Description is everything before the completion cue
        let description = stepContent.replace(/Completion cue:\s*.+/i, '').trim();

        // Clean up description
        description = description
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^\*\s*/, '').trim())
          .filter(line => line)
          .join('\n');

        steps.push({
          stepNumber,
          title: stepTitle,
          timeEstimate,
          description: description || 'Complete this step',
          completionCue
        });
      }

      if (steps.length === 0) {
        throw new Error('No steps found in response');
      }

      return { title, steps };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw new Error('Failed to parse task breakdown. Please try again.');
    }
  }

  // Stream version for real-time feedback (optional enhancement)
  async breakdownTaskStream(
    userTask: string,
    onProgress?: (chunk: string) => void
  ): Promise<ParsedFlow> {
    try {
      const prompt = `${GLIDE_PROMPT}\n\n"${userTask}"`;

      const result = await this.model.generateContentStream(prompt);

      let fullText = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        onProgress?.(chunkText);
      }

      return this.parseResponse(fullText);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Failed to break down task. Please try again.');
    }
  }
}

export const geminiService = new GeminiService();