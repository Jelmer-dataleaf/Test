import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();

function runNode(code: string, env: Record<string, string | undefined> = {}) {
  return execSync(`node -e ${JSON.stringify(code)}`, {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

function cleanupGeneratedTests() {
  const dir = path.join(repoRoot, 'tests', 'generated');
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test.describe('src/index.js mode selection logging', () => {
  test('prefers Azure OpenAI mode when Azure env vars are present', async () => {
    // happy path: Azure credentials take precedence over standard OpenAI
    const output = runNode(
      `
      const Module = require('module');
      const originalLoad = Module._load;
      Module._load = function(request, parent, isMain) {
        if (request === './gitChecker' || request.endsWith('/gitChecker')) {
          return {
            getLastCommitDiff() {
              return {
                hash: 'abc123',
                message: 'msg',
                author: 'author',
                changedFiles: ['src/testGenerator.js'],
                addedLines: ['const x = 1;'],
                hasNewCode: true,
                diff: '+ const x = 1;'
              };
            }
          };
        }
        if (request === './changeAnalyzer' || request.endsWith('/changeAnalyzer')) {
          return {
            analyzeChanges() {
              return { summary: 'analysis' };
            }
          };
        }
        if (request === './testGenerator' || request.endsWith('/testGenerator')) {
          return {
            async generateTest() {
              return 'tests/generated/fake.spec.ts';
            }
          };
        }
        return originalLoad.apply(this, arguments);
      };

      process.exit = (code) => { throw new Error('EXIT:' + code); };

      require('./src/index.js');
      `,
      {
        AZURE_OPENAI_API_KEY: 'azure-key',
        AZURE_OPENAI_ENDPOINT: 'https://example.openai.azure.com/',
        OPENAI_API_KEY: 'openai-key',
      },
    );

    expect(output).toContain('Generating Playwright test using AI (Azure OpenAI) strategy');
  });

  test('falls back to standard OpenAI mode when only OPENAI_API_KEY is present', async () => {
    // happy path: standard OpenAI mode is used without Azure env vars
    const output = runNode(
      `
      const Module = require('module');
      const originalLoad = Module._load;
      Module._load = function(request, parent, isMain) {
        if (request === './gitChecker' || request.endsWith('/gitChecker')) {
          return {
            getLastCommitDiff() {
              return {
                hash: 'abc123',
                message: 'msg',
                author: 'author',
                changedFiles: ['src/index.js'],
                addedLines: ['const y = 2;'],
                hasNewCode: true,
                diff: '+ const y = 2;'
              };
            }
          };
        }
        if (request === './changeAnalyzer' || request.endsWith('/changeAnalyzer')) {
          return {
            analyzeChanges() {
              return { summary: 'analysis' };
            }
          };
        }
        if (request === './testGenerator' || request.endsWith('/testGenerator')) {
          return {
            async generateTest() {
              return 'tests/generated/fake.spec.ts';
            }
          };
        }
        return originalLoad.apply(this, arguments);
      };

      process.exit = (code) => { throw new Error('EXIT:' + code); };

      require('./src/index.js');
      `,
      {
        OPENAI_API_KEY: 'openai-key',
        AZURE_OPENAI_API_KEY: '',
        AZURE_OPENAI_ENDPOINT: '',
      },
    );

    expect(output).toContain('Generating Playwright test using AI (OpenAI) strategy');
    expect(output).not.toContain('AI (Azure OpenAI)');
  });

  test('uses template-based mode when no AI credentials are configured', async () => {
    // edge case: no AI credentials should trigger template-based generation
    const output = runNode(
      `
      const Module = require('module');
      const originalLoad = Module._load;
      Module._load = function(request, parent, isMain) {
        if (request === './gitChecker' || request.endsWith('/gitChecker')) {
          return {
            getLastCommitDiff() {
              return {
                hash: 'abc123',
                message: 'msg',
                author: 'author',
                changedFiles: ['src/index.js'],
                addedLines: ['const z = 3;'],
                hasNewCode: true,
                diff: '+ const z = 3;'
              };
            }
          };
        }
        if (request === './changeAnalyzer' || request.endsWith('/changeAnalyzer')) {
          return {
            analyzeChanges() {
              return { summary: 'analysis' };
            }
          };
        }
        if (request === './testGenerator' || request.endsWith('/testGenerator')) {
          return {
            async generateTest() {
              return 'tests/generated/fake.spec.ts';
            }
          };
        }
        return originalLoad.apply(this, arguments);
      };

      process.exit = (code) => { throw new Error('EXIT:' + code); };

      require('./src/index.js');
      `,
      {
        OPENAI_API_KEY: '',
        AZURE_OPENAI_API_KEY: '',
        AZURE_OPENAI_ENDPOINT: '',
      },
    );

    expect(output).toContain('Generating Playwright test using template-based strategy');
  });
});

test.describe('src/testGenerator.js AI client selection', () => {
  test.beforeEach(() => {
    cleanupGeneratedTests();
  });

  test.afterEach(() => {
    cleanupGeneratedTests();
  });

  test('uses AzureOpenAI client and deployment when Azure env vars are configured', async () => {
    // happy path: Azure client should be instantiated with endpoint, apiVersion, and deployment
    const output = runNode(
      `
      const Module = require('module');
      const originalLoad = Module._load;
      let captured = {};

      class FakeAzureOpenAI {
        constructor(config) {
          captured.azureConfig = config;
          this.chat = {
            completions: {
              create: async (payload) => {
                captured.payload = payload;
                return {
                  choices: [
                    { message: { content: "import { test, expect } from '@playwright/test';\\ntest('azure', async () => {});" } }
                  ]
                };
              }
            }
          };
        }
      }

      class FakeOpenAI {
        constructor(config) {
          captured.openaiConfig = config;
          this.chat = {
            completions: {
              create: async (payload) => {
                captured.payload = payload;
                return {
                  choices: [
                    { message: { content: "import { test, expect } from '@playwright/test';\\ntest('openai', async () => {});" } }
                  ]
                };
              }
            }
          };
        }
      }

      Module._load = function(request, parent, isMain) {
        if (request === 'openai') {
          return { OpenAI: FakeOpenAI, AzureOpenAI: FakeAzureOpenAI };
        }
        return originalLoad.apply(this, arguments);
      };

      const { generateTest } = require('./src/testGenerator');

      (async () => {
        const result = await generateTest(
          {
            hash: 'da261166038d9665b5fd50ca269f01375990e85f',
            message: 'Test',
            author: 'tester',
            changedFiles: ['src/testGenerator.js'],
            addedLines: ['azure support'],
            diff: '+ azure support',
            hasNewCode: true
          },
          { patterns: ['generic'] }
        );
        console.log(JSON.stringify({ result, captured }));
      })().catch(err => {
        console.error(err);
        process.exit(1);
      });
      `,
      {
        AZURE_OPENAI_API_KEY: 'azure-key',
        AZURE_OPENAI_ENDPOINT: 'https://example.openai.azure.com/',
        AZURE_OPENAI_API_VERSION: '2024-10-21',
        AZURE_OPENAI_DEPLOYMENT: 'gpt-5.4',
        OPENAI_API_KEY: '',
      },
    );

    const parsed = JSON.parse(output.trim().split('\n').pop() || '{}');
    expect(parsed.result).toContain(path.join('tests', 'generated'));
    expect(parsed.captured.azureConfig.apiKey).toBe('azure-key');
    expect(parsed.captured.azureConfig.endpoint).toBe('https://example.openai.azure.com/');
    expect(parsed.captured.azureConfig.apiVersion).toBe('2024-10-21');
    expect(parsed.captured.payload.model).toBe('gpt-5.4');
    expect(parsed.captured.openaiConfig).toBeUndefined();
  });

  test('uses standard OpenAI client and model when Azure env vars are absent', async () => {
    // happy path: standard OpenAI should be used as fallback
    const output = runNode(
      `
      const Module = require('module');
      const originalLoad = Module._load;
      let captured = {};

      class FakeAzureOpenAI {
        constructor(config) {
          captured.azureConfig = config;
          this.chat = { completions: { create: async () => ({ choices: [{ message: { content: 'bad' } }] }) } };
        }
      }

      class FakeOpenAI {
        constructor(config) {
          captured.openaiConfig = config;
          this.chat = {
            completions: {
              create: async (payload) => {
                captured.payload = payload;
                return {
                  choices: [
                    { message: { content: "import { test, expect } from '@playwright/test';\\ntest('openai', async () => {});" } }
                  ]
                };
              }
            }
          };
        }
      }

      Module._load = function(request, parent, isMain) {
        if (request === 'openai') {
          return { OpenAI: FakeOpenAI, AzureOpenAI: FakeAzureOpenAI };
        }
        return originalLoad.apply(this, arguments);
      };

      const { generateTest } = require('./src/testGenerator');

      (async () => {
        const result = await generateTest(
          {
            hash: 'da261166038d9665b5fd50ca269f01375990e85f',
            message: 'Test',
            author: 'tester',
            changedFiles: ['src/index.js'],
            addedLines: ['openai fallback'],
            diff: '+ openai fallback',
            hasNewCode: true
          },
          { patterns: ['generic'] }
        );
        console.log(JSON.stringify({ result, captured }));
      })().catch(err => {
        console.error(err);
        process.exit(1);
      });
      `,
      {
        OPENAI_API_KEY: 'openai-key',
        OPENAI_MODEL: 'gpt-5.4',
        AZURE_OPENAI_API_KEY: '',
        AZURE_OPENAI_ENDPOINT: '',
      },
    );

    const parsed = JSON.parse(output.trim().split('\n').pop() || '{}');
    expect(parsed.result).toContain(path.join('tests', 'generated'));
    expect(parsed.captured.openaiConfig.apiKey).toBe('openai-key');
    expect(parsed.captured.payload.model).toBe('gpt-5.4');
    expect(parsed.captured.azureConfig).toBeUndefined();
  });

  test('throws a clear error when AI mode is requested but openai package is unavailable', async () => {
    // error state: missing dependency should fail with actionable message
    let errorOutput = '';
    try {
      runNode(
        `
        const Module = require('module');
        const originalLoad = Module._load;

        Module._load = function(request, parent, isMain) {
          if (request === 'openai') {
            throw new Error('Cannot find module openai');
          }
          return originalLoad.apply(this, arguments);
        };

        const { generateTest } = require('./src/testGenerator');

        (async () => {
          await generateTest(
            {
              hash: 'da261166038d9665b5fd50ca269f01375990e85f',
              message: 'Test',
              author: 'tester',
              changedFiles: ['src/testGenerator.js'],
              addedLines: ['ai mode'],
              diff: '+ ai mode',
              hasNewCode: true
            },
            { patterns: ['generic'] }
          );
        })().catch(err => {
          console.error(err.message);
          process.exit(1);
        });
        `,
        {
          AZURE_OPENAI_API_KEY: 'azure-key',
          AZURE_OPENAI_ENDPOINT: 'https://example.openai.azure.com/',
        },
      );
    } catch (error: any) {
      errorOutput = String(error.stdout || '') + String(error.stderr || '');
    }

    expect(errorOutput).toContain('openai package is not installed');
  });

  test('falls back to template generation when only partial Azure config is provided', async () => {
    // edge case: Azure API key without endpoint should not trigger AI mode
    const output = runNode(
      `
      const Module = require('module');
      const originalLoad = Module._load;
      let openaiLoaded = false;

      Module._load = function(request, parent, isMain) {
        if (request === 'openai') {
          openaiLoaded = true;
          return originalLoad.apply(this, arguments);
        }
        return originalLoad.apply(this, arguments);
      };

      const { generateTest } = require('./src/testGenerator');

      (async () => {
        const result = await generateTest(
          {
            hash: 'da261166038d9665b5fd50ca269f01375990e85f',
            message: 'Test',
            author: 'tester',
            changedFiles: ['src/index.js'],
            addedLines: ['partial azure'],
            diff: '+ partial azure',
            hasNewCode: true
          },
          { patterns: ['generic'] }
        );
        const content = require('fs').readFileSync(result, 'utf8');
        console.log(JSON.stringify({ result, openaiLoaded, contentLength: content.length }));
      })().catch(err => {
        console.error(err);
        process.exit(1);
      });
      `,
      {
        AZURE_OPENAI_API_KEY: 'azure-key',
        AZURE_OPENAI_ENDPOINT: '',
        OPENAI_API_KEY: '',
      },
    );

    const parsed = JSON.parse(output.trim().split('\n').pop() || '{}');
    expect(parsed.result).toContain(path.join('tests', 'generated'));
    expect(parsed.contentLength).toBeGreaterThan(0);
  });
});