import Ajv from 'ajv';
import { JSONSchema4 } from 'json-schema';
import * as Figma from 'figma-api';

export async function validate<T>(
    schema: JSONSchema4,
    properties: {
        [p in keyof T]?: Figma.NodeType|'Node'
    },
    object: T,
): Promise<{
    errors: Ajv.ErrorObject[] | null | undefined,
    errorText: string,
}> {
    var ajv = new Ajv({schemaId: 'id'});
    ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));
    ajv.addSchema(schema, 'schema');

    await ajv.validate(
        Object.entries(properties).reduce((sum, [k,v]) =>
            Object.assign(sum, {
                [k]: `schema/definitions/${v}`
            })
        , {}),
    object);

    return {
        errors: ajv.errors,
        errorText: ajv.errorsText(ajv.errors)
    };
}