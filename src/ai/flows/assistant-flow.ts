
'use server';
/**
 * @fileOverview An AI assistant that can answer questions and log expenses.
 *
 * - askAssistant - A function that handles the user's query.
 * - AssistantInput - The input type for the askAssistant function.
 * - AssistantOutput - The return type for the askAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { Category, Expense, Person } from '@/lib/types';

const ExpenseSchema = z.object({
  id: z.string(),
  type: z.enum(['expense', 'income']),
  amount: z.number(),
  categoryId: z.string(),
  note: z.string(),
  date: z.string(),
  receipt: z.string().optional(),
  splitWith: z.array(z.object({ personId: z.string(), amount: z.number(), settled: z.boolean() })).optional(),
  relatedExpenseId: z.string().optional(),
});

const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  group: z.string(),
  icon: z.string(),
});

const PersonSchema = z.object({
  id: z.string(),
  name: z.string(),
  tags: z.array(z.string()).optional(),
});

export interface AssistantInput {
    query: string;
    expenses: Expense[];
    categories: Category[];
    people: Person[];
}

const AssistantFlowInputSchema = z.object({
  query: z.string().describe('The user question.'),
  jsonData: z.string().describe('A JSON string containing all expenses, categories, and people data.'),
  currentDate: z.string().describe('The current date, for context.'),
});

const LogExpenseActionSchema = z.object({
    name: z.enum(['logExpense']),
    parameters: z.object({
        amount: z.number().describe('The numeric amount of the expense.'),
        categoryId: z.string().describe('The ID of the most relevant category for the expense.'),
        note: z.string().describe('A short, descriptive note for the expense.'),
    }),
});

const AssistantOutputSchema = z.object({
  answer: z.string().describe("The AI's answer to the user's question, formatted in Markdown. If an action is taken, this should be a confirmation message."),
  action: LogExpenseActionSchema.optional().describe("An action to perform. ONLY use this field if the user explicitly asks to log, add, or create a new expense. For ALL other queries (e.g., asking questions, requesting summaries), this field MUST be omitted."),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

export async function askAssistant(input: AssistantInput): Promise<AssistantOutput> {
  const jsonData = JSON.stringify({
    expenses: input.expenses,
    categories: input.categories,
    people: input.people,
  });
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return assistantFlow({
    query: input.query,
    jsonData,
    currentDate,
  });
}

const prompt = ai.definePrompt({
  name: 'assistantPrompt',
  input: {schema: AssistantFlowInputSchema},
  output: {schema: AssistantOutputSchema},
  prompt: `You are a financial assistant. Your primary job is to answer questions about a user's financial data. You can also log new expenses, but only when explicitly asked.

The current date is {{currentDate}}.
User's data:
\`\`\`json
{{{jsonData}}}
\`\`\`

User's request:
"{{{query}}}"

***IMPORTANT RULES***
1.  **Default to Answering:** Your main goal is to provide helpful answers based on the data.
2.  **Strict Action Condition:** You MUST ONLY use the 'action' field if the user's request contains clear, explicit keywords for creating a new expense. These keywords include "log", "add", "new expense", "charge", or "put".
3.  **DO NOT USE ACTION FOR QUESTIONS:** For any request that is a question (e.g., "What was...", "How much did I spend...", "Show me..."), you MUST NOT use the 'action' field. Your response should only be in the 'answer' field.
4.  **Markdown Formatting:** For all answers, format your response in Markdown for readability (e.g., using lists for multiple items, bold for emphasis).
5.  **Confirmation Message:** When you do use the 'action' field, the 'answer' field should contain a simple confirmation, like "Done. I've logged that for you."

**Example Scenarios:**
- If user asks: "What was my biggest expense last month?"
  - Your response: 'answer' contains the analysis in Markdown, 'action' is OMITTED.
- If user says: "Add a $25 charge for gasoline."
  - Your response: 'answer' is "Okay, I've logged the expense for gasoline.", 'action' is POPULATED with amount: 25, note: "gasoline", and the correct categoryId.
- If user asks: "Did I spend more on food or transport?"
  - Your response: 'answer' contains the comparison in Markdown, 'action' is OMITTED.

Now, analyze the user's request and respond according to these strict rules.`,
});

const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantFlowInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    const output = response.output;

    if (!output) {
      const reason = response.candidates[0]?.finishReasonMessage || 'The model did not produce a valid response.';
      throw new Error(`AI assistant failed. Reason: ${reason}`);
    }

    return output;
  }
);
