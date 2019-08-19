import { ObjectType } from './types';
import { JSONSchema4, JSONSchema4TypeName } from "json-schema";

/** object name -> code */
type GeneratedSchema = {
    [name: string]: JSONSchema4,
};

type SchemaAppend = {
    description?: string,
};

type SchemaFuncOpts = {
    canBeNull?: boolean,
};

const typeOrNull = <T extends JSONSchema4TypeName>(type: T, canBeNull?: boolean): (JSONSchema4TypeName|JSONSchema4TypeName[]) =>
    canBeNull ? [ type, 'null' ] : type;

/** json schema utils */
class sch {
    static string(append: SchemaAppend = {}, opts: SchemaFuncOpts = {}): JSONSchema4 {
        return {
            type: typeOrNull("string", opts.canBeNull),
            ...append,
        }
    }

    static number(append: SchemaAppend = {}, opts: SchemaFuncOpts = {}): JSONSchema4 { 
        return {
            type: typeOrNull("number", opts.canBeNull),
            ...append
        }
    }

    static boolean(append: SchemaAppend = {}, opts: SchemaFuncOpts = {}): JSONSchema4 {
        return {
            type: typeOrNull("boolean", opts.canBeNull),
            ...append
        }
    }

    static enum(values: string[], append: SchemaAppend = {}, opts: SchemaFuncOpts = {}): JSONSchema4 {
        return {
            type: typeOrNull("string", opts.canBeNull),
            enum: values,
            ...append
        }
    }

    static anyOf(
        variants: JSONSchema4[],
        append: SchemaAppend = {},
        opts: SchemaFuncOpts = {},
    ): JSONSchema4 {
        return {
            anyOf: variants,
            ...append
        }
    }

    static oneOf(
        variants: JSONSchema4[],
        append: SchemaAppend = {},
        opts: SchemaFuncOpts = {},
    ): JSONSchema4 {
        return {
            oneOf: variants,
            ...append
        }
    }

    static array(
        items: JSONSchema4,
        append: SchemaAppend = {},
        opts: SchemaFuncOpts = {},
    ): JSONSchema4 {
        return {
            type: typeOrNull('array', opts.canBeNull),
            items,
            ...append
        }
    }

    static arrayExact(
        items: JSONSchema4[],
        append: SchemaAppend = {},
        opts: SchemaFuncOpts = {},
    ): JSONSchema4 {
        return {
            type: typeOrNull('array', opts.canBeNull),
            items,
            additionalItems: false,
            ...append
        }
    }

    static any(): JSONSchema4 {
        return {};
    }

    static ref(targetObject: string, append: SchemaAppend = {}, opts: SchemaFuncOpts = {}): JSONSchema4 {
        return {
            "$ref": `#/definitions/${targetObject}`,
            ...append
        }
    }

    static object<PropName extends string>(params: {
        properties: {
            [name in PropName]: JSONSchema4
        },
        required: PropName[],
        extends: string,
    }): JSONSchema4 {
        const r: JSONSchema4 = {
            type: 'object' as const,
            properties: params.properties,
        };

        if (params.required.length !== 0) r.required = params.required;
        if (params.extends) r.extends = params.extends;

        return r;
    }
};

export function generateSchema(
    objs: ObjectType[],
    /** field name -> figma's type */
    validateStructure: {
        [fieldName: string]: string
    } = {}
): JSONSchema4 {
    const ctx = generateSchemaObjects(objs);
    postUpdateSchema(ctx);
    return {
        $schema: 'http://json-schema.org/draft-04/schema#',
        type: 'object',
        properties: Object.entries(validateStructure).reduce((sum, [k,v]) =>
            Object.assign(sum, {
                [k]: sch.ref(v)
            }), {}
        ),
        definitions: Object.entries(ctx).reduce((sum, [k,v]) =>
            Object.assign(sum, {
                [k]: v,
            }), {}
        ),
    };
}

