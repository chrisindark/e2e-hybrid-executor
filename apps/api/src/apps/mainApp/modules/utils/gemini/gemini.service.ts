import { GoogleGenAI } from '@google/genai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  private client: GoogleGenAI | null = null;

  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow('GEMINI_API_KEY');
    this.createGoogleGenAIClient();
  }

  createGoogleGenAIClient() {
    try {
      this.client = new GoogleGenAI({
        apiKey: this.apiKey,
      });
    } catch (err) {
      this.logger.error(`createGoogleGenAIClient: ${err}`);
    }
  }

  handleError(error: any) {
    this.logger.error(error);
  }

  async normalCompletion(
    userPrompt: string,
    systemPrompt: string = '',
    model: string = 'gemini-2.5-flash',
    schema: z.ZodType<any> | null = null,
    schemaName: string = '',
  ) {
    try {
      this.logger.log(
        `Sending normal request to Google GenAI API with content length: ${userPrompt.length}`,
      );
      const startTime = performance.now();

      let config = {
        systemInstruction: systemPrompt,
        maxOutputTokens: 7000,
        responseMimeType: schema ? 'application/json' : 'text/plain',
      };
      config = schema
        ? Object.assign(
            { responseSchema: zodToJsonSchema(schema as any) },
            config,
          )
        : Object.assign({}, config);

      const response = await this.client?.models.generateContent({
        model: model,
        contents: userPrompt,
        config: config,
      });
      const endTime = performance.now();
      const latency = (endTime - startTime) / 1000;
      this.logger.debug(
        `Completion took ${latency} seconds to generate the following response: ${JSON.stringify(response)}`,
      );

      if (!response?.candidates || response?.candidates.length === 0) {
        const errorMsg = 'Gemini API returned empty candidates';
        this.logger.error(errorMsg);
        throw new Error('Gemini API returned empty response candidates');
      }
      const output = schema ? (response.text ?? '{}') : (response.text ?? '');
      const usage = response.usageMetadata;

      //   const output = schema
      //     ? (response.candidates[0].message.content ?? '{}')
      //     : (completion.choices[0].message.content ?? '');
      //   const usage = completion.usage;
      return { output, usage };
    } catch (err) {
      this.handleError(err);

      return null;
    }
  }
}
