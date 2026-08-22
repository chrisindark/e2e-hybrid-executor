import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);

  private client: OpenAI | null = null;
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    // this.apiKey = this.configService.getOrThrow('OPENAI_API_KEY');
    // this.apiUrl = this.configService.getOrThrow('OPENAI_API_URL');
    this.apiKey = this.configService.getOrThrow('GROQ_API_KEY');
    this.apiUrl = this.configService.getOrThrow('GROQ_API_URL');
    this.createOpenAIClient();
  }

  createOpenAIClient() {
    try {
      this.client = new OpenAI({
        baseURL: this.apiUrl,
        apiKey: this.apiKey,
      });
    } catch (err) {
      this.logger.error('createOpenAIClient', err);
    }
  }

  createAuthHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  handleError(error: any) {
    if (error.response?.status === 429) {
      this.logger.error(`OpenAI API rate limit exceeded: ${error.message}`);
      throw new Error(
        'OpenAI API rate limit exceeded. Please try again later.',
      );
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
      this.logger.error(`OpenAI API request timed out: ${error.message}`);
      throw new Error('OpenAI API request timed out. Please try again.');
    } else {
      this.logger.error(`OpenAI API error: ${error.message}`);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  private isGpt5FamilyModel(model: string | undefined | null): boolean {
    const modelLower = String(model ?? '')
      .trim()
      .toLowerCase();

    return modelLower.startsWith('gpt-5');
  }

  async normalCompletion(
    userPrompt: string,
    systemPrompt: string = '',
    model: string = 'openai/gpt-oss-20b',
    schema: any = null,
    schemaName: string = '',
  ) {
    try {
      this.logger.log(
        `Sending normal request to OpenAI API with content length: ${userPrompt.length}`,
      );

      const startTime = performance.now();
      const systemMessage: { role: 'user' | 'system'; content: string } = {
        role: 'system',
        content: systemPrompt,
      };
      const userMessage: { role: 'user' | 'system'; content: string } = {
        role: 'user',
        content: userPrompt,
      };
      const completion = await this.client?.chat.completions.create({
        model: model,
        messages: [...(systemPrompt ? [systemMessage] : []), userMessage],
        response_format: schema
          ? zodResponseFormat(schema, schemaName)
          : { type: 'text' },
        max_completion_tokens: 1000,
      });
      const endTime = performance.now();
      const latency = (endTime - startTime) / 1000;
      this.logger.debug(
        `Completion took ${latency} seconds to generate the following response: ${JSON.stringify(completion)}`,
      );
      // log to langfuse

      if (!completion?.choices || completion?.choices.length === 0) {
        const errorMsg = 'OpenAI API returned empty choices';
        this.logger.error(errorMsg);
        throw new Error('OpenAI API returned empty response choices');
      }

      const output = schema
        ? (completion.choices[0].message.content ?? '{}')
        : (completion.choices[0].message.content ?? '');
      const usage = completion.usage;

      return { output, usage };
    } catch (error) {
      this.handleError(error);

      return null;
    }
  }
}
