import { ObjectType } from '../types';

/** interface name -> interface code */
export type GeneratedInterfacesCode = {
    [interfaceName: string]: string,
};

export function podTypeToTS(type: string): string {
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

export function generateComment(description: string, idention = '') {
    if (!description.trim()) return '';

    description = description.replace(/^/gm, idention + ' * ').replace(/$/gm, '  ');
    return `${idention}/**\n${description}\n${idention} */\n`;
}

export function generateTSCodeInterface(obj: ObjectType, ctx: GeneratedInterfacesCode = {}): GeneratedInterfacesCode {
    let code = generateComment(obj.desc);

    if (obj.isEnum) {
        code += `enum ${obj.name} {\n${obj.enumValues.map(x => `\t${x} = '${x}'`).join(',\n')}\n}`;
    } else {
        // rename Node->NodeBase, coz Node is base interface
        // then NodeBase will be used in footer
        if (obj.name === 'Node') {
            obj.name = 'NodeBase';
        }

        code += `interface ${obj.name} `;
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
                fcode += podTypeToTS(x.type);
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