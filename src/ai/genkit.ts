import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import * as dotenv from 'dotenv';

dotenv.config();

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
  model: 'googleai/gemma-3n-e2b-it',
});
