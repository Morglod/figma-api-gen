import * as fs from 'fs';
import { reqParseDocs } from './req-parse-docs';
import { generateCompileTSCode } from './ts-gen';
import { ObjectType } from './types';
import { makeDiff, printMarkdownDiff } from './diff';
import { generateSchema } from './jsonschema-gen';

(async () => {
    const objs = await reqParseDocs();
    fs.writeFileSync('./gen.json', JSON.stringify(objs));

    // const objs = JSON.parse(fs.readFileSync('./gen.json', 'utf8')) as ObjectType[];
    // const objs2 = JSON.parse(fs.readFileSync('./gen2_diff_test.json', 'utf8')) as ObjectType[];
    const code = generateCompileTSCode(objs);

    fs.writeFileSync('../gen-code.ts', code);

    const schemas = generateSchema(objs);
    // fs.writeFileSync('./diff.md', printMarkdownDiff(makeDiff(objs, objs2)), 'utf8');
    fs.writeFileSync('./schemas.json', JSON.stringify(schemas), 'utf8');
})();
