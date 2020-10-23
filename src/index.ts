import * as fs from 'fs';
import { reqParseDocs, fixObjects } from './req-parse-docs';
import { generateCompileTSCode } from './ts-gen/index';
import { ObjectType } from './types';
import { makeDiff, printMarkdownDiff } from './diff';
import { generateSchema } from './jsonschema-gen';
import { testFileKey } from './tests';
import * as Figma from 'figma-api';
import { validate } from './validate';

(async () => {
    const objs = await reqParseDocs();
    fixObjects(objs);
    fs.writeFileSync('./example_output/gen.json', JSON.stringify(objs));

    // const objs = JSON.parse(fs.readFileSync('./gen.json', 'utf8')) as ObjectType[];
    // const objs2 = JSON.parse(fs.readFileSync('./gen2_diff_test.json', 'utf8')) as ObjectType[];
    const code = generateCompileTSCode(objs);

    fs.writeFileSync('./example_output/gen-code.ts', code);

    const schemas = generateSchema(objs);
    // fs.writeFileSync('./diff.md', printMarkdownDiff(makeDiff(objs, objs2)), 'utf8');
    fs.writeFileSync('./example_output/schemas.json', JSON.stringify(schemas), 'utf8');

    // const testAccessToken = fs.readFileSync('./tests_access_token', 'utf8');

    // const figma = new Figma.Api({
    //     personalAccessToken: testAccessToken,
    // });

    // const testFile = await figma.getFile(testFileKey);
    // const validation = await validate(schemas, {
    //     document: 'DOCUMENT',
    // }, testFile);

    // if (validation.errors) {
    //     console.error(validation.errorText);
    // }
})();
