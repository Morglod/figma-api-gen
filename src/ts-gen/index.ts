import { ObjectType } from '../types';
import { GeneratedInterfacesCode, generateTSCodeInterface } from './ts-gen';
import { preTSCode, postTSCode } from './pre_post-code';
import { appendFooterCode } from './footer-code';

export function generateCompileTSCode(objs: ObjectType[]): string {
    const ctx = generateTSCode(objs);
    postTSCode(ctx);
    return compileTSCode(ctx);
}

function generateTSCode(objs: ObjectType[]): GeneratedInterfacesCode {
    const ctx = preTSCode();
    for (const o of objs) {
        generateTSCodeInterface(o, ctx);
    }

    return ctx;
}

function compileTSCode(ctx: GeneratedInterfacesCode) {
    const body = Object.values(ctx).join('\n\n');
    return body + appendFooterCode({ export: false, nodeBaseInterface: 'NodeBase' });
}