'use server';
/**
 * @fileOverview An AI assistant that can answer questions about the user's finances.
 *
 * - askAssistant - A function that handles the user's query.
 * - AssistantInput - The input type for the askAssistant function.
 * - AssistantOutput - The return type for the askAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { Category, Expense, Person, Split } from '@/lib/types';


// Define Zod schemas that match the data types for validation
const SplitSchema = z.object({
  personId: z.string(),
  amount: z.number(),
  settled: z.boolean(),
});

const ExpenseSchema = z.object({
  id: z.string(),
  type: z.enum(['expense', 'income']),
  amount: z.number(),
  categoryId: z.string(),
  note: z.string(),
  date: z.string(),
  receipt: z.string().optional(),
  splitWith: z.array(SplitSchema).optional(),
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


// Define the actual input for the wrapper function, which is more user-friendly.
export interface AssistantInput {
    query: string;
    expenses: Expense[];
    categories: Category[];
    people: Person[];
}

// Define the schema for the data that will be passed to the Genkit flow itself.
const AssistantFlowInputSchema = z.object({
  query: z.string().describe('The user question.'),
  jsonData: z.string().describe('A JSON string containing all expenses, categories, and people data.'),
  currentDate: z.string().describe('The current date, for context.'),
});

const AssistantOutputSchema = z.object({
  answer: z.string().describe("The AI's answer to the user's question, formatted in Markdown."),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;


/**
 * A wrapper function that prepares the data and invokes the Genkit flow.
 * @param input The user's query and their financial data.
 * @returns A promise that resolves to the AI's answer.
 */
export async function askAssistant(input: AssistantInput): Promise<AssistantOutput> {
  // We stringify the data here to pass it cleanly to the prompt.
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
Your task is to analyze the user's financial data, provided as a JSON string, to answer their questions.
The current date is {{currentDate}}.

Please adhere to the following rules:
1.  Provide clear, concise, and accurate answers based ONLY on the provided data.
2.  Format your answers in simple Markdown. Use lists, bold text, and italics to improve readability.
3.  If a question is ambiguous or the data is insufficient, ask for clarification instead of making assumptions.
4.  Do not perform any calculations that are not directly supported by the data (e.g., forecasting).
5.  When referencing a person, use their name. When referencing a category, use its name.

Here is the user's data:
\`\`\`json
{{{jsonData}}}
\`\`\`

Here is the user's question:
"{{{query}}}"

Now, analyze the data and provide your answer.`,
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
