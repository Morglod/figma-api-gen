import { ObjectType } from './types';

/** interface name -> interface code */
type GeneratedInterfacesCode = {
    [interfaceName: string]: string,
};

export function generateCompileTSCode(objs: ObjectType[]): string {
    const ctx = generateTSCode(objs);
    postUpdateTSCode(ctx);
    return compileTSCode(ctx);
}

function generateTSCode(objs: ObjectType[]): GeneratedInterfacesCode {
    const ctx = generateTSDefaultCode();
    for (const o of objs) {
        generateTSCodeInterface(o, ctx);
    }

    return ctx;
}

function compileTSCode(ctx: GeneratedInterfacesCode) {
    return Object.values(ctx).join('\n\n');
}

function generateTSDefaultCode(ctx: GeneratedInterfacesCode = {}): GeneratedInterfacesCode {
    // ctx['Number'] = 'type Number = number;';
    // ctx['String'] = 'type String = string;';
    // ctx['Path'] = 'type Path = string;';
    // ctx['StyleType'] = `type StyleType = 'FILL'|'TEXT'|'EFFECT'|'GRID'|string;`;
    // ctx['PageInfo'] = 'type PageInfo = unknown;';

    return ctx;
}

function postUpdateTSCode(ctx: GeneratedInterfacesCode): GeneratedInterfacesCode {
    ctx['Transform'] = '/** A 2x3 affine transformation matrix\n * the identity matrix would be [[1, 0, 0], [0, 1, 0]] */\ntype Transform = [ [number,number,number], [number,number,number] ];';

    return ctx;
}

function processType(type: string): string {
    const mapping = {
        Number: 'number',
        String: 'string',
        Boolean: 'boolean',
        Any: 'any',
        'Map<StyleType, String>': `{ [styleType in 'TEXT' | 'FILL' | 'EFFECT' | 'GRID']: string }`,
        'Map<Number,TypeStyle>': `{ [mapId: number]: TypeStyle }`,
    };

    if (type in mapping) return (mapping as any)[type];
    return type;
}

function generateComment(description: string, idention = '') {
    if (!description.trim()) return '';

    description = description.replace(/^/gm, idention + ' * ').replace(/$/gm, '  ');
    return `${idention}/**\n${description}\n${idention} */\n`;
}

function generateTSCodeInterface(obj: ObjectType, ctx: GeneratedInterfacesCode = {}): GeneratedInterfacesCode {
    let code = generateComment(obj.desc);

    if (obj.isEnum) {
        code = `enum ${obj.name} {\n${obj.enumValues.map(x => `\t${x} = '${x}'`).join(',\n')}\n}`;
    } else {
        code = `interface ${obj.name} `;
        if (obj.extends) {
            code += `extends ${obj.extends} `;
        }

        code += '{\n';

        let nextPropsIsOptional = false;

        code += obj.props.map(x => {
            if (x.name === '') {
                nextPropsIsOptional = true;
                return '';
            }

            let fcode = `${generateComment(x.desc, '\t')}\t${x.name}${nextPropsIsOptional ? '?' : ''}: `;

            if (x.isEnum) {
                const enumName = `${obj.name}_${x.name[0].toUpperCase()}${x.name.substr(1)}`;

                ctx[enumName] = `enum ${enumName} {\n${
                    x.enumValues.map(ex => {
                        if (ex.includes('%')) ex = `"${ex}"`;
                        return `\t${ex} = '${ex}'`;
                    }).join(',\n')
                }\n}`;

                fcode += enumName;
            } else {
                fcode += processType(x.type);
            }
            if (x.mayBeNull) {
                fcode += '|null';
            }

            fcode += ';\n';

            return fcode;
        }).join('');

        code += '}';
    }

    ctx[obj.name] = code;

    return ctx;
}