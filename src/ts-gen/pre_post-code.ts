import { GeneratedInterfacesCode } from "./ts-gen";

export function preTSCode(ctx: GeneratedInterfacesCode = {}): GeneratedInterfacesCode {
    // ctx['Number'] = 'type Number = number;';
    // ctx['String'] = 'type String = string;';
    // ctx['Path'] = 'type Path = string;';
    // ctx['StyleType'] = `type StyleType = 'FILL'|'TEXT'|'EFFECT'|'GRID'|string;`;
    // ctx['PageInfo'] = 'type PageInfo = unknown;';

    return ctx;
}

export function postTSCode(ctx: GeneratedInterfacesCode): GeneratedInterfacesCode {
    ctx['Transform'] = '/** A 2x3 affine transformation matrix\n * the identity matrix would be [[1, 0, 0], [0, 1, 0]] */\ntype Transform = [ [number,number,number], [number,number,number] ];';

    return ctx;
}