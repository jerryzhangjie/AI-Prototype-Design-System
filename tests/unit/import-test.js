// 测试模块导入
import { test } from 'node:test';
import assert from 'node:assert';

test('模块导入测试', async (t) => {
  await t.test('导入AIDesignSystem', async () => {
    const module = await import('../../src/index.js');
    assert.ok(module.default, '应有默认导出');
    const AIDesignSystem = module.default;
    assert.strictEqual(typeof AIDesignSystem, 'function', '应为类');
  });

  await t.test('导入lib模块', async () => {
    const router = await import('../../src/lib/router.js');
    assert.ok(router.default, 'Router应有默认导出');

    const middleware = await import('../../src/lib/middleware.js');
    assert.ok(middleware.requestId, '应有requestId导出');

    const opencodeManager = await import('../../src/lib/opencode-manager.js');
    assert.ok(opencodeManager.default, '应有默认导出');

    const tempManager = await import('../../src/lib/temp-manager.js');
    assert.ok(tempManager.default, '应有默认导出');

    const vueGenerator = await import('../../src/lib/vue-project-generator.js');
    assert.ok(vueGenerator.default, '应有默认导出');

    const promptEngineer = await import('../../src/lib/prompt-engineer.js');
    assert.ok(promptEngineer.default, '应有默认导出');
  });
});