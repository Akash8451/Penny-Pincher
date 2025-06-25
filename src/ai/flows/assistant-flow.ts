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
    name: z.literal('logExpense'),
    parameters: z.object({
        amount: z.number().describe('The numeric amount of the expense.'),
        categoryId: z.string().describe('The ID of the most relevant category for the expense.'),
        note: z.string().describe('A short, descriptive note for the expense.'),
    }),
});

const AssistantOutputSchema = z.object({
  answer: z.string().describe("The AI's answer to the user's question, formatted in Markdown. If an action is taken, this should be a confirmation message."),
  action: LogExpenseActionSchema.optional().describe("If the user's query implies an action like logging an expense, define that action here."),
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
  prompt: `You are a friendly and helpful financial assistant for the PennyPincher app.
Your task is to analyze the user's financial data, provided as a JSON string, to answer their questions OR to help them log a new expense.
The current date is {{currentDate}}.

Here is the user's data, including available categories for logging expenses:
\`\`\`json
{{{jsonData}}}
\`\`\`

Here is the user's request:
"{{{query}}}"

Please adhere to the following rules:
1.  **Dual Capability**: You can either answer questions about the data OR log a new expense.
2.  **Answering Questions**:
    *   Provide clear, concise, and accurate answers based ONLY on the provided data.
    *   Format your answers in simple Markdown. Use lists, bold text, and italics to improve readability.
    *   If a question is ambiguous or the data is insufficient, ask for clarification.
    *   Do not perform any calculations that are not directly supported by the data (e.g., forecasting).
3.  **Logging Expenses**:
    *   If the user's request is to add or log a new expense (e.g., "log a new transaction", "add 5 dollars for coffee"), you MUST use the 'action' field in your response.
    *   Extract the amount, a descriptive note, and map the expense to the most appropriate category ID from the data.
    *   Populate the 'action.parameters' object with these details.
    *   Your 'answer' field should be a simple confirmation, like "Okay, I've logged the expense for [note]."
4.  **Always Respond**: Always provide a text-based 'answer', even when performing an action.

Now, analyze the request and provide your response.`,
});

const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantFlowInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
