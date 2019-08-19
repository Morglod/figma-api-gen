import Ajv from 'ajv';
import { JSONSchema4 } from 'json-schema';

export async function validate<T>(
    schema: JSONSchema4,
    properties: {
        [p in keyof T]: string
    },
    object: T,
): Promise<{
    errors: Ajv.ErrorObject[] | null | undefined,
    errorText: string,
}> {
    var ajv = new Ajv({schemaId: 'id'});
    ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));

    await ajv.validate({
        ...schema,
        properties: Object.entries(properties).reduce((sum, [k,v]) =>
            Object.assign(sum, {
                [k]: `#/definitions/${v}`
            }), {}
        ),
    }, object);

    return {
        errors: ajv.errors,
        errorText: ajv.errorsText(ajv.errors)
    };
}