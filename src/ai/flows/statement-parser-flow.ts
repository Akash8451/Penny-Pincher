
'use server';
/**
 * @fileOverview An AI flow to parse financial statements (PDF/CSV) and categorize transactions.
 *
 * - parseStatement - A function that handles the statement parsing process.
 * - ParseStatementInput - The input type for the parseStatement function.
 * - ParseStatementOutput - The return type for the parseStatement function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Category } from '@/lib/types';

// The input for the wrapper function.
export interface ParseStatementInput {
  statementDataUri: string;
  categories: Category[];
}

// The schema for the data passed to the Genkit flow.
const ParseStatementFlowInputSchema = z.object({
  statementDataUri: z
    .string()
    .describe(
      "A financial statement file (PDF or CSV), as a data URI that must include a MIME type and use Base64 encoding. E.g., 'data:application/pdf;base64,<encoded_data>' or 'data:text/csv;base64,<encoded_data>'."
    ),
  categoriesJson: z.string().describe('A JSON string of available categories for mapping.'),
  currentDate: z.string().describe('The current date, for context.'),
});


const ParsedTransactionSchema = z.object({
    description: z.string().describe("The full transaction description from the statement."),
    amount: z.number().describe("The numeric amount of the transaction. Use positive numbers for both credits/income and debits/expenses."),
    date: z.string().describe("The transaction date in YYYY-MM-DD format."),
    type: z.enum(['expense', 'income']).describe("The type of transaction. 'expense' for debits/withdrawals, 'income' for credits/deposits."),
    suggestedCategoryId: z.string().describe("The ID of the most relevant category from the provided list. If no suitable category is found, use the ID for 'Other'."),
});

// The output schema for what the AI should extract.
const ParseStatementOutputSchema = z.object({
    transactions: z.array(ParsedTransactionSchema).describe("A list of all transactions found in the statement."),
});
export type ParseStatementOutput = z.infer<typeof ParseStatementOutputSchema>;


export async function parseStatement(input: ParseStatementInput): Promise<ParseStatementOutput> {
  const categoriesJson = JSON.stringify(input.categories);
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return statementParserFlow({
    statementDataUri: input.statementDataUri,
    categoriesJson,
    currentDate,
  });
}

const prompt = ai.definePrompt({
  name: 'statementParserPrompt',
  input: { schema: ParseStatementFlowInputSchema },
  output: { schema: ParseStatementOutputSchema },
  prompt: `You are an expert financial statement analyst. Your task is to parse the provided statement (PDF or CSV) and extract all transactions.

Current Date: {{currentDate}}

Here is the list of available expense categories. Use these to suggest a category for each transaction.
\`\`\`json
{{{categoriesJson}}}
\`\`\`

Statement File:
{{media url=statementDataUri}}

**Instructions:**
1.  Analyze the provided file, which is either a PDF or CSV bank/credit card statement.
2.  Identify every individual transaction.
3.  For each transaction, extract the following details:
    *   **description**: The full transaction description.
    *   **amount**: The transaction amount as a positive number.
    *   **date**: The date of the transaction. Format it as YYYY-MM-DD. If the year is not present, infer it from the statement's date range or the current date.
    *   **type**: Determine if it's an 'expense' (debit, withdrawal, payment) or 'income' (credit, deposit).
    *   **suggestedCategoryId**: Based on the transaction description, choose the most appropriate category ID from the provided JSON list. If you are unsure, use the ID for the "Other" category.
4.  Return all extracted transactions as a JSON array matching the output schema. Ignore any summary sections, opening/closing balances, or non-transactional text.`,
});

const statementParserFlow = ai.defineFlow(
  {
    name: 'statementParserFlow',
    inputSchema: ParseStatementFlowInputSchema,
    outputSchema: ParseStatementOutputSchema,
  },
  async (input) => {
    const response = await prompt(input);
    const output = response.output;

    if (!output) {
      const reason = response.candidates[0]?.finishReasonMessage || 'The model did not produce a valid response.';
      throw new Error(`Failed to parse statement. Reason: ${reason}`);
    }
    
    return output;
  }
);