function generateSchemaObjects(objs: ObjectType[]): GeneratedSchema {
    const ctx = generateDefaultSchemaTypes();
    for (const o of objs) {
        generateSchemaOneObject(o, ctx);
    }

    return ctx;
}

function generateDefaultSchemaTypes(ctx: GeneratedSchema = {}): GeneratedSchema {
    ctx['Path'] = sch.string();
    ctx['StyleType'] = sch.anyOf([
        sch.string(),
        sch.enum([
            'FILL',
            'TEXT',
            'EFFECT',
            'GRID',
        ]),
    ]);
    ctx['PageInfo'] = sch.any();

    return ctx;
}

function postUpdateSchema(ctx: GeneratedSchema): GeneratedSchema {
    ctx['Transform'] = sch.arrayExact([
        sch.arrayExact([
            sch.number(),
            sch.number(),
            sch.number(),
        ]),
        sch.arrayExact([
            sch.number(),
            sch.number(),
            sch.number(),
        ]),
    ], {
        description: 'A 2x3 affine transformation matrix\n * the identity matrix would be [[1, 0, 0], [0, 1, 0]]',
    });

    const nodeSchema = ctx['Node'];

    const nodeTypes = [
        'DOCUMENT',
        'CANVAS',
        'FRAME',
        'GROUP',
        'VECTOR',
        'BOOLEAN_OPERATION',
        'STAR',
        'LINE',
        'ELLIPSE',
        'REGULAR_POLYGON',
        'RECTANGLE',
        'TEXT',
        'SLICE',
        'COMPONENT',
        'INSTANCE',
    ];

    ctx['Node'] = {
        description: nodeSchema.description,
        type: 'object',
        oneOf: nodeTypes.map(nodeType => sch.ref(nodeType)),
    };

    for (const nt of nodeTypes) {
        ctx[nt] = {
            properties: {
                ...ctx[nt].properties,
                ...nodeSchema.properties,
                type: {
                    type: 'string',
                    enum: [ nt ],
                }
            }
        };
    }

    ctx['StylesMap'] = sch.object({
        properties: {
            TEXT: sch.string(),
            FILL: sch.string(),
            EFFECT: sch.string(),
            GRID: sch.string(),
        },
        required: [
            'TEXT',
            'FILL',
            'EFFECT',
            'GRID'
        ],
        extends: '',
    });

    ctx['TypeStyleMap'] = {
        type: "object" as const,
        additionalProperties: sch.ref('TypeStyle'),
    };

    return ctx;
}

function processType(type: string, canBeNull?: boolean): JSONSchema4 {
    if (type.endsWith('[]')) {
        return sch.array(processType(type.substr(0, type.length - 2), canBeNull));
    }

    switch(type) {
        case 'Number':
            return sch.number({}, { canBeNull });
        case 'String':
            return sch.string({}, { canBeNull });
        case 'Boolean':
            return sch.boolean({}, { canBeNull });
        case 'Any':
            return sch.any();
        case 'Map<StyleType, String>':
            return sch.ref('StylesMap');
        case 'Map<Number,TypeStyle>':
            return sch.ref('TypeStyleMap');
        default:
            return sch.ref(type);
    }
}

function processComment(description: string) {
    if (!description.trim()) return undefined;
    return description;
}

function generateSchemaOneObject(obj: ObjectType, ctx: GeneratedSchema = {}): GeneratedSchema {
    const opts = {
        description: processComment(obj.desc),
    };

    let schema: JSONSchema4 = { type: 'null' };

    if (obj.isEnum) {
        schema = sch.enum(obj.enumValues, opts);
    } else {
        schema = sch.object({
            properties: obj.props.reduce((sum, x) => {
                const val = x.isEnum ? sch.enum(x.enumValues, { description: x.desc }) : processType(x.type, x.mayBeNull);

                return Object.assign(sum, {
                    [x.name]: val
                });
            }, {}),
            extends: obj.extends,
            required: obj.props.filter(x => !x.optional).map(x => x.name),
        });
    }

    ctx[obj.name] = schema;

    return ctx;
}