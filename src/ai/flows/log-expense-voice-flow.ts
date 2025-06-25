
'use server';
/**
 * @fileOverview An AI flow to parse expense details from a voice query.
 *
 * - logExpenseFromVoice - A function that handles the voice query parsing.
 * - VoiceInput - The input type for the logExpenseFromVoice function.
 * - VoiceOutput - The return type for the logExpenseFromVoice function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Category } from '@/lib/types';

// This is the Zod schema for a single category, needed for the input.
const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  group: z.string(),
  icon: z.string(),
});

// The input for the wrapper function.
export interface VoiceInput {
  query: string;
  categories: Category[];
}

// The schema for the data passed to the Genkit flow.
const VoiceFlowInputSchema = z.object({
  query: z.string().describe('The user\'s spoken query about an expense.'),
  categoriesJson: z.string().describe('A JSON string of available categories for mapping.'),
  currentDate: z.string().describe('The current date, for context if the user mentions "today" or "yesterday".'),
});

// The output schema for what the AI should extract.
const VoiceOutputSchema = z.object({
  amount: z.number().optional().describe('The numeric amount of the expense.'),
  categoryId: z.string().optional().describe('The ID of the most relevant category.'),
  note: z.string().optional().describe('A short note for the transaction, derived from the query.'),
});
export type VoiceOutput = z.infer<typeof VoiceOutputSchema>;

/**
 * Wrapper function to prepare data and invoke the Genkit flow.
 * @param input The user's voice query and the list of categories.
 * @returns A promise that resolves to the extracted expense data.
 */
export async function logExpenseFromVoice(input: VoiceInput): Promise<VoiceOutput> {
  const categoriesJson = JSON.stringify(input.categories);
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return logExpenseVoiceFlow({
    query: input.query,
    categoriesJson,
    currentDate,
  });
}

const prompt = ai.definePrompt({
  name: 'logExpenseVoicePrompt',
  input: { schema: VoiceFlowInputSchema },
  output: { schema: VoiceOutputSchema },
  prompt: `You are an intelligent expense logger. A user will provide a spoken query, and you must extract the transaction details.

Current Date: {{currentDate}}

Here is the list of available categories:
\`\`\`json
{{{categoriesJson}}}
\`\`\`

User's query: "{{query}}"

Your task:
1. Extract the numeric expense amount. Ignore currency symbols or names (like $, ₹, dollars, rupees).
2. Determine the most appropriate category from the provided list based on the user's query. Return the 'id' of that category. If no clear category matches, leave 'categoryId' blank.
3. Create a concise 'note' from the main subject of the expense (e.g., for "I spent 150 on coffee with friends", the note should be "Coffee with friends").

Return the extracted information in the specified JSON format. If you cannot extract a value for a field, omit it.`,
});

const logExpenseVoiceFlow = ai.defineFlow(
  {
    name: 'logExpenseVoiceFlow',
    inputSchema: VoiceFlowInputSchema,
    outputSchema: VoiceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
