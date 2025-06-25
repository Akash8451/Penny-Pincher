
'use server';
/**
 * @fileOverview An AI flow to itemize receipts from an image.
 *
 * - itemizeReceipt - A function that handles the receipt scanning process.
 * - ItemizeReceiptInput - The input type for the itemizeReceipt function.
 * - ItemizeReceiptOutput - The return type for the itemizeReceipt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const ItemizeReceiptInputSchema = z.object({
  photoDataUri: z.string().describe("A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type ItemizeReceiptInput = z.infer<typeof ItemizeReceiptInputSchema>;

const ItemizedItemSchema = z.object({
  description: z.string().describe("The description of the line item from the receipt."),
  price: z.number().describe("The price of the line item."),
});

export const ItemizeReceiptOutputSchema = z.object({
  items: z.array(ItemizedItemSchema).describe("A list of all items found on the receipt."),
  total: z.number().optional().describe("The total amount from the receipt, if found."),
});
export type ItemizeReceiptOutput = z.infer<typeof ItemizeReceiptOutputSchema>;


export async function itemizeReceipt(input: ItemizeReceiptInput): Promise<ItemizeReceiptOutput> {
  return itemizeReceiptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'itemizeReceiptPrompt',
  input: { schema: ItemizeReceiptInputSchema },
  output: { schema: ItemizeReceiptOutputSchema },
  prompt: `You are an expert receipt processing agent. Your task is to analyze the provided receipt image and extract all individual line items with their corresponding prices.

- Identify each distinct item purchased.
- Extract the price for each item.
- If a total amount is clearly visible, extract it.
- Return the data in the specified JSON format. Make sure the 'price' is a valid number.

Receipt Image:
{{media url=photoDataUri}}`,
});

const itemizeReceiptFlow = ai.defineFlow(
  {
    name: 'itemizeReceiptFlow',
    inputSchema: ItemizeReceiptInputSchema,
    outputSchema: ItemizeReceiptOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
